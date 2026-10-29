import {useState} from 'react';
import {ArrowLeft, CheckCircle2, Copy, Download, Play, ShieldCheck} from 'lucide-react';
import {catalog} from './catalog';
import {executeExtra,extras} from './extraEngine';
export default function ExtraWorkbench({number,onBack,onCompleted}:{number:number;onBack:()=>void;onCompleted:(name:string,result:string)=>void}){
  const spec=extras[number];
  const title=catalog[number-1]?.name||`Action ${number}`;
  const [values,setValues]=useState(()=>[...spec.example]);
  const [output,setOutput]=useState('');
  const [error,setError]=useState('');
  const [busy,setBusy]=useState(false);
  async function run(){setBusy(true);setError('');setOutput('');try{const result=await executeExtra(number,values);setOutput(result);onCompleted(title,'Text result');}catch(e){setError(e instanceof Error?e.message:'Invalid input');}finally{setBusy(false)}}
  async function copy(){try{await navigator.clipboard.writeText(output);}catch{setError('Clipboard unavailable; manually select and copy the result.')}}
  function download(){const ext=[301,303,307,329].includes(number)?'json':[306,308,359].includes(number)?'xml':number===310?'sql':number===318||number===357||number===358?'html':number===319?'md':'txt';const url=URL.createObjectURL(new Blob([output],{type:'text/plain;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download=`localtools-${String(number).padStart(3,'0')}.${ext}`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
  return <div className="v2-toolview">
    <button className="v2-link" onClick={onBack}><ArrowLeft size={16}/> Back to catalog</button>
    <div className="v2-pagehead"><div><span className="v2-kicker">#{String(number).padStart(3,'0')} · {spec.category.toUpperCase()}</span><h1>{title}</h1><p>{spec.help}</p></div><span className="v2-private"><ShieldCheck size={16}/> 100% local</span></div>
    <div className="utility-layout"><section className="v2-panel v2-utility"><div className="v2-sectiontitle"><h2>Input</h2><span>{spec.inputs.length} field(s)</span></div>
      {spec.inputs.map((field,i)=><label className="v2-field" key={i}><span>{field}</span>{(i===0&&['Text','Developer'].includes(spec.category) && ![321,322,323,329,333,335,336].includes(number))?<textarea rows={9} value={values[i]||''} onChange={e=>setValues(prev=>prev.map((v,j)=>i===j?e.target.value:v))}/>:<input value={values[i]||''} onChange={e=>setValues(prev=>prev.map((v,j)=>i===j?e.target.value:v))} />}</label>)}
      <button className="v2-primary" disabled={busy} onClick={()=>void run()}><Play size={16}/>{busy?'Processing…':'Run locally'}</button>{error&&<p className="v2-error" role="alert">{error}</p>}
      <p className="v2-hint"><ShieldCheck size={15}/> Input stays in this browser tab; no conversion requests are made.</p>
    </section><section className="v2-panel v2-result"><div className="v2-sectiontitle"><h2>Output</h2><span>{output?'Complete':'Awaiting input'}</span></div>
      <textarea aria-label="Tool result" rows={18} readOnly value={output} placeholder="The result will appear here."/>
      <div className="v2-result-actions"><button className="v2-secondary" disabled={!output} onClick={()=>void copy()}><Copy size={16}/> Copy</button><button className="v2-secondary" disabled={!output} onClick={download}><Download size={16}/> Save file</button></div>
      {output&&<p className="v2-hint"><CheckCircle2 size={16}/> Processed entirely in your browser</p>}
    </section></div>
  </div>;
}