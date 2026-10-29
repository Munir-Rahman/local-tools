import { useState } from 'react';
import { Copy, Download, FileJson2, Hash, QrCode, ScanBarcode, ShieldCheck, TextCursorInput, WandSparkles } from 'lucide-react';
import QRCode from 'qrcode';
import JsBarcode from 'jsbarcode';

export type UtilityId = 'json-tool' | 'word-counter' | 'text-case' | 'base64-tool' |
  'uuid-tool' | 'sha-tool' | 'qr-generator' | 'barcode-generator';
export const utilityDefs: {id:UtilityId;name:string;description:string;category:string}[] = [
  {id:'json-tool',name:'JSON Toolkit',description:'Validate, format and minify JSON.',category:'Developer'},
  {id:'word-counter',name:'Word counter',description:'Count words, lines and characters instantly.',category:'Text'},
  {id:'text-case',name:'Text case converter',description:'Upper, lower, title, camel, snake or kebab case.',category:'Text'},
  {id:'base64-tool',name:'Base64 encode/decode',description:'Encode or decode UTF-8 text locally.',category:'Developer'},
  {id:'uuid-tool',name:'UUID generator',description:'Create cryptographically random UUID v4 identifiers.',category:'Developer'},
  {id:'sha-tool',name:'SHA-256 hasher',description:'Calculate a SHA-256 digest locally using Web Crypto.',category:'Developer'},
  {id:'qr-generator',name:'QR code generator',description:'Generate QR codes for links, text, Wi-Fi or contacts.',category:'QR & Barcode'},
  {id:'barcode-generator',name:'Code 128 barcode',description:'Generate and export a printable Code 128 barcode.',category:'QR & Barcode'}
];
function downloadData(url:string,name:string){ const a=document.createElement('a'); a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove(); }
const buttonStyle:React.CSSProperties={};
export default function Utilities({id,onBack,onCompleted}:{id:UtilityId;onBack:()=>void;onCompleted:(name:string,result:string)=>void}) {
  const definition=utilityDefs.find(x=>x.id===id)!;
  const [input,setInput]=useState('');
  const [mode,setMode]=useState('format');
  const [output,setOutput]=useState('');
  const [error,setError]=useState('');
  const [qrKind,setQrKind]=useState<'text'|'url'|'wifi'|'vcard'>('text');
  const [extra,setExtra]=useState('');
  const [qrImage,setQrImage]=useState('');
  const [barcodeSvg,setBarcodeSvg]=useState('');
  const [color,setColor]=useState('#2563eb');
  const [bgColor,setBgColor]=useState('#ffffff');
  function encodeBase64(t:string){return btoa(Array.from(new TextEncoder().encode(t),b=>String.fromCharCode(b)).join(''));}
  function decodeBase64(t:string){return new TextDecoder('utf-8',{fatal:true}).decode(Uint8Array.from(atob(t.trim()),c=>c.charCodeAt(0)));}
  function caseText(t:string,variant:string){
    const words=t.trim().split(/[^\p{L}\p{N}]+/u).filter(Boolean);
    switch(variant){
      case 'upper':return t.toUpperCase();case 'lower':return t.toLowerCase();
      case 'title':return t.toLowerCase().replace(/\b\p{L}/gu,c=>c.toUpperCase());
      case 'camel':return words.map((w,i)=>i ? w.charAt(0).toUpperCase()+w.slice(1).toLowerCase():w.toLowerCase()).join('');
      case 'snake':return words.map(w=>w.toLowerCase()).join('_');
      case 'kebab':return words.map(w=>w.toLowerCase()).join('-');
      default:return t;
    }
  }
  async function run() {
    setError('');setOutput('');setQrImage('');setBarcodeSvg('');
    try {
      let result='';
      if(id==='json-tool') {const val=JSON.parse(input);result= mode==='minify'?JSON.stringify(val):mode==='validate'?'Valid JSON ✓':JSON.stringify(val,null,2);}
      else if(id==='word-counter') {
        const words=input.trim()?input.trim().split(/\s+/u).length:0;
        result=`Words: ${words}\nCharacters: ${[...input].length}\nCharacters without spaces: ${[...input.replace(/\s/gu,'')].length}\nLines: ${input?input.split(/\r\n|\r|\n/).length:0}\nApprox. reading time: ${Math.max(1,Math.ceil(words/200))} minute(s)`;
      }
      else if(id==='text-case')result=caseText(input,mode);
      else if(id==='base64-tool')result=mode==='decode'?decodeBase64(input):encodeBase64(input);
      else if(id==='uuid-tool')result=Array.from({length:Math.min(100,Math.max(1,Number.parseInt(input||'1',10)||1))},()=>crypto.randomUUID()).join('\n');
      else if(id==='sha-tool') {
        const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(input));
        result=Array.from(new Uint8Array(digest)).map(n=>n.toString(16).padStart(2,'0')).join('');
      }
      else if(id==='qr-generator') {
        if(!input.trim())throw new Error('Enter content to encode.');
        const value=qrKind==='wifi'?`WIFI:T:WPA;S:${input.replaceAll(';','\\;')};P:${extra.replaceAll(';','\\;')};;`:
        qrKind==='vcard'?`BEGIN:VCARD\nVERSION:3.0\nFN:${input}\nTEL:${extra}\nEND:VCARD`:input;
        const data=await QRCode.toDataURL(value,{errorCorrectionLevel:'H',width:640,margin:2,color:{dark:color,light:bgColor}});
        setQrImage(data);result='QR code generated. Download the image below.';
      }
      else if(id==='barcode-generator') {
        if(!input.trim())throw new Error('Enter a barcode value.');
        const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
        JsBarcode(svg,input,{format:'CODE128',displayValue:true,background:bgColor,lineColor:color,margin:14,height:92});
        const str=new XMLSerializer().serializeToString(svg);setBarcodeSvg(str);result='Barcode generated. Download SVG below.';
      }
      setOutput(result);onCompleted(definition.name,id==='qr-generator'?'qr-code.png':id==='barcode-generator'?'barcode.svg':'Text result');
    }catch(e){setError(e instanceof Error?e.message:'Unable to process input');}
  }
  async function copyOutput(){try{await navigator.clipboard.writeText(output);}catch{setError('Clipboard access is unavailable. Select the output and copy it manually.');}}
  function downloadBarcode(){const url=URL.createObjectURL(new Blob([barcodeSvg],{type:'image/svg+xml'}));downloadData(url,'code128.svg');setTimeout(()=>URL.revokeObjectURL(url),1000);}
  return <div className="v2-toolview">
    <button className="v2-link" onClick={onBack}>← All tools</button>
    <div className="v2-pagehead"><div><span className="v2-kicker">{definition.category.toUpperCase()} / LOCAL UTILITY</span><h1>{definition.name}</h1><p>{definition.description}</p></div><span className="v2-private"><ShieldCheck size={16}/> Device only</span></div>
    <div className="utility-layout"><section className="v2-panel v2-utility">
      {id==='json-tool' && <div className="v2-field"><label>Action</label><select value={mode} onChange={e=>setMode(e.target.value)}><option value="format">Prettify JSON</option><option value="validate">Validate JSON</option><option value="minify">Minify JSON</option></select></div>}
      {id==='text-case' && <div className="v2-field"><label>Case style</label><select value={mode} onChange={e=>setMode(e.target.value)}>{['upper','lower','title','camel','snake','kebab'].map(k=><option key={k} value={k}>{k}</option>)}</select></div>}
      {id==='base64-tool' && <div className="v2-field"><label>Operation</label><select value={mode} onChange={e=>setMode(e.target.value)}><option value="format">Encode UTF-8 text</option><option value="decode">Decode Base64 as UTF-8</option></select></div>}
      {id==='qr-generator' && <div className="v2-field"><label>QR content type</label><select value={qrKind} onChange={e=>setQrKind(e.target.value as typeof qrKind)}><option value="text">Text</option><option value="url">Website URL</option><option value="wifi">Wi-Fi credentials</option><option value="vcard">Contact card</option></select></div>}
      <div className="v2-field"><label>{id==='uuid-tool'?'Number of UUIDs (1–100)':id==='qr-generator'?(qrKind==='wifi'?'Wi-Fi network name':qrKind==='vcard'?'Contact full name':'Content to encode'):id==='barcode-generator'?'Barcode value':'Input text'}</label>
        {id==='uuid-tool'||id==='qr-generator'||id==='barcode-generator'?<input value={input} onChange={e=>setInput(e.target.value)} placeholder={id==='uuid-tool'?'1':id==='barcode-generator'?'PRODUCT-123456':'Enter content'} />:<textarea rows={10} value={input} onChange={e=>setInput(e.target.value)} placeholder={id==='json-tool'?'{"hello": "world"}':'Paste or type your text here...'}/>}</div>
      {id==='qr-generator'&&(qrKind==='wifi'||qrKind==='vcard')&&<div className="v2-field"><label>{qrKind==='wifi'?'Wi-Fi password':'Phone number'}</label><input value={extra} onChange={e=>setExtra(e.target.value)}/></div>}
      {(id==='qr-generator'||id==='barcode-generator')&&<div className="v2-colors"><label>Foreground <input type="color" value={color} onChange={e=>setColor(e.target.value)}/></label><label>Background <input type="color" value={bgColor} onChange={e=>setBgColor(e.target.value)}/></label></div>}
      <button className="v2-primary" onClick={run} style={buttonStyle}><WandSparkles size={17}/>{id==='qr-generator'||id==='barcode-generator'?'Generate':'Process locally'}</button>
      {error&&<p className="v2-error" role="alert">{error}</p>}
    </section><section className="v2-panel v2-result"><div className="v2-sectiontitle"><h2>Result</h2><span>Never sent to a server</span></div>
      {qrImage?<div className="v2-generated"><img src={qrImage} alt="Generated QR code"/><button className="v2-primary" onClick={()=>downloadData(qrImage,'qr-code.png')}><Download size={16}/> Save PNG</button></div>:
      barcodeSvg?<div className="v2-generated"><div className="barcode-preview" dangerouslySetInnerHTML={{__html:barcodeSvg}}/><button className="v2-primary" onClick={downloadBarcode}><Download size={16}/> Save SVG</button></div>:
      <><textarea value={output} rows={15} readOnly placeholder="Your local result will appear here..."/><button className="v2-secondary" disabled={!output} onClick={copyOutput}><Copy size={16}/> Copy result</button></>}
      <p className="v2-hint"><FileJson2 size={15}/><TextCursorInput size={15}/><Hash size={15}/><QrCode size={15}/><ScanBarcode size={15}/> Processing runs entirely in your browser.</p>
    </section></div>
  </div>;
}