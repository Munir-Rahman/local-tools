import { useState } from 'react';
import { Calculator, Check, Copy, RotateCcw } from 'lucide-react';
import { calculateScience, scienceTools } from './scienceEngine';
export default function ScienceWorkbench({id,onComplete}:{id:string;onComplete:(name:string,result:string)=>void}){
  const spec=scienceTools.find(t=>t.id===id);
  const [values,setValues]=useState<string[]>(spec?.samples||[]);
  const [result,setResult]=useState('');
  const [error,setError]=useState('');
  if(!spec)return <div className="v2-error">Unknown calculator.</div>;
  const run=()=>{try{const out=calculateScience(spec.id,values);setResult(out);setError('');onComplete(spec.name,out);}catch(e){setError(e instanceof Error?e.message:'Calculation failed');setResult('');}};
  return <div className="v2-toolview"><div className="v2-pagehead"><div><span className="v2-kicker">{spec.category.toUpperCase()} · OFFLINE CALCULATOR</span><h1>{spec.name}</h1><p>{spec.description}</p></div></div>
   <div className="utility-layout"><section className="v2-panel"><div className="v2-sectiontitle"><h2>Input values</h2></div>
    {spec.fields.map((field,index)=><label key={index} className="v2-field">{field}<input value={values[index]??''} onChange={e=>{setValues(current=>{const next=[...current];next[index]=e.target.value;return next;});setResult('');}} /></label>)}
    <div className="v2-result-actions"><button className="v2-primary" type="button" onClick={run}><Calculator size={17}/> Calculate</button><button className="v2-secondary" type="button" onClick={()=>{setValues(spec.samples);setResult('');setError('');}}><RotateCcw size={15}/> Reset</button></div>
   </section><section className="v2-panel"><div className="v2-sectiontitle"><h2>Result</h2></div>{error&&<p className="v2-error" role="alert">{error}</p>}{result?<div className="v4-output"><strong>{result}</strong><button className="v2-secondary" type="button" onClick={()=>navigator.clipboard.writeText(result)}><Copy size={15}/> Copy result</button></div>:<p className="v2-hint"><Check size={17}/> Enter values and calculate. No data is uploaded.</p>}<p className="v2-hint">Use appropriate units and assumptions. This tool is not a substitute for professional engineering verification.</p></section></div>
  </div>;
}