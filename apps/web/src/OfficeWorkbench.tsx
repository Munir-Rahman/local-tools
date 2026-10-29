import {useState} from 'react';
import {Download,FileSpreadsheet,FileText,TriangleAlert} from 'lucide-react';
import JSZip from 'jszip';
import {PDFDocument,StandardFonts,rgb} from 'pdf-lib';
import {getDocument,GlobalWorkerOptions} from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
GlobalWorkerOptions.workerSrc=pdfWorker;

export const officeTools=[
 {id:'docx-to-pdf-basic',name:'DOCX to PDF — Text Only',catalog:75,description:'Reflow visible DOCX paragraph text into a new PDF; original layout, images and tables are not preserved.'},
 {id:'pdf-to-docx-basic',name:'PDF to DOCX — Text Only',catalog:61,description:'Extract selectable PDF text into an editable Word document; visual layout is not preserved.'},
 {id:'pptx-to-pdf-basic',name:'PPTX to PDF — Slide Text Only',catalog:77,description:'Create a text-only PDF with one page per slide; original graphics and layout are not preserved.'},
 {id:'pdf-to-pptx-basic',name:'PDF to PPTX — Page Images',catalog:63,description:'Embed each PDF page as an image on its own non-editable PowerPoint slide.'},
 {id:'xlsx-to-pdf-basic',name:'XLSX to PDF — Values Only',catalog:76,description:'Render plain values from the first worksheet; charts, formulas, images and formatting are not preserved.'},
 {id:'pdf-to-xlsx-basic',name:'PDF to XLSX — Text Rows',catalog:62,description:'Put each extracted PDF text line into a spreadsheet row; table recovery is not guaranteed.'},
 {id:'xlsx-to-csv-basic',name:'XLSX to CSV',catalog:102,description:'Extract cell values from first sheet to UTF-8 CSV; formulas are not calculated.'},
 {id:'csv-to-xlsx-basic',name:'CSV to XLSX',catalog:101,description:'Convert UTF-8 CSV rows to an XLSX workbook.'},
] as const;
export type OfficeId=typeof officeTools[number]['id'];
function xml(s:string){const d=new DOMParser().parseFromString(s,'application/xml');if(d.getElementsByTagName('parsererror').length)throw Error('Invalid Office XML.');return d;}
function childrenTag(node:Document|Element,name:string){return [...node.getElementsByTagName('*')].filter(e=>e.localName===name);}
function allTexts(text:string,part='t'){const doc=xml(text);return childrenTag(doc,part).map(x=>x.textContent||'');}
function encodeXml(value:string){return value.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;');}
function docxParagraphs(text:string){const d=xml(text);return childrenTag(d,'p').map(p=>childrenTag(p,'t').map(t=>t.textContent||'').join('')).filter(Boolean);}
async function docxText(zip:JSZip){const f=zip.file('word/document.xml');if(!f)throw Error('DOCX word/document.xml not found.');return docxParagraphs(await f.async('string'));}
function csvValue(s:string){return /[",\r\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s;}
function parseCsv(text:string){const rows:string[][]=[];let value='',row:string[]=[],quoted=false;for(let i=0;i<text.length;i++){const c=text[i];if(quoted){if(c==='"'&&text[i+1]==='"'){value+='"';i++;}else if(c==='"')quoted=false;else value+=c;}else if(c==='"')quoted=true;else if(c===','){row.push(value);value='';}else if(c==='\r'||c==='\n'){row.push(value);rows.push(row);row=[];value='';if(c==='\r'&&text[i+1]==='\n')i++;}else value+=c;}if(quoted)throw Error('Unclosed CSV quotation.');if(value||row.length)rows.push([...row,value]);return rows;}
const columnToIndex=(col:string)=>{let v=0;for(const c of col.toUpperCase())v=v*26+c.charCodeAt(0)-64;return v-1;};
const indexToColumn=(i:number)=>{let s='';for(i++;i;i=Math.floor((i-1)/26))s=String.fromCharCode(65+(i-1)%26)+s;return s;};
async function readXlsx(zip:JSZip):Promise<string[][]>{
 const sheet=zip.file('xl/worksheets/sheet1.xml');if(!sheet)throw Error('First worksheet not found.');
 const shared=zip.file('xl/sharedStrings.xml');const sharedStrings=shared?childrenTag(xml(await shared.async('string')),'si').map(si=>childrenTag(si,'t').map(t=>t.textContent||'').join('')):[];
 const doc=xml(await sheet.async('string'));const result:string[][]=[];
 for(const row of childrenTag(doc,'row').slice(0,250)){const cells:string[]=[];for(const cell of childrenTag(row,'c').slice(0,64)){
  const ref=cell.getAttribute('r')||'';const col=columnToIndex(ref.replace(/[0-9]/g,''));if(col<0||col>63)continue;
  const value=childrenTag(cell,'v')[0]?.textContent||'';
  const inline=childrenTag(cell,'is')[0];
  const raw=cell.getAttribute('t')==='s'?sharedStrings[Number(value)]||'':cell.getAttribute('t')==='inlineStr'&&inline?childrenTag(inline,'t').map(t=>t.textContent||'').join(''):value;
  cells[col]=raw;
 }result.push(Array.from({length:cells.length},(_,i)=>cells[i]||''));}return result;
}
async function createXlsx(rows:string[][]):Promise<Blob>{
 if(rows.length>1000||rows.some(x=>x.length>64))throw Error('Maximum 1,000 rows and 64 columns per sheet.');
 const zip=new JSZip();
 zip.file('[Content_Types].xml','<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>');
 zip.file('_rels/.rels','<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>');
 zip.file('xl/workbook.xml','<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="LocalTools" sheetId="1" r:id="rId1"/></sheets></workbook>');
 zip.file('xl/_rels/workbook.xml.rels','<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>');
 const xmlRows=rows.map((row,i)=>`<row r="${i+1}">${row.map((value,j)=>`<c r="${indexToColumn(j)}${i+1}" t="inlineStr"><is><t xml:space="preserve">${encodeXml(value)}</t></is></c>`).join('')}</row>`).join('');
 zip.file('xl/worksheets/sheet1.xml',`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${xmlRows}</sheetData></worksheet>`);
 return await zip.generateAsync({type:'blob',mimeType:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
}
async function createDocx(paragraphs:string[]):Promise<Blob>{
 const zip=new JSZip();
 zip.file('[Content_Types].xml','<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>');
 zip.file('_rels/.rels','<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>');
 zip.file('word/document.xml',`<?xml version="1.0" encoding="UTF-8"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${paragraphs.map(p=>`<w:p><w:r><w:t xml:space="preserve">${encodeXml(p)}</w:t></w:r></w:p>`).join('')}<w:sectPr/></w:body></w:document>`);
 return await zip.generateAsync({type:'blob',mimeType:'application/vnd.openxmlformats-officedocument.wordprocessingml.document'});
}
async function textPdf(pages:string[][]):Promise<Blob>{
 const pdf=await PDFDocument.create();const font=await pdf.embedFont(StandardFonts.Helvetica);
 if(pages.length>100)throw Error('Maximum 100 pages.');
 for(const pageLines of pages){let page=pdf.addPage([595,842]),y=790;
  for(const raw of pageLines){if(!/^[\x00-\x7F]*$/.test(raw))throw Error('This text-only PDF exporter supports ASCII characters only. Use print-to-PDF for non-Latin languages.');
   for(let i=0;i<Math.max(1,Math.ceil(raw.length/92));i++){if(y<50){page=pdf.addPage([595,842]);y=790;}const line=raw.slice(i*92,(i+1)*92).replace(/[\x00-\x1F]/g,' ');page.drawText(line,{x:38,y,size:10,font,color:rgb(.1,.15,.23)});y-=15;}
  }
 }
 return new Blob([new Uint8Array(await pdf.save())],{type:'application/pdf'});
}
async function pdfLines(file:File){const job=getDocument({data:new Uint8Array(await file.arrayBuffer())});const pages:string[][]=[];
 try{const pdf=await job.promise;if(pdf.numPages>40)throw Error('PDF contains too many pages (maximum 40).');
  for(let n=1;n<=pdf.numPages;n++){const page=await pdf.getPage(n);const content=await page.getTextContent();pages.push(content.items.filter(x=>'str'in x).map(x=>'str' in x?String(x.str):'').filter(Boolean));page.cleanup();}
 }finally{await job.destroy();}return pages;}
async function pdfToPptx(file:File):Promise<Blob>{
 const pptxModule=await import('pptxgenjs');const pptx=new pptxModule.default();pptx.layout='LAYOUT_WIDE';
 const job=getDocument({data:new Uint8Array(await file.arrayBuffer())});try{
  const src=await job.promise;if(src.numPages>24)throw Error('Maximum 24 PDF pages for image-based slide export.');
  for(let n=1;n<=src.numPages;n++){const page=await src.getPage(n),v=page.getViewport({scale:1.5});const canvas=document.createElement('canvas');canvas.width=Math.ceil(v.width);canvas.height=Math.ceil(v.height);if(canvas.width*canvas.height>16e6)throw Error('PDF page too large for slide conversion.');const ctx=canvas.getContext('2d');if(!ctx)throw Error('Canvas unavailable');await page.render({canvas,canvasContext:ctx,viewport:v}).promise;const data=canvas.toDataURL('image/png');const slide=pptx.addSlide();slide.addImage({data,x:0,y:0,w:13.333,h:7.5});canvas.width=0;canvas.height=0;page.cleanup();}
  const result=await pptx.write({outputType:'blob'});return result as Blob;
 }finally{await job.destroy();}
}
export default function OfficeWorkbench({id,onComplete}:{id:string;onComplete:(name:string,result:string)=>void}){
 const spec=officeTools.find(s=>s.id===id)!;const [file,setFile]=useState<File|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const [result,setResult]=useState<{name:string;url:string}|null>(null);
 const run=async()=>{setBusy(true);setError('');try{
  if(!file)throw Error('Select a file.');if(file.size>20*1024*1024)throw Error('Maximum file size is 20 MB.');
  const ext=file.name.split('.').pop()?.toLowerCase()||'';
  const expected=id.startsWith('docx')?'docx':id.startsWith('pptx')?'pptx':id.startsWith('xlsx')?'xlsx':id.startsWith('csv')?'csv':'pdf';
  if(ext!==expected)throw Error(`Expected a .${expected} file.`);
  let output:Blob;let suffix='';
  if(id==='docx-to-pdf-basic'){const zip=await JSZip.loadAsync(await file.arrayBuffer());output=await textPdf([await docxText(zip)]);suffix='pdf';}
  else if(id==='pdf-to-docx-basic'){const pages=await pdfLines(file);output=await createDocx(pages.flatMap((rows,i)=>[`PDF page ${i+1}`,...rows]));suffix='docx';}
  else if(id==='pptx-to-pdf-basic'){const zip=await JSZip.loadAsync(await file.arrayBuffer());const slidePaths=Object.keys(zip.files).filter(n=>/^ppt\/slides\/slide\d+\.xml$/.test(n)).sort((a,b)=>Number(a.match(/\d+/)![0])-Number(b.match(/\d+/)![0]));if(slidePaths.length>100)throw Error('Maximum 100 slides');const pages=[];for(const path of slidePaths)pages.push(allTexts(await zip.file(path)!.async('string')));if(!pages.length)throw Error('No slide XML found');output=await textPdf(pages);suffix='pdf';}
  else if(id==='pdf-to-pptx-basic'){output=await pdfToPptx(file);suffix='pptx';}
  else if(id==='xlsx-to-pdf-basic'){const zip=await JSZip.loadAsync(await file.arrayBuffer());const rows=await readXlsx(zip);output=await textPdf([rows.map(row=>row.join('    '))]);suffix='pdf';}
  else if(id==='pdf-to-xlsx-basic'){const pages=await pdfLines(file);output=await createXlsx(pages.flatMap((lines,i)=>lines.map(s=>[`Page ${i+1}`,s])));suffix='xlsx';}
  else if(id==='xlsx-to-csv-basic'){const rows=await readXlsx(await JSZip.loadAsync(await file.arrayBuffer()));output=new Blob([rows.map(row=>row.map(csvValue).join(',')).join('\r\n')],{type:'text/csv;charset=utf-8'});suffix='csv';}
  else {output=await createXlsx(parseCsv(await file.text()));suffix='xlsx';}
  if(result)URL.revokeObjectURL(result.url);
  const name=`${file.name.replace(/\.[^.]+$/,'')}-converted.${suffix}`;setResult({name,url:URL.createObjectURL(output)});onComplete(spec.name,name);
 }catch(e){setError(e instanceof Error?e.message:String(e));}finally{setBusy(false);}};
 return <div className="v2-toolview"><div className="v2-pagehead"><div><span className="v2-kicker">OFFICE · LOCAL PREVIEW CONVERSION</span><h1>{spec.name}</h1><p>{spec.description}</p></div></div><div className="utility-layout"><section className="v2-panel"><label className="v2-field">Input file<input type="file" accept=".pdf,.docx,.pptx,.xlsx,.csv" onChange={e=>{setFile(e.target.files?.[0]||null);setError('');}}/></label><button type="button" className="v2-primary" disabled={busy||!file} onClick={()=>void run()}><FileSpreadsheet size={17}/>{busy?'Converting…':'Convert locally'}</button><p className="v2-hint"><TriangleAlert size={16}/> This is a basic conversion. It does not preserve complex Office layouts or automatically identify spreadsheet tables in PDFs.</p></section><section className="v2-panel"><h2><FileText size={17}/> Output</h2>{error&&<div role="alert" className="v2-error">{error}</div>}{result&&<a className="v2-primary" href={result.url} download={result.name}><Download size={17}/> Download {result.name}</a>}<p className="v2-hint">This transformation runs locally in your browser. Source document bytes are never uploaded.</p></section></div></div>;
}