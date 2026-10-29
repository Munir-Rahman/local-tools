import {useState} from 'react';
import {ArrowLeft,Download,Files,ShieldCheck} from 'lucide-react';
import {PDFDocument,StandardFonts,rgb} from 'pdf-lib';
import {getDocument,GlobalWorkerOptions} from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import JSZip from 'jszip';
import {catalog} from './catalog';
import {parsePages} from './conversion';
GlobalWorkerOptions.workerSrc=workerUrl;
export const pdfAdvancedNumbers=[2,10,11,12,14,17,18,21,35,38,40,52,53,64,69,401,417,478,480];
const settings:Record<number,{fields:string[];defaults:string[];note:string}>={
  2:{fields:['Page ranges, e.g. 1-3,5'],defaults:['1-3'],note:'Export one PDF containing the selected pages.'},
  10:{fields:['Pages to duplicate (1-based)'],defaults:['1'],note:'Append duplicates at the end of the source document.'},
  11:{fields:['Blank pages to append'],defaults:['1'],note:'Append A4 blank pages.'},
  12:{fields:[],defaults:[],note:'Choose exactly two PDFs. The second is inserted at the end.'},
  14:{fields:[],defaults:[],note:'Choose two or more PDFs and interleave their pages in file order.'},
  17:{fields:['Left inset (pt)','Bottom inset (pt)','Right inset (pt)','Top inset (pt)'],defaults:['30','30','30','30'],note:'Sets visible crop boxes only. Hidden content remains in the file; NOT redaction.'},
  18:{fields:['New page width (pt)','New page height (pt)'],defaults:['595.28','841.89'],note:'Scale existing page content to fit each new page size.'},
  21:{fields:['Text to add (ASCII only)','Font size'],defaults:['LocalTools','18'],note:'Adds text near the top-left of every PDF page; existing text is not edited.'},
  35:{fields:['Header','Footer'],defaults:['Document Header','Document Footer'],note:'Overlays simple ASCII header and footer on every page.'},
  38:{fields:['JSON field-name-to-value map'],defaults:['{"FullName":"Jane Doe"}'],note:'Only existing PDF text fields are filled. Field names must match exactly.'},
  40:{fields:[],defaults:[],note:'Flatten all fillable form fields into static page content.'},
  52:{fields:['Title','Author','Subject'],defaults:['My PDF','Author','Document'],note:'Set basic PDF information metadata.'},
  53:{fields:[],defaults:[],note:'Clear common metadata fields; not a forensic anonymization tool.'},
  64:{fields:[],defaults:[],note:'Extract embedded selectable text; scanned pages require OCR.'},
  69:{fields:['JPEG quality (0.1–1)'],defaults:['0.85'],note:'Render pages as rasterized JPEG images in a ZIP.'},
  401:{fields:['Page width (pt)','Page height (pt)','Page count'],defaults:['595.28','841.89','1'],note:'Create a blank PDF without uploading anything.'},
  417:{fields:['Bates prefix (ASCII)','First number'],defaults:['DOC-','1'],note:'Stamp sequential identification numbers at the bottom of each page.'},
  478:{fields:[],defaults:[],note:'Inspect every selected PDF; report any that fail to load.'},
  480:{fields:[],defaults:[],note:'Merge PDFs in alphabetical filename order.'}
};
const output=(bytes:Uint8Array)=>new Blob([new Uint8Array(bytes)],{type:'application/pdf'});
const safeFile=(s:string)=>s.replace(/\.[^.]+$/,'').replace(/[^\w.-]+/g,'-').slice(0,70);
function numeric(v:string,min=0,max=1e6){const n=Number(v);if(!Number.isFinite(n)||n<min||n>max)throw Error(`Enter a number between ${min} and ${max}.`);return n;}
function ascii(v:string){if(!/^[\x20-\x7e]*$/.test(v))throw Error('This stamp supports ASCII text only.');return v;}
export default function PdfAdvanced({number,onBack,onCompleted}:{number:number;onBack:()=>void;onCompleted:(name:string,result:string)=>void}){
 const def=settings[number],title=catalog[number-1].name;
 const [files,setFiles]=useState<File[]>([]),[opts,setOpts]=useState<string[]>(def.defaults),[error,setError]=useState(''),[busy,setBusy]=useState(false),[result,setResult]=useState<{url:string;name:string}|null>(null);
 function clear(){if(result)URL.revokeObjectURL(result.url);setResult(null);}
 const many=[12,14,478,480].includes(number);
 async function run(){setError('');clear();setBusy(true);try{
   if(number!==401&&!files.length)throw Error('Choose one or more PDF files.');if(files.length>20||files.some(f=>f.size>40e6))throw Error('Maximum 20 PDFs, 40 MB each.');
   if(number!==401&&!files.every(f=>f.name.toLowerCase().endsWith('.pdf')))throw Error('PDF files only.');
   let out:Blob,name=`localtools-${number}.pdf`;
   if(number===401){const w=numeric(opts[0],72,2000),h=numeric(opts[1],72,2000),k=numeric(opts[2],1,100);if(!Number.isInteger(k))throw Error('Use a whole page count');const doc=await PDFDocument.create();for(let i=0;i<k;i++)doc.addPage([w,h]);out=output(await doc.save());}
   else if(number===478){const report=[];for(const f of files){try{const pdf=await PDFDocument.load(await f.arrayBuffer());report.push({file:f.name,valid:true,pages:pdf.getPageCount()});}catch(e){report.push({file:f.name,valid:false,error:e instanceof Error?e.message:String(e)});}}out=new Blob([JSON.stringify(report,null,2)],{type:'application/json'});name='pdf-inspection.json';}
   else if(number===64||number===69){const f=files[0];const job=getDocument({data:new Uint8Array(await f.arrayBuffer())});try{const pdf=await job.promise;if(pdf.numPages>70)throw Error('Maximum 70 pages per operation.');if(number===64){let text='';for(let k=1;k<=pdf.numPages;k++){const page=await pdf.getPage(k);const content=await page.getTextContent();text+=`\n--- Page ${k} ---\n`+content.items.map(item=>'str' in item?item.str:'').join(' ')+'\n';page.cleanup();}out=new Blob([text],{type:'text/plain;charset=utf-8'});name=`${safeFile(f.name)}.txt`;}else{const zip=new JSZip(),quality=numeric(opts[0],.1,1);for(let k=1;k<=pdf.numPages;k++){const page=await pdf.getPage(k);const viewport=page.getViewport({scale:1.5});if(viewport.width*viewport.height>30e6)throw Error('Page image too large');const c=document.createElement('canvas');c.width=Math.ceil(viewport.width);c.height=Math.ceil(viewport.height);const ctx=c.getContext('2d');if(!ctx)throw Error('Canvas unavailable');ctx.fillStyle='white';ctx.fillRect(0,0,c.width,c.height);await page.render({canvas:c,canvasContext:ctx,viewport}).promise;const b=await new Promise<Blob>((resolve,reject)=>c.toBlob(v=>v?resolve(v):reject(Error('JPEG encoding failed')),'image/jpeg',quality));zip.file(`page-${String(k).padStart(3,'0')}.jpg`,b);page.cleanup();c.width=0;c.height=0;}out=await zip.generateAsync({type:'blob'});name=`${safeFile(f.name)}-jpg-pages.zip`;}}finally{await job.destroy();}}
   else if([12,14,480].includes(number)){if(files.length<2)throw Error('Choose at least two PDF files.');if(number===12&&files.length!==2)throw Error('Choose exactly two PDFs.');const doc=await PDFDocument.create(),ordered=number===480?[...files].sort((a,b)=>a.name.localeCompare(b.name)):files;const sources=await Promise.all(ordered.map(async f=>PDFDocument.load(await f.arrayBuffer())));if(number===14){const count=Math.max(...sources.map(s=>s.getPageCount()));for(let i=0;i<count;i++)for(const src of sources)if(i<src.getPageCount()){const [page]=await doc.copyPages(src,[i]);doc.addPage(page);}}else for(const src of sources){const pages=await doc.copyPages(src,src.getPageIndices());pages.forEach(page=>doc.addPage(page));}out=output(await doc.save());}
   else {const doc=await PDFDocument.load(await files[0].arrayBuffer());if(doc.getPageCount()<1)throw Error('No pages in PDF.');
     if(number===2){const indices=parsePages(opts[0],doc.getPageCount()),newDoc=await PDFDocument.create(),pages=await newDoc.copyPages(doc,indices);pages.forEach(p=>newDoc.addPage(p));out=output(await newDoc.save());}
     else {const font=await doc.embedFont(StandardFonts.Helvetica);
       if(number===10){const indices=parsePages(opts[0],doc.getPageCount()),pages=await doc.copyPages(doc,indices);pages.forEach(page=>doc.addPage(page));}
       if(number===11){const count=numeric(opts[0],1,50);if(!Number.isInteger(count))throw Error('Use whole page count');for(let i=0;i<count;i++)doc.addPage([595.28,841.89]);}
       if(number===17){for(const page of doc.getPages()){const [left,bottom,right,top]=opts.map(v=>numeric(v));const width=page.getWidth()-left-right,height=page.getHeight()-bottom-top;if(width<=0||height<=0)throw Error('Crop margins exceed page size');page.setCropBox(left,bottom,width,height);}}
       if(number===18){const width=numeric(opts[0],72,2000),height=numeric(opts[1],72,2000);for(const page of doc.getPages()){const sx=width/page.getWidth(),sy=height/page.getHeight();page.scaleContent(sx,sy);page.scaleAnnotations(sx,sy);page.setSize(width,height);}}
       if(number===21||number===35||number===417){const size=number===21?numeric(opts[1],6,50):11;for(let i=0;i<doc.getPageCount();i++){const page=doc.getPage(i),height=page.getHeight();if(number===21){page.drawText(ascii(opts[0]),{x:35,y:height-55,font,size,color:rgb(.15,.2,.3)});}if(number===35){page.drawText(ascii(opts[0]),{x:35,y:height-25,font,size,color:rgb(.3,.3,.3)});page.drawText(ascii(opts[1]),{x:35,y:18,font,size,color:rgb(.3,.3,.3)});}if(number===417){const start=numeric(opts[1],0,999999999);if(!Number.isInteger(start))throw Error('Starting number must be whole');page.drawText(ascii(opts[0])+String(start+i).padStart(6,'0'),{x:35,y:18,font,size,color:rgb(.3,.3,.3)});}}}
       if(number===38){const obj=JSON.parse(opts[0]) as Record<string,unknown>;if(!obj||typeof obj!=='object'||Array.isArray(obj))throw Error('Enter a JSON object');const form=doc.getForm();for(const [key,val] of Object.entries(obj)){if(typeof val!=='string')throw Error('Text values must be strings');form.getTextField(key).setText(val);}}
       if(number===40)doc.getForm().flatten();
       if(number===52){doc.setTitle(opts[0]);doc.setAuthor(opts[1]);doc.setSubject(opts[2]);}
       if(number===53){doc.setTitle('');doc.setAuthor('');doc.setSubject('');doc.setCreator('');doc.setProducer('');doc.setKeywords([]);}
       out=output(await doc.save());
     }
   }
   const url=URL.createObjectURL(out);setResult({url,name});onCompleted(title,name);
  }catch(e){setError(e instanceof Error?e.message:'PDF operation failed');}finally{setBusy(false);}}
 return <div className="v2-toolview"><button className="v2-link" onClick={onBack}><ArrowLeft size={16}/> Catalog</button><div className="v2-pagehead"><div><span className="v2-kicker">PDF PROCESSING · #{number}</span><h1>{title}</h1><p>{def.note}</p></div><span className="v2-private"><ShieldCheck size={16}/> Local only</span></div>
  <div className="utility-layout"><section className="v2-panel v2-utility"><div className="v2-field"><span>{number===401?'No source file required':many?'Select PDF files':'Select PDF'}</span>{number!==401&&<input type="file" accept="application/pdf,.pdf" multiple={many} onChange={e=>{setFiles([...e.target.files||[]]);clear();}}/>}</div>
   {def.fields.map((label,i)=><label className="v2-field" key={i}><span>{label}</span>{number===38?<textarea rows={4} value={opts[i]} onChange={e=>setOpts(p=>p.map((x,j)=>i===j?e.target.value:x))}/>:<input value={opts[i]} onChange={e=>setOpts(p=>p.map((x,j)=>i===j?e.target.value:x))}/>}</label>)}
   <button className="v2-primary" disabled={busy} onClick={()=>void run()}><Files size={16}/>{busy?'Processing…':'Run PDF tool'}</button>{error&&<p className="v2-error" role="alert">{error}</p>}</section>
   <section className="v2-panel v2-result"><div className="v2-sectiontitle"><h2>Output</h2></div>{result?<a className="v2-primary" href={result.url} download={result.name}><Download size={16}/> Download {result.name}</a>:<p>Result will be saved on this device.</p>}</section></div></div>;
}