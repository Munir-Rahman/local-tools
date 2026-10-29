/** Platform-independent tool definitions for the future web/mobile/desktop apps. */
export type ToolCategory = 'PDF' | 'Images';
export type ToolId =
  | 'merge-pdf' | 'split-pdf' | 'extract-pages' | 'remove-pages'
  | 'reorder-pages' | 'rotate-pdf' | 'watermark-pdf' | 'number-pages'
  | 'images-to-pdf' | 'pdf-to-png' | 'pdf-info'
  | 'image-convert' | 'resize-image' | 'compress-image';

export interface ToolDefinition {
  id: ToolId;
  name: string;
  description: string;
  category: ToolCategory;
  icon: string;
  accepts: 'pdf' | 'images';
  multiple: boolean;
  short: string;
  featured?: boolean;
}

export const tools: ToolDefinition[] = [
  { id: 'merge-pdf', name: 'Merge PDF', description: 'Combine several PDFs into one document, in your chosen order.', category: 'PDF', icon: 'files', accepts: 'pdf', multiple: true, short: 'Combine PDFs', featured: true },
  { id: 'split-pdf', name: 'Split PDF', description: 'Save every page as a separate PDF inside a ZIP archive.', category: 'PDF', icon: 'scissors', accepts: 'pdf', multiple: false, short: 'One PDF per page', featured: true },
  { id: 'extract-pages', name: 'Extract pages', description: 'Choose specific pages and download them as a new PDF.', category: 'PDF', icon: 'file-output', accepts: 'pdf', multiple: false, short: 'Keep selected pages' },
  { id: 'remove-pages', name: 'Remove pages', description: 'Delete selected pages without uploading your document.', category: 'PDF', icon: 'file-minus', accepts: 'pdf', multiple: false, short: 'Delete PDF pages' },
  { id: 'reorder-pages', name: 'Reorder pages', description: 'Set a custom page order, including repeated pages.', category: 'PDF', icon: 'list-ordered', accepts: 'pdf', multiple: false, short: 'Change page order' },
  { id: 'rotate-pdf', name: 'Rotate PDF', description: 'Rotate every page by 90, 180 or 270 degrees.', category: 'PDF', icon: 'rotate-cw', accepts: 'pdf', multiple: false, short: 'Turn PDF pages' },
  { id: 'watermark-pdf', name: 'Watermark PDF', description: 'Add a diagonal text watermark to each page (English/ASCII).', category: 'PDF', icon: 'stamp', accepts: 'pdf', multiple: false, short: 'Add a text stamp' },
  { id: 'number-pages', name: 'Page numbers', description: 'Stamp a page number at the bottom center of each page.', category: 'PDF', icon: 'hash', accepts: 'pdf', multiple: false, short: 'Number PDF pages' },
  { id: 'images-to-pdf', name: 'Images to PDF', description: 'Convert several JPG, PNG or WebP images to PDF pages.', category: 'PDF', icon: 'images', accepts: 'images', multiple: true, short: 'Photos into a PDF', featured: true },
  { id: 'pdf-to-png', name: 'PDF to PNG', description: 'Render PDF pages into PNG images inside a ZIP.', category: 'PDF', icon: 'image-down', accepts: 'pdf', multiple: false, short: 'Export PDF pages', featured: true },
  { id: 'pdf-info', name: 'PDF information', description: 'Inspect page count, metadata and page sizes in a local JSON file.', category: 'PDF', icon: 'file-search', accepts: 'pdf', multiple: false, short: 'Inspect PDF metadata' },
  { id: 'image-convert', name: 'Convert images', description: 'Convert JPG, PNG and WebP images directly in your browser.', category: 'Images', icon: 'refresh-cw', accepts: 'images', multiple: true, short: 'JPG / PNG / WebP', featured: true },
  { id: 'resize-image', name: 'Resize images', description: 'Resize images to an exact width while preserving aspect ratio.', category: 'Images', icon: 'expand', accepts: 'images', multiple: true, short: 'Set image width', featured: true },
  { id: 'compress-image', name: 'Compress images', description: 'Re-encode images as quality-adjustable JPEG or WebP.', category: 'Images', icon: 'minimize-2', accepts: 'images', multiple: true, short: 'Reduce image weight', featured: true }
];