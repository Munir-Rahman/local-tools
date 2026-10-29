import { useEffect, useState } from 'react';

// The publisher must configure the client ID and slots in their hosting environment.
// Google-certified consent flow must set window.__toolnestAdsConsent = true and dispatch
// 'toolnest-consent-updated' before the first ad request. No ad network loads offline.
declare global { interface Window { __toolnestAdsConsent?:boolean; adsbygoogle?:Record<string,unknown>[] } }
type Placement='home'|'catalog'|'footer'|'tools'|'article';
const slots:Record<Placement,string|undefined>={
  home:import.meta.env.VITE_ADSENSE_SLOT_HOME,
  catalog:import.meta.env.VITE_ADSENSE_SLOT_CATALOG,
  footer:import.meta.env.VITE_ADSENSE_SLOT_FOOTER,
  tools:import.meta.env.VITE_ADSENSE_SLOT_TOOLS,
  article:import.meta.env.VITE_ADSENSE_SLOT_ARTICLE,
};
let scriptPromise:Promise<void>|undefined;
function loadAdScript(client:string){
 if(scriptPromise)return scriptPromise;
 scriptPromise=new Promise((resolve,reject)=>{
   const script=document.createElement('script');script.async=true;script.crossOrigin='anonymous';
   script.src=`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(client)}`;
   script.onload=()=>resolve();script.onerror=()=>reject(Error('Ad script unavailable'));
   document.head.appendChild(script);
 });
 return scriptPromise;
}
export default function AdSlot({placement}:{placement:Placement}){
 const [consented,setConsented]=useState(Boolean(window.__toolnestAdsConsent));
 const [error,setError]=useState(false);
 const client=import.meta.env.VITE_ADSENSE_CLIENT_ID as string|undefined;
 const slot=slots[placement];
 const enabled=Boolean(!new URLSearchParams(location.search).has('desktop')&&import.meta.env.PROD&&location.protocol==='https:'&&client?.startsWith('ca-pub-')&&slot&&consented);
 useEffect(()=>{const update=()=>setConsented(Boolean(window.__toolnestAdsConsent));window.addEventListener('toolnest-consent-updated',update);return()=>window.removeEventListener('toolnest-consent-updated',update)},[]);
 useEffect(()=>{
   if(!enabled||!client||!slot)return;
   let alive=true;
   loadAdScript(client).then(()=>{if(alive)(window.adsbygoogle=window.adsbygoogle||[]).push({});}).catch(()=>{if(alive)setError(true)});
   return()=>{alive=false};
 },[enabled,client,slot]);
 if(new URLSearchParams(window.location.search).has('desktop'))return null;
 return <section className="v6-ad-slot no-print" aria-label="Advertisement">
   <div className="v6-ad-label">Advertisement</div>
   {enabled&&!error?<ins className="adsbygoogle" style={{display:'block'}} data-ad-client={client} data-ad-slot={slot} data-ad-format="auto" data-full-width-responsive="true"/>:
   <div className="v6-ad-empty">{error?'Advertisement unavailable':'Reserved ad space · no ad loaded in local or offline mode'}</div>}
 </section>;
}
