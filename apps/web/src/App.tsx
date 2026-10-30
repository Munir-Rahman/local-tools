import { useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { Activity, ArrowRight, BookMarked, Check, CheckCircle2, ChevronDown, ChevronRight, CircleHelp,
  Clock3, Database, FileCode2, FileText, Files, FolderHeart, Heart, Image, FileImage, FileArchive, Film, Headphones, Calculator, Laptop, Grid2X2,
  LayoutDashboard, Moon, Palette, Printer, Search, Settings2, ShieldCheck,
  Sparkles, Star, Sun, WandSparkles, X, Zap, QrCode, ScanBarcode, Type, Braces, Code2 } from 'lucide-react';
import { tools as pdfTools } from '@local-tools/core';
import type { ToolId } from '@local-tools/core';
import { catalog, catalogSupported } from './catalog';
import masterCatalog from './masterCatalog';
import AdSlot from './AdSlot';
import ToolNestHeader from './ToolNestHeader';
import StickerStudio from './StickerStudio';
import { utilityDefs } from './Utilities';
import type { UtilityId } from './Utilities';
import Utilities from './Utilities';
import Templates from './Templates';
import type { TemplateId } from './Templates';
import PdfWorkspace from './PdfWorkspace';
import { addActivity, clearHistory, readLocalState, setPreference, toggleFavorite, verifyLocalDatabase, exportDatabaseSnapshot } from './localDb';
import type { Activity as ActivityEntry } from './localDb';
import './dashboard.css';
import ExtraWorkbench from './ExtraWorkbench';
import {extras} from './extraEngine';
import ImageWorkbench, {imageActionNumbers} from './ImageWorkbench';
import PdfAdvanced, {pdfAdvancedNumbers} from './PdfAdvanced';
import FileWorkbench, {fileActionNumbers} from './FileWorkbench';
import CsvWorkbench, {csvNumbers} from './CsvWorkbench';
import {scienceTools} from './scienceEngine';
import ScienceWorkbench from './ScienceWorkbench';
import {unitConversions} from './unitConversions';
import UnitWorkbench from './UnitWorkbench';
import BusinessTemplates, {businessTemplates} from './BusinessTemplates';
import MediaWorkbench, {mediaTools} from './MediaWorkbench';
import OfficeWorkbench, {officeTools} from './OfficeWorkbench';

type Page='dashboard'|'all'|'favorites'|'recent'|'catalog'|'templates'|'settings'|'privacy'|'about'|'faq'|'contact'|'personal';
type ToolItem={id:string;name:string;description:string;category:string;featured?:boolean};
const allTools:ToolItem[]=[
  ...pdfTools.map(t=>({id:t.id,name:t.name,description:t.description,category:t.category,featured:t.featured})),
  ...utilityDefs.map(t=>({...t,featured:['json-tool','word-counter','qr-generator','barcode-generator'].includes(t.id)})),
  {id:'cv-builder',name:'CV & Resume Builder',description:'Build a professional resume using editable templates and print it as a PDF.',category:'Templates',featured:true},
  {id:'invoice-builder',name:'Invoice Generator',description:'Create detailed invoices with multiple items, discounts and printable bills.',category:'Templates',featured:true},
  {id:'sticker-studio',name:'Sticker & Emoji Studio',description:'Make colorful printable stickers and SVG sheets with emoji and captions.',category:'Design',featured:true},
  ...Object.values(extras).map(spec=>({id:`action-${spec.number}`,name:catalog[spec.number-1].name,description:spec.help,category:spec.category,featured:false})),
  ...imageActionNumbers.map(n=>({id:`image-${n}`,name:catalog[n-1].name,description:'Offline image editing with browser Canvas.',category:'Images',featured:false})),
  ...pdfAdvancedNumbers.map(n=>({id:`pdf-${n}`,name:catalog[n-1].name,description:'Offline PDF operation using local processing.',category:'PDF',featured:false})),
  ...fileActionNumbers.map(n=>({id:`file-${n}`,name:catalog[n-1].name,description:'Work with local files and archives without uploads.',category:'File',featured:false})),
  ...csvNumbers.map(n=>({id:`csv-${n}`,name:catalog[n-1].name,description:'Process local CSV tables.',category:'Spreadsheets',featured:false})),
  ...scienceTools.map(t=>({id:t.id,name:t.name,description:t.description,category:t.category,featured:false})),
  ...unitConversions.map(t=>({id:t.id,name:t.name,description:t.description,category:t.category,featured:false})),
  ...businessTemplates.map(t=>({id:t.id,name:t.name,description:t.description,category:'Templates',featured:false})),
  ...mediaTools.map(t=>({id:t.id,name:t.name,description:t.description,category:t.category,featured:false})),
  ...officeTools.map(t=>({id:t.id,name:t.name,description:t.description,category:'Office',featured:false}))
];
const starterFeatured=['merge-pdf','image-convert','json-tool','word-counter','qr-generator','barcode-generator','cv-builder','sticker-studio','unit-length-km-mi','unit-storage-GiB-MB'];
const groups=['All','PDF','Images','File','Spreadsheets','Developer','Text','Calculators','Design','QR & Barcode','Templates','Computer','Physics','Chemistry','Electrical','Engineering','Converters','Video','Audio','Office'];
const toolIcons:Record<string,typeof Files>={
  'merge-pdf':Files,'split-pdf':FileText,'pdf-to-png':Image,'images-to-pdf':Image,
  'compress-image':Image,'resize-image':Image,'image-convert':Image,'json-tool':Braces,
  'word-counter':Type,'text-case':Type,'base64-tool':Code2,'uuid-tool':Code2,'sha-tool':ShieldCheck,
  'qr-generator':QrCode,'barcode-generator':ScanBarcode,'cv-builder':FileText,'invoice-builder':Printer,'sticker-studio':Sparkles,
};
const accentColors=['#ef892c','#3b82f6','#10b981','#8b5cf6','#e11d48'];
const displayDate=(n:number)=>new Date(n).toLocaleString(undefined,{month:'short',day:'numeric',year:'numeric',hour:'2-digit',minute:'2-digit'});

export default function App(){
  const [page,setPage]=useState<Page>('dashboard');
  const [selected,setSelected]=useState<string|null>(null);
  const [search,setSearch]=useState('');
  const [group,setGroup]=useState('All');
  const [catalogGroup,setCatalogGroup]=useState('All categories');
  const [catalogPage,setCatalogPage]=useState(0);
  const [toolPage,setToolPage]=useState(0);
  const [favorites,setFavorites]=useState<string[]>([]);
  const [history,setHistory]=useState<ActivityEntry[]>([]);
  const [theme,setTheme]=useState<'dark'|'light'|'system'>('light');
  const [accent,setAccent]=useState('#ef892c');
  const [displayName,setDisplayName]=useState('');
  const [profileStatus,setProfileStatus]=useState('');
  const [systemDark,setSystemDark]=useState(true);
  const [sideOpen,setSideOpen]=useState(false);
  const [storageError,setStorageError]=useState('');
  const [loaded,setLoaded]=useState(false);
  const [dbTest,setDbTest]=useState('');
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
      setFavorites(data.favorites);setHistory(data.history);setDisplayName((data.preferences.displayName||'').slice(0,80));
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
  function go(p:Page){
    window.history.pushState({tn:true,page:p,selected:null},'',`#${p}`);
    setSelected(null);setPage(p);setSideOpen(false);setSearch('');setGroup('All');window.scrollTo(0,0);
  }
  async function saveProfile(){try{await setPreference('displayName',displayName.trim().slice(0,80));setProfileStatus('Your name has been saved in local SQLite storage.');}catch(e){setProfileStatus('Cannot save display name: '+String(e));}}
  function back(){if(window.history.state?.tn)window.history.back();else{setSelected(null);setPage('all');}}
  useEffect(()=>{
    const raw=decodeURIComponent(location.hash.replace(/^#/,''));
    const selectedFromHash=raw.startsWith('tool/')?raw.slice(5):null;
    const pageFromHash=(['dashboard','all','favorites','recent','catalog','templates','settings','privacy','about','faq','contact','personal'] as Page[]).includes(raw as Page)?raw as Page:'dashboard';
    window.history.replaceState({tn:true,page:pageFromHash,selected:selectedFromHash},'',location.pathname+location.search+(location.hash||'#dashboard'));
    setPage(pageFromHash);setSelected(selectedFromHash);
    const restore=(e:PopStateEvent)=>{setSelected(e.state?.selected||null);setPage(e.state?.page||'dashboard');setSideOpen(false);window.scrollTo(0,0)};
    window.addEventListener('popstate',restore);return()=>window.removeEventListener('popstate',restore);
  },[]);
  function openTool(id:string){window.history.pushState({tn:true,page,selected:id},'',`#tool/${encodeURIComponent(id)}`);setSelected(id);setSideOpen(false);window.scrollTo(0,0);}
  async function favorite(id:string){
    const next=!favorites.includes(id);setFavorites(prev=>next?[id,...prev]:prev.filter(x=>x!==id));
    try{await toggleFavorite(id,next);}catch(e){setFavorites(prev=>next?prev.filter(x=>x!==id):[id,...prev]);setStorageError('Could not save favorite: '+(e instanceof Error?e.message:String(e)));}
  }
  async function activity(toolId:string,name:string,fileName:string,resultName:string){
    const entry:ActivityEntry={id:crypto.randomUUID(),toolId,toolName:name,fileName:fileName.slice(0,240),resultName:resultName.slice(0,240),createdAt:Date.now(),status:'completed'};
    setHistory(prev=>[entry,...prev].slice(0,100));
    try{await addActivity(entry);}catch(e){setStorageError('Could not persist activity to local SQLite: '+(e instanceof Error?e.message:String(e)));}
  }
  async function updateTheme(next:typeof theme){setTheme(next);try{await setPreference('theme',next);}catch{setStorageError('Could not save theme preference.');}}
  async function updateAccent(next:string){setAccent(next);try{await setPreference('accent',next);}catch{setStorageError('Could not save color preference.');}}
  async function checkStorage(){setDbTest('Checking…');try{await verifyLocalDatabase();setDbTest('SQLite and IndexedDB persistence verified on this device.');setStorageError('');}catch(e){setDbTest('Database test failed: '+String(e));}}
  async function downloadDatabase(){try{const snapshot=await exportDatabaseSnapshot();const url=URL.createObjectURL(snapshot);const link=document.createElement('a');link.href=url;link.download='localtools-backup.sqlite';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}catch(e){setDbTest('SQLite backup failed: '+String(e));}}
  async function eraseHistory(){try{await clearHistory();setHistory([]);}catch{setStorageError('Could not clear local SQLite history.');}}
  const matched=useMemo(()=>allTools.filter(t=>(group==='All'||t.category===group)&&`${t.name} ${t.description} ${t.category}`.toLowerCase().includes(search.toLowerCase())),[group,search]);
  useEffect(()=>setToolPage(0),[group,search,page]);
  const visibleTools=matched.slice(0,(toolPage+1)*48);
  const featured=starterFeatured.map(id=>allTools.find(t=>t.id===id)!).filter(Boolean);
  const favoriteTools=allTools.filter(t=>favorites.includes(t.id));
  const filteredCatalog=useMemo(()=>masterCatalog.filter(t=>
    (catalogGroup==='All categories'||t.category===catalogGroup)&&
    `${t.number} ${t.name} ${t.category}`.toLowerCase().includes(search.toLowerCase())),[catalogGroup,search]);
  const masterCategories=useMemo(()=>[...new Set(masterCatalog.map(t=>t.category))],[]);
  const visibleCatalog=filteredCatalog.slice(catalogPage*30,(catalogPage+1)*30);
  const selectedCore=pdfTools.find(t=>t.id===selected);
  const selectedUnit=selected?.startsWith('unit-')?selected:null;
  const selectedUtil=utilityDefs.find(t=>t.id===selected);
  const selectedTemplate=selected==='cv-builder'||selected==='invoice-builder';
  const selectedExtra=selected?.startsWith('action-')?Number(selected.slice(7)):null;
  const selectedImage=selected?.startsWith('image-')?Number(selected.slice(6)):null;
  const selectedPdfExtra=selected?.startsWith('pdf-')?Number(selected.slice(4)):null;
  const selectedFile=selected?.startsWith('file-')?Number(selected.slice(5)):null;
  const selectedCsv=selected?.startsWith('csv-')?Number(selected.slice(4)):null;
  const availableCatalog:Record<number,string>={...catalogSupported,
    ...Object.fromEntries(Object.keys(extras).map(n=>[Number(n),`action-${n}`])),
    ...Object.fromEntries(imageActionNumbers.map(n=>[n,`image-${n}`])),
    ...Object.fromEntries(pdfAdvancedNumbers.map(n=>[n,`pdf-${n}`])),
    ...Object.fromEntries(fileActionNumbers.map(n=>[n,`file-${n}`])),
    ...Object.fromEntries(csvNumbers.map(n=>[n,`csv-${n}`])),
    ...Object.fromEntries([205,206,207,208,209,211,212,215,216,217].map(n=>[n,'qr-generator'])),
    ...Object.fromEntries([222,223,224,225,227,230].map(n=>[n,'barcode-generator'])),
    ...Object.fromEntries(businessTemplates.map(t=>[t.catalog,t.id])),
    ...Object.fromEntries(mediaTools.filter(t=>t.catalog>0).map(t=>[t.catalog,t.id])),
    ...Object.fromEntries(officeTools.map(t=>[t.catalog,t.id]))};
  const sideLinks:[Page,typeof Files,string][]=[
    ['dashboard',LayoutDashboard,'Dashboard'],['all',Files,'All tools'],['favorites',Heart,'Favorites'],
    ['recent',Clock3,'Recent activity'],['templates',BookMarked,'Templates'],['catalog',FolderHeart,'5,000-action catalog']
  ];
  const style={'--v2-accent':accent} as CSSProperties;
  function Card({tool}:{tool:ToolItem}){
    const categoryIcons:Record<string,typeof Files>={PDF:FileText,Images:FileImage,File:FileArchive,Spreadsheets:Database,Office:FileText,Video:Film,Audio:Headphones,Developer:Code2,Text:Type,Calculators:Calculator,Design:Sparkles,Templates:BookMarked,Computer:Laptop,Physics:Zap,Chemistry:Zap,Electrical:Zap,Engineering:Settings2,Converters:Calculator};
    const Icon=toolIcons[tool.id]||categoryIcons[tool.category]||FileText;const fav=favorites.includes(tool.id);
    return <article className="v2-card" onClick={()=>openTool(tool.id)} onKeyDown={e=>{if(e.key==='Enter')openTool(tool.id)}} tabIndex={0} role="button" aria-label={`Open ${tool.name}`}>
      <div className="v2-cardtop"><span className={`v2-ticon ${tool.category==='PDF'?'v2-pdf':tool.category==='Images'?'v2-image':tool.category==='Templates'?'v2-purple':'v2-green'}`}><Icon size={23}/></span>
        <button className={`v2-star ${fav?'is-favorite':''}`} aria-label={fav?`Remove ${tool.name} from favorites`:`Favorite ${tool.name}`} title={fav?'Remove favorite':'Add favorite'} onClick={e=>{e.stopPropagation();void favorite(tool.id)}}><Star size={21} fill={fav?'currentColor':'none'}/></button>
      </div><h3>{tool.name}</h3><p>{tool.description}</p><div className="v2-cardfoot"><span>{tool.category}</span><ArrowRight size={16}/></div></article>;
  }
  const cardGrid=(items:ToolItem[])=>items.length?<div className="v2-cardgrid">{items.map(t=><Card key={t.id} tool={t}/>)}</div>:<div className="v2-empty"><Star size={28}/><h3>Nothing here yet</h3><p>Star a tool to make it appear in Favorites.</p><button className="v2-secondary" onClick={()=>go('all')}>Browse tools</button></div>;
  return <div className={`v2 ${isDark?'v2-dark':'v2-light'}`} style={style}>
    {sideOpen&&<button className="v2-overlay" aria-label="Close menu" onClick={()=>setSideOpen(false)}/>}
    <aside className={`v2-sidebar ${sideOpen?'is-open':''}`}>
      <button className="v2-brand" onClick={()=>go('dashboard')}><span className="v2-brandmark"><img src="/brand-icon.png" alt=""/></span><span><strong>ToolNest</strong><small>Free private tool suite</small></span></button>
      <div className="v2-navcaption">WORKSPACE</div>
      <nav aria-label="Main workspace">
        {sideLinks.map(([id,Icon,label])=><button key={id} className={`v2-navlink ${page===id&&!selected?'active':''}`} onClick={()=>go(id)}><Icon size={18}/><span>{label}</span>{id==='favorites'&&favorites.length>0&&<em>{favorites.length}</em>}</button>)}
      </nav>
      <div className="v2-navcaption">TOOL CATEGORIES</div><nav className="v7-side-submodules" aria-label="Browse tool categories">{groups.filter(x=>x!=='All').map(g=><button key={g} className="v2-navlink" onClick={()=>{go('all');setGroup(g)}}><ChevronRight size={15}/><span>{g}</span></button>)}</nav>
      <div className="v2-navcaption">QUICK ACCESS</div><nav aria-label="Quick access">
        {allTools.filter(t=>favorites.includes(t.id)).slice(0,4).map(t=><button key={t.id} className="v2-navlink" onClick={()=>openTool(t.id)}><Star size={16}/><span>{t.name}</span></button>)}
        {favorites.length===0&&<span className="v2-emptyhint">Star tools for quick access</span>}
      </nav>
      <div className="v2-navbottom"><div className="v2-safety"><ShieldCheck size={20}/><strong>No uploads</strong><small>Your files stay on your device.</small></div>
        <button className={`v2-navlink ${page==='settings'&&!selected?'active':''}`} onClick={()=>go('settings')}><Settings2 size={18}/>Settings</button>
        <button className={`v2-navlink ${page==='privacy'&&!selected?'active':''}`} onClick={()=>go('privacy')}><CircleHelp size={18}/>Privacy & help</button>
        <div className="v2-local"><span/> Local processing · v0.8</div>
      </div>
    </aside>
    <div className="v2-main"><ToolNestHeader tools={allTools} favoriteCount={favorites.length} isDark={isDark}
        onOpenTool={openTool} onCategory={g=>{go('all');setGroup(g)}} onPage={p=>go(p)}
        onToggleTheme={()=>void updateTheme(isDark?'light':'dark')} onOpenMobile={()=>setSideOpen(true)}/>
      <main className="v2-content">
        {storageError&&<div className="v2-warning" role="alert">{storageError}<button onClick={()=>setStorageError('')}><X size={16}/></button></div>}
        {selected&&<button className="v2-secondary v6-pageback no-print" type="button" onClick={back}>← Back to previous page</button>}
        {!loaded&&<div className="v2-loading">Initializing private workspace…</div>}
        {selectedExtra!==null&&extras[selectedExtra]?<ExtraWorkbench key={selectedExtra} number={selectedExtra} onBack={back} onCompleted={(name,result)=>{void activity(selected!,name,'Local input',result)}}/>:
        selectedImage!==null&&imageActionNumbers.includes(selectedImage)?<ImageWorkbench key={selectedImage} number={selectedImage} onBack={back} onCompleted={(name,result)=>{void activity(selected!,name,'Local image',result)}}/>:
        selectedPdfExtra!==null&&pdfAdvancedNumbers.includes(selectedPdfExtra)?<PdfAdvanced key={selectedPdfExtra} number={selectedPdfExtra} onBack={back} onCompleted={(name,result)=>{void activity(selected!,name,'Local PDF',result)}}/>:
        selectedFile!==null&&fileActionNumbers.includes(selectedFile)?<FileWorkbench key={selectedFile} number={selectedFile} onBack={back} onCompleted={(name,result)=>{void activity(selected!,name,'Local file',result)}}/>:
        selectedCsv!==null&&csvNumbers.includes(selectedCsv)?<CsvWorkbench key={selectedCsv} number={selectedCsv} onBack={back} onCompleted={(name,result)=>{void activity(selected!,name,'Local CSV',result)}}/>:
        selected&&scienceTools.some(t=>t.id===selected)?<ScienceWorkbench key={selected} id={selected} onComplete={(name,result)=>{void activity(selected,name,'Local calculation',result)}}/>:
        selectedUnit?<UnitWorkbench key={selectedUnit} id={selectedUnit} onSwap={openTool} onComplete={(name,result)=>{void activity(selectedUnit,name,'Local unit value',result)}}/>:
        selected&&businessTemplates.some(t=>t.id===selected)?<BusinessTemplates key={selected} id={selected as typeof businessTemplates[number]['id']} onBack={back} onCompleted={(name,result)=>{void activity(selected,name,'Local template',result)}}/>:
        selected&&mediaTools.some(t=>t.id===selected)?<MediaWorkbench key={selected} id={selected as typeof mediaTools[number]['id']} onComplete={(name,result)=>{void activity(selected,name,'Local media',result)}}/>:
        selected&&officeTools.some(t=>t.id===selected)?<OfficeWorkbench key={selected} id={selected} onComplete={(name,result)=>{void activity(selected,name,'Local Office file',result)}}/>:
        selected==='sticker-studio'?<StickerStudio onBack={back} onCompleted={(name,result)=>{void activity(selected,name,'Local text',result)}}/>:
        selectedCore?<PdfWorkspace key={selectedCore.id} initialToolId={selectedCore.id as ToolId} onBack={back} onCompleted={(id,name,file,result)=>{void activity(id,name,file,result)}}/>:
        selectedUtil?<Utilities key={selectedUtil.id} id={selectedUtil.id as UtilityId} onBack={back} onCompleted={(name,result)=>{void activity(selectedUtil.id,name,'Text / local input',result)}}/>:
        selectedTemplate?<Templates key={selected} id={selected as TemplateId} onBack={back} onCompleted={(name,result)=>{void activity(selected,name,'Local template',result)}}/>:
        page==='dashboard'?<>
          <section className="tn-hero" aria-label="ToolNest introductory banner">
            <div className="tn-hero-left"><span className="tn-hero-brow"><ShieldCheck size={15}/> PRIVATE BY DESIGN · FREE TO USE</span>
              <h1>Powerful file tools.<br/><em>Simply yours.</em></h1>
              <p>Convert documents, create designs and work with PDFs, images, audio and video. Supported tools process files on your device, not on an upload server.</p>
              <div className="tn-hero-pills"><button onClick={()=>go('all')}><Grid2X2 size={17}/> Explore tools <ArrowRight size={16}/></button><button onClick={()=>go('templates')}><BookMarked size={17}/> Ready-made templates</button><button onClick={()=>go('favorites')}><Heart size={17}/> My favorites</button></div>
            </div>
            <div className="tn-hero-art" aria-hidden="true"><div className="tn-hero-document"><FileText size={34}/><span/><span/><span/><span/></div><div className="tn-hero-floating tn-float-a"><Image size={37}/></div><div className="tn-hero-floating tn-float-b"><Sparkles size={37}/></div><div className="tn-hero-floating tn-float-c"><FileArchive size={34}/></div></div>
          </section>
          <div className="tn-trust-band"><div><ShieldCheck size={24}/><span><strong>Private by default</strong><small>Files stay in local processing engines</small></span></div><div><Zap size={24}/><span><strong>Offline-capable tools</strong><small>Use supported cached tools without internet</small></span></div><div><Heart size={24}/><span><strong>Free and practical</strong><small>No credits or account required</small></span></div></div>
          <div className="tn-section-intro"><div><span className="tn-eyebrow">FIND THE RIGHT TOOL</span><h2>Browse by category</h2><p>Pick a category to explore compatible utilities.</p></div><button onClick={()=>go('all')}>View all tools <ArrowRight size={16}/></button></div>
          <div className="tn-category-tiles">{[
            ['PDF','PDF tools',FileText,'Organize PDF documents'],['Images','Image tools',Image,'Resize and convert'],['Office','Office tools',BookMarked,'Documents & spreadsheets'],['Video','Video tools',Film,'Edit and extract'],['Audio','Audio tools',Headphones,'Audio conversion'],['Templates','Templates',Sparkles,'CVs, invoices and more'],['Converters','Unit converters',Calculator,'1,500+ working conversions']
          ].map(([cat,label,Icon,note])=>{const TileIcon=Icon as typeof FileText;return <button key={cat as string} className="tn-category-tile" onClick={()=>{go('all');setGroup(cat as string)}}><TileIcon size={29}/><strong>{label as string}</strong><span>{note as string}</span></button>})}</div>
          <AdSlot placement="leaderboard"/>
          <div className="v2-searchwrap"><Search size={20}/><input value={search} ref={searchRef} onChange={e=>setSearch(e.target.value)} onFocus={()=>{}} placeholder="Search tools like 'Merge PDF', 'QR code' or 'Resume'..."/><kbd>Ctrl K</kbd></div>
          <div className="v2-tabs">{groups.map(g=><button key={g} className={group===g?'selected':''} onClick={()=>setGroup(g)}>{g}</button>)}</div>
          <div className="v2-overview"><div><span className="v2-stat-icon"><Files size={18}/></span><strong>{allTools.length}</strong><small>Tool routes (some simplified)</small></div><div><span className="v2-stat-icon"><Star size={18}/></span><strong>{favorites.length}</strong><small>Saved favorites</small></div><div><span className="v2-stat-icon"><Activity size={18}/></span><strong>{history.length}</strong><small>Recent operations stored locally</small></div><div><span className="v2-stat-icon"><BookMarked size={18}/></span><strong>5,000</strong><small>Feature ideas in roadmap</small></div></div>
          <AdSlot placement="home"/>
          <div className="v2-sectiontitle"><h2>{search||group!=='All'?'Matching tools':'Popular tools'}</h2><button className="v2-link" onClick={()=>go('all')}>View all <ArrowRight size={16}/></button></div>
          {cardGrid(search||group!=='All'?visibleTools:featured)}{(search||group!=='All')&&matched.length>visibleTools.length&&<button className="v2-secondary tn-load-more" onClick={()=>setToolPage(x=>x+1)}>Load more · {matched.length-visibleTools.length} remaining</button>}
          <AdSlot placement="infeed"/>
          <div className="v2-sectiontitle v2-topspace"><h2>Recent activity</h2><button className="v2-link" onClick={()=>go('recent')}>View history <ArrowRight size={16}/></button></div>
          <HistoryTable entries={history.slice(0,5)} onOpen={openTool}/>
          <div className="v2-roadmap"><div><Sparkles size={24}/><strong>5,000 ideas cataloged, with verified and planned engines</strong><p>Explore the full backlog. Implemented web tools are available; Office fidelity, advanced security, offline AI and many media features still require separate engines.</p></div><button className="v2-primary" onClick={()=>go('catalog')}>Explore roadmap <ArrowRight size={16}/></button></div>
        </>:
        page==='all'||page==='favorites'?<><div className="v2-pagehead"><div><span className="v2-kicker">YOUR TOOLBOX</span><h1>{page==='favorites'?'Favorite tools':'All available tools'}</h1><p>{page==='favorites'?'Starred utilities, saved privately in local SQLite.':'Open any of the implemented offline-capable utilities below.'}</p></div></div>
          {page==='all'&&<><div className="v2-searchwrap"><Search size={19}/><input ref={searchRef} value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search working tools..."/><kbd>Ctrl K</kbd></div><div className="v2-tabs">{groups.map(g=><button key={g} className={group===g?'selected':''} onClick={()=>setGroup(g)}>{g}</button>)}</div></>}
          {cardGrid(page==='favorites'?favoriteTools:visibleTools)}{page==='all'&&matched.length>visibleTools.length&&<div className="v2-pagination"><button className="v2-secondary" onClick={()=>setToolPage(x=>x+1)}>Load 48 more tools · {matched.length-visibleTools.length} remaining</button></div>}{page==='all'&&<><AdSlot placement="category"/><AdSlot placement="tools"/></>}</>:
        page==='recent'?<><div className="v2-pagehead"><div><span className="v2-kicker">YOUR DEVICE ONLY</span><h1>Recent activity</h1><p>Only tool names, input file names, output names and timestamps are saved in browser-local SQLite. File contents are never stored here.</p></div><button className="v2-secondary" disabled={history.length===0} onClick={()=>void eraseHistory()}>Clear history</button></div><HistoryTable entries={history} onOpen={openTool}/><p className="v2-hint">For privacy and disk space, downloads are not retained. Past results cannot be re-downloaded from this list; run the tool again with the original file.</p></>:
        page==='templates'?<><div className="v2-pagehead"><div><span className="v2-kicker">EDITABLE DESIGNS</span><h1>Document templates</h1><p>Fill forms, choose styles and colors, save local drafts, and print to PDF. No cloud account is required.</p></div></div>{cardGrid(allTools.filter(t=>t.category==='Templates'))}<AdSlot placement="category"/><div className="v2-roadmap"><div><BookMarked size={22}/><strong>More templates planned</strong><p>Quotation, receipt, purchase order, delivery note, certificate, cover letter, business card, ID badge, timesheet and product label templates are included in this release.</p></div><button className="v2-secondary" onClick={()=>go('catalog')}>See planned templates</button></div></>:
        page==='catalog'?<><div className="v2-pagehead"><div><span className="v2-kicker">PRODUCT ROADMAP · MULTIPLE CATEGORIES</span><h1>5,000-action tool catalog</h1><p>From your 5,000-item master backlog. Planned entries are not working converters until verified.</p></div><span className="v2-count">{filteredCatalog.length} ideas</span></div>
          <AdSlot placement="catalog"/>
          <div className="v2-catalog-filter"><div className="v2-searchwrap"><Search size={19}/><input ref={searchRef} placeholder="Search all 5,000 actions..." value={search} onChange={e=>{setSearch(e.target.value);setCatalogPage(0)}}/></div><label><span>Category</span><select value={catalogGroup} onChange={e=>{setCatalogGroup(e.target.value);setCatalogPage(0)}}><option>All categories</option>{masterCategories.map(c=><option key={c}>{c}</option>)}</select><ChevronDown size={16}/></label></div>
          <div className="v2-legend"><span><CheckCircle2 size={15}/> Available: opens a working tool</span><span><Clock3 size={15}/> Planned: roadmap only</span></div>
          <div className="v2-catalog-list">{visibleCatalog.map(t=>{const id=availableCatalog[t.number];return <div className="v2-catalog-row" key={t.number}><span className="v2-catalog-n">{String(t.number).padStart(3,'0')}</span><div><strong>{t.name}</strong><small>{t.category}</small></div>{id?<button className="v2-available" onClick={()=>openTool(id)}><Check size={14}/> Available <ArrowRight size={14}/></button>:<span className="v2-planned">Planned</span>}</div>})}</div>
          {filteredCatalog.length===0&&<div className="v2-empty">No actions match your search.</div>}
          <div className="v2-pagination"><button className="v2-secondary" disabled={catalogPage===0} onClick={()=>setCatalogPage(p=>Math.max(0,p-1))}>Previous</button><span>Page {catalogPage+1} of {Math.max(1,Math.ceil(filteredCatalog.length/30))}</span><button className="v2-secondary" disabled={(catalogPage+1)*30>=filteredCatalog.length} onClick={()=>setCatalogPage(p=>p+1)}>Next</button></div>
        </>:
        page==='settings'?<><div className="v2-pagehead"><div><span className="v2-kicker">PERSONALIZE</span><h1>Appearance & preferences</h1><p>Make the workspace comfortable. Your selections are stored in your browser's SQLite database. The light theme is the default on new installations.</p></div></div><div className="v2-settingscards"><section className="v2-panel"><h2><Palette size={20}/> Theme mode</h2><div className="v2-themeoptions">{(['dark','light','system'] as const).map(t=><button key={t} className={theme===t?'selected':''} onClick={()=>void updateTheme(t)}>{t==='dark'?<Moon size={22}/>:t==='light'?<Sun size={22}/>:<Settings2 size={22}/>}<strong>{t.charAt(0).toUpperCase()+t.slice(1)}</strong>{theme===t&&<CheckCircle2 size={17}/>}</button>)}</div></section><section className="v2-panel"><h2><WandSparkles size={20}/> Accent color</h2><div className="v2-accentchoices">{accentColors.map(c=><button key={c} aria-label={`Set accent ${c}`} style={{background:c}} className={accent===c?'selected':''} onClick={()=>void updateAccent(c)}>{accent===c&&<Check size={21}/>}</button>)}<label>Custom <input type="color" value={accent} onChange={e=>void updateAccent(e.target.value)}/></label></div></section></div><div className="v2-panel v2-settingnote"><Database size={27}/><div><strong>Private SQLite workspace</strong><p>Favorites, activity metadata, saved CV/invoice drafts, theme and accent color persist locally using SQLite WASM and IndexedDB. If you clear site data, this information is deleted. Use the controls below to verify persistence or export your database.</p></div></div><div className="v2-panel" style={{marginTop:16}}><h2>Local SQLite database health</h2><div className="v2-result-actions"><button className="v2-primary" onClick={()=>void checkStorage()}>Test SQLite persistence</button><button className="v2-secondary" onClick={()=>void downloadDatabase()}>Export SQLite backup</button></div><p role="status" className="v2-hint">{dbTest||'Favorites, history and saved drafts are stored locally.'}</p></div></>:
        page==='privacy'?<><div className="v2-pagehead"><div><span className="v2-kicker">PRIVACY FIRST</span><h1>Your documents stay in your workspace.</h1><p>Processing uses JavaScript, Canvas, PDF engines, and WebAssembly locally. Offline tools require cached assets. Optional advertisements use Google online services and may transmit ad-related data; document contents are not sent to ad providers.</p></div></div><div className="v2-privacygrid"><div className="v2-panel"><ShieldCheck size={27}/><h3>No document upload</h3><p>We do not transmit the files selected for conversion. No cloud conversion service is included.</p></div><div className="v2-panel"><Database size={27}/><h3>Browser-local SQLite</h3><p>Favorites, recent file-name metadata, preferences and template drafts stay in IndexedDB on this device.</p></div><div className="v2-panel"><Zap size={27}/><h3>Offline after install</h3><p>The service worker caches application assets for offline usage, subject to browser storage eviction. Test offline before relying on it.</p></div></div></>:
        page==='about'?<section className="v7-information"><span className="v2-kicker">ABOUT OUR PRODUCT</span><h1>Everyday tools, in one place.</h1><p>ToolNest is an independently built productivity workspace for PDF, office, image, audio, video, text and document-generation tasks. Many tools can process files in your browser without uploading them.</p><h2>Created to make everyday work easier · د خلکو د کار د آسانولو لپاره</h2><p><strong>Developed with ❤ by Eng.Munir Rahman Rahmani.</strong> ToolNest is free to use. دا وړیا وسیلې د خلکو د کارونو د آسانولو لپاره جوړې سوي دي.</p><h2>How we build it</h2><p>We prioritize clear results, transparent implementation statuses and local-first handling. The searchable 5,000-action catalog is a development roadmap; it does not mean 5,000 processing engines are complete.</p><AdSlot placement="article"/></section>:
        page==='faq'?<section className="v7-information"><span className="v2-kicker">HELP CENTER</span><h1>Frequently asked questions</h1>{[
          ['Is ToolNest free?','Yes. There is no ToolNest account or credit balance required for the local tools. Optional ads may appear when online.'],
          ['Do my files leave my device?','Local tools process files in your browser or app storage. Advertising and optional cloud imports involve network requests, but ToolNest does not upload the content of locally selected documents for conversion.'],
          ['Are all 5,000 tools working?','No. The catalog lists ideas, planned tools and implemented routes. Available items open a processing interface; planned items are displayed as roadmap entries.'],
          ['Can I use it offline?','Core local tools work offline after their assets have been installed or cached. Google ads, cloud file imports and uncached models require an internet connection.'],
          ['Can I make a smaller PDF or video with an exact byte size?','Compression depends on content and format. You can specify a target and we can aim below it where an appropriate processor exists, but some source files cannot reach an arbitrary size without major quality loss.'],
          ['Why does Android report a file permission problem?','Select the document using the Android system document picker. The app should process its cached copy; a signed build must still be tested with your specific Android version and file provider.'],
          ['Are advertisements part of the file?','No. Ads live in page layouts, not generated PDF, CV, image, or other downloaded outputs.']
        ].map(([q,a])=><details className="v7-faq-item" key={q}><summary>{q}</summary><p>{a}</p></details>)}<AdSlot placement="article"/></section>:
        page==='personal'?<section className="v7-information"><span className="v2-kicker">YOUR LOCAL WORKSPACE</span><h1>Personal preferences</h1><p>No account needed. Your display name stays inside this browser's local SQLite data and can be cleared at any time.</p><label htmlFor="tn-personal-name" style={{display:'block',fontWeight:700,marginTop:20}}>Your display name</label><input id="tn-personal-name" className="v7-profile-input" maxLength={80} value={displayName} onChange={e=>setDisplayName(e.target.value)} placeholder="Enter your name"/><div className="v2-result-actions"><button className="v2-primary" onClick={()=>void saveProfile()}>Save locally</button><button className="v2-secondary" onClick={()=>{setDisplayName('');void setPreference('displayName','').then(()=>setProfileStatus('Local name cleared.')).catch(e=>setProfileStatus(String(e)))}}>Clear name</button></div><p role="status">{profileStatus}</p><div className="v7-personal-links"><button onClick={()=>go('favorites')}>Favorites</button><button onClick={()=>go('recent')}>Recent activity</button><button onClick={()=>go('faq')}>FAQ</button><button onClick={()=>go('contact')}>Contact</button></div></section>:
        page==='contact'?<section className="v7-information"><span className="v2-kicker">GET IN TOUCH</span><h1>Contact ToolNest</h1><p>Report a problem, request a new tool, or share feedback. Include the tool name, platform (web, Android, iOS, or desktop), and steps to reproduce the issue. Never send private files or passwords in a bug report.</p><p><strong>Developer:</strong> Eng.Munir Rahman Rahmani</p><p lang="ps" dir="rtl">دا وړیا پروګرام د خلکو د کارونو د آسانولو لپاره په مینه جوړ سوی دئ. د پوښتنو او وړاندیزونو لپاره راسره اړیکه ونیسئ.</p><p><a href="mailto:munirrahmanrahmani0@gmail.com?subject=ToolNest%20feedback" className="v2-primary">Email: munirrahmanrahmani0@gmail.com</a></p><AdSlot placement="article"/></section>:null}
        {selected&&<div className="tn-tool-after-ad"><AdSlot placement="tools"/></div>}
      </main><AdSlot placement="footer"/><footer className="v7-footer no-print"><div className="v7-footer-grid"><section><img src="/brand-icon.png" alt="" width="54" height="54"/><h3>ToolNest</h3><p>Free tools to make everyday work easier. Developed with ❤ by Eng.Munir Rahman Rahmani.</p><p lang="ps" dir="rtl">د خلکو د کارونو د آسانولو لپاره وړیا جوړ سوی دئ.</p><p><a href="mailto:munirrahmanrahmani0@gmail.com">munirrahmanrahmani0@gmail.com</a></p></section><section><h3>Explore</h3><button onClick={()=>go('all')}>All tools</button><button onClick={()=>go('templates')}>CV & document templates</button><button onClick={()=>go('catalog')}>5,000-action roadmap</button><button onClick={()=>{go('all');setGroup('Video')}}>Video tools</button><button onClick={()=>{go('all');setGroup('Audio')}}>Audio tools</button></section><section><h3>Personal</h3><button onClick={()=>go('personal')}>Your name & preferences</button><button onClick={()=>go('favorites')}>Favorites</button><button onClick={()=>go('recent')}>Recent tools</button><button onClick={()=>go('settings')}>Theme settings</button></section><section><h3>Company</h3><button onClick={()=>go('about')}>About us</button><button onClick={()=>go('contact')}>Contact us</button><button onClick={()=>go('faq')}>Frequently asked questions</button><button onClick={()=>go('privacy')}>Privacy & security</button></section><section><h3>Important information</h3><p>Ads may use external network services. Files selected for local conversion are not sold to advertisers.</p><p>Google AdSense placements are web-only. Desktop releases use no AdSense code.</p></section></div><div className="v7-footer-bottom">© {new Date().getFullYear()} ToolNest · Developed with ❤ by Eng.Munir Rahman Rahmani · {allTools.length} tool interfaces · 5,000 cataloged actions</div></footer>
    </div>
  </div>;
}
function HistoryTable({entries,onOpen}:{entries:ActivityEntry[];onOpen:(id:string)=>void}){
  return <div className="v2-history">{entries.length===0?<div className="v2-empty"><Clock3 size={26}/><h3>No recent activity</h3><p>Finish your first conversion to see it here. Nothing is uploaded.</p></div>:<div className="v2-table-scroll"><table><thead><tr><th>FILE / INPUT</th><th>TOOL USED</th><th>DATE</th><th>STATUS</th><th>ACTION</th></tr></thead><tbody>{entries.map(t=><tr key={t.id}><td><FileCode2 size={18}/><div><strong>{t.fileName||'Local input'}</strong><small>{t.resultName}</small></div></td><td>{t.toolName}</td><td>{displayDate(t.createdAt)}</td><td><span className="v2-success"><CheckCircle2 size={13}/> {t.status}</span></td><td><button className="v2-link" onClick={()=>onOpen(t.toolId)}>Open tool <ArrowRight size={13}/></button></td></tr>)}</tbody></table></div>}</div>;
}