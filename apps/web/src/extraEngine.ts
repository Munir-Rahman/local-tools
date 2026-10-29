/** Standalone, browser-local utilities. No network or eval. */
export type ExtraCategory='Text'|'Developer'|'Design'|'Calculators';
export type ExtraDefinition={number:number;category:ExtraCategory;inputs:string[];example:string[];help:string};
export const extras:Record<number,ExtraDefinition>={};
function add(category:ExtraCategory, ids:number[],labels:string[],examples:string[],help='Runs locally in your browser'){
  for(const number of ids)extras[number]={number,category,inputs:labels,example:examples,help};
}
add('Text',[281,282,283,285,286,287,288,289,290,291,292,293,294,297,299,300],['Input text'],['Hello world\nHello again']);
add('Text',[284],['Input text','Reading speed (words per minute)'],['Hello world','200']);
add('Text',[295],['Input text','Find','Replace with'],['hello world','world','everyone']);
add('Text',[296],['Original text','Updated text'],['one\ntwo','two\nthree']);
add('Text',[298],['Input text','Normalization form'],['café','NFC']);
add('Developer',[301,302,303,306,320],['Input JSON'],['{"name":"LocalTools"}']);
add('Developer',[307,308,309],['Input XML'],['<root><item>test</item></root>']);
add('Developer',[310],['CSV with header row','SQL table name'],['id,name\n1,Jane','imported_data']);
add('Developer',[312,313,314,315,316,317,318,319,325],['Input text'],['Hello, world!']);
add('Developer',[321,322],['Number of IDs (1-100)'],['3']);
add('Developer',[323],['Password length (8-256)','Include punctuation (yes/no)'],['20','yes']);
add('Developer',[326],['Message','HMAC secret'],['message','local-secret']);
add('Developer',[327,328],['Text / encrypted JSON','Password'],['Hello, world!','local-passphrase']);
add('Developer',[329],['JWT token'],['eyJhbGciOiJub25lIn0.eyJzdWIiOiIxIn0.']);
add('Developer',[330],['JWT payload JSON','HS256 secret'],['{"sub":"1"}','local-secret']);
add('Developer',[331],['Signed JWT','HS256 secret'],['','local-secret']);
add('Developer',[332],['Text to test','JavaScript regular expression','Flags'],['one two one','one','gi'],'Complex patterns may block the browser.');
add('Developer',[333],['5-field cron expression'],['*/15 * * * *']);
add('Developer',[334],['Minute','Hour','Day of month','Month','Day of week'],['0','9','*','*','1-5']);
add('Developer',[335],['Unix seconds or milliseconds'],['1730000000']);
add('Developer',[336],['ISO date/time'],['2026-10-29T00:00:00Z']);
add('Developer',[337],['First JSON','Second JSON'],['{"one":1}','{"one":2}']);
add('Developer',[338],['HTTP method','URL','Request JSON (optional)'],['GET','https://example.org','']);
add('Developer',[339],['HTTP response headers'],['Content-Type: application/json\nX-Test: yes']);
add('Design',[342,343,344,352],['HEX color'],['#3366ee']);
add('Design',[345],['First HEX','Second HEX','Gradient angle'],['#2563eb','#9333ea','135']);
add('Design',[346],['Text HEX','Background HEX'],['#ffffff','#2563eb']);
add('Design',[347],['X offset','Y offset','Blur','Color'],['0','8','24','#00000033']);
add('Design',[348],['Top left','Top right','Bottom right','Bottom left'],['12','12','12','12']);
add('Design',[349],['Polygon points'],['0 0, 100% 0, 100% 100%, 0 100%']);
add('Design',[350],['Columns','Gap in px'],['3','16']);
add('Design',[351],['Flex direction','Justify content','Align items'],['row','space-between','center']);
add('Design',[357],['Page title','Description','Canonical URL'],['LocalTools','Private offline tools','https://example.org']);
add('Design',[358],['Organization name','Website URL'],['Example','https://example.org']);
add('Design',[359],['URLs (one per line)'],['https://example.org/\nhttps://example.org/about']);
add('Design',[360],['Sitemap URL','Disallowed paths, comma-separated'],['https://example.org/sitemap.xml','/admin,/private']);
const calc=[381,382,383,384,385,386,387,388,389,390,391,392,393,394,395,396,397,398,399,400];
const calcLabels:Record<number,string[]>= {
  381:['Value','Percentage'],382:['Price','Discount %'],383:['Net price','Tax %'],384:['Principal','Annual %','Months'],
  385:['Principal','Annual %','Years','Compounds per year'],386:['Amount','Manual rate'],387:['Birth date YYYY-MM-DD','As-of date YYYY-MM-DD'],
  388:['First date','Second date'],389:['Date','Days to add/subtract'],390:['UTC ISO date','IANA timezone'],
  391:['Value','From (m,km,cm,mm,in,ft,mi)','To'],392:['Value','From (kg,g,lb,oz,t)','To'],
  393:['Value','From (C,F,K)','To'],394:['Value','From (m2,km2,ft2,acre,hectare)','To'],
  395:['Value','From (L,mL,gal,m3,cup)','To'],396:['Weight kg','Height cm'],397:['Width px','Height px'],
  398:['Value','From (B,KB,MB,GB,TB)','To'],399:['Minimum integer','Maximum integer'],400:['Paragraph count']
};
const calcDefaults:Record<number,string[]>= {
  381:['240','15'],382:['100','20'],383:['100','10'],384:['10000','8','36'],385:['1000','5','10','12'],386:['100','0.92'],
  387:['2000-01-01','2026-10-29'],388:['2026-01-01','2026-10-29'],389:['2026-10-29','30'],390:['2026-10-29T00:00:00Z','Asia/Kabul'],
  391:['10','km','mi'],392:['75','kg','lb'],393:['25','C','F'],394:['10','m2','ft2'],395:['10','L','gal'],
  396:['70','175'],397:['1920','1080'],398:['1024','MB','GB'],399:['1','100'],400:['3']
};
for(const id of calc)add('Calculators',[id],calcLabels[id],calcDefaults[id]);
const N=(v:string)=>{const x=Number(v);if(!v.trim()||!Number.isFinite(x))throw Error('Enter a valid number.');return x;};
const requireText=(v:string)=>{if(!v.trim())throw Error('Input is required.');return v;};
const rows=(v:string)=>v.split(/\r?\n/);
const pieces=(v:string)=>v.trim().split(/[^\p{L}\p{N}]+/u).filter(Boolean);
const escapeHTML=(s:string)=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
const bytesToB64=(bytes:Uint8Array)=>{let raw='';for(let i=0;i<bytes.length;i+=8192)raw+=String.fromCharCode(...bytes.subarray(i,i+8192));return btoa(raw);};
const encode=(s:string)=>bytesToB64(new TextEncoder().encode(s));
const decode=(s:string)=>new TextDecoder('utf-8',{fatal:true}).decode(Uint8Array.from(atob(s.trim()),x=>x.charCodeAt(0)));
const hex=(bytes:Uint8Array)=>[...bytes].map(x=>x.toString(16).padStart(2,'0')).join('');
const random=(count:number)=>{const b=new Uint8Array(count);for(let i=0;i<count;i+=65536)crypto.getRandomValues(b.subarray(i,Math.min(count,i+65536)));return b;};
function randomInt(min:number,max:number){if(!Number.isSafeInteger(min)||!Number.isSafeInteger(max)||max<min||max-min+1>2**32)throw Error('Invalid integer bounds or range too large.');const span=max-min+1,limit=Math.floor(2**32/span)*span;let x=0;do{x=new DataView(random(4).buffer).getUint32(0);}while(x>=limit);return min+x%span;}
const format=(v:number)=>Number.isFinite(v)?Number(v.toPrecision(12)).toString():String(v);
const csvRows=(s:string)=>{const result:string[][]=[];let field='',row:string[]=[],quote=false;for(let i=0;i<s.length;i++){const c=s[i];if(quote){if(c==='"'&&s[i+1]==='"'){field+='"';i++;}else if(c==='"')quote=false;else field+=c;}else if(c==='"'){if(field)throw Error('Bad CSV quote');quote=true;}else if(c===','){row.push(field);field='';}else if(c==='\n'||c==='\r'){row.push(field);result.push(row);row=[];field='';if(c==='\r'&&s[i+1]==='\n')i++;}else field+=c;}if(quote)throw Error('Unclosed CSV quote');if(row.length||field){row.push(field);result.push(row);}return result;};
const sqlName=(s:string)=>{if(!/^[A-Za-z_][A-Za-z0-9_]*$/.test(s))throw Error('SQL identifiers must contain only letters, digits and underscores.');return '['+s+']';};
function xml(s:string){const doc=new DOMParser().parseFromString(requireText(s),'application/xml');if(doc.querySelector('parsererror'))throw Error('Invalid XML.');return doc;}
function xmlToJS(e:Element):unknown{const obj:Record<string,unknown>={};for(const a of [...e.attributes])obj['@'+a.name]=a.value;for(const child of [...e.children]){const value=xmlToJS(child),prior=obj[child.tagName];obj[child.tagName]=prior===undefined?value:Array.isArray(prior)?[...prior,value]:[prior,value];}const content=[...e.childNodes].filter(x=>x.nodeType===3).map(x=>x.textContent||'').join('').trim();if(content){if(Object.keys(obj).length)obj['#text']=content;else return content;}return obj;}
function xmlFromJS(value:unknown,tag='root'):string{const name=tag.replace(/[^a-zA-Z0-9_.-]/g,'_').replace(/^[^A-Za-z_]/,'_');if(Array.isArray(value))return value.map(x=>xmlFromJS(x,'item')).join('');if(value&&typeof value==='object')return `<${name}>${Object.entries(value).map(([k,x])=>xmlFromJS(x,k)).join('')}</${name}>`;return `<${name}>${escapeHTML(value==null?'':String(value))}</${name}>`;}
const jsonType=(v:unknown):string=>v===null?'null':Array.isArray(v)?`Array<${[...new Set(v.map(jsonType))].join(' | ')||'unknown'}>`:typeof v==='object'?`{${Object.entries(v).map(([k,x])=>JSON.stringify(k)+': '+jsonType(x)).join('; ')}}`:typeof v;
const fromHex=(raw:string)=>{let s=raw.replace(/^#/,'').trim();if(/^[0-9a-f]{3}$/i.test(s))s=[...s].map(x=>x+x).join('');if(!/^[0-9a-f]{6}$/i.test(s))throw Error('Expected #rrggbb.');return [0,2,4].map(i=>parseInt(s.slice(i,i+2),16));};
const rgbHex=(c:number[])=>'#'+c.map(x=>Math.round(Math.min(255,Math.max(0,x))).toString(16).padStart(2,'0')).join('');
const hsl=(color:string)=>{const [r,g,b]=fromHex(color).map(v=>v/255),hi=Math.max(r,g,b),lo=Math.min(r,g,b),diff=hi-lo;let H=0,S=0;const L=(hi+lo)/2;if(diff){S=diff/(1-Math.abs(2*L-1));switch(hi){case r:H=(g-b)/diff%6;break;case g:H=(b-r)/diff+2;break;default:H=(r-g)/diff+4;}H*=60;if(H<0)H+=360;}return [H,S,L];};
const fromHsl=(h:number,s:number,l:number)=>{const C=(1-Math.abs(2*l-1))*s,X=C*(1-Math.abs(h/60%2-1)),m=l-C/2;let rgb:number[];if(h<60)rgb=[C,X,0];else if(h<120)rgb=[X,C,0];else if(h<180)rgb=[0,C,X];else if(h<240)rgb=[0,X,C];else if(h<300)rgb=[X,0,C];else rgb=[C,0,X];return rgbHex(rgb.map(x=>(x+m)*255));};
const luminance=(color:string)=>{const [r,g,b]=fromHex(color).map(c=>{const s=c/255;return s<=.04045?s/12.92:Math.pow((s+.055)/1.055,2.4);});return .2126*r+.7152*g+.0722*b;};
const parseDate=(v:string)=>{if(!/^\d{4}-\d{2}-\d{2}$/.test(v))throw Error('Date must use YYYY-MM-DD');const [y,m,d]=v.split('-').map(Number),result=new Date(Date.UTC(y,m-1,d));if(result.getUTCFullYear()!==y||result.getUTCMonth()!==m-1||result.getUTCDate()!==d)throw Error('Invalid date');return result;};
const ratio=(a:number,b:number):number=>b?ratio(b,a%b):a;
const convertUnit=(value:number,from:string,to:string,units:Record<string,number>)=>{const a=units[from.trim().toLowerCase()],b=units[to.trim().toLowerCase()];if(!a||!b)throw Error('Supported units: '+Object.keys(units).join(', '));return format(value*a/b);};
const units={length:{m:1,km:1000,cm:.01,mm:.001,in:.0254,ft:.3048,mi:1609.344},mass:{kg:1,g:.001,lb:.45359237,oz:.028349523125,t:1000},area:{m2:1,km2:1e6,ft2:.09290304,acre:4046.8564224,hectare:10000},volume:{l:1,ml:.001,gal:3.785411784,m3:1000,cup:.2365882365},storage:{b:1,kb:1024,mb:1024**2,gb:1024**3,tb:1024**4}};
export const runnableExtraIds=Object.keys(extras).map(Number).sort((a,b)=>a-b);
export async function executeExtra(id:number,input:string[]):Promise<string>{
  if(!extras[id])throw Error('Unavailable action.');
  const [v='',a='',b='',c='',d='']=input;
  const lines=rows(v),words=pieces(v);
  switch(id){
    case 281:return String(words.length);
    case 282:return String([...v].length);
    case 283:return String(v?lines.length:0);
    case 284:if(N(a)<=0)throw Error('Reading speed must be positive');return `${words.length} words, ${format(words.length/N(a))} minutes`;
    case 285:return v.toUpperCase();
    case 286:return v.toLowerCase();
    case 287:return words.map(x=>x[0].toUpperCase()+x.slice(1).toLowerCase()).join(' ');
    case 288:return words.map((x,i)=>i?x[0].toUpperCase()+x.slice(1).toLowerCase():x.toLowerCase()).join('');
    case 289:return words.map(x=>x.toLowerCase()).join('_');
    case 290:return words.map(x=>x.toLowerCase()).join('-');
    case 291:return v.replace(/\s+/gu,' ').trim();
    case 292:return v.trim();
    case 293:return [...new Set(lines)].join('\n');
    case 294:return [...lines].sort((x,y)=>x.localeCompare(y)).join('\n');
    case 295:return v.split(requireText(a)).join(b);
    case 296:if(v===a)return 'Texts are identical.';return 'Removed lines:\n'+lines.filter(x=>!rows(a).includes(x)).map(x=>'- '+x).join('\n')+'\nAdded lines:\n'+rows(a).filter(x=>!lines.includes(x)).map(x=>'+ '+x).join('\n');
    case 297:return [...v].reverse().join('');
    case 298:if(!['NFC','NFD','NFKC','NFKD'].includes(a))throw Error('Valid forms: NFC, NFD, NFKC, NFKD');return v.normalize(a as 'NFC');
    case 299:return v.normalize('NFD').replace(/\p{M}/gu,'');
    case 300:return lines.map((x,i)=>`${i+1}. ${x}`).join('\n');
    case 301:return JSON.stringify(JSON.parse(v),null,2);
    case 302:JSON.parse(v);return 'Valid JSON';
    case 303:return JSON.stringify(JSON.parse(v));
    case 306:return '<?xml version="1.0" encoding="UTF-8"?>\n'+xmlFromJS(JSON.parse(v));
    case 307:{const root=xml(v).documentElement;return JSON.stringify({[root.tagName]:xmlToJS(root)},null,2);}
    case 308:{const doc=xml(v);const serializer=new XMLSerializer();return serializer.serializeToString(doc).replace(/></g,'>\n<');}
    case 309:xml(v);return 'Valid XML';
    case 310:{const rows=csvRows(v);if(rows.length<2)throw Error('Requires CSV headers and data rows.');const names=rows[0].map(sqlName);return rows.slice(1).map(x=>{if(x.length!==names.length)throw Error('CSV column counts differ');return `INSERT INTO ${sqlName(a)} (${names.join(', ')}) VALUES (${x.map(t=>`N'${t.replace(/'/g,"''")}'`).join(', ')});`;}).join('\n');}
    case 312:return encode(v);
    case 313:return decode(v);
    case 314:return encodeURIComponent(v);
    case 315:return decodeURIComponent(v);
    case 316:return escapeHTML(v);
    case 317:return v.replace(/&(amp|lt|gt|quot|apos|#39);/g,(m,key)=>(({amp:'&',lt:'<',gt:'>',quot:'"',apos:"'",'#39':"'"} as Record<string,string>)[key]||m));
    case 318:return v.split(/\r?\n/).map(l=>{const escaped=escapeHTML(l);const match=/^(#{1,6})\s+(.*)$/.exec(escaped);return match?`<h${match[1].length}>${match[2]}</h${match[1].length}>`:l.trim()?`<p>${escaped}</p>`:'';}).join('\n');
    case 319:{const doc=new DOMParser().parseFromString(v,'text/html');doc.querySelectorAll('script,style,iframe,object').forEach(x=>x.remove());return doc.body.innerText||doc.body.textContent||'';}
    case 320:return 'export type Root = '+jsonType(JSON.parse(v))+';';
    case 321:{const k=N(v);if(k<1||k>100||!Number.isInteger(k))throw Error('Choose 1–100');return Array.from({length:k},()=>crypto.randomUUID()).join('\n');}
    case 322:{const k=N(v);if(k<1||k>100||!Number.isInteger(k))throw Error('Choose 1–100');const alphabet='0123456789ABCDEFGHJKMNPQRSTVWXYZ';return Array.from({length:k},()=>{let time=BigInt(Date.now()),lead='';for(let j=0;j<10;j++){lead=alphabet[Number(time%32n)]+lead;time/=32n;}let bits=0n;for(const byte of random(10))bits=(bits<<8n)+BigInt(byte);let tail='';for(let j=0;j<16;j++){tail=alphabet[Number(bits%32n)]+tail;bits/=32n;}return lead+tail;}).join('\n');}
    case 323:{const k=N(v);if(k<8||k>256||!Number.isInteger(k))throw Error('Password length: 8–256');const abc='ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789'+(a.toLowerCase()==='no'?'':'!@#$%^&*-_=+?');return Array.from({length:k},()=>abc[randomInt(0,abc.length-1)]).join('');}
    case 325:return hex(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(v))));
    case 326:return hex(new Uint8Array(await crypto.subtle.sign('HMAC',await crypto.subtle.importKey('raw',new TextEncoder().encode(requireText(a)),{name:'HMAC',hash:'SHA-256'},false,['sign']),new TextEncoder().encode(v))));
    case 327:{const salt=random(16),iv=random(12),key=await derive(a,salt),encrypted=new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv},key,new TextEncoder().encode(v)));return JSON.stringify({v:1,alg:'AES-256-GCM',kdf:'PBKDF2-SHA256',iterations:210000,salt:encodeBytesURL(salt),iv:encodeBytesURL(iv),data:encodeBytesURL(encrypted)},null,2);}
    case 328:{const obj=JSON.parse(v);if(obj.v!==1||obj.alg!=='AES-256-GCM'||obj.kdf!=='PBKDF2-SHA256'||obj.iterations!==210000)throw Error('Unsupported encryption envelope');const salt=decodeBytesURL(obj.salt),iv=decodeBytesURL(obj.iv),data=decodeBytesURL(obj.data);if(salt.length!==16||iv.length!==12||data.length>8*1024*1024)throw Error('Invalid encrypted payload');return new TextDecoder().decode(await crypto.subtle.decrypt({name:'AES-GCM',iv},await derive(a,salt),data));}
    case 329:{const parts=jwtSegments(v);return JSON.stringify({warning:'Not signature-verified',header:parts.header,payload:parts.payload},null,2);}
    case 330:{const h=encodeBytesURL(new TextEncoder().encode('{"alg":"HS256","typ":"JWT"}'));const p=encodeBytesURL(new TextEncoder().encode(JSON.stringify(JSON.parse(v))));const msg=h+'.'+p;return msg+'.'+encodeBytesURL(await signHmac(a,msg));}
    case 331:{const parts=jwtSegments(v);if(parts.header.alg!=='HS256')throw Error('Only HS256 supported');return encodeBytesURL(await signHmac(a,parts.raw[0]+'.'+parts.raw[1]))===parts.raw[2]?'Valid HS256 signature (expiry/claims not evaluated)':'INVALID HS256 signature';}
    case 332:{if(v.length>20000||a.length>200)throw Error('Input/pattern too long');const flags=b.includes('g')?b:b+'g';const rx=new RegExp(a,flags);const result=Array.from(v.matchAll(rx)).slice(0,100);return result.map(m=>`${m.index}: ${m[0]}`).join('\n')||'No matches';}
    case 333:return validCron(v)+'\nMinute / hour / day / month / weekday';
    case 334:return validCron([v,a,b,c,d].join(' '));
    case 335:{const x=N(v),dt=new Date(Math.abs(x)>1e11?x:x*1000);if(!Number.isFinite(dt.getTime()))throw Error('Timestamp out of range');return `${dt.toISOString()}\nUnix seconds: ${Math.floor(dt.getTime()/1000)}`;}
    case 336:{const dt=new Date(v);if(!Number.isFinite(dt.getTime()))throw Error('Invalid date/time');return `${dt.toISOString()}\nEpoch seconds: ${Math.floor(dt.getTime()/1000)}`;}
    case 337:{const x=JSON.parse(v),y=JSON.parse(a);return JSON.stringify(x)===JSON.stringify(y)?'JSON values have identical serialization.':'Different JSON values:\nFIRST\n'+JSON.stringify(x,null,2)+'\nSECOND\n'+JSON.stringify(y,null,2);}
    case 338:{const method=v.toUpperCase().trim();if(!/^[A-Z]+$/.test(method))throw Error('Invalid method');const url=new URL(a);if(!['http:','https:'].includes(url.protocol))throw Error('HTTP(S) only');if(b.trim())JSON.parse(b);return `// Generated sample only. No request was sent.\nfetch(${JSON.stringify(url.href)}, {method: ${JSON.stringify(method)}${b.trim()?`, body: ${JSON.stringify(JSON.stringify(JSON.parse(b)))}`:''}})`;}
    case 339:{const obj:Record<string,string>={};for(const row of lines){if(!row.trim())continue;const i=row.indexOf(':');if(i<1)throw Error('Header missing colon');const key=row.slice(0,i).trim();if(!/^[\w-]+$/.test(key))throw Error('Invalid header name');obj[key]=row.slice(i+1).trim();}return JSON.stringify(obj,null,2);}
    default:return executeDesignOrCalculation(id,input);
  }
}
function encodeBytesURL(data:Uint8Array){return bytesToB64(data).replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_');}
function decodeBytesURL(s:string){return Uint8Array.from(atob(s.replace(/-/g,'+').replace(/_/g,'/').padEnd(Math.ceil(s.length/4)*4,'=')),c=>c.charCodeAt(0));}
async function derive(password:string,salt:Uint8Array){const seed=await crypto.subtle.importKey('raw',new TextEncoder().encode(requireText(password)),'PBKDF2',false,['deriveKey']);return crypto.subtle.deriveKey({name:'PBKDF2',salt,iterations:210000,hash:'SHA-256'},seed,{name:'AES-GCM',length:256},false,['encrypt','decrypt']);}
async function signHmac(secret:string,payload:string){const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(requireText(secret)),{name:'HMAC',hash:'SHA-256'},false,['sign']);return new Uint8Array(await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(payload)));}
function jwtSegments(token:string){const raw=token.trim().split('.');if(raw.length!==3)throw Error('JWT needs three segments');const parse=(s:string)=>JSON.parse(decodeBytesURL(s).length?new TextDecoder().decode(decodeBytesURL(s)):'');return {raw,header:parse(raw[0]) as {alg?:string},payload:parse(raw[1])};}
function validCron(v:string){const parts=v.trim().split(/\s+/);if(parts.length!==5)throw Error('Cron must have five fields');const ranges=[[0,59],[0,23],[1,31],[1,12],[0,7]];for(let i=0;i<5;i++){for(const token of parts[i].split(',')){const match=/^(\*|\d+|\d+-\d+)(?:\/(\d+))?$/.exec(token);if(!match)throw Error('Unsupported cron expression');for(const x of match[1].split('-'))if(x!=='*'&&(Number(x)<ranges[i][0]||Number(x)>ranges[i][1]))throw Error('Cron field out of range');if(match[2]&&Number(match[2])<1)throw Error('Cron step must be >=1');}}return parts.join(' ');}
function executeDesignOrCalculation(id:number,input:string[]):string{
  const [v='',a='',b='',c='']=input;
  switch(id){
    case 342:return `rgb(${fromHex(v).join(', ')})`;
    case 343:{const [h,s,l]=hsl(v);return `hsl(${Math.round(h)}, ${Math.round(s*100)}%, ${Math.round(l*100)}%)`;}
    case 344:{const [h,s]=hsl(v);return [95,75,55,40,25].map((x,i)=>`${[50,200,400,600,800][i]}: ${fromHsl(h,s,x/100)}`).join('\n');}
    case 345:fromHex(v);fromHex(a);return `background: linear-gradient(${N(b)}deg, ${v}, ${a});`;
    case 346:{const light=[luminance(v),luminance(a)].sort((x,y)=>y-x);const r=(light[0]+.05)/(light[1]+.05);return `Contrast: ${r.toFixed(2)}:1\nAA normal text: ${r>=4.5?'Pass':'Fail'}\nAA large text: ${r>=3?'Pass':'Fail'}\nAAA normal text: ${r>=7?'Pass':'Fail'}`;}
    case 347:return `box-shadow: ${N(v)}px ${N(a)}px ${N(b)}px ${c};`;
    case 348:return `border-radius: ${input.map(x=>N(x)+'px').join(' ')};`;
    case 349:if(!/^[0-9.,%\s-]+$/.test(v))throw Error('Invalid polygon value');return `clip-path: polygon(${v});`;
    case 350:if(N(v)<1||N(v)>24||!Number.isInteger(N(v))||N(a)<0)throw Error('Columns must be 1–24 and gap positive');return `display: grid;\ngrid-template-columns: repeat(${N(v)}, minmax(0, 1fr));\ngap: ${N(a)}px;`;
    case 351:if(!['row','column','row-reverse','column-reverse'].includes(v)||!['flex-start','center','flex-end','space-between','space-around','space-evenly'].includes(a)||!['flex-start','center','flex-end','stretch','baseline'].includes(b))throw Error('Enter supported flex CSS values');return `display: flex;\nflex-direction: ${v};\njustify-content: ${a};\nalign-items: ${b};`;
    case 352:{const [h,s]=hsl(v);return [95,90,80,70,60,50,40,30,20,10].map((x,i)=>`${[50,100,200,300,400,500,600,700,800,900][i]}: ${fromHsl(h,s,x/100)}`).join('\n');}
    case 357:{if(b)new URL(b);return `<title>${escapeHTML(v)}</title>\n<meta name="description" content="${escapeHTML(a)}">\n${b?`<link rel="canonical" href="${escapeHTML(b)}">`:''}`;}
    case 358:{const url=new URL(a);return `<script type="application/ld+json">\n${JSON.stringify({'@context':'https://schema.org','@type':'Organization',name:v,url:url.href},null,2)}\n</script>`;}
    case 359:{const urls=rows(v).map(x=>x.trim()).filter(Boolean);if(!urls.length)throw Error('Provide URLs');for(const raw of urls){const url=new URL(raw);if(!['http:','https:'].includes(url.protocol))throw Error('HTTP(S) only');}return '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+urls.map(x=>`  <url><loc>${escapeHTML(x)}</loc></url>`).join('\n')+'\n</urlset>';}
    case 360:if(v)new URL(v);return `User-agent: *\n${a.split(',').map(s=>s.trim()).filter(Boolean).map(s=>'Disallow: '+s).join('\n')}\nSitemap: ${v}`;
    case 381:return format(N(v)*N(a)/100);
    case 382:return `Savings: ${format(N(v)*N(a)/100)}\nFinal price: ${format(N(v)*(1-N(a)/100))}`;
    case 383:return `Tax amount: ${format(N(v)*N(a)/100)}\nGross total: ${format(N(v)*(1+N(a)/100))}`;
    case 384:{const principal=N(v),rate=N(a)/1200,months=N(b);if(principal<0||rate<0||months<1||!Number.isInteger(months))throw Error('Invalid loan values');const emi=rate===0?principal/months:principal*rate/(1-Math.pow(1+rate,-months));return `Monthly payment: ${format(emi)}\nTotal interest: ${format(emi*months-principal)}`;}
    case 385:{const [p,r,y,k]=input.map(N);if(p<0||r<0||y<0||k<1||!Number.isInteger(k))throw Error('Invalid compound interest inputs');const future=p*(1+r/(100*k))**(k*y);return `Future value: ${format(future)}\nInterest: ${format(future-p)}`;}
    case 386:return format(N(v)*N(a));
    case 387:{const from=parseDate(v),to=parseDate(a);if(to<from)throw Error('End date must be later');let years=to.getUTCFullYear()-from.getUTCFullYear(),months=to.getUTCMonth()-from.getUTCMonth();if(to.getUTCDate()<from.getUTCDate())months--;if(months<0){years--;months+=12;}return `${years} years, ${months} months (completed)`;}
    case 388:return `${Math.round((parseDate(a).getTime()-parseDate(v).getTime())/86400000)} days`;
    case 389:{const day=parseDate(v),delta=N(a);if(!Number.isInteger(delta))throw Error('Days must be whole');day.setUTCDate(day.getUTCDate()+delta);return day.toISOString().slice(0,10);}
    case 390:{const date=new Date(v);if(!Number.isFinite(date.getTime()))throw Error('Invalid timestamp');return new Intl.DateTimeFormat('en-GB',{timeZone:a,year:'numeric',month:'short',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(date);}
    case 391:return convertUnit(N(v),a,b,units.length);
    case 392:return convertUnit(N(v),a,b,units.mass);
    case 393:{const from=a.toUpperCase(),to=b.toUpperCase();if(!['C','F','K'].includes(from)||!['C','F','K'].includes(to))throw Error('Supported C, F, K');const k=from==='C'?N(v)+273.15:from==='F'?(N(v)-32)*5/9+273.15:N(v);if(k<0)throw Error('Below absolute zero');return format(to==='C'?k-273.15:to==='F'?(k-273.15)*9/5+32:k);}
    case 394:return convertUnit(N(v),a,b,units.area);
    case 395:return convertUnit(N(v),a,b,units.volume);
    case 396:if(N(v)<=0||N(a)<=0)throw Error('Positive values required');return `BMI: ${format(N(v)/(N(a)/100)**2)} kg/m² (informational only)`;
    case 397:{const x=N(v),y=N(a);if(x<=0||y<=0||!Number.isInteger(x)||!Number.isInteger(y))throw Error('Use whole positive dimensions');const div=ratio(x,y);return `${x/div}:${y/div}`;}
    case 398:return convertUnit(N(v),a,b,units.storage);
    case 399:return String(randomInt(N(v),N(a)));
    case 400:{const k=N(v);if(!Number.isInteger(k)||k<1||k>25)throw Error('Use 1–25 paragraphs');const paragraph='Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus semper volutpat risus, vitae rutrum sapien efficitur a. Integer pellentesque, nibh eget tincidunt facilisis, justo mauris dapibus est, vitae finibus nisl massa sed neque.';return Array.from({length:k},()=>paragraph).join('\n\n');}
    default:throw Error('Not implemented.');
  }
}