import type { ToolId } from '@local-tools/core';
import JSZip from 'jszip';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

export interface ConversionOptions {
  pages: string;
  angle: number;
  watermark: string;
  format: 'png' | 'jpeg' | 'webp';
  width: number;
  quality: number;
}
export interface OutputFile { name: string; blob: Blob }
export type Progress = (message: string, percent: number) => void;

const MAX_FILE_BYTES = 80 * 1024 * 1024;
const MAX_BATCH_BYTES = 160 * 1024 * 1024;
const MAX_IMAGE_PIXELS = 40_000_000;
const MAX_PAGES_TO_EXPORT = 120;

function stem(name: string): string {
  return name.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9 _.-]/g, '_').slice(0, 80) || 'document';
}
function pdfBlob(bytes: Uint8Array): Blob { return new Blob([new Uint8Array(bytes)], { type: 'application/pdf' }); }
function textBlob(value: string): Blob { return new Blob([value], { type: 'application/json' }); }
function assertImage(file: File): void {
  if (!/\.(jpe?g|png|webp)$/i.test(file.name)) throw new Error(`${file.name}: only JPG, PNG and WebP are supported.`);
}
export async function validateFiles(files: File[], accepts: 'pdf' | 'images', multi: boolean): Promise<void> {
  if (!files.length) throw new Error('Choose at least one file.');
  if (!multi && files.length !== 1) throw new Error('This tool accepts exactly one file.');
  if (files.length > 32) throw new Error('Please select no more than 32 files at once.');
  if (files.some(f => f.size === 0)) throw new Error('Empty files are not supported.');
  if (files.some(f => f.size > MAX_FILE_BYTES)) throw new Error('Individual files must be smaller than 80 MB.');
  if (files.reduce((sum, f) => sum + f.size, 0) > MAX_BATCH_BYTES) throw new Error('Please keep each batch under 160 MB.');
  for (const file of files) {
    if (accepts === 'images') assertImage(file);
    else {
      if (!/\.pdf$/i.test(file.name)) throw new Error(`${file.name}: expected a PDF.`);
      const header = new TextDecoder().decode(await file.slice(0, 8).arrayBuffer());
      if (!header.startsWith('%PDF-')) throw new Error(`${file.name}: file does not have a valid PDF header.`);
    }
  }
}

/** Page syntax: "1-3, 5, 9" (1-based, inclusive). */
export function parsePages(input: string, count: number): number[] {
  if (!input.trim()) throw new Error('Enter page numbers, for example: 1-3, 5.');
  const pages: number[] = [];
  for (const part of input.split(',')) {
    const token = part.trim();
    const match = /^(\d+)(?:\s*-\s*(\d+))?$/.exec(token);
    if (!match) throw new Error(`Invalid page range: "${token}".`);
    const start = Number(match[1]);
    const end = match[2] ? Number(match[2]) : start;
    if (start < 1 || end > count || end < start || end - start > count) {
      throw new Error(`Page range "${token}" is outside 1–${count}.`);
    }
    for (let p = start; p <= end; p++) pages.push(p - 1);
  }
  if (pages.length > 250) throw new Error('Select no more than 250 output pages.');
  return pages;
}

async function readImage(file: File): Promise<{ canvas: HTMLCanvasElement; width: number; height: number }> {
  assertImage(file);
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.decoding = 'async';
    image.src = url;
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error(`${file.name}: unable to decode the image.`));
    });
    const { naturalWidth: width, naturalHeight: height } = image;
    if (!width || !height || width * height > MAX_IMAGE_PIXELS) throw new Error(`${file.name}: image exceeds the 40-megapixel processing limit.`);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Your browser does not support Canvas 2D.');
    ctx.drawImage(image, 0, 0);
    return { canvas, width, height };
  } finally { URL.revokeObjectURL(url); }
}

function canvasBlob(canvas: HTMLCanvasElement, format: 'png' | 'jpeg' | 'webp', quality: number): Promise<Blob> {
  const mime = `image/${format}`;
  return new Promise((resolve, reject) => canvas.toBlob(blob => {
    if (!blob) return reject(new Error(`Could not encode ${format.toUpperCase()} on this browser.`));
    if (blob.type !== mime) return reject(new Error(`Your browser does not support ${format.toUpperCase()} encoding.`));
    resolve(blob);
  }, mime, quality));
}

