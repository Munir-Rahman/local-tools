import * as Print from 'expo-print';
import type { EngineOutput } from './engine';

export type ResumeData={name:string;role:string;email:string;phone:string;location:string;summary:string;skills:string;experience:string;education:string;accent:string;layout:'modern'|'classic'|'minimal'};
export type InvoiceData={business:string;client:string;number:string;date:string;item:string;quantity:string;price:string;currency:string;notes:string;accent:string};
export const defaultResume:ResumeData={name:'',role:'',email:'',phone:'',location:'',summary:'',skills:'',experience:'',education:'',accent:'#4775F5',layout:'modern'};
export const defaultInvoice:InvoiceData={business:'',client:'',number:'INV-001',date:new Date().toISOString().slice(0,10),item:'',quantity:'1',price:'0',currency:'USD',notes:'',accent:'#4775F5'};
const escape=(value:string)=>value.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
const block=(text:string)=>escape(text).replace(/\r?\n/g,'<br>');
const color=(v:string)=>/^#[0-9A-F]{6}$/i.test(v)?v:'#4775F5';
const css=(accent:string)=>`<meta name="viewport" content="width=device-width,initial-scale=1"><style>@page{size:A4;margin:14mm}body{font-family:Arial,Helvetica,sans-serif;color:#182339;margin:0;line-height:1.5;font-size:11pt}h1{font-size:29pt;letter-spacing:-.7pt;margin:0 0 4px;color:${accent}}h2{font-size:11pt;letter-spacing:1pt;text-transform:uppercase;color:${accent};border-bottom:1px solid #dfe6f1;padding-bottom:6px;margin-top:23px}p{margin:4px 0}.muted{color:#66758c}.hero{border-top:6px solid ${accent};padding-top:22px}.row{display:flex;justify-content:space-between;gap:16px}.price{text-align:right}.table{width:100%;border-collapse:collapse;margin-top:28px}.table th{background:${accent};color:#fff;text-align:left}.table th,.table td{padding:11px 9px;border-bottom:1px solid #e1e6f2}.total{margin-top:22px;font-size:15pt;text-align:right;font-weight:bold}.caps{letter-spacing:1.5px;text-transform:uppercase}.classic h1{color:#182339}.classic .hero{border-top:2px solid #182339}.minimal .hero{border:0;padding-top:8px}.minimal h2{color:#26384f}</style>`;
function shell(content:string,accent:string,bodyClass=''){return `<!DOCTYPE html><html><head><meta charset="UTF-8">${css(color(accent))}</head><body class="${bodyClass}">${content}</body></html>`;}
export function resumeHtml(data:ResumeData){
 const contact=[data.email,data.phone,data.location].filter(Boolean).map(escape).join(' &nbsp;·&nbsp; ');
 const section=(title:string,value:string)=>value.trim()?`<section><h2>${title}</h2><p>${block(value)}</p></section>`:'';
 return shell(`<div class="hero"><h1>${escape(data.name||'Your Name')}</h1><div class="caps muted">${escape(data.role||'Professional title')}</div><p class="muted">${contact}</p></div>${section('Profile',data.summary)}${section('Experience',data.experience)}${section('Education',data.education)}${section('Skills',data.skills)}`,data.accent,data.layout);
}
export function invoiceHtml(data:InvoiceData){
 const price=Number(data.price)||0,qty=Math.max(0,Number(data.quantity)||0),total=price*qty;
 return shell(`<div class="hero row"><div><h1>INVOICE</h1><p><b>${escape(data.business||'Your business')}</b></p></div><div class="price"><p># ${escape(data.number)}</p><p>${escape(data.date)}</p></div></div><div style="margin-top:35px"><div class="muted caps">BILL TO</div><p><b>${block(data.client||'Client name')}</b></p></div><table class="table"><thead><tr><th>Description</th><th>Qty</th><th>Unit price</th><th>Amount</th></tr></thead><tbody><tr><td>${escape(data.item||'Service or product')}</td><td>${qty}</td><td>${escape(data.currency)} ${price.toFixed(2)}</td><td>${escape(data.currency)} ${total.toFixed(2)}</td></tr></tbody></table><div class="total">Total: ${escape(data.currency)} ${total.toFixed(2)}</div><p style="margin-top:45px" class="muted">${block(data.notes||'Thank you for your business.')}</p>`,data.accent);
}
export async function exportTemplatePdf(type:'resume'|'invoice',data:ResumeData|InvoiceData):Promise<EngineOutput>{
 const html=type==='resume'?resumeHtml(data as ResumeData):invoiceHtml(data as InvoiceData);
 const {uri}=await Print.printToFileAsync({html,width:595,height:842});
 return {kind:'file',name:`localtools-${type}.pdf`,uri,mime:'application/pdf'};
}
