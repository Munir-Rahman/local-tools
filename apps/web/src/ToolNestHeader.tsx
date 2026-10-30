import { useEffect, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent } from 'react';
import { ArrowRight, BookOpen, CalendarDays, ChevronDown, CircleHelp, Clock3, FileText, FileImage, Film, Headphones, Grid2X2, Heart, Info, Mail, Menu, Moon, Palette, Search, Settings2, ShieldCheck, Sparkles, Sun, UserRound } from 'lucide-react';
import './toolnest-refresh.css';

type ToolLink = { id:string; name:string; category:string; description:string };
type MenuId='documents'|'images'|'media'|'more'|'account';
const menus:{id:MenuId;label:string;headline:string;description:string;categories:string[];keywords:string[]}[]=[
  {id:'documents',label:'Document tools',headline:'Work with documents',description:'PDF, Office and file conversion tools you can use privately.',categories:['PDF','Office','File','Spreadsheets'],keywords:['merge','split','compress','convert','pdf','excel','word','extract']},
  {id:'images',label:'Image tools',headline:'Create and edit images',description:'Resize, convert, compress and create visual assets.',categories:['Images','Design','QR & Barcode'],keywords:['image','resize','compress','qr','barcode','crop','sticker']},
  {id:'media',label:'Audio & video',headline:'Media conversion tools',description:'Use local engines for compatible media files.',categories:['Audio','Video'],keywords:['audio','video','mp3','mp4','extract','convert']},
  {id:'more',label:'Other tools',headline:'Explore more tools',description:'Developer utilities, calculators, templates and science tools.',categories:['Developer','Text','Calculators','Computer','Physics','Chemistry','Electrical','Engineering','Converters','Templates'],keywords:['json','word','calculator','convert','unit','cv','invoice','qr','base64']},
];
const menuIcons=[FileText,FileImage,Grid2X2,BookOpen,Film,Headphones,Sparkles,ShieldCheck];
const accountIcons={personal:UserRound,favorites:Heart,recent:Clock3,settings:Palette,about:Info,contact:Mail,faq:CircleHelp} as const;
export default function ToolNestHeader({tools,onOpenTool,onCategory,onPage,onToggleTheme,isDark,onOpenMobile,favoriteCount}:{
  tools:ToolLink[];onOpenTool:(id:string)=>void;onCategory:(category:string)=>void;onPage:(page:'dashboard'|'all'|'favorites'|'recent'|'templates'|'catalog'|'about'|'faq'|'contact'|'personal'|'settings')=>void;
  onToggleTheme:()=>void;isDark:boolean;onOpenMobile:()=>void;favoriteCount:number;
}){
  const [menu,setMenu]=useState<MenuId|null>(null);
  const [query,setQuery]=useState('');
  const [searchOpen,setSearchOpen]=useState(false);
  const root=useRef<HTMLElement>(null);
  const searchInput=useRef<HTMLInputElement>(null);
  useEffect(()=>{const onDoc=(event:PointerEvent)=>{if(root.current&&!root.current.contains(event.target as Node)){setMenu(null);setSearchOpen(false)}};
    const onKey=(event:KeyboardEvent)=>{if(event.key==='Escape'){setMenu(null);setSearchOpen(false)}if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='k'){event.preventDefault();searchInput.current?.focus();setSearchOpen(true)}};
    document.addEventListener('pointerdown',onDoc);document.addEventListener('keydown',onKey);
    return ()=>{document.removeEventListener('pointerdown',onDoc);document.removeEventListener('keydown',onKey)};
  },[]);
  const searched=useMemo(()=>query.trim()?tools.filter(t=>`${t.name} ${t.category} ${t.description}`.toLowerCase().includes(query.trim().toLowerCase())).slice(0,7):[],[query,tools]);
  const selected=menus.find(m=>m.id===menu);
  function navigate(fn:()=>void){fn();setMenu(null);setSearchOpen(false);setQuery('');}
  function onMenuKey(e:ReactKeyboardEvent<HTMLElement>){if(e.key==='Escape'){setMenu(null);(e.currentTarget.querySelector('[aria-expanded="true"]') as HTMLElement|null)?.focus()}}
  return <header className="tn-sitehead no-print" ref={root} onKeyDown={onMenuKey} onMouseLeave={()=>setMenu(null)}>
    <div className="tn-sitehead-inner">
      <button className="tn-header-mobile" aria-label="Open navigation" onClick={onOpenMobile}><Menu size={23}/></button>
      <button className="tn-header-brand" onClick={()=>navigate(()=>onPage('dashboard'))} aria-label="ToolNest home"><img src="/brand-icon.png" alt="" width="48" height="48"/><span><strong>ToolNest</strong><small>Free private tools</small></span></button>
      <nav className="tn-header-navigation" aria-label="Main navigation">
        <button onClick={()=>navigate(()=>onPage('all'))}>All tools</button>
        <button onClick={()=>navigate(()=>onPage('templates'))}>Templates</button>
        <button className="tn-roadmap-link" onClick={()=>navigate(()=>onPage('catalog'))}>5,000-action catalog</button>
        {menus.map(item=><div className="tn-nav-entry" key={item.id} onMouseEnter={()=>{setMenu(item.id);setSearchOpen(false)}} onMouseLeave={()=>{}}><button className={menu===item.id?'open':''} aria-haspopup="true" aria-expanded={menu===item.id} aria-controls="tn-mega-panel" onFocus={()=>setMenu(item.id)} onClick={()=>setMenu(x=>x===item.id?null:item.id)}>{item.label}<ChevronDown size={15}/></button></div>)}
      </nav>
      <div className="tn-header-tools">
        <div className="tn-header-search"><Search size={19}/><input ref={searchInput} aria-label="Search available tools" placeholder="Search tools..." value={query} onFocus={()=>{setSearchOpen(true);setMenu(null)}} onChange={e=>setQuery(e.target.value)}/><kbd>Ctrl K</kbd>
          {searchOpen&&<div className="tn-search-popover" role="region" aria-label="Search results"><strong>{query.trim()?`${searched.length} suggested tools`:'Quick access'}</strong>{query.trim()?searched.length>0?searched.map(t=><button key={t.id} onClick={()=>navigate(()=>onOpenTool(t.id))}><FileText size={19}/><span>{t.name}<small>{t.category}</small></span><ArrowRight size={15}/></button>):<p>No matching implemented tools. Try another term.</p>:<><button onClick={()=>navigate(()=>onPage('all'))}><Grid2X2 size={19}/>Browse working tools<ArrowRight size={15}/></button><button onClick={()=>navigate(()=>onPage('catalog'))}><BookOpen size={19}/>5,000-action roadmap<ArrowRight size={15}/></button></>}</div>}
        </div>
        <button className="tn-header-icon" aria-label="Favorites" title="Favorites" onClick={()=>navigate(()=>onPage('favorites'))}><Heart size={20}/>{favoriteCount>0&&<span>{favoriteCount}</span>}</button>
        <button className="tn-header-icon" aria-label={isDark?'Use light theme':'Use dark theme'} title="Toggle theme" onClick={onToggleTheme}>{isDark?<Sun size={20}/>:<Moon size={20}/>}</button>
        <button className="tn-header-icon tn-settings-action" aria-label="Settings" title="Settings" onClick={()=>navigate(()=>onPage('settings'))}><Settings2 size={19}/></button>
        <button className="tn-profile-trigger" aria-haspopup="true" aria-expanded={menu==='account'} onClick={()=>setMenu(x=>x==='account'?null:'account')} onMouseEnter={()=>setMenu('account')}><UserRound size={19}/><ChevronDown size={14}/></button>
      </div>
    </div>
    {(selected||menu==='account')&&<div id="tn-mega-panel" className={`tn-mega ${menu==='account'?'tn-mega-account':''}`} onMouseLeave={()=>setMenu(null)}>
      {menu==='account'?<div className="tn-account-grid"><strong>My workspace</strong>{(['personal','favorites','recent','settings','about','contact','faq'] as const).map(p=>{const Icon=accountIcons[p];return <button key={p} onClick={()=>navigate(()=>onPage(p))}><Icon size={18} aria-hidden="true"/>{({personal:'Personal profile',favorites:'Favorites',recent:'Recent tools',settings:'Appearance',about:'About ToolNest',contact:'Contact & support',faq:'Help & FAQ'} as Record<string,string>)[p]}</button>})}</div>:<>
        <aside className="tn-mega-feature"><span className="tn-mega-eyebrow">TOOLNEST WORKSPACE</span><h2>{selected?.headline}</h2><p>{selected?.description}</p><div className="tn-mega-featurelinks">{selected?.categories.slice(0,4).map((g,i)=>{const Icon=menuIcons[i];return <button key={g} onClick={()=>navigate(()=>onCategory(g))}><span><Icon size={20}/></span>{g} tools<ArrowRight size={14}/></button>})}</div><button className="tn-mega-view" onClick={()=>navigate(()=>onPage('all'))}>Browse all tools <ArrowRight size={17}/></button></aside>
        <div className="tn-mega-directory"><div className="tn-mega-directoryhead"><strong>Popular tools</strong><button onClick={()=>navigate(()=>onPage('all'))}>View all available <ArrowRight size={15}/></button></div><div className="tn-mega-links">{tools.filter(t=>selected?.categories.includes(t.category)).sort((a,b)=>Number(selected?.keywords.some(k=>b.name.toLowerCase().includes(k)))-Number(selected?.keywords.some(k=>a.name.toLowerCase().includes(k)))).slice(0,24).map((tool,i)=>{const Icon=menuIcons[i%menuIcons.length];return <button key={tool.id} onClick={()=>navigate(()=>onOpenTool(tool.id))}><span className={`tn-menu-icon tn-menu-icon-${i%6}`}><Icon size={21}/></span><span>{tool.name}</span></button>})}</div></div>
        <div className="tn-mega-bottom"><ShieldCheck size={16}/> Local processing for supported tools <span>·</span> No sign-in required <span>·</span> No credits or paywall</div>
      </>}
    </div>}
    <div className="tn-mobile-links"><button onClick={()=>navigate(()=>onPage('all'))}><Grid2X2 size={16}/> All tools</button><button onClick={()=>navigate(()=>onCategory('PDF'))}><FileText size={16}/> PDF</button><button onClick={()=>navigate(()=>onCategory('Images'))}><FileImage size={16}/> Images</button><button onClick={()=>navigate(()=>onCategory('Audio'))}><Headphones size={16}/> Audio</button><button onClick={()=>navigate(()=>onPage('templates'))}><BookOpen size={16}/> Templates</button></div>
  </header>;
}