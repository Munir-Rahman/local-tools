import { useEffect, useState } from 'react';
import { Download, FileText, Plus, Printer, Save, Trash2, Check } from 'lucide-react';
import { deleteDocument, readDocument, saveDocument } from './localDb';

export type TemplateId='cv-builder'|'invoice-builder';
const cvLayouts=['modern','classic','minimal','executive','creative','academic','technical','elegant','sidebar','compact','bold','graduate'] as const;
type CV={name:string,title:string,email:string,phone:string,location:string,website:string,summary:string,experience:string,education:string,skills:string,color:string,template:typeof cvLayouts[number]};
const starterCV:CV={name:'',title:'',email:'',phone:'',location:'',website:'',summary:'',experience:'',education:'',skills:'',color:'#2563eb',template:'modern'};
type InvoiceLine={id:string;description:string;quantity:string;price:string};
type Invoice={items:InvoiceLine[];company:string,client:string,number:string,date:string,currency:string,description:string,quantity:string,price:string,notes:string,color:string};
const starterInvoice:Invoice={company:'',client:'',number:'INV-001',date:new Date().toISOString().slice(0,10),currency:'USD',description:'',quantity:'1',price:'0',notes:'',color:'#2563eb',items:[{id:'first',description:'',quantity:'1',price:'0'}]};

