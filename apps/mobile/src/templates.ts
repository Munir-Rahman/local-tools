import * as Print from 'expo-print';
import type { EngineOutput } from './engine';

export type ResumeLayout=typeof resumeLayouts[number];
export const resumeLayouts=['modern','classic','minimal','executive','creative','academic','technical','elegant','sidebar','compact','bold','graduate'] as const;
export type ResumeData={name:string;role:string;email:string;phone:string;location:string;summary:string;skills:string;experience:string;education:string;accent:string;layout:ResumeLayout};
export type InvoiceItem={id:string;description:string;quantity:string;price:string};
export type InvoiceData={items:InvoiceItem[];business:string;client:string;number:string;date:string;item:string;quantity:string;price:string;currency:string;notes:string;accent:string};
export const defaultResume:ResumeData={name:'',role:'',email:'',phone:'',location:'',summary:'',skills:'',experience:'',education:'',accent:'#4775F5',layout:'modern'};
export const defaultInvoice:InvoiceData={business:'',client:'',number:'INV-001',date:new Date().toISOString().slice(0,10),item:'',quantity:'1',price:'0',currency:'USD',notes:'',accent:'#4775F5',items:[{id:'first',description:'',quantity:'1',price:'0'}]};
const escape=(value:string)=>value.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
const block=(text:string)=>escape(text).replace(/\r?\n/g,'<br>');
const color=(v:string)=>/^#[0-9A-F]{6}$/i.test(v)?v:'#4775F5';
const css=(accent:string)=>`<meta name="viewport" content="width=device-width,initial-scale=1"><style>@page{size:A4;margin:14mm}body{font-family:Arial,Helvetica,sans-serif;color:#182339;margin:0;line-height:1.5;font-size:11pt}h1{font-size:29pt;letter-spacing:-.7pt;margin:0 0 4px;color:${accent}}h2{font-size:11pt;letter-spacing:1pt;text-transform:uppercase;color:${accent};border-bottom:1px solid #dfe6f1;padding-bottom:6px;margin-top:23px}p{margin:4px 0}.muted{color:#66758c}.hero{border-top:6px solid ${accent};padding-top:22px}.row{display:flex;justify-content:space-between;gap:16px}.price{text-align:right}.table{width:100%;border-collapse:collapse;margin-top:28px}.table th{background:${accent};color:#fff;text-align:left}.table th,.table td{padding:11px 9px;border-bottom:1px solid #e1e6f2}.total{margin-top:22px;font-size:15pt;text-align:right;font-weight:bold}.caps{letter-spacing:1.5px;text-transform:uppercase}.classic h1{color:#182339}.classic .hero{border-top:2px solid #182339}.minimal .hero{border:0;padding-top:8px}.minimal h2{color:#26384f}
.executive .hero{background:#f0f4fa;padding:28px;border-top:10px solid #172033}.executive h1{color:#172033}
.creative .hero{border-radius:16px;background:#ecf6ff;padding:25px}.creative h2{border-left:6px solid ${accent};padding-left:12px}
.academic .hero{border-top:2px double ${accent};text-align:center}.academic h2{font-family:Georgia,serif;text-transform:none;font-size:14pt}
.technical h1{font-family:monospace}.technical h2{background:#e9f3f7;color:#20374b;padding:7px 12px;border:0}
.elegant h1{font-family:Georgia,serif;font-weight:normal;letter-spacing:2px}.elegant h2{font-family:Georgia,serif;font-style:italic}
.sidebar .hero{padding-left:25px;border-left:10px solid ${accent};border-top:0}.sidebar h2{border-left:3px solid ${accent};padding-left:9px}
.compact{font-size:9pt;line-height:1.32}.compact h2{margin-top:12px}.compact h1{font-size:24pt}
.bold .hero{background:#17243e;color:white;padding:25px}.bold h1{color:#fff}.bold .muted{color:#c3d0e5}
.graduate .hero{background:#e8f7f1;border-top:5px solid #14856c;padding:20px}.graduate h2{color:#127260}
.table tbody tr:nth-child(even){background:#f5f7fa}.table th{color:white!important}</style>`;
function shell(content:string,accent:string,bodyClass=''){return `<!DOCTYPE html><html><head><meta charset="UTF-8">${css(color(accent))}</head><body class="${bodyClass}">${content}</body></html>`;}
export function resumeHtml(data:ResumeData){
 const contact=[data.email,data.phone,data.location].filter(Boolean).map(escape).join(' &nbsp;·&nbsp; ');
 const section=(title:string,value:string)=>value.trim()?`<section><h2>${title}</h2><p>${block(value)}</p></section>`:'';
 return shell(`<div class="hero"><h1>${escape(data.name||'Your Name')}</h1><div class="caps muted">${escape(data.role||'Professional title')}</div><p class="muted">${contact}</p></div>${section('Profile',data.summary)}${section('Experience',data.experience)}${section('Education',data.education)}${section('Skills',data.skills)}`,data.accent,data.layout);
}
export function invoiceHtml(data:InvoiceData){
 const rows=(data.items?.length?data.items:[{id:'legacy',description:data.item,quantity:data.quantity,price:data.price}]);
 const total=rows.reduce((acc,row)=>acc+Math.max(0,Number(row.quantity)||0)*Math.max(0,Number(row.price)||0),0);
 const tableRows=rows.map(row=>{const qty=Math.max(0,Number(row.quantity)||0),price=Math.max(0,Number(row.price)||0);
  return `<tr><td>${escape(row.description||'Item or service')}</td><td>${qty}</td><td>${escape(data.currency)} ${price.toFixed(2)}</td><td>${escape(data.currency)} ${(qty*price).toFixed(2)}</td></tr>`;
 }).join('');
 return shell(`<div class="hero row"><div><h1>INVOICE</h1><p><b>${escape(data.business||'Your business')}</b></p></div><div class="price"><p># ${escape(data.number)}</p><p>${escape(data.date)}</p></div></div><div style="margin-top:35px"><div class="muted caps">BILL TO</div><p><b>${block(data.client||'Client name')}</b></p></div><table class="table"><thead><tr><th>Description</th><th>Qty</th><th>Unit price</th><th>Amount</th></tr></thead><tbody>${tableRows}</tbody></table><div class="total">Total: ${escape(data.currency)} ${total.toFixed(2)}</div><p style="margin-top:45px" class="muted">${block(data.notes||'Thank you for your business.')}</p>`,data.accent);
}

