/** Pure offline text and numeric utilities. These do not load untrusted scripts. */
function tokens(s:string){return s.trim().split(/[^\p{L}\p{N}]+/u).filter(Boolean);}
function parsePair(s:string){
  const parts=s.split(',').map(v=>v.trim());if(parts.length!==2)throw Error('Enter two values separated by a comma.');
  const nums=parts.map(Number);if(nums.some(n=>!Number.isFinite(n)))throw Error('Both values must be valid numbers.');return nums;
}
function csvFields(line:string):string[]{
  const fields:string[]=[];let field='';let quoted=false;
  for(let i=0;i<line.length;i++){const ch=line[i];if(ch==='"'){if(quoted&&line[i+1]==='"'){field+='"';i++;}else quoted=!quoted;}else if(ch===','&&!quoted){fields.push(field);field='';}else field+=ch;}
  if(quoted)throw Error('Unclosed CSV quotation mark.');fields.push(field);return fields;
}
function csvEscape(x:unknown){let value=String(x??'');if(/^[=+@-]/.test(value))value="'"+value;return /[\n\r,"]/.test(value)?'"'+value.replace(/"/g,'""')+'"':value;}
export function extendedText(id:string,s:string):string{
 switch(id){
  case 'json-validate':JSON.parse(s);return 'Valid JSON';
  case 'json-minify':return JSON.stringify(JSON.parse(s));
  case 'text-lowercase':return s.toLowerCase();
  case 'text-titlecase':return s.replace(/\b\p{L}/gu,letter=>letter.toUpperCase());
  case 'text-camel':return tokens(s).map((word,i)=>i?word[0].toUpperCase()+word.slice(1).toLowerCase():word.toLowerCase()).join('');
  case 'text-snake':return tokens(s).join('_').toLowerCase();
  case 'text-kebab':return tokens(s).join('-').toLowerCase();
  case 'text-trim':return s.trim();
  case 'text-unique':return [...new Set(s.split(/\r?\n/))].join('\n');
  case 'text-sort':return s.split(/\r?\n/).sort((a,b)=>a.localeCompare(b)).join('\n');
  case 'text-reverse':return Array.from(s).reverse().join('');
  case 'text-normalize':return s.normalize('NFC');
  case 'text-accents':return s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').normalize('NFC');
  case 'text-line-numbers':return s.split(/\r?\n/).map((line,i)=>`${i+1}. ${line}`).join('\n');
  case 'url-decode':return decodeURIComponent(s);
  case 'html-encode':return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  case 'html-decode':return s.replace(/&(amp|lt|gt|quot|#39);/g,(_,entity)=>({amp:'&',lt:'<',gt:'>',quot:'"','#39':"'"} as Record<string,string>)[entity]);
  case 'text-slug':return tokens(s.normalize('NFKD').replace(/[\u0300-\u036f]/g,'')).join('-').toLowerCase();
  case 'safe-filename':return s.replace(/[<>:"/\\|?*\x00-\x1f]/g,'_').replace(/[. ]+$/g,'').slice(0,200)||'file';
  case 'number-base':{
    const v=s.trim();if(!/^(?:-?(?:0x[0-9a-f]+|0b[01]+|0o[0-7]+|[0-9]+))$/i.test(v))throw Error('Enter an integer, e.g. 255, 0xFF, 0b1010 or 0o17.');
    const n=BigInt(v);return `Decimal: ${n.toString(10)}\nBinary: ${n.toString(2)}\nOctal: ${n.toString(8)}\nHex: ${n.toString(16).toUpperCase()}`;}
  case 'storage-convert':{
    const v=Number(s.trim());if(!Number.isFinite(v)||v<0)throw Error('Enter a nonnegative byte count.');return `Bytes: ${v}\nkB (1000): ${(v/1000).toFixed(3)}\nMB (1000²): ${(v/1e6).toFixed(3)}\nGB (1000³): ${(v/1e9).toFixed(3)}\nKiB (1024): ${(v/1024).toFixed(3)}\nMiB (1024²): ${(v/1048576).toFixed(3)}\nGiB (1024³): ${(v/1073741824).toFixed(3)}`;}
  case 'percentage-calc':{const [v,p]=parsePair(s);return `${p}% of ${v} = ${(v*p/100).toFixed(4)}`;}
  case 'discount-calc':{const [price,p]=parsePair(s);if(price<0||p<0||p>100)throw Error('Price must be nonnegative and discount 0–100%.');return `Original: ${price.toFixed(2)}\nDiscount: ${(price*p/100).toFixed(2)}\nFinal: ${(price*(1-p/100)).toFixed(2)}`;}
  case 'temp-convert':{const m=/^\s*(-?\d+(?:\.\d+)?)\s*([CFK])\s*$/i.exec(s);if(!m)throw Error('Enter 100 C, 212 F, or 373.15 K.');const n=Number(m[1]),unit=m[2].toUpperCase();const c=unit==='C'?n:unit==='F'?(n-32)*5/9:n-273.15;if(c< -273.15)throw Error('Below absolute zero.');return `Celsius: ${c.toFixed(3)} °C\nFahrenheit: ${(c*9/5+32).toFixed(3)} °F\nKelvin: ${(c+273.15).toFixed(3)} K`;}
  case 'date-difference':{const dates=s.split(',').map(x=>x.trim());if(dates.length!==2||dates.some(d=>!/^\d{4}-\d{2}-\d{2}$/.test(d)))throw Error('Enter YYYY-MM-DD,YYYY-MM-DD');const t=dates.map(d=>Date.parse(d+'T00:00:00Z'));if(t.some(x=>!Number.isFinite(x)))throw Error('Invalid date');return `Difference: ${Math.round(Math.abs(t[1]-t[0])/86400000)} days`;}
  case 'csv-json':{const lines=s.trim().split(/\r?\n/);if(lines.length<2)throw Error('CSV needs a header and at least one data row.');const headers=csvFields(lines[0]);return JSON.stringify(lines.slice(1).map(line=>Object.fromEntries(csvFields(line).map((v,i)=>[headers[i]||`col_${i+1}`,v]))),null,2);}
  case 'json-csv':{const rows=JSON.parse(s);if(!Array.isArray(rows)||!rows.every(v=>v&&typeof v==='object'&&!Array.isArray(v)))throw Error('Expected a JSON array of objects.');const keys=[...new Set(rows.flatMap((v:Record<string,unknown>)=>Object.keys(v)))];return [keys.map(csvEscape).join(','),...rows.map((r:Record<string,unknown>)=>keys.map(k=>csvEscape(r[k])).join(','))].join('\n');}
  case 'text-frequency':{const counts=new Map<string,number>();for(const c of Array.from(s))counts.set(c,(counts.get(c)||0)+1);return [...counts].sort((a,b)=>b[1]-a[1]).map(([c,count])=>`${JSON.stringify(c)}: ${count}`).join('\n');}
  case 'text-to-binary':{if([...s].some(c=>c.charCodeAt(0)>127))throw Error('ASCII only in this tool.');return Array.from(s).map(c=>c.charCodeAt(0).toString(2).padStart(8,'0')).join(' ');}
  case 'binary-to-text':{const bs=s.trim().split(/\s+/);if(bs.some(b=>! /^[01]{8}$/.test(b)))throw Error('Enter space-separated 8-bit binary values.');return bs.map(b=>String.fromCharCode(parseInt(b,2))).join('');}
  default:throw Error('This tool is not yet implemented.');
 }
}