export default function Templates({id,onBack,onCompleted}:{id:TemplateId;onBack:()=>void;onCompleted:(name:string,result:string)=>void}) {
  const [cv,setCV]=useState<CV>(starterCV);
  const [invoice,setInvoice]=useState<Invoice>(starterInvoice);
  const [notice,setNotice]=useState('');
  const [saving,setSaving]=useState(false);
  useEffect(()=>{
    let live=true;
    readDocument<CV|Invoice>(id).then(value=>{if(!live||!value)return;if(id==='cv-builder')setCV({...starterCV,...value as CV});else setInvoice({...starterInvoice,...value as Invoice,items:Array.isArray((value as Invoice).items)?(value as Invoice).items:starterInvoice.items});}).catch(()=>{if(live)setNotice('Local saved templates could not be loaded.');});
    return ()=>{live=false};
  },[id]);
  async function save(){setSaving(true);try{await saveDocument(id,id==='cv-builder'?cv:invoice);setNotice('Saved privately in this browser (SQLite).');}catch{setNotice('Could not save. Check browser storage settings.');}finally{setSaving(false)}}
  async function clear(){setSaving(true);try{await deleteDocument(id);if(id==='cv-builder')setCV(starterCV);else setInvoice(starterInvoice);setNotice('Saved draft cleared.');}catch{setNotice('Unable to clear the saved draft.');}finally{setSaving(false)}}
  function print(){onCompleted(id==='cv-builder'?'CV builder':'Invoice builder','Print / Save as PDF');window.print();}
  function cvUpdate(key:keyof CV,value:string){setCV(p=>({...p,[key]:value}));setNotice('Unsaved changes');}
  function invoiceUpdate(key:keyof Invoice,value:string){setInvoice(p=>({...p,[key]:value}));setNotice('Unsaved changes');}
  function invoiceUpdateItems(items:InvoiceLine[]){setInvoice(p=>({...p,items}));setNotice('Unsaved changes');}
  function invoiceLineUpdate(id:string,key:'description'|'quantity'|'price',value:string){invoiceUpdateItems(invoice.items.map(row=>row.id===id?{...row,[key]:value}:row));}
  function cvField(key: keyof CV,label:string,large=false){return <label className="v2-field" key={key}><span>{label}</span>{large?<textarea rows={3} value={cv[key]} onChange={e=>cvUpdate(key,e.target.value)}/>:<input value={cv[key]} onChange={e=>cvUpdate(key,e.target.value)}/>}</label>}
  function invoiceField(key: Exclude<keyof Invoice,'items'>,label:string){return <label className="v2-field" key={key}><span>{label}</span><input value={invoice[key]} onChange={e=>invoiceUpdate(key,e.target.value)}/></label>}
  return <div className="v2-toolview v2-template-page"><button className="v2-link no-print" onClick={onBack}>← Templates</button>
    <div className="v2-pagehead no-print"><div><span className="v2-kicker">CUSTOMIZABLE LOCAL TEMPLATE</span><h1>{id==='cv-builder'?'CV & Resume Builder':'Invoice Generator'}</h1><p>Customize information, colors, and layout. Save a local draft or print to PDF without uploads.</p></div></div>
    <div className="template-layout"><section className="v2-panel template-editor no-print"><div className="v2-sectiontitle"><h2>{id==='cv-builder'?'Your professional profile':'Invoice details'}</h2></div>
      {id==='cv-builder'?<>
        <div className="v7-cv-heading"><h3>Choose your resume design</h3><span>12 live preview layouts</span></div><div className="v7-cv-gallery" role="group" aria-label="Choose CV template">{cvLayouts.map(v=><button key={v} type="button" aria-pressed={cv.template===v} className={`v7-cv-choice ${cv.template===v?'selected':''}`} onClick={()=>cvUpdate('template',v)}><span className={`v7-cv-thumb v7-thumb-${v}`}><i className="v7-mini-head"/><i className="v7-mini-name"/><i className="v7-mini-line"/><i className="v7-mini-line short"/><i className="v7-mini-section"/><i className="v7-mini-line"/><i className="v7-mini-line short"/><i className="v7-mini-section"/><i className="v7-mini-line"/></span><span>{v.charAt(0).toUpperCase()+v.slice(1)}</span>{cv.template===v&&<Check size={14}/>}</button>)}</div><div className="v2-template-options"><label className="v2-field"><span>Accent color</span><input type="color" value={cv.color} onChange={e=>cvUpdate('color',e.target.value)}/></label></div>
        <div className="v2-two-col">{cvField('name','Full name')}{cvField('title','Professional title')}{cvField('email','Email')}{cvField('phone','Phone')}{cvField('location','Location')}{cvField('website','Website or portfolio')}</div>
        {cvField('summary','Profile summary',true)}{cvField('experience','Work experience (one entry per line)',true)}
        {cvField('education','Education (one entry per line)',true)}{cvField('skills','Skills (comma-separated)',true)}
      </>:<>
        <div className="v2-two-col">{invoiceField('company','Your business')}{invoiceField('client','Bill to')}{invoiceField('number','Invoice number')}{invoiceField('date','Invoice date')}{invoiceField('currency','Currency (e.g. USD)')}</div>
        <div className="v6-lineitems-head"><h3>Items & services ({invoice.items.length})</h3><button type="button" className="v2-secondary" onClick={()=>invoiceUpdateItems([...invoice.items,{id:crypto.randomUUID(),description:'',quantity:'1',price:'0'}])}><Plus size={16}/> Add item</button></div>
        {invoice.items.map((line,i)=><div className="v6-lineitem" key={line.id}><label className="v2-field"><span>Item {i+1} description</span><input value={line.description} onChange={e=>invoiceLineUpdate(line.id,'description',e.target.value)}/></label><label className="v2-field"><span>Qty</span><input type="number" min="0" step="any" value={line.quantity} onChange={e=>invoiceLineUpdate(line.id,'quantity',e.target.value)}/></label><label className="v2-field"><span>Unit price</span><input type="number" min="0" step="any" value={line.price} onChange={e=>invoiceLineUpdate(line.id,'price',e.target.value)}/></label><button className="v6-remove-line" aria-label={`Remove item ${i+1}`} title="Remove item" disabled={invoice.items.length===1} onClick={()=>invoiceUpdateItems(invoice.items.filter(x=>x.id!==line.id))}><Trash2 size={16}/></button></div>)}
        {invoiceField('notes','Payment notes')}<label className="v2-field"><span>Accent color</span><input type="color" value={invoice.color} onChange={e=>invoiceUpdate('color',e.target.value)}/></label>
      </>}
      <div className="template-actions"><button className="v2-secondary" disabled={saving} onClick={save}><Save size={16}/> Save draft</button><button className="v2-secondary" disabled={saving} onClick={clear}><Trash2 size={16}/> Clear</button><button className="v2-primary" onClick={print}><Printer size={16}/> Print / Save PDF</button></div>
      {notice&&<p className="v2-hint">{notice}</p>}
      <p className="v2-hint"><FileText size={16}/> In the print dialog, select “Save as PDF.” PDF output uses the browser's local print engine; page breaks and fonts may vary by browser.</p>
    </section>
    <section className="v2-panel template-preview-panel"><div className="v2-sectiontitle no-print"><h2>Live A4 preview</h2><span><Download size={14}/> Printable</span></div>
      {id==='cv-builder'?<article className={`cv-paper cv-${cv.template}`} style={{'--document-accent':cv.color} as React.CSSProperties} id="print-document">
        <header className="cv-header"><h1>{cv.name||'Your name'}</h1><p className="cv-role">{cv.title||'Professional title'}</p><p className="cv-contact">{[cv.email,cv.phone,cv.location,cv.website].filter(Boolean).join('  •  ')||'Email • Phone • Location • Website'}</p></header>
        <div className="cv-content"><section><h2>PROFILE</h2><p>{cv.summary||'Add a concise professional summary to introduce your experience and strengths.'}</p></section>
        <section><h2>EXPERIENCE</h2>{(cv.experience||'Add your roles, dates, accomplishments, and professional achievements.').split('\n').map((line,i)=><p key={i}>{line||' '}</p>)}</section>
        <section><h2>EDUCATION</h2>{(cv.education||'Add degrees, institutions, certificates, and relevant coursework.').split('\n').map((line,i)=><p key={i}>{line||' '}</p>)}</section>
        <section><h2>SKILLS</h2><div className="cv-skills">{(cv.skills||'Communication, Project management, Software development').split(',').filter(Boolean).map((s,i)=><span key={i}>{s.trim()}</span>)}</div></section></div>
      </article>:<article className="invoice-paper" style={{'--document-accent':invoice.color} as React.CSSProperties} id="print-document">
        <header><span className="invoice-brand">{invoice.company||'Your company'}</span><h1>INVOICE</h1><p>#{invoice.number||'INV-001'} · {invoice.date}</p></header>
        <div className="invoice-to"><strong>BILL TO</strong><p>{invoice.client||'Customer or company'}</p></div>
        <table><thead><tr><th>Description</th><th>Qty</th><th>Unit price</th><th>Amount</th></tr></thead><tbody>{invoice.items.map(line=><tr key={line.id}><td>{line.description||'Service or product'}</td><td>{line.quantity}</td><td>{invoice.currency} {Number(line.price||0).toFixed(2)}</td><td>{invoice.currency} {(Math.max(0,Number(line.quantity)||0)*Math.max(0,Number(line.price)||0)).toFixed(2)}</td></tr>)}</tbody></table>
        <div className="invoice-total"><strong>Total</strong><strong>{invoice.currency} {invoice.items.reduce((sum,line)=>sum+Math.max(0,Number(line.quantity)||0)*Math.max(0,Number(line.price)||0),0).toFixed(2)}</strong></div>
        <p className="invoice-notes">{invoice.notes||'Thank you for your business.'}</p>
      </article>}
    </section></div>
  </div>;
}
