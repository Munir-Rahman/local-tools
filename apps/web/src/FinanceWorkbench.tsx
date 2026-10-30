import {useState} from 'react';
import {ArrowLeft,Calculator,Copy,ShieldCheck} from 'lucide-react';
import {estimateSalaryTax,estimateZakat} from './financeEngine';
import './financeWorkbench.css';
export type FinanceToolId='zakat-estimator'|'salary-tax-estimator';
export const financeTools=[
 {id:'zakat-estimator',name:'Zakat estimate calculator',description:'Estimate 2.5% of eligible net wealth with your own nisab threshold. No live gold prices.',category:'Calculators',featured:false},
 {id:'salary-tax-estimator',name:'Salary tax percentage calculator',description:'Estimate take-home salary from your own rate. No local tax law assumed.',category:'Calculators',featured:false}
] as const;
function toNumber(value:string,label:string){
 if(!value.trim())throw Error('Enter '+label+'.');
 const n=Number(value);
 if(!Number.isFinite(n))throw Error('Enter a valid number for '+label+'.');
 return n;
}
function Field({title,value,onChange,help}:{title:string;value:string;onChange:(x:string)=>void;help?:string}){
  return <label>{title}<input type="number" step="any" min="0" value={value} onChange={e=>onChange(e.target.value)}/>{help&&<small>{help}</small>}</label>;
 }
export default function FinanceWorkbench({id,onBack,onCompleted}:{id:FinanceToolId;onBack:()=>void;onCompleted:(name:string,result:string)=>void}){
 const zakat=id==='zakat-estimator';
 const [assets,setAssets]=useState('0'),[liabilities,setLiabilities]=useState('0'),[threshold,setThreshold]=useState('');
 const [salary,setSalary]=useState(''),[rate,setRate]=useState('10');
 const [currency,setCurrency]=useState('AFN'),[result,setResult]=useState(''),[error,setError]=useState('');
 const title=zakat?'Zakat estimate calculator':'Salary percentage calculator';
 function calculate(){
  setError('');setResult('');
  try{
    let output='';
    if(zakat){
      const x=estimateZakat(toNumber(assets,'assets'),toNumber(liabilities,'liabilities'),toNumber(threshold,'the nisab threshold'));
      output='Net wealth: '+currency+' '+x.netAssets.toFixed(2)+'\nNisab threshold reached: '+(x.aboveThreshold?'Yes':'No')+'\nEstimated 2.5% amount: '+currency+' '+x.estimatedAmount.toFixed(2);
    }else{
      const x=estimateSalaryTax(toNumber(salary,'salary'),toNumber(rate,'tax percentage'));
      output='Gross salary: '+currency+' '+x.gross.toFixed(2)+'\nUser-provided rate: '+x.ratePercent.toFixed(2)+'%\nEstimated tax: '+currency+' '+x.tax.toFixed(2)+'\nEstimated net: '+currency+' '+x.net.toFixed(2);
    }
    setResult(output);onCompleted(title,'Local calculation');
  }catch(e){setError(e instanceof Error?e.message:String(e))}
 }
 return <div className="tn-finance-page"><button className="tn-finance-back" onClick={onBack}><ArrowLeft size={17}/> All tools</button>
   <header><span><Calculator size={31}/></span><div><small>LOCAL FINANCIAL UTILITIES</small><h1>{title}</h1><p>{zakat?'Your figures and locally confirmed nisab threshold. No market data is fetched.':'A simple percentage estimate, not a jurisdiction-specific payroll tax schedule.'}</p></div></header>
   <div className="tn-finance-columns"><section><h2>Enter values</h2>
   <label>Currency label<select value={currency} onChange={e=>setCurrency(e.target.value)}><option>AFN</option><option>USD</option><option>PKR</option><option>EUR</option><option>INR</option></select></label>
   {zakat?<><Field title="Total zakatable assets (in selected currency)" value={assets} onChange={setAssets} help="Include eligible cash, savings, trade stock and other assessed holdings."/><Field title="Allowable liabilities (same currency)" value={liabilities} onChange={setLiabilities}/><Field title="Nisab threshold VALUE (same currency)" value={threshold} onChange={setThreshold} help="Obtain your own current gold/silver price and applicable nisab measure from a reliable local source." /></>:
   <><Field title="Gross salary" value={salary} onChange={setSalary}/><Field title="User-entered tax percentage (%)" value={rate} onChange={setRate} help="Do not assume this rate represents current law in your country."/></>}
   <button className="tn-finance-action" onClick={calculate}>Calculate locally</button>{error&&<p role="alert" className="tn-finance-error">{error}</p>}
   </section><section className="tn-finance-result"><div className="tn-finance-resulthead"><h2>Calculation</h2>{result&&<button onClick={()=>void navigator.clipboard.writeText(result).catch(()=>setError('Clipboard unavailable'))}><Copy size={16}/> Copy</button>}</div>
   {result?<pre aria-live="polite">{result}</pre>:<p>Enter the values and select Calculate to see your result.</p>}
   <aside><ShieldCheck size={18}/><div><strong>Important limitations</strong><p>{zakat?'The calculation assumes eligible zakatable wealth held for the required period and uses a simplified 2.5% annual estimate. Juristic details, current market prices, assets and liabilities can change the amount. Consult a qualified local scholar when making obligations.':'This is arithmetic using a percentage you supply, not a calculation of legal withholding rates, deductions or brackets. Confirm payroll figures with current local regulations.'}</p></div></aside>
   </section></div></div>;
}
