import { useEffect, useRef, useState } from 'react';
import { Download, Film, Music2, TriangleAlert, Clock3, HardDrive, FileCheck2 } from 'lucide-react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

export const mediaTools = [
 {id:'mp4-to-webm',name:'MP4 to WebM',category:'Video',catalog:241,description:'Transcode MP4 videos to WebM.'},
 {id:'webm-to-mp4',name:'WebM to MP4',category:'Video',catalog:242,description:'Convert WebM to MP4 locally.'},
 {id:'mov-to-mp4',name:'MOV to MP4',category:'Video',catalog:244,description:'Convert MOV videos to MP4.'},
 {id:'mkv-to-mp4',name:'MKV to MP4',category:'Video',catalog:245,description:'Convert MKV videos to MP4.'},
 {id:'avi-to-mp4',name:'AVI to MP4',category:'Video',catalog:246,description:'Convert AVI to MP4.'},
 {id:'video-compress',name:'Compress Video',category:'Video',catalog:247,description:'Lower bitrate/quality with optional resolution reduction.'},
 {id:'video-trim',name:'Trim Video',category:'Video',catalog:248,description:'Trim to a selected time window.'},
 {id:'video-remove-audio',name:'Remove Audio from Video',category:'Video',catalog:255,description:'Export a silent MP4.'},
 {id:'video-extract-mp3',name:'Extract MP3 from Video',category:'Audio',catalog:256,description:'Extract or transcode audio from MP4 to MP3.'},
 {id:'video-gif',name:'Video to GIF',category:'Video',catalog:260,description:'Create animated GIF from short clips.'},
 {id:'mp3-to-wav',name:'MP3 to WAV',category:'Audio',catalog:261,description:'Decode MP3 audio to WAV.'},
 {id:'wav-to-mp3',name:'WAV to MP3',category:'Audio',catalog:262,description:'Encode WAV audio as MP3.'},
 {id:'flac-to-mp3',name:'FLAC to MP3',category:'Audio',catalog:263,description:'Encode FLAC audio as MP3.'},
 {id:'m4a-to-mp3',name:'M4A to MP3',category:'Audio',catalog:264,description:'Encode M4A audio as MP3.'},
 {id:'ogg-to-mp3',name:'OGG to MP3',category:'Audio',catalog:265,description:'Encode OGG audio as MP3.'},
 {id:'audio-compress',name:'Compress Audio',category:'Audio',catalog:266,description:'Create a lower-bitrate MP3.'},
 {id:'audio-trim',name:'Trim Audio',category:'Audio',catalog:267,description:'Extract a short audio segment.'},
 {id:'audio-normalize',name:'Normalize Audio',category:'Audio',catalog:270,description:'Normalize loudness to an approximate target.'},
 {id:'audio-speed',name:'Change Audio Speed',category:'Audio',catalog:271,description:'Speed audio up or slow it down.'},
 {id:'image-audio-mp4',name:'Image + MP3 → MP4',category:'Video',catalog:0,description:'Combine your still image and audio into an MP4 video.'},
] as const;
export type MediaId = typeof mediaTools[number]['id'];
const allowedVideo=new Set(['mp4','webm','mov','mkv','avi','ogg','flac','wav','m4a','mp3','png','jpg','jpeg']);
const EXT: Record<string,string>={
'mp4-to-webm':'webm','webm-to-mp4':'mp4','mov-to-mp4':'mp4','mkv-to-mp4':'mp4','avi-to-mp4':'mp4',
'video-compress':'mp4','video-trim':'mp4','video-remove-audio':'mp4','video-extract-mp3':'mp3','video-gif':'gif',
'mp3-to-wav':'wav','wav-to-mp3':'mp3','flac-to-mp3':'mp3','m4a-to-mp3':'mp3','ogg-to-mp3':'mp3','audio-compress':'mp3','audio-trim':'mp3','audio-normalize':'mp3','audio-speed':'mp3','image-audio-mp4':'mp4'
};
function commands(id:MediaId,input:string,output:string,start:string,duration:string,quality:number):string[]{
 const seek=['-ss',String(Math.max(0,Number(start)||0))], len=['-t',String(Math.max(.1,Number(duration)||10))];
 const video=['-c:v','mpeg4','-q:v',String(quality),' -c:a','aac'].flatMap(x=>x.trim().split(' '));
 switch(id){
 case 'mp4-to-webm':return ['-i',input,'-c:v','libvpx','-b:v','800k','-c:a','libopus',output];
 case 'webm-to-mp4':case 'mov-to-mp4':case 'mkv-to-mp4':case 'avi-to-mp4':return ['-i',input,...video,output];
 case 'video-compress':return ['-i',input,'-vf','scale=-2:480',...video,output];
 case 'video-trim':return [...seek,'-i',input,...len,...video,output];
 case 'video-remove-audio':return ['-i',input,'-an','-c:v','copy',output];
 case 'video-extract-mp3':return ['-i',input,'-vn','-codec:a','libmp3lame','-q:a','4',output];
 case 'video-gif':return [...seek,'-i',input,...len,'-vf','fps=10,scale=480:-1:flags=lanczos',output];
 case 'mp3-to-wav':return ['-i',input,'-vn','-acodec','pcm_s16le',output];
 case 'wav-to-mp3':case 'flac-to-mp3':case 'm4a-to-mp3':case 'ogg-to-mp3':return ['-i',input,'-vn','-codec:a','libmp3lame','-q:a','4',output];
 case 'audio-compress':return ['-i',input,'-vn','-b:a','96k',output];
 case 'audio-trim':return [...seek,'-i',input,...len,'-codec:a','libmp3lame',output];
 case 'audio-normalize':return ['-i',input,'-af','loudnorm=I=-16:TP=-1.5:LRA=11',output];
 case 'audio-speed':return ['-i',input,'-filter:a','atempo=1.25','-vn',output];
 default:throw Error('No matching conversion');
 }
}
function outputMime(ext:string){return ({mp4:'video/mp4',webm:'video/webm',mp3:'audio/mpeg',wav:'audio/wav',gif:'image/gif'} as Record<string,string>)[ext]||'application/octet-stream';}
export default function MediaWorkbench({id,onComplete}:{id:MediaId;onComplete:(name:string,result:string)=>void}){
 const spec=mediaTools.find(x=>x.id===id)!;
 const engine=useRef<FFmpeg|null>(null);
 const [files,setFiles]=useState<File[]>([]);const [targetMB,setTargetMB]=useState('');const [durationOverride,setDurationOverride]=useState('');const [outputBytes,setOutputBytes]=useState<number|null>(null);
 const [start,setStart]=useState('0');const [duration,setDuration]=useState('10');const [quality,setQuality]=useState(8);
 const [trimSeconds,setTrimSeconds]=useState('');const [sourceDuration,setSourceDuration]=useState<number|null>(null);const [outputLength,setOutputLength]=useState<number|null>(null);
 const [busy,setBusy]=useState(false);const [progress,setProgress]=useState('');const [error,setError]=useState('');
 const [engineReady,setEngineReady]=useState(false);
 const [output,setOutput]=useState<{name:string;url:string}|null>(null);
 useEffect(()=>()=>{if(engine.current){engine.current.terminate();engine.current=null;}},[]);
 useEffect(()=>()=>{if(output)URL.revokeObjectURL(output.url)},[output]);
 const select=(newFiles:FileList|null)=>{
  setFiles(Array.from(newFiles||[]).slice(0,2));setError('');setOutput(null);setOutputBytes(null);setOutputLength(null);setSourceDuration(null);
 };
 async function detectDuration(file:File):Promise<number>{
   const objectUrl=URL.createObjectURL(file);
   try{
     return await new Promise<number>((resolve,reject)=>{
       const media=document.createElement(file.type.startsWith('audio/') || /\.(mp3|wav|m4a|ogg|flac)$/i.test(file.name)?'audio':'video');
       let settled=false;
       const timer=setTimeout(()=>finish(Error('Timed out reading media duration')),9000);
       function finish(error?:Error,seconds?:number){
         if(settled)return;settled=true;clearTimeout(timer);media.removeAttribute('src');media.load();
         if(error)reject(error);else resolve(seconds!);
       }
       media.preload='metadata';
       media.onloadedmetadata=()=>Number.isFinite(media.duration)&&media.duration>0?finish(undefined,media.duration):finish(Error('Unknown media duration'));
       media.onerror=()=>finish(Error('Unable to read media duration in this browser'));
       media.src=objectUrl;
     });
   }finally{URL.revokeObjectURL(objectUrl)}
 }
 async function run(){
  if(!files.length)return;
  setBusy(true);setError('');setOutput(null);setOutputBytes(null);setOutputLength(null);setProgress('Checking local FFmpeg files…');
  try{
   const total=files.reduce((a,f)=>a+f.size,0);if(total>64*1024*1024)throw Error('Total inputs must be 64 MB or less to limit browser memory use.');
   for(const file of files){const ext=file.name.split('.').pop()?.toLowerCase()||'';if(!allowedVideo.has(ext))throw Error('Unsupported input format: '+ext);}
   if(id==='image-audio-mp4'&&files.length!==2)throw Error('Select one image and one audio file.');
   if(!engine.current){
    const coreURL=`${import.meta.env.BASE_URL}ffmpeg/ffmpeg-core.js`;
    const wasmURL=`${import.meta.env.BASE_URL}ffmpeg/ffmpeg-core.wasm`;
    const ffmpeg=new FFmpeg();engine.current=ffmpeg;
    ffmpeg.on('log',({message})=>{if(message.includes('time='))setProgress(message.slice(-160));});
    const check=await fetch(coreURL,{method:'HEAD'});
    if(!check.ok)throw Error(`Local FFmpeg script is missing (HTTP ${check.status}). Run npm install and restart the development server; the predev script must copy the FFmpeg core files.`);
    setProgress('Loading local FFmpeg engine (~32 MB, first-time load can be slower)…');
    let timer:ReturnType<typeof setTimeout>|undefined;
    try{
      await Promise.race([
        ffmpeg.load({coreURL: await toBlobURL(coreURL,'text/javascript'),wasmURL: await toBlobURL(wasmURL,'application/wasm')}),
        new Promise<never>((_,reject)=>{timer=setTimeout(()=>reject(Error('FFmpeg engine did not start within 90 seconds. Check your browser memory, /ffmpeg/*.wasm network response, and console errors.')),90000);})
      ]);
      setEngineReady(true);
    }catch(e){ffmpeg.terminate();engine.current=null;setEngineReady(false);throw e;}
    finally{if(timer)clearTimeout(timer);}
   }
   const ffmpeg=engine.current!;
   const first=files[0];const ext=first.name.split('.').pop()?.toLowerCase()||'bin';const input=`input.${ext}`;
   const compressing=id==='video-compress'||id==='audio-compress';
   let measuredSeconds:number|null=null;
   if(compressing){
     try{measuredSeconds=await detectDuration(first);setSourceDuration(measuredSeconds);}
     catch{setSourceDuration(null);}
   }
   const requestedTrim=Number(trimSeconds);
   if(compressing && trimSeconds.trim() && (!Number.isFinite(requestedTrim)||requestedTrim<=0))throw Error('Trim duration must be greater than zero.');
   if(compressing&&measuredSeconds!==null&&trimSeconds.trim()&&requestedTrim>measuredSeconds)throw Error('Requested trim duration is longer than the source video/audio.');
   const actualSeconds=compressing?(trimSeconds.trim()?requestedTrim:measuredSeconds):null;
   if(compressing&&actualSeconds!==null)setOutputLength(actualSeconds);
   for(const file of files){const fileExtension=file.name.split('.').pop()?.toLowerCase()||'bin';if(!fileExtension||!allowedVideo.has(fileExtension))throw Error('Unsupported extension');}
   await ffmpeg.writeFile(input,await fetchFile(first));
   const resultExt=EXT[id];
   const safeName=first.name.replace(/\.[^.]+$/,'').replace(/[^a-zA-Z0-9_-]/g,'-').slice(0,45)||'media';
   const outputName=`${safeName}-ToolNest.${resultExt}`;let args:string[];
   let secondName='';
   if(id==='image-audio-mp4'){
    const image=files.find(f=>/^image\//.test(f.type));const audio=files.find(f=>/^audio\//.test(f.type));
    if(!image||!audio)throw Error('Select an image and an audio file.');
    const imgExt=image.name.split('.').pop()!.toLowerCase();const audExt=audio.name.split('.').pop()!.toLowerCase();
    const imgName=`cover.${imgExt}`;secondName=`track.${audExt}`;
    await ffmpeg.writeFile(imgName,await fetchFile(image));await ffmpeg.writeFile(secondName,await fetchFile(audio));
    args=['-loop','1','-framerate','1','-i',imgName,'-i',secondName,'-vf','scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2','-c:v','mpeg4','-q:v','7','-c:a','aac','-shortest','-pix_fmt','yuv420p',outputName];

   }else args=commands(id,input,outputName,start,duration,quality);
   if(targetMB.trim() && compressing){
     const mb=Number(targetMB);
     if(!Number.isFinite(mb)||mb<0.1||mb>500)throw Error('Enter a target size between 0.1 and 500 MB.');
     let length=actualSeconds;
     if(!length){
       // Fallback is used only when metadata cannot be decoded. It never trims output.
       const fallback=Number(durationOverride);
       if(!Number.isFinite(fallback)||fallback<=0)throw Error('Cannot read source duration. Enter the actual source length in fallback duration.');
       length=fallback;
       if(trimSeconds.trim())length=requestedTrim;
     }
     // 0.85 safety margin accounts for container overhead and encoder bitrate variation.
     const overallKbps=(mb*1024*1024*8*.85)/(length*1000);
     if(id==='audio-compress'){
       const kbps=Math.min(320,Math.floor(overallKbps));
       if(kbps<24)throw Error('Target size too small for playable audio at this length.');
       args=['-i',input,'-vn','-c:a','libmp3lame','-b:a',`${kbps}k`,outputName];
     }else{
       const audioKbps=overallKbps>160?96:48;
       const videoKbps=Math.floor(overallKbps-audioKbps);
       if(videoKbps<90)throw Error('Target size too small for playable video. Use a larger size, shorter clip, or lower resolution.');
       args=['-i',input,'-vf','scale=-2:480','-c:v','mpeg4','-b:v',`${videoKbps}k`,'-c:a','aac','-b:a',`${audioKbps}k`,'-pix_fmt','yuv420p',outputName];
     }
   }
   // A compression target controls size, not time. Only this separate option changes length.
   if(compressing && trimSeconds.trim()){
     args.splice(args.length-1,0,'-t',String(requestedTrim));
   }
   // Metadata branding is nonvisual and does not alter the user's video frames or audio samples.
   if(['mp4','webm','mp3'].includes(resultExt)){
     args.splice(args.length-1,0,'-metadata','comment=Processed locally with ToolNest');
   }
   setProgress('Converting locally…');
   const code=await ffmpeg.exec(args,600000);
   if(code!==0)throw Error(`FFmpeg could not perform this conversion (exit ${code}); the codec may not be available.`);
   const data=await ffmpeg.readFile(outputName);
   if(!(data instanceof Uint8Array))throw Error('Unexpected output format');
   const bytes=new Uint8Array(data);
   if(!bytes.length)throw Error('Converter returned an empty file.');
   const url=URL.createObjectURL(new Blob([bytes],{type:outputMime(resultExt)}));
   setOutput({name:outputName,url});setOutputBytes(bytes.length);setProgress('Complete. Download your file.');onComplete(spec.name,outputName);
   await ffmpeg.deleteFile(outputName);
   try{await ffmpeg.deleteFile(input);}catch{/* Input already removed */}
   if(secondName)try{await ffmpeg.deleteFile(secondName)}catch{/* optional */}
   if(id==='image-audio-mp4')for(const file of files){try{await ffmpeg.deleteFile(`cover.${file.name.split('.').pop()!.toLowerCase()}`)}catch{/* optional cleanup */}}
  }catch(e){const msg=e instanceof Error?e.message:String(e);setError(msg);setProgress('');console.error('Local media conversion failed:',e);}
  finally{setBusy(false);}
 }
 return <div className="v2-toolview"><div className="v2-pagehead"><div><span className="v2-kicker">MEDIA PROCESSING · FULLY LOCAL</span><h1 style={{display:'flex',alignItems:'center',gap:12}}><img src="/brand-icon.png" width={42} height={42} alt="ToolNest"/>{spec.name}</h1><p>{spec.description}</p><p className="v2-hint">ToolNest processes supported media on this device. Compression size and playback duration are independent settings.</p></div></div>
   <div className="utility-layout"><section className="v2-panel"><h2>Choose file{ id==='image-audio-mp4'?'s':'' }</h2><label className="v2-field">Select {id==='image-audio-mp4'?'image and audio':'media file'}<input type="file" accept={id==='image-audio-mp4'?'image/*,audio/*':'video/*,audio/*,.mkv,.flac,.avi,.mov'} multiple={id==='image-audio-mp4'} onChange={e=>select(e.target.files)}/></label>
     {files.map(f=><p className="v2-hint" key={f.name}>{f.name} · {(f.size/1024/1024).toFixed(2)} MB</p>)}
     {['video-trim','video-gif','audio-trim'].includes(id)&&<><label className="v2-field">Start at seconds<input type="number" min="0" value={start} onChange={e=>setStart(e.target.value)}/></label><label className="v2-field">Duration in seconds<input type="number" min="0.1" value={duration} onChange={e=>setDuration(e.target.value)}/></label></>}
     {id==='video-compress'&&<label className="v2-field">Compression quality · {quality<=6?'High quality / larger file':quality<=12?'Balanced':'Smaller file / lower quality'}<input type="range" min="2" max="20" value={quality} onChange={e=>setQuality(Number(e.target.value))}/>Level {quality} of 20. Used when no target size is specified.</label>}
     {(id==='video-compress'||id==='audio-compress')&&<div className="tn-media-options">
       <label className="v2-field"><HardDrive size={16}/> Target maximum size (MB, approximate)<input type="number" min="0.1" max="500" step="0.1" value={targetMB} onChange={e=>setTargetMB(e.target.value)} placeholder="Optional, e.g. 2"/></label>
       <label className="v2-field"><Clock3 size={16}/> Trim to first N seconds (optional)<input type="number" min="0.1" step="0.1" value={trimSeconds} onChange={e=>setTrimSeconds(e.target.value)} placeholder="Leave blank to keep full length"/></label>
       <label className="v2-field">Fallback source duration (seconds) · only if automatic detection fails<input type="number" min="0.1" step="0.1" value={durationOverride} onChange={e=>setDurationOverride(e.target.value)} placeholder="Normally leave blank"/></label>
       <p className="v2-hint">{sourceDuration!==null?`Detected source length: ${sourceDuration.toFixed(1)} seconds. `:''}Size compression does not shorten playback. Set trim duration only when you want to cut the recording. Target size is an estimate, not a guarantee.</p>
     </div>}
     <button className="v2-primary" disabled={busy||!files.length} type="button" onClick={()=>void run()}><Film size={17}/>{busy?'Processing…':'Convert on this device'}</button>
     <p className="v2-hint"><TriangleAlert size={16}/> Media decoding is CPU-intensive; some codec combinations cannot run in this FFmpeg build. Maximum input size 64 MB.</p>
   </section><section className="v2-panel"><h2><img src="/brand-icon.png" width={29} height={29} alt=""/> <Music2 size={18}/> Result · ToolNest</h2>{progress&&<p role="status" className="v2-hint">{progress}</p>}{error&&<div className="v2-error" role="alert">{error}</div>}{outputBytes!==null&&<p className="v2-hint">Output size: {(outputBytes/1024/1024).toFixed(2)} MB {targetMB&&Number(targetMB)>0&&outputBytes>Number(targetMB)*1024*1024?'· Above target; a smaller bitrate may be required.':''}</p>}{output&&<div className="tn-media-result"><p className="v2-hint"><FileCheck2 size={17}/> Ready: {output.name}</p>
    {['mp4','webm'].includes(EXT[id])?<video controls preload="metadata" src={output.url} style={{maxWidth:'100%',width:'100%',borderRadius:12,background:'#13131b'}}/>:EXT[id]==='mp3'||EXT[id]==='wav'?<audio controls preload="metadata" src={output.url} style={{width:'100%'}}/>:null}
    {outputLength!==null&&<p className="v2-hint">Expected length {outputLength.toFixed(1)} seconds; your media player's actual duration is authoritative.</p>}
    <a className="v2-primary" href={output.url} download={output.name}><Download size={17}/> Download {output.name}</a></div>}{engineReady&&<p className="v2-hint" style={{color:'#16a34a'}}>FFmpeg engine ready on this device.</p>}<p className="v2-hint">Local FFmpeg WebAssembly is bundled with this app. It requires an initial download to cache (~32 MB) and significant browser memory. Output is not sent to a server.</p></section></div>
 </div>;
}
