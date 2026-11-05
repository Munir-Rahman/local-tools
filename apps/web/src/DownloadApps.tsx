import { useEffect, useState } from 'react';
import { Download, Smartphone, Monitor, Laptop, Package, ShieldAlert, WifiOff } from 'lucide-react';
import './downloads.css';

type Platform='android'|'windows'|'macos'|'linux';
type AssetState={available:boolean;size:number|null};
type DownloadManifest={release:string;preview:boolean;platforms:Partial<Record<Platform,AssetState>>;ios?:{available:boolean;reason:string}};
const PLATFORMS=[
  {id:'windows',name:'Windows',icon:Monitor,format:'EXE installer',note:'Windows 10/11 · unsigned preview',label:'Download Windows EXE'},
  {id:'android',name:'Android',icon:Smartphone,format:'APK installer',note:'Android preview · back up app data',label:'Download Android APK'},
  {id:'macos',name:'macOS',icon:Laptop,format:'DMG package',note:'Unsigned / not notarized · test build',label:'Download macOS DMG'},
  {id:'linux',name:'Linux',icon:Package,format:'AppImage',note:'Linux desktop preview',label:'Download Linux AppImage'}
] as const;
const url=(platform:Platform)=>'/api/download?platform='+platform;
function formatted(size:number|null|undefined){
  if(!size)return '';
  return size>=1024*1024?(size/(1024*1024)).toFixed(1)+' MB':Math.ceil(size/1024)+' KB';
}

export default function DownloadApps({compact=false}:{compact?:boolean}){
  const [state,setState]=useState<DownloadManifest|null>(null);
  const [error,setError]=useState(false);
  useEffect(()=>{
    const controller=new AbortController();
    fetch('/api/download',{signal:controller.signal,cache:'no-store',headers:{Accept:'application/json'}})
      .then(async response=>{
        if(!response.ok)throw Error('Download status unavailable');
        const data=await response.json() as DownloadManifest;
        if(!data?.platforms)throw Error('Missing release metadata');
        if(!controller.signal.aborted){setState(data);setError(false);}
      }).catch(()=>{
        if(!controller.signal.aborted){setState(null);setError(true);}
      });
    return ()=>controller.abort();
  },[]);
  return <section className={'tn-downloads '+(compact?'tn-downloads-compact':'tn-downloads-full')} aria-label="Download ToolNest applications">
    <div className="tn-downloads-heading">
      <span className="tn-downloads-eyebrow">INSTALL TOOLNEST</span>
      <h2>{compact?'Download ToolNest apps':'Download ToolNest for your device'}</h2>
      <p>Use ToolNest on your computer or phone. Available installers download directly from this website—no GitHub pages or sign-in required.</p>
    </div>
    <div className="tn-downloads-grid">
      {PLATFORMS.map(platform=>{
        const Icon=platform.icon;
        const item=state?.platforms?.[platform.id];
        const isReady=item?.available===true;
        return <article className="tn-download-tile" key={platform.id}>
          <div className="tn-download-title"><span className="tn-download-icon"><Icon size={23} aria-hidden="true"/></span><div><strong>{platform.name}</strong><small>{platform.format}</small></div></div>
          <p>{platform.note}</p>
          {isReady?<a className="tn-download-action" href={url(platform.id)} aria-label={platform.label}><Download size={17} aria-hidden="true"/> {platform.label}</a>:
            <span className="tn-download-unavailable" aria-disabled="true">{error?'Status unavailable':!state?'Checking downloads…':'Installer not published yet'}</span>}
          {isReady&&<small className="tn-download-size">{formatted(item?.size)} · Preview build</small>}
        </article>;
      })}
    </div>
    <div className="tn-download-notes"><p><ShieldAlert size={17} aria-hidden="true"/> These are <strong>preview/test installers</strong>, not signed or independently certified production releases. Installing Android previews may require backing up your current app. Windows or macOS may warn about an unsigned publisher.</p><p><WifiOff size={17} aria-hidden="true"/> <strong>iPhone / iPad:</strong> No App Store or TestFlight build published yet. iOS apps require Apple signing and cannot be installed like an Android APK.</p></div>
    {error&&<p role="status" className="tn-download-error">Installer availability could not be checked. Check your connection and refresh this page. Files must be published before download buttons are enabled.</p>}
  </section>;
}
