import { File, Paths } from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import * as Sharing from 'expo-sharing';
import { PDFDocument, StandardFonts, degrees, rgb } from 'pdf-lib';
import JSZip from 'jszip';
import QRCode from 'qrcode';
import type { ToolId } from './tools';

export type PickedFile={name:string;uri:string;size?:number;mimeType?:string};
export type EngineOutput={kind:'file';name:string;uri:string;mime:string}|{kind:'text';text:string};
export type EngineOptions={pages:string;angle:number;watermark:string;width:number;quality:number;format:'jpg'|'png';inputText:string};
const MAX_BYTES=35*1024*1024;
const MAX_PAGES=100;
function ext(file:PickedFile){return file.name.split('.').pop()?.toLowerCase()||'';}
function validate(files:PickedFile[],allowed:string[],min=1){
  if(files.length<min)throw Error(`Choose at least ${min} file${min===1?'':'s'}.`);
  if(files.some(f=>f.size && f.size>MAX_BYTES))throw Error('Maximum size is 35 MB per file on mobile.');
  for(const f of files){if(!allowed.includes(ext(f)))throw Error(`Unsupported file type: ${f.name}`);}
}
async function getBytes(f:PickedFile){return await new File(f.uri).bytes();}
function resultName(base:string,extension:string){return `${base}-${Date.now()}.${extension}`;}
async function store(name:string,data:string|Uint8Array,mime:string):Promise<EngineOutput>{
  const file=new File(Paths.cache,name);file.create({overwrite:true});file.write(data);
  return {kind:'file',name,uri:file.uri,mime};
}
function pageIndices(source:string,count:number){
  if(!source.trim())throw Error('Enter a page range, for example: 1-3,5.');
  const result:number[]=[];
  for(const item of source.split(',')){
    const m=/^\s*(\d+)\s*(?:-\s*(\d+)\s*)?$/.exec(item);
    if(!m)throw Error('Invalid page range. Use numbers separated by commas, or 1-3.');
    const a=Number(m[1]),b=m[2]?Number(m[2]):a;
    if(a<1||b>count||b<a)throw Error(`Page numbers must be between 1 and ${count}.`);
    for(let n=a;n<=b;n++)result.push(n-1);
  }
  if(result.length>MAX_PAGES)throw Error('Select 100 pages or fewer.');
  return result;
}
async function pdfTask(id:ToolId,files:PickedFile[],o:EngineOptions):Promise<EngineOutput>{
  if(id==='images-to-pdf'){
    validate(files,['jpg','jpeg','png']);
    if(files.length>30)throw Error('Select at most 30 images.');
    const doc=await PDFDocument.create();
    for(const file of files){
      const data=await getBytes(file);
      const image=ext(file)==='png'?await doc.embedPng(data):await doc.embedJpg(data);
      const portrait=image.height>=image.width;const pw=portrait?595.3:841.9,ph=portrait?841.9:595.3;
      const page=doc.addPage([pw,ph]);const scale=Math.min((pw-48)/image.width,(ph-48)/image.height);
      const w=image.width*scale,h=image.height*scale;
      page.drawImage(image,{x:(pw-w)/2,y:(ph-h)/2,width:w,height:h});
    }
    return store(resultName('images-to-pdf','pdf'),new Uint8Array(await doc.save()),'application/pdf');
  }
  validate(files,['pdf'],id==='merge-pdf'?2:1);
  if(id==='merge-pdf'){
    const merged=await PDFDocument.create();
    for(const f of files){const pdf=await PDFDocument.load(await getBytes(f));const pages=await merged.copyPages(pdf,pdf.getPageIndices());pages.forEach(p=>merged.addPage(p));}
    if(merged.getPageCount()>MAX_PAGES)throw Error('This mobile release limits merging to 100 pages.');
    return store(resultName('merged','pdf'),new Uint8Array(await merged.save()),'application/pdf');
  }
  const doc=await PDFDocument.load(await getBytes(files[0]));
  if(doc.getPageCount()>MAX_PAGES)throw Error('This mobile release supports up to 100 pages per PDF.');
  if(id==='pdf-info'){
    return {kind:'text',text:`File: ${files[0].name}\nPages: ${doc.getPageCount()}\nTitle: ${doc.getTitle()||'Not set'}\nAuthor: ${doc.getAuthor()||'Not set'}\nSubject: ${doc.getSubject()||'Not set'}\nFirst page: ${doc.getPages()[0]?.getWidth().toFixed(1)} × ${doc.getPages()[0]?.getHeight().toFixed(1)} pt`};
  }
  if(id==='split-pdf'){
    const zip=new JSZip();
    for(let i=0;i<doc.getPageCount();i++){
      const single=await PDFDocument.create();const [page]=await single.copyPages(doc,[i]);single.addPage(page);
      zip.file(`page-${String(i+1).padStart(3,'0')}.pdf`,new Uint8Array(await single.save()));
    }
    return store(resultName('split-pages','zip'),new Uint8Array(await zip.generateAsync({type:'uint8array',compression:'DEFLATE'})),'application/zip');
  }
  if(id==='extract-pages'){
    const indices=pageIndices(o.pages,doc.getPageCount());const output=await PDFDocument.create();
    const pages=await output.copyPages(doc,indices);pages.forEach(p=>output.addPage(p));
    return store(resultName('extracted','pdf'),new Uint8Array(await output.save()),'application/pdf');
  }
  if(id==='rotate-pdf')doc.getPages().forEach(p=>p.setRotation(degrees((p.getRotation().angle+o.angle)%360)));
  if(id==='number-pdf'){
    const font=await doc.embedFont(StandardFonts.Helvetica);
    doc.getPages().forEach((p,i)=>{const label=`${i+1} / ${doc.getPageCount()}`;
      p.drawText(label,{x:Math.max(12,(p.getWidth()-font.widthOfTextAtSize(label,10))/2),y:18,size:10,font,color:rgb(.25,.35,.55)});
    });
  }
  if(id==='watermark-pdf'){
    if(!o.watermark.trim())throw Error('Enter watermark text.');
    if(/[^\x20-\x7e]/.test(o.watermark))throw Error('This basic PDF watermark supports ASCII characters only.');
    const font=await doc.embedFont(StandardFonts.HelveticaBold);
    doc.getPages().forEach(page=>{page.drawText(o.watermark.slice(0,45),{x:page.getWidth()*.13,y:page.getHeight()*.45,size:30,font,rotate:degrees(32),color:rgb(.38,.43,.55),opacity:.23});});
  }
  return store(resultName(id,'pdf'),new Uint8Array(await doc.save()),'application/pdf');
}
async function imageTask(id:ToolId,files:PickedFile[],o:EngineOptions):Promise<EngineOutput>{
  validate(files,['jpeg','jpg','png','webp','heic','heif']);
  const source=files[0];
  const ctx=ImageManipulator.ImageManipulator.manipulate(source.uri);
  if(id==='resize-image'){
    if(!Number.isFinite(o.width)||o.width<16||o.width>6000)throw Error('Width must be between 16 and 6000 pixels.');
    ctx.resize({width:o.width});
  }
  if(id==='rotate-image')ctx.rotate(o.angle);
  if(id==='flip-image')ctx.flip(ImageManipulator.FlipType.Horizontal);
  const rendered=await ctx.renderAsync();
  const result=await rendered.saveAsync({format:id==='convert-image'&&o.format==='png'?ImageManipulator.SaveFormat.PNG:ImageManipulator.SaveFormat.JPEG,compress:id==='compress-image'?o.quality/100:.92});
  return {kind:'file',uri:result.uri,name:result.uri.split('/').pop()||'localtools-image.jpg',mime:id==='convert-image'&&o.format==='png'?'image/png':'image/jpeg'};
}
export function runTextTool(id:ToolId,o:EngineOptions):string{
  const s=o.inputText;
  switch(id){
    case 'json-format':return JSON.stringify(JSON.parse(s),null,2);
    case 'word-count':return `Words: ${s.trim()?s.trim().split(/\s+/u).length:0}\nCharacters: ${Array.from(s).length}\nLines: ${s?s.split(/\r?\n/).length:0}`;
    case 'text-case':return s.toUpperCase();
    case 'text-clean':return s.trim().replace(/\s+/gu,' ');
    case 'url-encode':return encodeURIComponent(s);
    default:throw Error('This text tool is not yet supported.');
  }
}
export async function processTool(id:ToolId,files:PickedFile[],o:EngineOptions):Promise<EngineOutput>{
  if(['merge-pdf','split-pdf','extract-pages','rotate-pdf','number-pdf','watermark-pdf','images-to-pdf','pdf-info'].includes(id))return pdfTask(id,files,o);
  if(['resize-image','compress-image','convert-image','rotate-image','flip-image'].includes(id))return imageTask(id,files,o);
  return {kind:'text',text:runTextTool(id,o)};
}
export async function generateQr(text:string,color:string){
  if(!text.trim())throw Error('Enter text or a URL.');
  if(text.length>2000)throw Error('QR contents are limited to 2000 characters.');
  const svg=await QRCode.toString(text,{type:'svg',margin:2,width:600,errorCorrectionLevel:'M',color:{dark:color,light:'#FFFFFF'}});
  return {svg,...await store(resultName('localtools-qr','svg'),svg,'image/svg+xml')};
}
export async function shareResult(result:EngineOutput){
  if(result.kind!=='file')return;
  if(!(await Sharing.isAvailableAsync()))throw Error('File sharing is not available on this device.');
  await Sharing.shareAsync(result.uri,{dialogTitle:'Save or share your LocalTools file',mimeType:result.mime,UTI:result.mime==='application/pdf'?'com.adobe.pdf':undefined});
}
