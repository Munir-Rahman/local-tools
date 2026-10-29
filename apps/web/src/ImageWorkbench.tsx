import {useRef,useState} from 'react';
import {ArrowLeft, Download, Image as ImageIcon, ShieldCheck} from 'lucide-react';
import JSZip from 'jszip';
import {catalog} from './catalog';
export const imageActionNumbers=[161,162,163,164,165,166,167,168,169,170,171,172,175,176,177,178,179,180,199,341,354,355,356];
const fileName=(s:string)=>s.replace(/\.[^.]+$/,'').replace(/[^\w-]/g,'_').slice(0,90);
const clamp=(v:number,min:number,max:number)=>Math.min(max,Math.max(min,v));
const blob=(canvas:HTMLCanvasElement,type:string,quality?:number)=>new Promise<Blob>((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(Error('This output format is not supported.')),type,quality));
const imageFromFile=async(file:File)=>{const url=URL.createObjectURL(file);try{const img=new Image();img.decoding='async';img.src=url;await img.decode();return img;}finally{URL.revokeObjectURL(url);}};
const canvas=(w:number,h:number)=>{if(!Number.isInteger(w)||!Number.isInteger(h)||w<1||h<1||w>8000||h>8000||w*h>32_000_000)throw Error('Canvas dimensions must fit within 8,000 px per side and 32 million pixels.');const c=document.createElement('canvas');c.width=w;c.height=h;return c;};
export default function ImageWorkbench({number,onBack,onCompleted}:{number:number;onBack:()=>void;onCompleted:(name:string,result:string)=>void}){
 const title=catalog[number-1].name;
 const input=useRef<HTMLInputElement>(null);
 const [files,setFiles]=useState<File[]>([]),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 const [value,setValue]=useState('50'),[second,setSecond]=useState('50'),[third,setThird]=useState(''),[color,setColor]=useState('#ffffff'),[quality,setQuality]=useState(80);
 const [result,setResult]=useState<{name:string;url:string;type:string}|null>(null),[picked,setPicked]=useState('');
 const multiple=[168,180].includes(number);
 function clearResult(){if(result)URL.revokeObjectURL(result.url);setResult(null);}
 async function process(){setBusy(true);setError('');setPicked('');clearResult();try{
   if(!files.length)throw Error('Choose an image.');
   if(files.length>12||files.some(f=>f.size>50*1024*1024))throw Error('Maximum 12 images, each up to 50 MB.');
   const images=await Promise.all(files.map(imageFromFile));
   const bundle=new JSZip(),processed:{name:string;blob:Blob}[]=[];
   const targets=number===180?[images[0]]:images;
   for(let i=0;i<targets.length;i++){
    const img=targets[i],base=files[i]?.name||'generated',x=Number(value),y=Number(second),q=clamp(quality/100,.1,1);
    let width=img?.naturalWidth||1200,height=img?.naturalHeight||630;
    if(number===162){width=clamp(Math.round(x),1,8000);height=clamp(Math.round(y),1,8000);}
    if(number===163&&[90,270].includes(x)){[width,height]=[height,width];}
    if(number===169){const ratio=x/y;if(!Number.isFinite(ratio)||ratio<=0)throw Error('Enter a positive aspect ratio');width=Math.round(height*ratio);}
    if(number===170){width+=Math.round(x);height+=Math.round(y);}
    if(number===354){width=64;height=64;}
    if(number===355){width=512;height=512;}
    if(number===356){width=1200;height=630;}
    if(number===180){width=800;height=Math.ceil(images.length/3)*230;}
    const cvs=canvas(width,height),ctx=cvs.getContext('2d',{willReadFrequently:number===341});if(!ctx)throw Error('Canvas unavailable');
    if([166,167,168].includes(number)){ctx.fillStyle='#ffffff';ctx.fillRect(0,0,width,height);}
    if(number===162){const cropWidth=Math.min(img.naturalWidth,width),cropHeight=Math.min(img.naturalHeight,height);ctx.drawImage(img,Math.round((img.naturalWidth-cropWidth)/2),Math.round((img.naturalHeight-cropHeight)/2),cropWidth,cropHeight,0,0,width,height);}
    else if(number===163){ctx.translate(width/2,height/2);ctx.rotate(x*Math.PI/180);ctx.drawImage(img,-img.naturalWidth/2,-img.naturalHeight/2);}
    else if(number===164||number===165){ctx.translate(number===164?width:0,number===165?height:0);ctx.scale(number===164?-1:1,number===165?-1:1);ctx.drawImage(img,0,0);}
    else if(number===169||number===170){ctx.fillStyle=color;ctx.fillRect(0,0,width,height);ctx.drawImage(img,Math.floor((width-img.naturalWidth)/2),Math.floor((height-img.naturalHeight)/2));}
    else if(number===175){ctx.filter=`blur(${clamp(x,0,50)}px)`;ctx.drawImage(img,0,0);ctx.filter='none';}
    else if(number===177){ctx.filter=['grayscale(1)','sepia(1)','invert(1)','saturate(1.8)'][Math.round(clamp(x,0,3))];ctx.drawImage(img,0,0);ctx.filter='none';}
    else if(number===178){ctx.filter=`brightness(${clamp(x,0,300)}%)`;ctx.drawImage(img,0,0);ctx.filter='none';}
    else if(number===179){ctx.filter=`contrast(${clamp(x,0,300)}%)`;ctx.drawImage(img,0,0);ctx.filter='none';}
    else if(number===180){ctx.fillStyle=color;ctx.fillRect(0,0,width,height);images.forEach((pic,k)=>{const cw=256,ch=218,cx=(k%3)*266,cy=Math.floor(k/3)*230;const scale=Math.min(cw/pic.width,ch/pic.height);const iw=pic.width*scale,ih=pic.height*scale;ctx.drawImage(pic,cx+(cw-iw)/2,cy+(ch-ih)/2,iw,ih);});}
    else if(number===356){ctx.fillStyle=color;ctx.fillRect(0,0,width,height);if(img)ctx.drawImage(img,0,0,width,height);ctx.fillStyle='#ffffff';ctx.font='bold 62px sans-serif';ctx.fillText(third.slice(0,35)||'Your social card',60,300,1080);}
    else if([354,355].includes(number)){ctx.drawImage(img,0,0,width,height);}
    else {ctx.drawImage(img,0,0);}
    if(number===176){const src=ctx.getImageData(0,0,width,height),dst=ctx.createImageData(width,height),weights=[0,-1,0,-1,5,-1,0,-1,0];for(let row=0;row<height;row++)for(let col=0;col<width;col++){const pos=(row*width+col)*4;for(let ch=0;ch<3;ch++){let sum=0;for(let ky=-1;ky<=1;ky++)for(let kx=-1;kx<=1;kx++){const rx=clamp(col+kx,0,width-1),ry=clamp(row+ky,0,height-1);sum+=src.data[(ry*width+rx)*4+ch]*weights[(ky+1)*3+kx+1];}dst.data[pos+ch]=clamp(sum,0,255);}dst.data[pos+3]=src.data[pos+3];}ctx.putImageData(dst,0,0);}
    if(number===171||number===172){ctx.save();ctx.font=`bold ${clamp(x,12,240)}px sans-serif`;ctx.fillStyle=color;ctx.globalAlpha=number===172?.32:1;ctx.textAlign='center';ctx.fillText(third||'LocalTools',width/2,height/2,width*.9);ctx.restore();}
    let type=[166,167,168].includes(number)?'image/jpeg':'image/png';let final=await blob(cvs,type,q);
    if(number===167){const target=clamp(x,5,10240)*1024;let low=.1,high=.96,best=final;for(let retry=0;retry<8;retry++){const current=(low+high)/2,candidate=await blob(cvs,'image/jpeg',current);if(candidate.size<=target){best=candidate;low=current;}else high=current;}final=best;if(final.size>target)throw Error('Cannot reach target KB with this image at a usable quality.');}
    if(number===341){const point=ctx.getImageData(Math.floor(width/2),Math.floor(height/2),1,1).data;setPicked('#'+[point[0],point[1],point[2]].map(k=>k.toString(16).padStart(2,'0')).join(''));}
    const extension=type==='image/jpeg'?'jpg':'png';processed.push({name:`${fileName(base)}_${number}.${extension}`,blob:final});
   }
   let output:Blob,name:string;if(processed.length>1){for(const item of processed)bundle.file(item.name,item.blob);output=await bundle.generateAsync({type:'blob'});name=`localtools-images-${number}.zip`;}else{output=processed[0].blob;name=processed[0].name;}
   const url=URL.createObjectURL(output);setResult({name,url,type:output.type});onCompleted(title,name);
  }catch(e){setError(e instanceof Error?e.message:'Unable to process image');}finally{setBusy(false);}}
 return <div className="v2-toolview"><button className="v2-link" onClick={onBack}><ArrowLeft size={16}/> Catalog</button>
  <div className="v2-pagehead"><div><span className="v2-kicker">IMAGE EDITOR · #{number}</span><h1>{title}</h1><p>Uses your browser Canvas API. Changes are not uploaded.</p></div><span className="v2-private"><ShieldCheck size={16}/> Local only</span></div>
  <div className="utility-layout"><section className="v2-panel v2-utility"><input ref={input} type="file" multiple={multiple} accept="image/jpeg,image/png,image/webp" onChange={e=>{setFiles([...e.target.files||[]]);clearResult();}}/>
   <p className="v2-hint">Use JPG, PNG or WebP images. {multiple?'Up to 12 files.':'One file.'}</p>
   {![164,165,166,168,176,199,341].includes(number)&&<label className="v2-field"><span>{({162:'Crop width (px)',163:'Rotation degrees',167:'Target KB',169:'Aspect width',170:'Extra canvas width (px)',171:'Font size',172:'Font size',175:'Blur radius px',177:'Filter: 0 grayscale,1 sepia,2 invert,3 saturated',178:'Brightness %',179:'Contrast %'} as Record<number,string>)[number]||'Value'}</span><input type="number" value={value} onChange={e=>setValue(e.target.value)}/></label>}
   {[162,169,170].includes(number)&&<label className="v2-field"><span>{number===162?'Crop height (px)':number===169?'Aspect height':'Extra canvas height (px)'}</span><input type="number" value={second} onChange={e=>setSecond(e.target.value)}/></label>}
   {[171,172,356].includes(number)&&<label className="v2-field"><span>Text</span><input value={third} onChange={e=>setThird(e.target.value)}/></label>}
   {[169,170,171,172,180,356].includes(number)&&<label className="v2-field"><span>Background / text color</span><input type="color" value={color} onChange={e=>setColor(e.target.value)}/></label>}
   {[166,167,168].includes(number)&&<label className="v2-field"><span>JPEG quality {quality}%</span><input type="range" min={15} max={100} value={quality} onChange={e=>setQuality(Number(e.target.value))}/></label>}
   <button className="v2-primary" disabled={busy||!files.length} onClick={()=>void process()}><ImageIcon size={16}/>{busy?'Working…':'Process image locally'}</button>
   {error&&<p className="v2-error" role="alert">{error}</p>}</section>
   <section className="v2-panel v2-result"><div className="v2-sectiontitle"><h2>Result</h2><span>{picked||'Local output'}</span></div>{result?<><img className="v3-image-result" src={result.url} alt="Processed image preview" title={number===341?'Click a pixel to sample its color':''} onClick={number===341?async(e)=>{const image=e.currentTarget;const box=image.getBoundingClientRect();const px=Math.max(0,Math.floor((e.clientX-box.left)/box.width*image.naturalWidth)),py=Math.max(0,Math.floor((e.clientY-box.top)/box.height*image.naturalHeight));const c=document.createElement('canvas');c.width=image.naturalWidth;c.height=image.naturalHeight;const ctx=c.getContext('2d');if(!ctx)return;ctx.drawImage(image,0,0);const d=ctx.getImageData(Math.min(px,c.width-1),Math.min(py,c.height-1),1,1).data;const rgb='#'+[d[0],d[1],d[2]].map(v=>v.toString(16).padStart(2,'0')).join('');setPicked(rgb);try{await navigator.clipboard.writeText(rgb);}catch{/* clipboard may be unavailable */}}:undefined}/><a className="v2-primary" href={result.url} download={result.name}><Download size={16}/> Download {result.name}</a></>:<p>Choose an image and process it to see the output.</p>}</section></div>
 </div>;
}