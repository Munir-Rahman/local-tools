import { File, Paths } from 'expo-file-system';
import * as LegacyFS from 'expo-file-system/legacy';
import { Platform } from 'react-native';
import * as ImageManipulator from 'expo-image-manipulator';
import * as Sharing from 'expo-sharing';
import { PDFDocument, StandardFonts, degrees, rgb } from 'pdf-lib';
import JSZip from 'jszip';
import QRCode from 'qrcode';
import type { ToolId } from './tools';
import { extendedText } from './textEngines';

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
async function getBytes(f:PickedFile){
  try { return await new File(f.uri).bytes(); }
  catch(err){
    throw Error(`Cannot read ${f.name}. Select it again through the device file picker. Android permissions or document provider may have expired. ${String(err)}`);
  }
}
export async function importPickedFile(uri:string,name:string):Promise<string>{
  // Explicitly copy to our own app cache while the picker grants us access.
  // This avoids content:// URI grants expiring between the picker and PDF processing.
  const safe=name.replace(/[^a-zA-Z0-9._-]/g,'_').slice(-80)||'document';
  const dest=new File(Paths.cache,`picked-${Date.now()}-${Math.floor(Math.random()*1e6)}-${safe}`);
  // DocumentPicker(copyToCacheDirectory:true) already returns an app-readable file:// copy.
  // Do not re-copy it via a restricted document provider; that triggered the READ permission error.
  if(uri.startsWith('file://')){
    try {const f=new File(uri);if(f.exists && f.size>=0){await f.bytes();return f.uri;}}catch{/* fall back to copy */}
  }
  try{ await new File(uri).copy(dest); if(!dest.exists)throw Error('No cached file created'); return dest.uri; }
  catch(err){throw Error(`Cannot access this document through the selected Android provider. Open Android Files, select the file using its system picker, and try again. No broad storage permission is required. Details: ${String(err)}`); }
}

function resultName(base:string,extension:string){return `${base}-${Date.now()}.${extension}`;}
async function store(name:string,data:string|Uint8Array,mime:string):Promise<EngineOutput>{
  const file=new File(Paths.document,name);file.create({overwrite:true});await file.write(data);
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

  if(['remove-pdf-pages','reverse-pdf-pages','reorder-pdf-pages','duplicate-pdf-pages','odd-pdf-pages','even-pdf-pages'].includes(id)){
    const count=doc.getPageCount();let order:number[]=[];
    if(id==='reverse-pdf-pages')order=Array.from({length:count},(_,i)=>count-i-1);
    else if(id==='odd-pdf-pages'||id==='even-pdf-pages')order=Array.from({length:count},(_,i)=>i).filter(i=>id==='odd-pdf-pages'?i%2===0:i%2===1);
    else if(id==='remove-pdf-pages'){
      const removed=new Set(pageIndices(o.pages,count));order=Array.from({length:count},(_,i)=>i).filter(i=>!removed.has(i));
    }else if(id==='reorder-pdf-pages'){
      order=pageIndices(o.pages,count);
      if(order.length!==count||new Set(order).size!==count)throw Error('Include each PDF page exactly once in the new order.');
    }else order=[...Array.from({length:count},(_,i)=>i),...pageIndices(o.pages,count)];
    if(!order.length)throw Error('Cannot create an empty PDF.');
    if(order.length>MAX_PAGES)throw Error('Result exceeds 100 pages.');
    const target=await PDFDocument.create();
    const pages=await target.copyPages(doc,order);pages.forEach(page=>target.addPage(page));
    return store(resultName(id,'pdf'),new Uint8Array(await target.save()),'application/pdf');
  }
  if(id==='blank-pdf-page'){
    const first=doc.getPage(0);doc.insertPage(0,[first.getWidth(),first.getHeight()]);
  }
  if(id==='pdf-set-title'||id==='pdf-set-author'){
    if(!o.watermark.trim())throw Error('Enter title or author first.');
    if(id==='pdf-set-title')doc.setTitle(o.watermark.trim());else doc.setAuthor(o.watermark.trim());
  }
  if(id==='flatten-pdf-forms'){
    const form=doc.getForm();if(!form.getFields().length)throw Error('This PDF has no fillable form fields.');
    form.flatten();
  }
  if(id==='pdf-stamp-date'){
    const font=await doc.embedFont(StandardFonts.HelveticaBold);
    const stamp=new Date().toISOString().slice(0,10);
    for(const page of doc.getPages())page.drawText(stamp,{x:18,y:Math.max(14,page.getHeight()-24),font,size:10,color:rgb(.25,.35,.55)});
  }
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
  const outputName=resultName('image',id==='convert-image'&&o.format==='png'?'png':'jpg');
  const persisted=new File(Paths.document,outputName);await new File(result.uri).copy(persisted);
  return {kind:'file',uri:persisted.uri,name:outputName,mime:id==='convert-image'&&o.format==='png'?'image/png':'image/jpeg'};
}
export function runTextTool(id:ToolId,o:EngineOptions):string{
  const s=o.inputText;
  switch(id){
    case 'json-format':return JSON.stringify(JSON.parse(s),null,2);
    case 'word-count':return `Words: ${s.trim()?s.trim().split(/\s+/u).length:0}\nCharacters: ${Array.from(s).length}\nLines: ${s?s.split(/\r?\n/).length:0}`;
    case 'text-case':return s.toUpperCase();
    case 'text-clean':return s.trim().replace(/\s+/gu,' ');
    case 'url-encode':return encodeURIComponent(s);
    default:return extendedText(id,s);
  }
}