export async function processTool(id: ToolId, files: File[], opts: ConversionOptions, progress: Progress): Promise<OutputFile[]> {
  progress('Preparing local processing…', 4);
  if (id === 'image-convert' || id === 'resize-image' || id === 'compress-image') {
    const results: OutputFile[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const { canvas, width, height } = await readImage(file);
      let format = opts.format;
      if (id === 'resize-image') {
        if (!Number.isInteger(opts.width) || opts.width < 16 || opts.width > 8000) throw new Error('Width must be between 16 and 8000 pixels.');
        const scale = opts.width / width;
        const nextHeight = Math.max(1, Math.round(height * scale));
        if (nextHeight * opts.width > MAX_IMAGE_PIXELS) throw new Error('Resized image exceeds the 40-megapixel processing limit.');
        const out = document.createElement('canvas');
        out.width = opts.width; out.height = nextHeight;
        const ctx = out.getContext('2d');
        if (!ctx) throw new Error('Canvas is unavailable.');
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(canvas, 0, 0, out.width, out.height);
        canvas.width = 0; canvas.height = 0;
        // Preserve PNG transparency for resize by default, regardless of source filename.
        const blob = await canvasBlob(out, 'png', 1);
        results.push({ name: `${stem(file.name)}-${opts.width}w.png`, blob });
        out.width = 0; out.height = 0;
      } else {
        if (id === 'compress-image' && format === 'png') format = 'webp';
        if (format === 'jpeg') {
          const ctx = canvas.getContext('2d');
          if (!ctx) throw new Error('Canvas is unavailable.');
          // Fill transparent pixels with white when outputting JPEG.
          ctx.globalCompositeOperation = 'destination-over';
          ctx.fillStyle = '#fff';
          ctx.fillRect(0, 0, width, height);
        }
        const blob = await canvasBlob(canvas, format, opts.quality / 100);
        results.push({ name: `${stem(file.name)}.${format === 'jpeg' ? 'jpg' : format}`, blob });
        canvas.width = 0; canvas.height = 0;
      }
      progress(`Processed image ${i + 1} of ${files.length}`, Math.round((i + 1) * 90 / files.length));
    }
    return results;
  }

  const { PDFDocument, StandardFonts, rgb, degrees } = await import('pdf-lib');
  if (id === 'images-to-pdf') {
    const output = await PDFDocument.create();
    for (let i = 0; i < files.length; i++) {
      const { canvas, width, height } = await readImage(files[i]);
      const blob = await canvasBlob(canvas, 'png', 1);
      canvas.width = 0; canvas.height = 0;
      const png = await output.embedPng(await blob.arrayBuffer());
      const page = output.addPage([595.28, 841.89]);
      const scale = Math.min((595.28 - 48) / width, (841.89 - 48) / height);
      const w = width * scale, h = height * scale;
      page.drawImage(png, { x: (595.28 - w) / 2, y: (841.89 - h) / 2, width: w, height: h });
      progress(`Placed image ${i + 1} of ${files.length}`, Math.round((i + 1) * 85 / files.length));
    }
    return [{ name: 'images-to-pdf.pdf', blob: pdfBlob(await output.save()) }];
  }

  if (id === 'merge-pdf') {
    if (files.length < 2) throw new Error('Select at least two PDFs to merge.');
    const output = await PDFDocument.create();
    for (let i = 0; i < files.length; i++) {
      const document = await PDFDocument.load(await files[i].arrayBuffer());
      const copied = await output.copyPages(document, document.getPageIndices());
      copied.forEach(page => output.addPage(page));
      progress(`Merged ${i + 1} of ${files.length} files`, Math.round((i + 1) * 85 / files.length));
    }
    return [{ name: 'merged.pdf', blob: pdfBlob(await output.save()) }];
  }

  if (id === 'pdf-to-png') {
    const { getDocument, GlobalWorkerOptions } = await import('pdfjs-dist');
    GlobalWorkerOptions.workerSrc = workerUrl;
    const task = getDocument({ data: new Uint8Array(await files[0].arrayBuffer()) });
    try {
      const pdf = await task.promise;
      try {
        if (pdf.numPages > MAX_PAGES_TO_EXPORT) throw new Error(`PDF-to-PNG is limited to ${MAX_PAGES_TO_EXPORT} pages per batch to protect browser memory.`);
        const out: OutputFile[] = [];
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 1.5 });
          if (viewport.width * viewport.height > MAX_IMAGE_PIXELS) throw new Error(`Page ${i} is too large to render safely.`);
          const canvas = document.createElement('canvas');
          canvas.width = Math.ceil(viewport.width);
          canvas.height = Math.ceil(viewport.height);
          const context = canvas.getContext('2d');
          if (!context) throw new Error('Canvas is unavailable.');
          await page.render({ canvas, canvasContext: context, viewport }).promise;
          const blob = await canvasBlob(canvas, 'png', 1);
          out.push({ name: `${stem(files[0].name)}-page-${String(i).padStart(3, '0')}.png`, blob });
          page.cleanup();
          canvas.width = 0; canvas.height = 0;
          progress(`Rendered page ${i} of ${pdf.numPages}`, Math.round(i * 90 / pdf.numPages));
        }
        return out;
      } finally { await pdf.destroy(); }
    } finally { await task.destroy(); }
  }

  const source = await PDFDocument.load(await files[0].arrayBuffer());
  const pageCount = source.getPageCount();
  if (pageCount === 0) throw new Error('The PDF contains no pages.');
  const filename = stem(files[0].name);
  const outputName = (suffix: string) => `${filename}-${suffix}.pdf`;

  if (id === 'pdf-info') {
    const info = {
      filename: files[0].name, pages: pageCount,
      title: source.getTitle() ?? null, author: source.getAuthor() ?? null,
      subject: source.getSubject() ?? null, creator: source.getCreator() ?? null,
      producer: source.getProducer() ?? null,
      pageSizes: source.getPages().map((page, index) => ({ page: index + 1, widthPoints: Math.round(page.getWidth() * 100) / 100, heightPoints: Math.round(page.getHeight() * 100) / 100 }))
    };
    return [{ name: `${filename}-information.json`, blob: textBlob(JSON.stringify(info, null, 2)) }];
  }

  if (id === 'split-pdf') {
    if (pageCount > MAX_PAGES_TO_EXPORT) throw new Error(`Splitting is limited to ${MAX_PAGES_TO_EXPORT} pages per batch.`);
    const results: OutputFile[] = [];
    for (let i = 0; i < pageCount; i++) {
      const part = await PDFDocument.create();
      const [page] = await part.copyPages(source, [i]);
      part.addPage(page);
      results.push({ name: `${filename}-page-${String(i + 1).padStart(3, '0')}.pdf`, blob: pdfBlob(await part.save()) });
      progress(`Split page ${i + 1} of ${pageCount}`, Math.round((i + 1) * 90 / pageCount));
    }
    return results;
  }

  if (id === 'extract-pages' || id === 'remove-pages' || id === 'reorder-pages') {
    const selected = parsePages(opts.pages, pageCount);
    let indices = selected;
    if (id === 'remove-pages') {
      const removed = new Set(selected);
      indices = source.getPageIndices().filter(i => !removed.has(i));
      if (!indices.length) throw new Error('You cannot remove every page.');
    }
    if (id === 'reorder-pages' && (selected.length !== pageCount || new Set(selected).size !== pageCount)) {
      throw new Error(`Enter every page exactly once (this PDF has ${pageCount} pages).`);
    }
    const output = await PDFDocument.create();
    const copied = await output.copyPages(source, indices);
    copied.forEach(page => output.addPage(page));
    return [{ name: outputName(id.replace('-pages', '')), blob: pdfBlob(await output.save()) }];
  }

  if (id === 'rotate-pdf') {
    if (![90, 180, 270].includes(opts.angle)) throw new Error('Choose a valid rotation angle.');
    source.getPages().forEach(page => page.setRotation(degrees((page.getRotation().angle + opts.angle) % 360)));
    return [{ name: outputName('rotated'), blob: pdfBlob(await source.save()) }];
  }
  if (id === 'watermark-pdf') {
    const text = opts.watermark.trim();
    if (!text || text.length > 60) throw new Error('Enter watermark text (1–60 characters).');
    if (!/^[\x20-\x7E]+$/.test(text)) throw new Error('This watermark tool currently supports English/ASCII text only.');
    const font = await source.embedFont(StandardFonts.HelveticaBold);
    source.getPages().forEach(page => {
      const w = page.getWidth(), h = page.getHeight();
      const size = Math.max(14, Math.min(50, (w * 0.74) / font.widthOfTextAtSize(text, 1)));
      const textWidth = font.widthOfTextAtSize(text, size);
      page.drawText(text, { x: Math.max(16, (w - textWidth * 0.75) / 2), y: h / 2, size, rotate: degrees(35), font, color: rgb(0.35, 0.42, 0.55), opacity: 0.22 });
    });
    return [{ name: outputName('watermarked'), blob: pdfBlob(await source.save()) }];
  }
  if (id === 'number-pages') {
    const font = await source.embedFont(StandardFonts.Helvetica);
    source.getPages().forEach((page, index) => {
      const text = `${index + 1} / ${pageCount}`;
      const width = font.widthOfTextAtSize(text, 10);
      page.drawText(text, { x: (page.getWidth() - width) / 2, y: 18, size: 10, font, color: rgb(0.36, 0.4, 0.49) });
    });
    return [{ name: outputName('numbered'), blob: pdfBlob(await source.save()) }];
  }
  throw new Error('This tool is not supported yet.');
}

export async function packageResults(outputs: OutputFile[], progress: Progress): Promise<OutputFile> {
  if (!outputs.length) throw new Error('No output files were produced.');
  if (outputs.length === 1) return outputs[0];
  progress('Packaging files into a ZIP…', 94);
  const zip = new JSZip();
  const used = new Set<string>();
  for (const output of outputs) {
    let name = output.name;
    let i = 2;
    while (used.has(name)) name = `${i++}-${output.name}`;
    used.add(name);
    zip.file(name, output.blob);
  }
  const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 3 } });
  return { name: 'localtools-results.zip', blob };
}

export function downloadResult(result: OutputFile): void {
  const url = URL.createObjectURL(result.blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = result.name;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  // Give the browser time to start the download before releasing the object URL.
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB'];
  let size = bytes / 1024;
  let i = 0;
  while (size >= 1024 && i < units.length - 1) { size /= 1024; i++; }
  return `${size.toFixed(size < 10 ? 1 : 0)} ${units[i]}`;
}