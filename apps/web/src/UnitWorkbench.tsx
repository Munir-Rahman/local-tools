import {useMemo,useState} from 'react';
import {ArrowLeftRight,Calculator,Check,Copy,RotateCcw} from 'lucide-react';
import {convertUnit,getConversion} from './unitConversions';
export default function UnitWorkbench({id,onSwap,onComplete}:{id:string;onSwap:(id:string)=>void;onComplete:(name:string,result:string)=>void}){
 const spec=getConversion(id);
 const [input,setInput]=useState('1');const [digits,setDigits]=useState(9);const [copied,setCopied]=useState(false);
 const state=useMemo(()=>{try{
  const current=getConversion(id);if(!current)throw Error('Unknown conversion');
  if(!input.trim())return {result:'',error:''};
  const value=Number(input);const n=convertUnit(id,value);
  return {result:Number(n.toPrecision(digits)).toString(),error:''};
 }catch(e){return {result:'',error:e instanceof Error?e.message:String(e)};}},[id,input,digits]);
 if(!spec)return <div role="alert">Unsupported unit conversion.</div>;
 function record(){if(state.result)onComplete(spec.name,state.result+' '+spec.to.label);}
 async function copy(){if(!state.result)return;try{await navigator.clipboard.writeText(state.result);setCopied(true);}catch{setCopied(false);}}
 return <div className="v2-toolview tn-unit-view">
  <div className="v2-pagehead"><div><span className="v2-kicker">VERIFIED UNIT PAIR · {spec.family.name.toUpperCase()}</span><h1>{spec.name}</h1><p>Local unit conversion with explicit unit definitions. No files or values are uploaded.</p></div></div>
  <div className="utility-layout"><section className="v2-panel">
   <div className="v2-sectiontitle"><h2><Calculator size={20}/> Convert</h2></div>
   <label className="v2-field">{spec.from.label}<input type="number" value={input} onChange={e=>{setInput(e.target.value);setCopied(false)}} placeholder="Enter a number" /></label>
   <div className="v2-result-actions"><button className="v2-secondary" onClick={()=>onSwap(`unit-${spec.family.code}-${spec.to.code}-${spec.from.code}`)}><ArrowLeftRight size={16}/> Reverse units</button><button className="v2-secondary" onClick={()=>setInput('1')}><RotateCcw size={16}/> Reset</button></div>
   <label className="v2-field">Significant digits <select value={digits} onChange={e=>setDigits(Number(e.target.value))}>{[4,6,9,12,15].map(n=><option key={n} value={n}>{n} digits</option>)}</select></label>
  </section><section className="v2-panel"><h2>Result · {spec.to.label}</h2>
   {state.error?<div className="v2-error" role="alert">{state.error}</div>:<div className="v4-output"><strong data-testid="unit-result" style={{overflowWrap:'anywhere',fontSize:30}}>{state.result||'—'}</strong><small>{spec.to.label}</small></div>}
   <div className="v2-result-actions"><button type="button" className="v2-primary" disabled={!state.result} onClick={()=>{record();void copy();}}>{copied?<Check size={17}/>:<Copy size={17}/>} {copied?'Copied':'Copy result'}</button></div>
   <p className="v2-hint">Conversions use documented conventional unit factors or decimal/binary definitions. Display rounding is controlled by significant digits; this is not a professional calibration certificate.</p>
  </section></div></div>;
}
