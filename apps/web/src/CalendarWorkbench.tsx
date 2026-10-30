import {useState} from 'react';
import {ArrowLeft,CalendarDays,Copy,RefreshCw,ShieldCheck} from 'lucide-react';
import {calendarLabels,convertCalendar,daysBetweenGregorian,toGregorianDate} from './calendarEngine';
import type {CalendarSystem,CalendarConversion} from './calendarEngine';
import './calendarWorkbench.css';

export const calendarToolDefs=[
  {id:'calendar-gregorian',name:'Gregorian date converter',description:'Convert Gregorian dates to Afghan Solar Hijri and civil Islamic Hijri.',category:'Calculators'},
  {id:'calendar-solar-hijri',name:'Afghan Solar Hijri converter',description:'Convert Afghan Shamsi (Hijri solar) dates to Gregorian and Islamic Hijri.',category:'Calculators'},
  {id:'calendar-islamic-hijri',name:'Islamic Hijri converter',description:'Convert tabular Islamic Hijri dates to Gregorian and Solar Hijri.',category:'Calculators'},
  {id:'calendar-days-between',name:'Days between dates',description:'Calculate elapsed calendar days using two Gregorian dates.',category:'Calculators'},
  {id:'calendar-add-days',name:'Add days to a date',description:'Calculate a new date by adding or subtracting days.',category:'Calculators'},
  {id:'calendar-age',name:'Age calculator',description:'Calculate completed age in years from a Gregorian birth date.',category:'Calculators'},
] as const;
export type CalendarToolId=typeof calendarToolDefs[number]['id'];
const mapping:Record<string,CalendarSystem>={'calendar-gregorian':'gregorian','calendar-solar-hijri':'solar-hijri','calendar-islamic-hijri':'islamic-hijri'};
const descriptions=['All calculations run offline in your browser.','Afghan Shamsi dates use the Persian/Solar Hijri calendar.','Islamic Hijri uses a tabular civil calculation; local moon-sighting dates may differ.'];
function formatResult(result:CalendarConversion):string{
 return 'Gregorian: '+result.gregorian+'\nSolar Hijri: '+result.solarHijri+'\nIslamic Hijri (civil): '+result.islamicHijri+'\nWeekday: '+result.weekday;
}
export default function CalendarWorkbench({id,onBack,onCompleted}:{id:CalendarToolId;onBack:()=>void;onCompleted:(name:string,result:string)=>void}){
 const definition=calendarToolDefs.find(t=>t.id===id)!;
 const [source,setSource]=useState<CalendarSystem>(mapping[id]||'gregorian');
 const [date,setDate]=useState(id==='calendar-gregorian'||!mapping[id]?new Date().toISOString().slice(0,10):'');
 const [second,setSecond]=useState(new Date().toISOString().slice(0,10));
 const [amount,setAmount]=useState('30');
 const [output,setOutput]=useState('');
 const [error,setError]=useState('');
 const [copied,setCopied]=useState(false);
 function calculate(){
  setError('');setOutput('');setCopied(false);
  try{
    let value:string;
    if(id==='calendar-days-between'){
      value='Days between '+date+' and '+second+': '+daysBetweenGregorian(date,second)+' days.';
    }else if(id==='calendar-add-days'){
      const n=Number(amount);
      if(!Number.isSafeInteger(n)||Math.abs(n)>36525)throw Error('Enter a whole number of days between -36525 and 36525.');
      const start=toGregorianDate(date,'gregorian');
      const changed=new Date(start.getTime()+n*86400000);
      value=formatResult(convertCalendar(changed.toISOString().slice(0,10),'gregorian'));
    }else if(id==='calendar-age'){
      const birth=toGregorianDate(date,'gregorian');
      const now=toGregorianDate(new Date().toISOString().slice(0,10),'gregorian');
      if(birth.getTime()>now.getTime())throw Error('Birth date cannot be in the future.');
      let years=now.getUTCFullYear()-birth.getUTCFullYear();
      if(now.getUTCMonth()<birth.getUTCMonth()||(now.getUTCMonth()===birth.getUTCMonth()&&now.getUTCDate()<birth.getUTCDate()))years--;
      value='Completed age: '+years+' years.\nDays since birth: '+daysBetweenGregorian(date,now.toISOString().slice(0,10))+'.';
    }else value=formatResult(convertCalendar(date,source));
    setOutput(value);onCompleted(definition.name,'Calendar result');
  }catch(e){setError(e instanceof Error?e.message:String(e))}
 }
 async function copy(){try{await navigator.clipboard.writeText(output);setCopied(true)}catch{setError('Clipboard is unavailable. Select and copy the result manually.')}}
 return <section className="tn-calendar-page">
   <button className="tn-calendar-back" onClick={onBack}><ArrowLeft size={17}/> All tools</button>
   <header className="tn-calendar-heading"><span className="tn-calendar-icon"><CalendarDays size={30}/></span><div><small>OFFLINE DATE UTILITIES</small><h1>{definition.name}</h1><p>{definition.description}</p></div></header>
   <div className="tn-calendar-layout"><div className="tn-calendar-panel">
     <h2>Enter date details</h2>
     {Boolean(mapping[id])&&<label>Source calendar<select value={source} onChange={e=>setSource(e.target.value as CalendarSystem)}>{(Object.keys(calendarLabels) as CalendarSystem[]).map(k=><option key={k} value={k}>{calendarLabels[k]}</option>)}</select></label>}
     <label>{id==='calendar-age'?'Birth date (Gregorian)':id==='calendar-days-between'?'Start date (Gregorian)':'Date (YYYY-MM-DD)'}<input value={date} onChange={e=>setDate(e.target.value)} placeholder={source==='gregorian'?'2026-10-30':source==='solar-hijri'?'1405-08-08':'1448-05-18'} spellCheck={false}/></label>
     {id==='calendar-days-between'&&<label>End date (Gregorian)<input value={second} onChange={e=>setSecond(e.target.value)} placeholder="2026-12-01"/></label>}
     {id==='calendar-add-days'&&<label>Days to add (use negative to subtract)<input type="number" value={amount} onChange={e=>setAmount(e.target.value)}/></label>}
     <button className="tn-calendar-submit" onClick={calculate}><RefreshCw size={18}/> Calculate locally</button>
     {error&&<p role="alert" className="tn-calendar-error">{error}</p>}
   </div><div className="tn-calendar-panel tn-calendar-results">
     <div className="tn-calendar-result-head"><h2>Result</h2>{output&&<button onClick={()=>void copy()}><Copy size={16}/>{copied?'Copied':'Copy'}</button>}</div>
     {output?<pre aria-live="polite">{output}</pre>:<p className="tn-calendar-empty">Enter a date and select Calculate to view the result here.</p>}
     <div className="tn-calendar-note"><ShieldCheck size={17}/><span>{descriptions.map(d=><span key={d}>{d}<br/></span>)}</span></div>
   </div></div>
 </section>;
}
