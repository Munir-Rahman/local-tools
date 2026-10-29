import { useEffect, useState } from 'react';
import { Download, Printer, Save, Trash2 } from 'lucide-react';
import { readDocument, saveDocument, deleteDocument } from './localDb';

export const businessTemplates=[
  {id:'quote-template',name:'Quotation / Estimate',catalog:422,description:'Printable quotation with amounts, validity and client information.'},
  {id:'receipt-template',name:'Payment Receipt',catalog:423,description:'Customer receipt with payment reference and total.'},
  {id:'purchase-template',name:'Purchase Order',catalog:424,description:'Issue a local purchase-order document.'},
  {id:'delivery-template',name:'Delivery Note',catalog:425,description:'Goods delivered, recipient and acknowledgment details.'},
  {id:'certificate-template',name:'Certificate Maker',catalog:435,description:'A printable achievement or completion certificate.'},
  {id:'letter-template',name:'Cover Letter Builder',catalog:434,description:'Formal cover letter with contact details.'},
  {id:'business-card-template',name:'Business Card Builder',catalog:432,description:'Printable simple branded business card.'},
  {id:'id-card-template',name:'Employee ID Badge',catalog:431,description:'Printable employee or visitor ID card.'},
  {id:'timesheet-template',name:'Timesheet Generator',catalog:430,description:'Generate and print a staff timesheet.'},
  {id:'label-template',name:'Product Price Label',catalog:438,description:'Printable SKU and price label.'},
] as const;
export type BusinessTemplateId = typeof businessTemplates[number]['id'];
const starter={issuer:'',recipient:'',reference:'REF-001',date:new Date().toISOString().slice(0,10),subject:'',body:'',quantity:'1',unitPrice:'0',currency:'USD',footer:'',color:'#2563eb'};
type Values=typeof starter;
export default function BusinessTemplates({id,onCompleted,onBack}:{id:BusinessTemplateId;onCompleted:(name:string,result:string)=>void;onBack:()=>void}){
 const spec=businessTemplates.find(t=>t.id===id)!;
 const [values,setValues]=useState<Values>(starter);
 const [notice,setNotice]=useState('');
 useEffect(()=>{let alive=true;readDocument<Values>(id).then(s=>{if(alive&&s)setValues({...starter,...s});}).catch(e=>{if(alive)setNotice(`Could not load saved draft: ${String(e)}`);});return()=>{alive=false};},[id]);
 const update=(key:keyof Values,val:string)=>{setValues(v=>({...v,[key]:val}));setNotice('Unsaved changes');};
 const save=async()=>{try{await saveDocument(id,values);setNotice('Draft saved in private browser SQLite.');}catch(e){setNotice(`Saving failed: ${String(e)}`);}};
 const clear=async()=>{try{await deleteDocument(id);setValues(starter);setNotice('Draft removed.');}catch(e){setNotice(`Deletion failed: ${String(e)}`);}};
 const print=()=>{onCompleted(spec.name,'Print / Save PDF');window.print()};
 const field=(key:keyof Values,label:string,multi=false)=><label className="v2-field"><span>{label}</span>{multi?<textarea rows={5} value={values[key]} onChange={e=>update(key,e.target.value)}/>:<input value={values[key]} onChange={e=>update(key,e.target.value)}/>}</label>;
 const financial=['quote-template','receipt-template','purchase-template'].includes(id);
 const total=Math.max(0,Number(values.quantity)||0)*Math.max(0,Number(values.unitPrice)||0);
 return <div className="v2-toolview v2-template-page"><button className="v2-link no-print" type="button" onClick={onBack}>← Templates</button><div className="v2-pagehead no-print"><div><span className="v2-kicker">PRIVATE DOCUMENT TEMPLATE</span><h1>{spec.name}</h1><p>{spec.description} · Print to PDF from your browser.</p></div></div>
   <div className="template-layout"><section className="v2-panel template-editor no-print"><h2>Document details</h2>
    <div className="v2-two-col">{field('issuer',id==='letter-template'?'Your name':'Issuer / company')}{field('recipient',id==='certificate-template'?'Recipient name':'Client / recipient')}{field('reference','Reference / number')}{field('date','Date (YYYY-MM-DD)')}{field('subject','Title / position / product')}{field('currency','Currency')}</div>
    {financial&&<div className="v2-two-col">{field('quantity','Quantity')}{field('unitPrice','Unit price')}</div>}
    {field('body','Description / details',true)}{field('footer','Footer / notes',true)}
    <label className="v2-field">Accent color<input type="color" value={values.color} onChange={e=>update('color',e.target.value)}/></label>
    <div className="template-actions"><button type="button" className="v2-secondary" onClick={save}><Save size={16}/> Save draft</button><button type="button" className="v2-secondary" onClick={clear}><Trash2 size={16}/> Clear</button><button type="button" className="v2-primary" onClick={print}><Printer size={16}/> Print / PDF</button></div>
    {notice&&<p role="status" className="v2-hint">{notice}</p>}<p className="v2-hint">All data stays in this browser. Print and select “Save as PDF.”</p></section>
    <section className="v2-panel template-preview-panel"><div className="v2-sectiontitle no-print"><h2>Live preview</h2><span><Download size={16}/> Printable</span></div>
      <article className="v4-template-paper" id="print-document" style={{'--document-accent':values.color} as React.CSSProperties}>
       <p className="v4-issuer">{values.issuer||'Your organization'}</p>
       <h1>{spec.name.toUpperCase()}</h1>
       <p><strong>Reference:</strong> {values.reference}　 <strong>Date:</strong> {values.date}</p>
       {id==='certificate-template'?<div style={{textAlign:'center',margin:'50px 0'}}><p>This certifies that</p><h1>{values.recipient||'Recipient name'}</h1><p>{values.body||'has successfully completed the specified achievement.'}</p><h2>{values.subject||'Achievement / Course'}</h2></div>:
       id==='business-card-template'||id==='id-card-template'?<div style={{margin:'40px auto',maxWidth:370,padding:28,border:`2px solid ${values.color}`,borderRadius:15}}><h2>{values.issuer||'Name'}</h2><p>{values.subject||'Title / role'}</p><p>{values.recipient||'Contact'}</p><p>{values.body||'Additional information'}</p></div>:
       <><p><strong>To:</strong> {values.recipient||'Recipient / customer'}</p><h2>{values.subject||'Subject'}</h2><p>{values.body||'Enter document details in the form.'}</p>{financial&&<table className="v4-simple-table"><thead><tr><th>Item</th><th>Quantity</th><th>Price</th><th>Amount</th></tr></thead><tbody><tr><td>{values.subject||'Description'}</td><td>{values.quantity}</td><td>{values.currency} {Number(values.unitPrice||0).toFixed(2)}</td><td>{values.currency} {total.toFixed(2)}</td></tr></tbody></table>}{financial&&<h2 style={{textAlign:'right'}}>Total: {values.currency} {total.toFixed(2)}</h2>}</>}
       <div className="v4-footer">{values.footer||'Generated locally with LocalTools · No uploads'}</div>
      </article>
    </section></div></div>;
}