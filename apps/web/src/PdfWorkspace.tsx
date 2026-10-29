import { useEffect, useMemo, useRef, useState } from 'react';
import type { ChangeEvent, DragEvent } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  ArrowLeft, ArrowRight, Check, CheckCircle2,
  ChevronRight, CircleHelp, CloudOff, Download, File, FileMinus2,
  FileOutput, FileSearch, Files, FileText, FolderOpen, Hash,
  Heart, ImageDown, Images, Info, Layers3, ListOrdered, LockKeyhole,
  Menu, Minimize2, MonitorSmartphone, Plus, RefreshCw, RotateCw,
  Scissors, Search, Shield, ShieldCheck, Sparkles, Stamp,
  UploadCloud, WifiOff, X, Expand, ArrowUp, ArrowDown
} from 'lucide-react';
import { tools } from '@local-tools/core';
import type { ToolDefinition, ToolId, ToolCategory } from '@local-tools/core';
import { downloadResult, formatBytes, packageResults, processTool, validateFiles } from './conversion';
import type { ConversionOptions, OutputFile } from './conversion';

type Filter = 'All tools' | ToolCategory;
const icons: Record<ToolId, LucideIcon> = {
  'merge-pdf': Files, 'split-pdf': Scissors, 'extract-pages': FileOutput,
  'remove-pages': FileMinus2, 'reorder-pages': ListOrdered, 'rotate-pdf': RotateCw,
  'watermark-pdf': Stamp, 'number-pages': Hash, 'images-to-pdf': Images,
  'pdf-to-png': ImageDown, 'pdf-info': FileSearch, 'image-convert': RefreshCw,
  'resize-image': Expand, 'compress-image': Minimize2
};
const initialOptions: ConversionOptions = { pages: '', angle: 90, watermark: 'CONFIDENTIAL', format: 'webp', width: 1200, quality: 82 };

