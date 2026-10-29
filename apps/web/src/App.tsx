import { useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { Activity, ArrowRight, BookMarked, Check, CheckCircle2, ChevronDown, ChevronRight, CircleHelp,
  Clock3, Database, FileCode2, FileText, Files, FolderHeart, Heart, Image,
  LayoutDashboard, Menu, Moon, Palette, Printer, Search, Settings2, ShieldCheck,
  Sparkles, Star, Sun, WandSparkles, X, Zap, QrCode, ScanBarcode, Type, Braces, Code2 } from 'lucide-react';
import { tools as pdfTools } from '@local-tools/core';
import type { ToolId } from '@local-tools/core';
import { catalog, catalogCategories, catalogSupported } from './catalog';
import { utilityDefs } from './Utilities';
import type { UtilityId } from './Utilities';
import Utilities from './Utilities';
import Templates from './Templates';
import type { TemplateId } from './Templates';
import PdfWorkspace from './PdfWorkspace';
import { addActivity, clearHistory, readLocalState, setPreference, toggleFavorite } from './localDb';
import type { Activity as ActivityEntry } from './localDb';
import './dashboard.css';

type Page='dashboard'|'all'|'favorites'|'recent'|'catalog'|'templates'|'settings'|'privacy';
type ToolItem={id:string;name:string;description:string;category:string;featured?:boolean};
const allTools:ToolItem[]=[
  ...pdfTools.map(t=>({id:t.id,name:t.name,description:t.description,category:t.category,featured:t.featured})),
  ...utilityDefs.map(t=>({...t,featured:['json-tool','word-counter','qr-generator','barcode-generator'].includes(t.id)})),
  {id:'cv-builder',name:'CV & Resume Builder',description:'Build a professional resume using editable templates and print it as a PDF.',category:'Templates',featured:true},
  {id:'invoice-builder',name:'Invoice Generator',description:'Create printable invoices with custom company details and colors.',category:'Templates',featured:true}
];
const starterFeatured=['merge-pdf','image-convert','json-tool','word-counter','qr-generator','barcode-generator','cv-builder','rotate-pdf'];
const groups=['All','PDF','Images','Developer','Text','QR & Barcode','Templates'];
const toolIcons:Record<string,typeof Files>={
  'merge-pdf':Files,'split-pdf':FileText,'pdf-to-png':Image,'images-to-pdf':Image,
  'compress-image':Image,'resize-image':Image,'image-convert':Image,'json-tool':Braces,
  'word-counter':Type,'text-case':Type,'base64-tool':Code2,'uuid-tool':Code2,'sha-tool':ShieldCheck,
  'qr-generator':QrCode,'barcode-generator':ScanBarcode,'cv-builder':FileText,'invoice-builder':Printer,
};
const accentColors=['#3b82f6','#8b5cf6','#10b981','#f97316','#e11d48'];
const toolIcon=(id:string)=>toolIcons[id]||FileText;
const displayDate=(n:number)=>new Date(n).toLocaleString(undefined,{month:'short',day:'numeric',year:'numeric',hour:'2-digit',minute:'2-digit'});

export default function App(){
  const [page,setPage]=useState<Page>('dashboard');
  const [selected,setSelected]=useState<string|null>(null);
  const [search,setSearch]=useState('');
  const [group,setGroup]=useState('All');
  const [catalogGroup,setCatalogGroup]=useState('All categories');
  const [catalogPage,setCatalogPage]=useState(0);
  const [favorites,setFavorites]=useState<string[]>([]);
  const [history,setHistory]=useState<ActivityEntry[]>([]);
  const [theme,setTheme]=useState<'dark'|'light'|'system'>('dark');
  const [accent,setAccent]=useState('#3b82f6');
  const [systemDark,setSystemDark]=useState(true);
  const [sideOpen,setSideOpen]=useState(false);
  const [storageError,setStorageError]=useState('');
  const [loaded,setLoaded]=useState(false);
  const searchRef=useRef<HTMLInputElement>(null);
  useEffect(()=>{
    const media=window.matchMedia('(prefers-color-scheme: dark)');
    const onChange=()=>setSystemDark(media.matches);onChange();media.addEventListener('change',onChange);
    return ()=>media.removeEventListener('change',onChange);
  },[]);
  useEffect(()=>{
    let live=true;
    readLocalState().then(data=>{
      if(!live)return;
      setFavorites(data.favorites);setHistory(data.history);
      if(['light','dark','system'].includes(data.preferences.theme))setTheme(data.preferences.theme as typeof theme);
      if(/^#[0-9a-f]{6}$/i.test(data.preferences.accent||''))setAccent(data.preferences.accent);
      setLoaded(true);
    }).catch(()=>{if(live){setStorageError('Local SQLite storage is unavailable. Favorites and history may not persist.');setLoaded(true);}});
    return ()=>{live=false};
  },[]);
  useEffect(()=>{
    const listener=(e:KeyboardEvent)=>{
      if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){
        e.preventDefault();setSelected(null);setPage('all');setSideOpen(false);
        setTimeout(()=>searchRef.current?.focus(),0);
      }
      if(e.key==='Escape')setSideOpen(false);
    };
    window.addEventListener('keydown',listener);return()=>window.removeEventListener('keydown',listener);
  },[]);
  const isDark=theme==='dark'||(theme==='system'&&systemDark);
  function go(p:Page){setSelected(null);setPage(p);setSideOpen(false);setSearch('');setGroup('All');window.scrollTo(0,0);}
  function openTool(id:string){setSelected(id);setSideOpen(false);window.scrollTo(0,0);}
  async function favorite(id:string){
    const next=!favorites.includes(id);setFavorites(prev=>next?[id,...prev]:prev.filter(x=>x!==id));
    try{await toggleFavorite(id,next);}catch{setFavorites(prev=>next?prev.filter(x=>x!==id):[id,...prev]);setStorageError('Could not save this favorite locally.');}
  }
  async function activity(toolId:string,name:string,fileName:string,resultName:string){
    const entry:ActivityEntry={id:crypto.randomUUID(),toolId,toolName:name,fileName:fileName.slice(0,240),resultName:resultName.slice(0,240),createdAt:Date.now(),status:'completed'};
    setHistory(prev=>[entry,...prev].slice(0,100));
    try{await addActivity(entry);}catch{setStorageError('Could not persist activity to local SQLite.');}
  }
  async function updateTheme(next:typeof theme){setTheme(next);try{await setPreference('theme',next);}catch{setStorageError('Could not save theme preference.');}}
  async function updateAccent(next:string){setAccent(next);try{await setPreference('accent',next);}catch{setStorageError('Could not save color preference.');}}
  async function eraseHistory(){try{await clearHistory();setHistory([]);}catch{setStorageError('Could not clear local SQLite history.');}}
  const matched=useMemo(()=>allTools.filter(t=>(group==='All'||t.category===group)&&`${t.name} ${t.description} ${t.category}`.toLowerCase().includes(search.toLowerCase())),[group,search]);
  const featured=starterFeatured.map(id=>allTools.find(t=>t.id===id)!).filter(Boolean);
  const favoriteTools=allTools.filter(t=>favorites.includes(t.id));
  const filteredCatalog=useMemo(()=>catalog.filter(t=>
    (catalogGroup==='All categories'||t.category===catalogGroup)&&
    `${t.number} ${t.name} ${t.category}`.toLowerCase().includes(search.toLowerCase())),[catalogGroup,search]);
  const visibleCatalog=filteredCatalog.slice(catalogPage*30,(catalogPage+1)*30);
  const selectedCore=pdfTools.find(t=>t.id===selected);
  const selectedUtil=utilityDefs.find(t=>t.id===selected);
  const selectedTemplate=selected==='cv-builder'||selected==='invoice-builder';
  const sideLinks:[Page,typeof Files,string][]=[
    ['dashboard',LayoutDashboard,'Dashboard'],['all',Files,'All tools'],['favorites',Heart,'Favorites'],
    ['recent',Clock3,'Recent activity'],['templates',BookMarked,'Templates'],['catalog',FolderHeart,'480-action catalog']
  ];
  const style={'--v2-accent':accent} as CSSProperties;
  function Card({tool}:{tool:ToolItem}){
    const Icon=toolIcon(tool.id);const fav=favorites.includes(tool.id);
    return <article className="v2-card" onClick={()=>openTool(tool.id)} onKeyDown={e=>{if(e.key==='Enter')openTool(tool.id)}} tabIndex={0} role="button" aria-label={`Open ${tool.name}`}>
      <div className="v2-cardtop"><span className={`v2-ticon ${tool.category==='PDF'?'v2-pdf':tool.category==='Images'?'v2-image':tool.category==='Templates'?'v2-purple':'v2-green'}`}><Icon size={23}/></span>
        <button className={`v2-star ${fav?'is-favorite':''}`} aria-label={fav?`Remove ${tool.name} from favorites`:`Favorite ${tool.name}`} title={fav?'Remove favorite':'Add favorite'} onClick={e=>{e.stopPropagation();void favorite(tool.id)}}><Star size={21} fill={fav?'currentColor':'none'}/></button>
      </div><h3>{tool.name}</h3><p>{tool.description}</p><div className="v2-cardfoot"><span>{tool.category}</span><ArrowRight size={16}/></div></article>;
  }
  const cardGrid=(items:ToolItem[])=>items.length?<div className="v2-cardgrid">{items.map(t=><Card key={t.id} tool={t}/>)}</div>:<div className="v2-empty"><Star size={28}/><h3>Nothing here yet</h3><p>Star a tool to make it appear in Favorites.</p><button className="v2-secondary" onClick={()=>go('all')}>Browse tools</button></div>;
  return <div className={`v2 ${isDark?'v2-dark':'v2-light'}`} style={style}>
    {sideOpen&&<button className="v2-overlay" aria-label="Close menu" onClick={()=>setSideOpen(false)}/>}
    <aside className={`v2-sidebar ${sideOpen?'is-open':''}`}>
      <button className="v2-brand" onClick={()=>go('dashboard')}><span className="v2-brandmark"><LayoutDashboard size={22}/></span><span><strong>LocalTools</strong><small>Private Work Suite</small></span></button>
      <div className="v2-navcaption">WORKSPACE</div>
      <nav aria-label="Main workspace">
        {sideLinks.map(([id,Icon,label])=><button key={id} className={`v2-navlink ${page===id&&!selected?'active':''}`} onClick={()=>go(id)}><Icon size={18}/><span>{label}</span>{id==='favorites'&&favorites.length>0&&<em>{favorites.length}</em>}</button>)}
      </nav>
      <div className="v2-navcaption">QUICK ACCESS</div><nav aria-label="Quick access">
        {allTools.filter(t=>favorites.includes(t.id)).slice(0,4).map(t=><button key={t.id} className="v2-navlink" onClick={()=>openTool(t.id)}><Star size={16}/><span>{t.name}</span></button>)}
        {favorites.length===0&&<span className="v2-emptyhint">Star tools for quick access</span>}
      </nav>
      <div className="v2-navbottom"><div className="v2-safety"><ShieldCheck size={20}/><strong>No uploads</strong><small>Your files stay on your device.</small></div>
        <button className={`v2-navlink ${page==='settings'&&!selected?'active':''}`} onClick={()=>go('settings')}><Settings2 size={18}/>Settings</button>
        <button className={`v2-navlink ${page==='privacy'&&!selected?'active':''}`} onClick={()=>go('privacy')}><CircleHelp size={18}/>Privacy & help</button>
        <div className="v2-local"><span/> Local-only conversion · v0.2</div>
      </div>
    </aside>
    <div className="v2-main"><header className="v2-topbar"><div className="v2-top-left"><button className="v2-mobile-menu" onClick={()=>setSideOpen(true)} aria-label="Open menu"><Menu size={21}/></button><span className="v2-breadcrumb">Workspace <ChevronRight size={15}/> <strong>{selected?(allTools.find(x=>x.id===selected)?.name||'Tool') : page==='catalog'?'480-action catalog':page==='recent'?'Recent activity':page==='all'?'All tools':page.charAt(0).toUpperCase()+page.slice(1)}</strong></span></div>
      <div className="v2-top-actions"><span className="v2-device"><ShieldCheck size={16}/> Local processing</span><button className="v2-iconbtn" title={isDark?'Light theme':'Dark theme'} aria-label="Toggle dark theme" onClick={()=>void updateTheme(isDark?'light':'dark')}>{isDark?<Sun size={19}/>:<Moon size={19}/>}</button><button className="v2-help" onClick={()=>go('settings')}><Palette size={17}/> Appearance</button></div></header>
      <main className="v2-content">
        {storageError&&<div className="v2-warning" role="alert">{storageError}<button onClick={()=>setStorageError('')}><X size={16}/></button></div>}
        {!loaded&&<div className="v2-loading">Initializing private workspace…</div>}
        {selectedCore?<PdfWorkspace key={selectedCore.id} initialToolId={selectedCore.id as ToolId} onBack={()=>go('all')} onCompleted={(id,name,file,result)=>{void activity(id,name,file,result)}}/>:
        selectedUtil?<Utilities key={selectedUtil.id} id={selectedUtil.id as UtilityId} onBack={()=>go('all')} onCompleted={(name,result)=>{void activity(selectedUtil.id,name,'Text / local input',result)}}/>:
        selectedTemplate?<Templates key={selected} id={selected as TemplateId} onBack={()=>go('templates')} onCompleted={(name,result)=>{void activity(selected,name,'Local template',result)}}/>:
        page==='dashboard'?<>
          <div className="v2-headingrow"><div><h1>Welcome to your workspace <span className="v2-wave">✦</span></h1><p>Private file tools, offline-ready. No account or document upload required.</p></div><div className="v2-operational"><span/> Your device is the processor</div></div>
          <div className="v2-searchwrap"><Search size={20}/><input value={search} ref={searchRef} onChange={e=>setSearch(e.target.value)} onFocus={()=>{}} placeholder="Search tools like 'Merge PDF', 'QR code' or 'Resume'..."/><kbd>Ctrl K</kbd></div>
          <div className="v2-tabs">{groups.map(g=><button key={g} className={group===g?'selected':''} onClick={()=>setGroup(g)}>{g}</button>)}</div>
          <div className="v2-overview"><div><span className="v2-stat-icon"><Files size={18}/></span><strong>{allTools.length}</strong><small>Working tools & builders</small></div><div><span className="v2-stat-icon"><Star size={18}/></span><strong>{favorites.length}</strong><small>Saved favorites</small></div><div><span className="v2-stat-icon"><Activity size={18}/></span><strong>{history.length}</strong><small>Recent operations stored locally</small></div><div><span className="v2-stat-icon"><BookMarked size={18}/></span><strong>480</strong><small>Feature ideas in roadmap</small></div></div>
          <div className="v2-sectiontitle"><h2>{search||group!=='All'?'Matching tools':'Popular tools'}</h2><button className="v2-link" onClick={()=>go('all')}>View all <ArrowRight size={16}/></button></div>
          {cardGrid(search||group!=='All'?matched:featured)}
          <div className="v2-sectiontitle v2-topspace"><h2>Recent activity</h2><button className="v2-link" onClick={()=>go('recent')}>View history <ArrowRight size={16}/></button></div>
          <HistoryTable entries={history.slice(0,5)} onOpen={openTool}/>
          <div className="v2-roadmap"><div><Sparkles size={24}/><strong>480 ideas, built responsibly</strong><p>Explore the full backlog. Only tools that actually work are marked available; difficult Office, AI and media features remain planned.</p></div><button className="v2-primary" onClick={()=>go('catalog')}>Explore roadmap <ArrowRight size={16}/></button></div>
        </>:
        page==='all'||page==='favorites'?<><div className="v2-pagehead"><div><span className="v2-kicker">YOUR TOOLBOX</span><h1>{page==='favorites'?'Favorite tools':'All available tools'}</h1><p>{page==='favorites'?'Starred utilities, saved privately in local SQLite.':'Open any of the implemented offline-capable utilities below.'}</p></div></div>
          {page==='all'&&<><div className="v2-searchwrap"><Search size={19}/><input ref={searchRef} value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search working tools..."/><kbd>Ctrl K</kbd></div><div className="v2-tabs">{groups.map(g=><button key={g} className={group===g?'selected':''} onClick={()=>setGroup(g)}>{g}</button>)}</div></>}
          {cardGrid(page==='favorites'?favoriteTools:matched)}</>:
        page==='recent'?<><div className="v2-pagehead"><div><span className="v2-kicker">YOUR DEVICE ONLY</span><h1>Recent activity</h1><p>Only tool names, input file names, output names and timestamps are saved in browser-local SQLite. File contents are never stored here.</p></div><button className="v2-secondary" disabled={history.length===0} onClick={()=>void eraseHistory()}>Clear history</button></div><HistoryTable entries={history} onOpen={openTool}/><p className="v2-hint">For privacy and disk space, downloads are not retained. Past results cannot be re-downloaded from this list; run the tool again with the original file.</p></>:
        page==='templates'?<><div className="v2-pagehead"><div><span className="v2-kicker">EDITABLE DESIGNS</span><h1>Document templates</h1><p>Fill forms, choose styles and colors, save local drafts, and print to PDF. No cloud account is required.</p></div></div>{cardGrid(allTools.filter(t=>t.category==='Templates'))}<div className="v2-roadmap"><div><BookMarked size={22}/><strong>More templates planned</strong><p>Quotes, certificates, business cards, labels, IDs and other designs are listed in the 480-action catalog.</p></div><button className="v2-secondary" onClick={()=>go('catalog')}>See planned templates</button></div></>:
        page==='catalog'?<><div className="v2-pagehead"><div><span className="v2-kicker">PRODUCT ROADMAP · 24 CATEGORIES</span><h1>480-action tool catalog</h1><p>Based on your uploaded catalog. Browsing a planned tool does not mean its conversion engine exists.</p></div><span className="v2-count">{filteredCatalog.length} ideas</span></div>
          <div className="v2-catalog-filter"><div className="v2-searchwrap"><Search size={19}/><input ref={searchRef} placeholder="Search all 480 actions..." value={search} onChange={e=>{setSearch(e.target.value);setCatalogPage(0)}}/></div><label><span>Category</span><select value={catalogGroup} onChange={e=>{setCatalogGroup(e.target.value);setCatalogPage(0)}}><option>All categories</option>{catalogCategories.map(c=><option key={c}>{c}</option>)}</select><ChevronDown size={16}/></label></div>
          <div className="v2-legend"><span><CheckCircle2 size={15}/> Available: opens a working tool</span><span><Clock3 size={15}/> Planned: roadmap only</span></div>
          <div className="v2-catalog-list">{visibleCatalog.map(t=>{const id=catalogSupported[t.number];return <div className="v2-catalog-row" key={t.number}><span className="v2-catalog-n">{String(t.number).padStart(3,'0')}</span><div><strong>{t.name}</strong><small>{t.category}</small></div>{id?<button className="v2-available" onClick={()=>openTool(id)}><Check size={14}/> Available <ArrowRight size={14}/></button>:<span className="v2-planned">Planned</span>}</div>})}</div>
          {filteredCatalog.length===0&&<div className="v2-empty">No actions match your search.</div>}
          <div className="v2-pagination"><button className="v2-secondary" disabled={catalogPage===0} onClick={()=>setCatalogPage(p=>Math.max(0,p-1))}>Previous</button><span>Page {catalogPage+1} of {Math.max(1,Math.ceil(filteredCatalog.length/30))}</span><button className="v2-secondary" disabled={(catalogPage+1)*30>=filteredCatalog.length} onClick={()=>setCatalogPage(p=>p+1)}>Next</button></div>
        </>:
        page==='settings'?<><div className="v2-pagehead"><div><span className="v2-kicker">PERSONALIZE</span><h1>Appearance & preferences</h1><p>Make the workspace comfortable. Your selections are stored in your browser's SQLite database.</p></div></div><div className="v2-settingscards"><section className="v2-panel"><h2><Palette size={20}/> Theme mode</h2><div className="v2-themeoptions">{(['dark','light','system'] as const).map(t=><button key={t} className={theme===t?'selected':''} onClick={()=>void updateTheme(t)}>{t==='dark'?<Moon size={22}/>:t==='light'?<Sun size={22}/>:<Settings2 size={22}/>}<strong>{t.charAt(0).toUpperCase()+t.slice(1)}</strong>{theme===t&&<CheckCircle2 size={17}/>}</button>)}</div></section><section className="v2-panel"><h2><WandSparkles size={20}/> Accent color</h2><div className="v2-accentchoices">{accentColors.map(c=><button key={c} aria-label={`Set accent ${c}`} style={{background:c}} className={accent===c?'selected':''} onClick={()=>void updateAccent(c)}>{accent===c&&<Check size={21}/>}</button>)}<label>Custom <input type="color" value={accent} onChange={e=>void updateAccent(e.target.value)}/></label></div></section></div><div className="v2-panel v2-settingnote"><Database size={27}/><div><strong>Private SQLite workspace</strong><p>Favorites, activity metadata, saved CV/invoice drafts, theme and accent color persist locally using SQLite WASM and IndexedDB. If you clear site data, this information is deleted. Backup is not yet implemented.</p></div></div></>:
        page==='privacy'?<><div className="v2-pagehead"><div><span className="v2-kicker">PRIVACY FIRST</span><h1>Your files never need our server.</h1><p>Processing uses JavaScript, Canvas, PDF engines, and WebAssembly locally. The initial app download needs a network connection; offline use requires assets to be cached.</p></div></div><div className="v2-privacygrid"><div className="v2-panel"><ShieldCheck size={27}/><h3>No document upload</h3><p>We do not transmit the files selected for conversion. No cloud conversion service is included.</p></div><div className="v2-panel"><Database size={27}/><h3>Browser-local SQLite</h3><p>Favorites, recent file-name metadata, preferences and template drafts stay in IndexedDB on this device.</p></div><div className="v2-panel"><Zap size={27}/><h3>Offline after install</h3><p>The service worker caches application assets for offline usage, subject to browser storage eviction. Test offline before relying on it.</p></div></div></>:null}
      </main><footer className="v2-footer"><span>LocalTools © {new Date().getFullYear()} · Private, offline-first software</span><span>{allTools.length} working tools & builders · 480 roadmap ideas</span></footer>
    </div>
  </div>;
}
function HistoryTable({entries,onOpen}:{entries:ActivityEntry[];onOpen:(id:string)=>void}){
  return <div className="v2-history">{entries.length===0?<div className="v2-empty"><Clock3 size={26}/><h3>No recent activity</h3><p>Finish your first conversion to see it here. Nothing is uploaded.</p></div>:<div className="v2-table-scroll"><table><thead><tr><th>FILE / INPUT</th><th>TOOL USED</th><th>DATE</th><th>STATUS</th><th>ACTION</th></tr></thead><tbody>{entries.map(t=><tr key={t.id}><td><FileCode2 size={18}/><div><strong>{t.fileName||'Local input'}</strong><small>{t.resultName}</small></div></td><td>{t.toolName}</td><td>{displayDate(t.createdAt)}</td><td><span className="v2-success"><CheckCircle2 size={13}/> {t.status}</span></td><td><button className="v2-link" onClick={()=>onOpen(t.toolId)}>Open tool <ArrowRight size={13}/></button></td></tr>)}</tbody></table></div>}</div>;
}