export async function exportTemplatePdf(type:'resume'|'invoice',data:ResumeData|InvoiceData):Promise<EngineOutput>{
 const html=type==='resume'?resumeHtml(data as ResumeData):invoiceHtml(data as InvoiceData);
 const {uri}=await Print.printToFileAsync({html,width:595,height:842});
 return {kind:'file',name:`localtools-${type}.pdf`,uri,mime:'application/pdf'};
}

export async function exportStickerPdf(title:string,emoji:string,accent:string):Promise<EngineOutput>{
 const safeTitle=escape(title.trim().slice(0,50)||'YOU GOT THIS!');
 const symbol=escape(emoji.trim().slice(0,8)||'✨');
 const tiles=Array.from({length:12},(_,i)=>`<div class="sticker v${i%6}"><div class="symbol">${symbol}</div><strong>${safeTitle}</strong><small>Made with ToolNest</small></div>`).join('');
 const html=`<!doctype html><html><head><meta charset="UTF-8"><style>@page{size:A4;margin:10mm}*{box-sizing:border-box}body{font-family:Arial,sans-serif;margin:0}.sheet{display:grid;grid-template-columns:repeat(3,1fr);gap:9mm}.sticker{height:53mm;border-radius:20px;border:2px dashed ${color(accent)};display:flex;align-items:center;justify-content:center;flex-direction:column;text-align:center;background:#f0f6ff;padding:12px}.symbol{font-size:34px}.sticker strong{font-size:12px;margin-top:7px}.sticker small{font-size:7px;color:#71809c;margin-top:5px}.v1{background:#fff0ed}.v2{background:#f7eefe}.v3{background:#e9faef}.v4{background:#fff8df}.v5{background:#e7f9ff}</style></head><body><div class="sheet">${tiles}</div></body></html>`;
 const {uri}=await Print.printToFileAsync({html});return {kind:'file',name:'toolnest-sticker-sheet.pdf',uri,mime:'application/pdf'};
}