export default function PdfWorkspace({ initialToolId, onBack, onCompleted }: { initialToolId?: ToolId; onBack?: () => void; onCompleted?: (id: ToolId, name: string, fileName: string, resultName: string) => void }) {
  const [filter, setFilter] = useState<Filter>('All tools');
  const [search, setSearch] = useState('');
  const [active, setActive] = useState<ToolDefinition | null>(tools.find(t => t.id === initialToolId) ?? null);
  const [files, setFiles] = useState<File[]>([]);
  const [options, setOptions] = useState<ConversionOptions>(initialOptions);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState({ message: '', percent: 0 });
  const [result, setResult] = useState<OutputFile | null>(null);
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState(false);
  const [offline, setOffline] = useState(!navigator.onLine);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [view, setView] = useState<'tools' | 'privacy'>('tools');
  const inputRef = useRef<HTMLInputElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const online = () => setOffline(false);
    const off = () => setOffline(true);
    const key = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault(); setActive(null); setView('tools'); searchRef.current?.focus();
      }
      if (event.key === 'Escape') { setSidebarOpen(false); }
    };
    window.addEventListener('online', online);
    window.addEventListener('offline', off);
    window.addEventListener('keydown', key);
    return () => { window.removeEventListener('online', online); window.removeEventListener('offline', off); window.removeEventListener('keydown', key); };
  }, []);

  const matches = useMemo(() => tools.filter(t => (filter === 'All tools' || t.category === filter) &&
    `${t.name} ${t.description} ${t.category}`.toLowerCase().includes(search.toLowerCase().trim())), [filter, search]);
  const popular = tools.filter(t => t.featured).slice(0, 6);

  function openTool(tool: ToolDefinition) {
    setActive(tool); setView('tools'); setFiles([]); setOptions(initialOptions);
    setResult(null); setError(''); setProgress({ message: '', percent: 0 });
    setSidebarOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  function home(nextFilter: Filter = 'All tools') {
    if (onBack) { onBack(); return; }
    setActive(null); setFilter(nextFilter); setSearch(''); setView('tools');
    setResult(null); setError(''); setSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  function addFiles(next: File[]) {
    if (busy || !active || !next.length) return;
    const selected = active.multiple ? [...files, ...next] : next.slice(0, 1);
    setFiles(selected); setResult(null); setError(''); setProgress({ message: '', percent: 0 });
    if (inputRef.current) inputRef.current.value = '';
  }
  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault(); setDragging(false);
    addFiles(Array.from(event.dataTransfer.files));
  }
  function onFileChange(event: ChangeEvent<HTMLInputElement>) { addFiles(Array.from(event.target.files || [])); }
  function moveFile(index: number, delta: number) {
    const target = index + delta;
    if (target < 0 || target >= files.length) return;
    setFiles(current => {
      const copy = [...current]; [copy[index], copy[target]] = [copy[target], copy[index]]; return copy;
    });
    setResult(null);
  }
  async function convert() {
    if (!active || busy) return;
    setError(''); setResult(null); setBusy(true); setProgress({ message: 'Validating files locally…', percent: 1 });
    try {
      await validateFiles(files, active.accepts, active.multiple);
      const outputs = await processTool(active.id, files, options, (message, percent) => setProgress({ message, percent }));
      const packaged = await packageResults(outputs, (message, percent) => setProgress({ message, percent }));
      setResult(packaged);
      onCompleted?.(active.id, active.name, files.map(f => f.name).join(', '), packaged.name);
      setProgress({ message: 'Complete — ready to download', percent: 100 });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Conversion failed. The source may be unsupported or damaged.');
      setProgress({ message: '', percent: 0 });
    } finally { setBusy(false); }
  }
  function updateOption<K extends keyof ConversionOptions>(key: K, value: ConversionOptions[K]) {
    setOptions(current => ({ ...current, [key]: value })); setResult(null);
  }

  const showPages = active && ['extract-pages', 'remove-pages', 'reorder-pages'].includes(active.id);
  const showImages = active && ['image-convert', 'resize-image', 'compress-image'].includes(active.id);
  const needQuality = active && ['image-convert', 'compress-image'].includes(active.id);
  const Icon = active ? icons[active.id] : Files;

  return (
    <div className={`app-shell ${onBack ? 'embedded-tools' : ''}`}>
      {sidebarOpen && <button type="button" className="mobile-overlay" onClick={() => setSidebarOpen(false)} aria-label="Close menu" />}
      <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <button type="button" onClick={() => home()} className="brand" aria-label="LocalTools home">
          <span className="brand-logo"><Layers3 size={23} strokeWidth={2.5} /></span>
          <span className="brand-name">local<span>tools</span><span className="brand-dot">.</span></span>
        </button>
        <div className="sidebar-caption">WORKSPACE</div>
        <nav aria-label="Main navigation" className="side-nav">
          <button type="button" className={!active && view === 'tools' && filter === 'All tools' ? 'nav-button active' : 'nav-button'} onClick={() => home()}><Layers3 size={18} /> All tools <ChevronRight size={15} className="nav-end" /></button>
          <button type="button" className={!active && view === 'tools' && filter === 'PDF' ? 'nav-button active' : 'nav-button'} onClick={() => home('PDF')}><FileText size={18} /> PDF tools <span className="nav-count">11</span></button>
          <button type="button" className={!active && view === 'tools' && filter === 'Images' ? 'nav-button active' : 'nav-button'} onClick={() => home('Images')}><Images size={18} /> Image tools <span className="nav-count">3</span></button>
        </nav>
        <div className="sidebar-caption library-caption">QUICK ACCESS</div>
        <nav className="side-nav" aria-label="Popular tools">
          {tools.filter(t => ['merge-pdf', 'images-to-pdf', 'compress-image', 'pdf-to-png'].includes(t.id)).map(t => {
            const SmallIcon = icons[t.id];
            return <button key={t.id} type="button" className={`nav-button small ${active?.id === t.id ? 'active' : ''}`} onClick={() => openTool(t)}><SmallIcon size={17} />{t.name}</button>;
          })}
        </nav>
        <div className="sidebar-spacer" />
        <div className="sidebar-safe">
          <div className="side-safe-icon"><ShieldCheck size={19} /></div>
          <strong>Private by design</strong>
          <p>Your documents stay in your browser. Nothing gets uploaded.</p>
          <button type="button" onClick={() => { setActive(null); setView('privacy'); setSidebarOpen(false); }} className="side-safe-link">Our privacy approach <ArrowRight size={14} /></button>
        </div>
        <div className="sidebar-bottom"><span className="status-dot" /> No file uploads · v0.1</div>
      </aside>

      <div className="main-wrap">
        <header className="topbar">
          <div className="topbar-left">
            <button type="button" className="mobile-menu icon-button" aria-label="Open navigation" onClick={() => setSidebarOpen(true)}><Menu size={22} /></button>
            <span className="breadcrumb">Workspace <ChevronRight size={14} /> <strong>{view === 'privacy' ? 'Privacy' : active?.name || (filter === 'All tools' ? 'All tools' : `${filter} tools`)}</strong></span>
          </div>
          <div className="topbar-actions">
            <span className="connection" title={offline ? 'No network connection. Cached tools can still work.' : 'Connected, but files are processed locally.'}>{offline ? <WifiOff size={14} /> : <LockKeyhole size={14} />}{offline ? 'Offline' : 'Local processing'}</span>
            <button type="button" className="help-link" onClick={() => { setActive(null); setView('privacy'); }}><CircleHelp size={17} /> Privacy & help</button>
          </div>
        </header>

        <main className="page-content">
          {view === 'privacy' ? (
            <section className="privacy-page">
              <button className="back-link" type="button" onClick={() => home()}><ArrowLeft size={17} /> Back to tools</button>
              <div className="eyebrow"><ShieldCheck size={15} /> PRIVACY & OFFLINE</div>
              <h1>Your files belong to you.</h1>
              <p className="lead">LocalTools runs file conversion in your browser using locally loaded JavaScript and WebAssembly where applicable. This version has no file-upload endpoints, accounts, tracking pixels, or analytics.</p>
              <div className="privacy-grid">
                <article className="privacy-card"><LockKeyhole size={26} /><h3>No uploads</h3><p>Files selected in the application are read by your browser and are not posted to a conversion server.</p></article>
                <article className="privacy-card"><CloudOff size={26} /><h3>Available offline</h3><p>Once the site and its assets have been cached successfully, supported tools work without an internet connection. Browsers can evict caches.</p></article>
                <article className="privacy-card"><Shield size={26} /><h3>Session-only files</h3><p>Selected files and generated outputs stay in browser memory for the current tab. We do not store documents in localStorage.</p></article>
              </div>
              <div className="privacy-note"><Info size={20}/><p><strong>Things to know:</strong> The first visit requires an internet connection to load and cache the app. A file you download goes to a folder controlled by your browser. Browser extensions, OS security, network administrators and hosting infrastructure are outside the app's control. No browser app can promise absolute privacy in a compromised environment. Some encrypted or malformed PDFs will not work.</p></div>
            </section>
          ) : active ? (
            <div className="tool-page">
              <button className="back-link" type="button" onClick={() => home(filter)}><ArrowLeft size={17} /> Back to tools</button>
              <div className="tool-hero">
                <div className={`tool-icon large ${active.category === 'PDF' ? 'pdf' : 'image'}`}><Icon size={28} strokeWidth={1.85} /></div>
                <div><div className="eyebrow">{active.category.toUpperCase()} TOOL</div><h1>{active.name}</h1><p>{active.description}</p></div>
                <div className="tool-privacy"><ShieldCheck size={17} /> 100% on your device</div>
              </div>
              <div className="workspace-grid">
                <div className="workspace-main">
                  <section className="panel upload-panel">
                    <div className="panel-title-row"><h2><span className="step-marker">1</span> Select your files</h2><span className="step-note">Max 80 MB / file</span></div>
                    <input ref={inputRef} className="sr-only" type="file" accept={active.accepts === 'pdf' ? '.pdf,application/pdf' : '.jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp'} multiple={active.multiple} onChange={onFileChange} aria-label="Choose files to convert" />
                    <div className={`dropzone ${dragging ? 'dragging' : ''}`} onDragOver={e => { e.preventDefault(); setDragging(true); }} onDragLeave={e => { e.preventDefault(); setDragging(false); }} onDrop={onDrop}>
                      <div className="upload-glyph"><UploadCloud size={27} strokeWidth={1.7} /></div>
                      <h3>Drag and drop your {active.accepts === 'pdf' ? 'PDF' : 'image'} {active.multiple ? 'files' : 'file'} here</h3>
                      <p>or choose {active.multiple ? 'files' : 'a file'} from your device</p>
                      <button type="button" className="primary-button choose-button" disabled={busy} onClick={() => inputRef.current?.click()}><FolderOpen size={17} /> Choose {active.multiple ? 'files' : 'file'}</button>
                      <small>{active.accepts === 'pdf' ? 'PDF documents only' : 'JPG, PNG and WebP'} · Files never leave this tab</small>
                    </div>
                    {files.length > 0 && <div className="file-list">
                      <div className="file-list-heading"><strong>{files.length} {files.length === 1 ? 'file' : 'files'} selected</strong><button type="button" onClick={() => { setFiles([]); setResult(null); }} disabled={busy} className="text-action">Clear all</button></div>
                      {files.map((file, index) => <div className="file-item" key={`${file.name}-${file.lastModified}-${index}`}>
                        <div className="file-icon"><File size={19}/></div><div className="file-details"><strong title={file.name}>{file.name}</strong><span>{formatBytes(file.size)}</span></div>
                        {active.multiple && <div className="reorder-buttons"><button type="button" disabled={index === 0 || busy} aria-label={`Move ${file.name} up`} onClick={() => moveFile(index,-1)}><ArrowUp size={15}/></button><button type="button" disabled={index === files.length - 1 || busy} aria-label={`Move ${file.name} down`} onClick={() => moveFile(index,1)}><ArrowDown size={15}/></button></div>}
                        <button type="button" className="file-remove" disabled={busy} onClick={() => { setFiles(a => a.filter((_,i) => i !== index)); setResult(null); }} aria-label={`Remove ${file.name}`}><X size={17}/></button>
                      </div>)}
                      {active.multiple && <button type="button" className="add-more" disabled={busy} onClick={() => inputRef.current?.click()}><Plus size={17} /> Add more files</button>}
                    </div>}
                  </section>

                  <section className="panel settings-panel">
                    <div className="panel-title-row"><h2><span className="step-marker">2</span> Conversion settings</h2></div>
                    {showPages && <div className="control-group"><label htmlFor="pages">{active.id === 'reorder-pages' ? 'New page order' : 'Page numbers'}</label><input id="pages" value={options.pages} onChange={e => updateOption('pages', e.target.value)} placeholder={active.id === 'reorder-pages' ? 'e.g. 3, 1, 2' : 'e.g. 1-3, 5, 8'} /><small>{active.id === 'reorder-pages' ? 'Include every page exactly once, in your preferred order.' : 'Use commas and hyphens. Page numbers begin at 1.'}</small></div>}
                    {active.id === 'rotate-pdf' && <div className="control-group"><label htmlFor="rotation">Rotate pages by</label><select id="rotation" value={options.angle} onChange={e => updateOption('angle', Number(e.target.value))}><option value={90}>90° clockwise</option><option value={180}>180°</option><option value={270}>270° clockwise</option></select></div>}
                    {active.id === 'watermark-pdf' && <div className="control-group"><label htmlFor="watermark">Watermark text (English/ASCII only)</label><input id="watermark" maxLength={60} value={options.watermark} onChange={e => updateOption('watermark', e.target.value)} placeholder="CONFIDENTIAL" /><small>Diagonal, semi-transparent watermark on all pages.</small></div>}
                    {active.id === 'resize-image' && <div className="control-group"><label htmlFor="width">New image width (pixels)</label><input id="width" type="number" min="16" max="8000" value={options.width} onChange={e => updateOption('width', Number(e.target.value))}/><small>Height is automatically calculated to preserve aspect ratio. Output: PNG.</small></div>}
                    {showImages && active.id !== 'resize-image' && <div className="control-group"><label htmlFor="format">Output format</label><select id="format" value={options.format} onChange={e => updateOption('format', e.target.value as ConversionOptions['format'])}>{active.id !== 'compress-image' && <option value="png">PNG (lossless)</option>}<option value="jpeg">JPG (smaller photos)</option><option value="webp">WebP (modern compression)</option></select></div>}
                    {needQuality && <div className="control-group"><label htmlFor="quality">Encoding quality <strong>{options.quality}%</strong></label><input className="range-input" id="quality" type="range" min="20" max="100" step="1" value={options.quality} onChange={e => updateOption('quality', Number(e.target.value))}/><small>Applies to JPEG and WebP. A smaller output size is not guaranteed.</small></div>}
                    {!showPages && !showImages && !['rotate-pdf','watermark-pdf','resize-image'].includes(active.id) && <div className="default-settings"><CheckCircle2 size={21} /><div><strong>No settings required</strong><p>Everything is ready. Your files will be processed with sensible defaults.</p></div></div>}
                    {active.id === 'merge-pdf' && <p className="settings-tip"><Info size={16}/> Use the arrows above to change the order of the input PDFs.</p>}
                  </section>
                  {error && <div className="error-message" role="alert"><Info size={19}/><span>{error}</span></div>}
                  <button type="button" className="process-button" disabled={!files.length || busy} onClick={convert}>{busy ? <span className="spinner" aria-hidden="true" /> : <Sparkles size={19}/>} {busy ? 'Processing locally…' : `Run ${active.name}`} <ArrowRight size={19}/></button>
                  {busy && <div className="progress-wrap" role="status" aria-live="polite"><div className="progress-text"><span>{progress.message}</span><strong>{progress.percent}%</strong></div><progress value={progress.percent} max="100" /></div>}
                  {result && <div className="result-panel" role="status" aria-live="polite"><div className="result-symbol"><Check size={22}/></div><div className="result-copy"><strong>Conversion complete!</strong><span>{result.name} · {formatBytes(result.blob.size)}</span></div><button type="button" className="download-button" onClick={() => downloadResult(result)}><Download size={17}/> Download</button></div>}
                </div>
                <aside className="workspace-side"><div className="info-card"><div className="info-card-icon"><LockKeyhole size={20}/></div><h3>Private. Always.</h3><p>Your files are processed directly on your device. We never receive their contents.</p><div className="info-divider"/><div className="info-list"><span><Check size={16}/> No file uploads</span><span><Check size={16}/> No account required</span><span><Check size={16}/> Works offline after caching</span></div></div><div className="tip-card"><div><Sparkles size={19}/> Quick tip</div><p>{active.multiple ? 'You can upload multiple files and rearrange their processing order before converting.' : 'For best results, use a valid, unencrypted file. Extremely large documents may exceed browser memory.'}</p></div></aside>
              </div>
            </div>
          ) : (
            <div className="home-page">
              <div className="hero"><div className="hero-content"><span className="hero-kicker"><span className="pulse-dot"/> THE PRIVATE FILE TOOLKIT</span><h1>Powerful file tools.<br/><span>Zero uploads.</span></h1><p>PDFs, images, and more — beautifully simple tools that run directly in your browser. Your files stay yours.</p><button type="button" className="hero-button" onClick={() => document.getElementById('all-tools')?.scrollIntoView({ behavior: 'smooth' })}>Explore all tools <ArrowRight size={18}/></button><div className="hero-trust"><span><ShieldCheck size={15}/> Privacy-first</span><span><CloudOff size={15}/> Offline-ready</span><span><MonitorSmartphone size={15}/> On any device</span></div></div><div className="hero-art" aria-hidden="true"><div className="orb orb-one"/><div className="orb orb-two"/><div className="art-card art-card-back"><Images size={27}/><span>image.png</span></div><div className="art-card art-card-main"><div className="art-filetop"><FileText size={32}/><span>PDF</span></div><div className="art-lines"><i/><i/><i/><i/></div></div><div className="art-lock"><LockKeyhole size={26}/></div><div className="art-check"><Check size={20}/></div></div></div>
              <div className="benefits"><div className="benefit"><span className="benefit-icon blue"><ShieldCheck size={21}/></span><div><strong>100% private</strong><span>Files stay on your device</span></div></div><div className="benefit"><span className="benefit-icon mint"><CloudOff size={21}/></span><div><strong>Works offline</strong><span>After your first load</span></div></div><div className="benefit"><span className="benefit-icon purple"><Sparkles size={21}/></span><div><strong>Simple & fast</strong><span>No account needed</span></div></div></div>
              {!search && filter === 'All tools' && <section className="featured"><div className="section-heading"><div><span className="eyebrow">GET STARTED</span><h2>Popular tools <span className="heading-star">✦</span></h2><p>The essentials, ready whenever you need them.</p></div><button type="button" className="section-link" onClick={() => document.getElementById('all-tools')?.scrollIntoView({ behavior: 'smooth' })}>Browse all <ArrowRight size={17}/></button></div><div className="tool-grid">{popular.map(tool => <ToolCard key={tool.id} tool={tool} onClick={() => openTool(tool)} />)}</div></section>}
              <section id="all-tools" className="all-section"><div className="section-heading"><div><span className="eyebrow">YOUR TOOLBOX</span><h2>{filter === 'All tools' ? 'All tools' : `${filter} tools`}</h2><p>Everything you need, without sending files anywhere.</p></div><span className="tool-count">{matches.length} tools</span></div><div className="tool-filters"><div className="filter-tabs" role="group" aria-label="Filter tools">{(['All tools','PDF','Images'] as Filter[]).map(f => <button type="button" key={f} className={filter === f ? 'filter-tab selected' : 'filter-tab'} onClick={() => setFilter(f)}>{f === 'All tools' ? 'All tools' : f === 'PDF' ? 'PDF tools' : 'Image tools'}</button>)}</div><label className="search-box"><Search size={18}/><input ref={searchRef} value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tools..." aria-label="Search tools" /><kbd>Ctrl K</kbd></label></div><div className="tool-grid">{matches.map(tool => <ToolCard key={tool.id} tool={tool} onClick={() => openTool(tool)} />)}</div>{matches.length === 0 && <div className="no-results"><Search size={28}/><h3>No tools found</h3><p>Try another search term.</p><button type="button" onClick={() => { setSearch(''); setFilter('All tools'); }}>Show all tools</button></div>}</section>
              <div className="bottom-banner"><div className="bottom-icon"><Heart size={23}/></div><div><strong>Built for privacy, not data collection.</strong><p>No uploads, no accounts, no tracking. Just useful tools.</p></div><button type="button" onClick={() => setView('privacy')}>How it works <ArrowRight size={17}/></button></div>
            </div>
          )}
        </main>
        <footer className="footer"><span>© {new Date().getFullYear()} LocalTools · Private file utilities</span><div><span>Made for the offline-first web</span><span className="footer-separator">·</span><button type="button" onClick={() => { setActive(null); setView('privacy'); }}>Privacy</button></div></footer>
      </div>
    </div>
  );
}

function ToolCard({ tool, onClick }: { tool: ToolDefinition; onClick: () => void }) {
  const Icon = icons[tool.id];
  return <button type="button" className="tool-card" onClick={onClick}>
    <span className={`tool-icon ${tool.category === 'PDF' ? 'pdf' : 'image'}`}><Icon size={23} strokeWidth={1.85}/></span>
    <strong>{tool.name}</strong><span className="card-description">{tool.short}</span>
    <span className="card-arrow"><ArrowRight size={17}/></span>
  </button>;
}