const nativeFileIds=['zip-files','zip-inspect','file-info','file-hex','compare-files'];
async function nativeFileTask(id:ToolId,files:PickedFile[]):Promise<EngineOutput>{
 if(!files.length)throw Error('Select a file first.');
 if(files.length>20)throw Error('Select no more than 20 files.');
 if(files.reduce((n,f)=>n+(f.size||0),0)>35*1024*1024)throw Error('Combined inputs must not exceed 35 MB.');
 if(id==='zip-files'){
  const zip=new JSZip();
  for(const file of files){
    const safe=file.name.replace(/[\\/:*?"<>|\x00-\x1f]/g,'_').replace(/^\.+/,'file').slice(0,100)||'file';
    zip.file(safe,await getBytes(file));
  }
  const archive=await zip.generateAsync({type:'uint8array',compression:'DEFLATE',compressionOptions:{level:6}});
  return store(resultName('archive','zip'),new Uint8Array(archive),'application/zip');
 }
 if(id==='zip-inspect'){
  validate(files,['zip']);
  const zip=await JSZip.loadAsync(await getBytes(files[0]));
  const names=Object.values(zip.files).filter(file=>!file.dir).map(file=>file.name);
  if(names.length>300)throw Error('Too many ZIP entries.');
  return {kind:'text',text:names.join('\n')||'No files in ZIP.'};
 }
 if(id==='file-info'||id==='file-hex'){
  const data=await getBytes(files[0]);const hex=Array.from(data.slice(0,id==='file-hex'?256:16)).map(x=>x.toString(16).padStart(2,'0')).join(' ');
  return {kind:'text',text:id==='file-hex'?hex:`File: ${files[0].name}\nSize: ${data.length} bytes\nExtension: ${ext(files[0])||'none'}\nHeader: ${hex}`};
 }
 if(id==='compare-files'){
  if(files.length!==2)throw Error('Select exactly two files.');
  const first=await getBytes(files[0]),second=await getBytes(files[1]);let same=first.length===second.length;
  if(same)for(let i=0;i<first.length;i++){if(first[i]!==second[i]){same=false;break;}}
  return {kind:'text',text:`${same?'Identical':'Different'} bytes: ${files[0].name} and ${files[1].name}.`};
 }
 throw Error('Unsupported file action.');
}

export async function processTool(id:ToolId,files:PickedFile[],o:EngineOptions):Promise<EngineOutput>{
  if(['merge-pdf','split-pdf','extract-pages','rotate-pdf','number-pdf','watermark-pdf','images-to-pdf','pdf-info','remove-pdf-pages','reverse-pdf-pages','reorder-pdf-pages','duplicate-pdf-pages','blank-pdf-page','odd-pdf-pages','even-pdf-pages','flatten-pdf-forms','pdf-set-title','pdf-set-author','pdf-stamp-date'].includes(id))return pdfTask(id,files,o);
  if(['resize-image','compress-image','convert-image','rotate-image','flip-image'].includes(id))return imageTask(id,files,o);
  if(nativeFileIds.includes(id))return nativeFileTask(id,files);
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
  const original=new File(result.uri);
  // Share the actual app-owned file. Copying back to temporary cache caused stale URIs.
  if(!result.uri.startsWith('file://') || !original.exists)throw Error('Generated file is missing or inaccessible. Generate it again.');
  try { await Sharing.shareAsync(original.uri,{dialogTitle:'Share ToolNest output',mimeType:result.mime}); }
  catch(err){throw Error(`Android could not open the share sheet. Try saving to a folder. ${String(err)}`);}
}
export async function saveResultToFolder(result:EngineOutput):Promise<boolean>{
  if(result.kind!=='file')return false;
  if(Platform.OS!=='android')throw Error('Android folder saving is supported; use the iOS share sheet on iOS.');
  const grant=await LegacyFS.StorageAccessFramework.requestDirectoryPermissionsAsync();
  if(!grant.granted)return false;
  const target=await LegacyFS.StorageAccessFramework.createFileAsync(grant.directoryUri,result.name.replace(/\.[a-z0-9]+$/i,''),result.mime);
  // SAF requires writing to the user-authorized content URI, using base64 for binary data.
  let b64:string;
  try { b64=await new File(result.uri).base64(); }
  catch(err){throw Error(`The generated output cannot be read. Make a fresh output first; if this is an older APK, install the updated build. ${String(err)}`);}
  await LegacyFS.writeAsStringAsync(target,b64,{encoding:LegacyFS.EncodingType.Base64});
  return true;
}
