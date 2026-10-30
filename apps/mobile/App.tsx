import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator, Alert, Appearance, BackHandler, Image, KeyboardAvoidingView, Platform, Pressable, Linking,
  ScrollView, StatusBar, StyleSheet, Text, TextInput, View, useWindowDimensions,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as Clipboard from 'expo-clipboard';
import * as Crypto from 'expo-crypto';
import QRCode from 'qrcode';
import { SvgXml } from 'react-native-svg';
import { tools, categories, byId } from './src/tools';
import type { MobileTool, ToolId } from './src/tools';
import { loadState, setFavorite, recordUse, clearActivity, savePreference, testPersistence, loadDraft, saveDraft } from './src/storage';
import type { RecentItem } from './src/storage';
import { processTool, shareResult, generateQr, importPickedFile, saveResultToFolder } from './src/engine';
import { pickerMimeType, normalizeDocumentName } from './src/pickerUtils';
import type { PickedFile, EngineOutput, EngineOptions } from './src/engine';
import { defaultInvoice, defaultResume, exportTemplatePdf, exportStickerPdf, resumeLayouts } from './src/templates';
import type { ResumeData, InvoiceData } from './src/templates';
import catalog from './src/masterCatalog';
import {convertUnit, getConversion} from './src/unitConversions';

type Tab = 'home'|'explore'|'saved'|'activity';
type ThemeSetting = 'light'|'dark'|'system';
const accentChoices=['#ef892c','#3b82f6','#10b981','#8b5cf6','#e11d48'];
const mobileEmojiGroups:Record<string,string[]>={
  Smileys:'😀 😃 😄 😁 😆 😅 😂 🤣 🥲 😊 😇 🙂 🙃 😉 😍 🥰 😘 😋 😎 🤩 🥳 😏 😴 🥺 😭 😤 😡 🤯 🤗 🤔 🫡 🤝 👍 👎 👏 🙌 🫶 💪 👀 👋 🙏 ✌️'.split(' '),
  Hearts:'❤️ 🧡 💛 💚 💙 💜 🖤 🤍 🤎 💗 💖 💘 💝 💞 💕 💓 💟 ❣️ 💔 ❤️‍🔥 ♥️'.split(' '),
  Nature:'🌸 🌹 🌻 🌷 🌼 🪷 🍀 🌿 🍃 🍁 🍂 🌳 🌴 🌵 🌺 🌱 🌲 🌈 ☀️ 🌙 ⭐ 🌟 ✨ ⚡ 🔥 💧 ❄️ ☁️ 🌊 🪐 🌍'.split(' '),
  Animals:'🐶 🐱 🐭 🐹 🐰 🦊 🐻 🐼 🐨 🐯 🦁 🐮 🐷 🐸 🐵 🐔 🐧 🐦 🦄 🦋 🐝 🐢 🐬 🐳 🐙 🦀 🦉 🐺 🦩 🦚'.split(' '),
  Fun:'🎯 🚀 🏆 🥇 🎉 🎊 🎁 🎈 🎮 🎲 🎨 🎭 🎸 🎵 🎤 🎧 🎬 📸 📚 💡 💻 📱 🖥️ 🛠️ ⚙️ ✏️ 📌 🔖 💎 💫 🎀'.split(' '),
  Symbols:'✅ ☑️ ✔️ ❌ ❎ ⚠️ ❗ ❓ 💯 ♻️ 🔴 🟠 🟡 🟢 🔵 🟣 ⚫ ⚪ 🔔 🔒 🔑 🆕 🆒 🆓 🔝 ➡️ ⬅️ ⬆️ ⬇️ ➕ ➖ ♾️ 〰️'.split(' ')
};
const emojiMixes=['✨🌙✨','🦋🌸🦋','🌈💫🌈','༺♥༻','✧･ﾟ: *✧･ﾟ:*','♡︎ ⋆｡˚ ☁︎ ˚｡⋆','★彡 ✨ 彡★','ʕ•ᴥ•ʔ','(づ｡◕‿‿◕｡)づ','(◕‿◕✿)','¯\\_(ツ)_/¯','𓆩♡𓆪','⋆｡°✩','୨୧','꒰ঌ ✦ ໒꒱'];
const defaultOptions:EngineOptions={pages:'1-2',angle:90,watermark:'CONFIDENTIAL',width:1200,quality:78,format:'jpg',inputText:''};
const light={background:'#fffaf5',surface:'#ffffff',text:'#242228',muted:'#766b68',border:'#e9ded4',subtle:'#fbf5ee',hero:'#29232f',heroMuted:'#e4dae0',shadow:'#b9a99b',warning:'#fff0df',warningText:'#97551b'};
const dark={background:'#0f1722',surface:'#171f2c',text:'#f2f5fb',muted:'#97a5b7',border:'#2a3545',subtle:'#1b2635',hero:'#262037',heroMuted:'#d4c7d6',shadow:'#080810',warning:'#3a2b1b',warningText:'#f6c68d'};
type Palette=typeof light;
const tabs:{id:Tab;label:string;icon:string;active:string}[]=[
  {id:'home',label:'Home',icon:'home-outline',active:'home'},
  {id:'explore',label:'Explore',icon:'grid-outline',active:'grid'},
  {id:'saved',label:'Saved',icon:'bookmark-outline',active:'bookmark'},
  {id:'activity',label:'Activity',icon:'time-outline',active:'time'},
];
function Glyph({name,color,size=20}:{name:string;color:string;size?:number}){return <Ionicons name={name as keyof typeof Ionicons.glyphMap} size={size} color={color}/>;}
function FilledButton({label,icon,accent,disabled=false,onPress}:{label:string;icon?:string;accent:string;disabled?:boolean;onPress:()=>void}){
  return <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress} style={({pressed})=>[s.primary,{backgroundColor:accent,opacity:disabled ? 0.48 : pressed ? 0.82 : 1}]}>
    {icon&&<Glyph name={icon} color="white" size={19}/>}<Text style={s.primaryText}>{label}</Text>
  </Pressable>;
}
function SecondaryButton({label,icon,p,accent,onPress}:{label:string;icon:string;p:Palette;accent:string;onPress:()=>void}){
  return <Pressable accessibilityRole="button" onPress={onPress} style={[s.secondaryButton,{borderColor:p.border,backgroundColor:p.surface}]}><Glyph name={icon} color={accent} size={18}/><Text style={{fontSize:13,fontWeight:'700',color:p.text}}>{label}</Text></Pressable>;
}
function Heading({eyebrow,title,subtitle,p}:{eyebrow?:string;title:string;subtitle?:string;p:Palette}){
  return <View style={{marginBottom:18}}>{eyebrow&&<Text style={s.eyebrow}>{eyebrow}</Text>}<Text style={[s.heading,{color:p.text}]}>{title}</Text>{subtitle&&<Text style={[s.subtitle,{color:p.muted}]}>{subtitle}</Text>}</View>;
}
function ToolTile({tool,p,accent,isSaved,onOpen,onSave,compact=false}:{tool:MobileTool;p:Palette;accent:string;isSaved:boolean;onOpen:()=>void;onSave:()=>void;compact?:boolean}){
  return <Pressable accessibilityRole="button" accessibilityLabel={`Open ${tool.name}`} onPress={onOpen} style={({pressed})=>[s.toolTile,{backgroundColor:p.surface,borderColor:p.border,opacity:pressed?.75:1},compact&&{width:156,minHeight:172}]}>
    <View style={s.tileTop}><View style={[s.tileIcon,{backgroundColor:tool.color+'18'}]}><Glyph name={tool.icon} color={tool.color} size={27}/></View>
      <Pressable accessibilityRole="button" accessibilityLabel={`${isSaved?'Remove':'Add'} ${tool.name} ${isSaved?'from':'to'} favorites`} onPress={onSave} hitSlop={10} style={s.starButton}>
        <Glyph name={isSaved?'star':'star-outline'} color={isSaved?'#F2AA36':p.muted} size={20}/>
      </Pressable></View>
    <Text numberOfLines={1} style={[s.tileName,{color:p.text}]}>{tool.name}</Text>
    <Text numberOfLines={2} style={[s.tileDescription,{color:p.muted}]}>{tool.subtitle}</Text>
    <View style={s.tileFooter}><Text style={{color:tool.color,fontWeight:'700',fontSize:10}}>{tool.kind==='pdf'?'PDF':tool.kind==='image'?'IMAGE':tool.kind==='text'?'UTILITY':tool.kind==='qr'?'QR':tool.kind==='unit'?'CONVERTER':'DOCUMENT'}</Text><Glyph name="arrow-forward" color={accent} size={17}/></View>
  </Pressable>;
}
function InputField({label,value,onChange,p,placeholder='',multiline=false,keyboardType}:{label:string;value:string;onChange:(next:string)=>void;p:Palette;placeholder?:string;multiline?:boolean;keyboardType?:'numeric'|'email-address'|'default'}){
  return <View style={{marginBottom:13}}><Text style={[s.fieldLabel,{color:p.text}]}>{label}</Text><TextInput
    value={value} onChangeText={onChange} placeholder={placeholder} placeholderTextColor={p.muted}
    multiline={multiline} textAlignVertical={multiline?'top':'center'} keyboardType={keyboardType||'default'}
    style={[s.field,{backgroundColor:p.surface,borderColor:p.border,color:p.text},multiline&&{minHeight:95,paddingTop:12}]}
  /></View>;
}

// Expo Go cannot host the Google Mobile Ads native SDK. Reserve clearly labelled,
// non-interactive layouts; activate AdMob only in a separately built native client.
function MobileAdPlacement({placement,p}:{placement:'home'|'explore'|'tool';p:Palette}){
 return <View accessibilityLabel={`Advertisement placement: ${placement}`} style={[s.adSlot,{backgroundColor:p.surface,borderColor:p.border,marginTop:placement==='home'?0:17,marginBottom:16}]}>
   <Glyph name="megaphone-outline" color={p.muted} size={17}/>
   <View style={{flex:1}}><Text style={{fontSize:11,color:p.muted,fontWeight:'700'}}>Advertisement</Text><Text style={{fontSize:10,color:p.muted}}>Reserved for AdMob · no live ads in Expo Go</Text></View>
 </View>;
}

function Main(){
  const {width}=useWindowDimensions();const isWide=width>=440;
  const [tab,setTab]=useState<Tab>('home');const [tool,setTool]=useState<MobileTool|null>(null);
  const [settingsOpen,setSettingsOpen]=useState(false);const [catalogOpen,setCatalogOpen]=useState(false);
  const [theme,setTheme]=useState<ThemeSetting>('light');const [accent,setAccent]=useState('#EF892C');const [profileName,setProfileName]=useState('');
  const [systemMode,setSystemMode]=useState(Appearance.getColorScheme()==='dark');
  const darkMode=theme==='dark'||(theme==='system'&&systemMode);const p=darkMode?dark:light;
  const [favorites,setFavorites]=useState<string[]>([]);const [recent,setRecent]=useState<RecentItem[]>([]);
  const [query,setQuery]=useState('');const [filter,setFilter]=useState('all');const [catalogPage,setCatalogPage]=useState(0);
  const [visibleCount,setVisibleCount]=useState(60);
  const [selectedFiles,setSelectedFiles]=useState<PickedFile[]>([]);const [options,setOptions]=useState<EngineOptions>(defaultOptions);
  const [result,setResult]=useState<EngineOutput|null>(null);const [error,setError]=useState('');const [busy,setBusy]=useState(false);
  const [resume,setResume]=useState<ResumeData>(defaultResume);const [invoice,setInvoice]=useState<InvoiceData>(defaultInvoice);
  const [stickerEmoji,setStickerEmoji]=useState('✨');const [stickerMode,setStickerMode]=useState('All');const [stickerCustom,setStickerCustom]=useState('');const [infoSection,setInfoSection]=useState<'faq'|'about'|'contact'|null>(null);
  const [toolOrigin,setToolOrigin]=useState<{tab:Tab;catalog:boolean}>({tab:'home',catalog:false});
  const [qrSvg,setQrSvg]=useState('');const [dbState,setDbState]=useState('');
  const [ready,setReady]=useState(false);
  const hydrate=useCallback(async()=>{
    try{const data=await loadState();setFavorites(data.favorites);setRecent(data.recent);setTheme(data.theme);setAccent(data.accent);setProfileName(data.userName);}catch(e){setDbState(`SQLite unavailable: ${String(e)}`);}finally{setReady(true);}
  },[]);
  useEffect(()=>{void hydrate();const listener=Appearance.addChangeListener(({colorScheme})=>setSystemMode(colorScheme==='dark'));return()=>listener.remove();},[hydrate]);
  useEffect(()=>{if(!tool||tool.id!=='qr-generator'){setQrSvg('');return;}let active=true;const t=setTimeout(()=>QRCode.toString(options.inputText||'https://example.com',{type:'svg',margin:1,width:240,color:{dark:accent,light:'#FFFFFF'}}).then(svg=>{if(active)setQrSvg(svg)}).catch(()=>setQrSvg('')),240);return()=>{active=false;clearTimeout(t);};},[tool,options.inputText,accent]);
  const go=(next:Tab)=>{setTab(next);setTool(null);setCatalogOpen(false);setSettingsOpen(false);setQuery('');setError('');setResult(null);};
  const openTool=async(next:MobileTool)=>{setToolOrigin({tab,catalog:catalogOpen});setTool(next);setCatalogOpen(false);setSettingsOpen(false);setSelectedFiles([]);setOptions({...defaultOptions,inputText:next.kind==='unit'?'1':''});setResult(null);setError('');
    if(next.id==='cv-builder'||next.id==='invoice-builder'){
      const saved=await loadDraft(next.id).catch(()=>null);
      if(saved && typeof saved==='object'){if(next.id==='cv-builder')setResume({...defaultResume,...saved as ResumeData});else setInvoice({...defaultInvoice,...saved as unknown as InvoiceData,items:Array.isArray((saved as unknown as InvoiceData).items)?(saved as unknown as InvoiceData).items:defaultInvoice.items});}
    }
  };
  const goBack=useCallback(()=>{
    if(tool){setTool(null);setTab(toolOrigin.tab);setCatalogOpen(toolOrigin.catalog);setError('');setResult(null);return true;}
    if(settingsOpen){setSettingsOpen(false);return true;}
    if(catalogOpen){setCatalogOpen(false);return true;}
    if(tab!=='home'){setTab('home');return true;}
    return false;
  },[tool,toolOrigin,settingsOpen,catalogOpen,tab]);
  useEffect(()=>{const subscription=BackHandler.addEventListener('hardwareBackPress',goBack);return()=>subscription.remove();},[goBack]);
  const favorite=async(id:string)=>{
    const on=!favorites.includes(id);
    setFavorites(prev=>on?[...prev,id]:prev.filter(x=>x!==id));
    try{await setFavorite(id,on);}catch(e){setFavorites(prev=>on?prev.filter(x=>x!==id):[...prev,id]);Alert.alert('Could not save favorite',String(e));}
  };
  const done=async(id:string,name:string,description:string)=>{try{await recordUse(id,name,description);const state=await loadState();setRecent(state.recent);}catch(e){Alert.alert('History could not be saved',String(e));}};
  const choose=async(allFiles=false)=>{
    if(!tool)return;
    const multiple=['merge-pdf','images-to-pdf','zip-files','compare-files'].includes(tool.id);
    // Both choices use the Android document picker with an app-owned cache copy.
    // Passing content:// to File.copy() caused READ permission failures on some phones.
    const type=pickerMimeType(tool.id,tool.kind,allFiles);
    try{
      const picked=await DocumentPicker.getDocumentAsync({type,multiple,copyToCacheDirectory:true});
      if(picked.canceled)return;
      const files:PickedFile[]=[];
      for(const asset of picked.assets){
        const name=normalizeDocumentName(asset.name,asset.mimeType);
        const uri=await importPickedFile(asset.uri,name);
        files.push({uri,name,size:asset.size,mimeType:asset.mimeType||undefined});
      }
      setSelectedFiles(files);setResult(null);setError('');
    }catch(e){
      const detail=e instanceof Error?e.message:String(e);
      setError(detail);
      Alert.alert('Could not open the selected file',detail+'\n\nTry Android Files or move the file to Downloads and choose it there.');
    }
  };
  const run=async()=>{
    if(!tool||busy)return;setBusy(true);setError('');setResult(null);
    try{
      let output:EngineOutput;
      if(tool.kind==='unit'){
        const source=options.inputText.trim();
        if(!source)throw Error('Enter a numeric value.');
        const converted=convertUnit(tool.id,Number(source));
        const definition=getConversion(tool.id);
        if(!definition)throw Error('Conversion does not exist.');
        output={kind:'text',text:`${source} ${definition.from.label} = ${Number(converted.toPrecision(12))} ${definition.to.label}`};
      }
      else if(tool.id==='uuid-generator')output={kind:'text',text:Crypto.randomUUID()};
      else if(tool.id==='qr-generator'){
        const data=await generateQr(options.inputText,accent);if(data.kind!=='file')throw Error('QR export failed.');output={kind:'file',name:data.name,uri:data.uri,mime:data.mime};
      }
      else if(tool.id==='sticker-maker')output=await exportStickerPdf(options.inputText,stickerEmoji,accent);
      else if(tool.id==='cv-builder')output=await exportTemplatePdf('resume',{...resume,accent});
      else if(tool.id==='invoice-builder')output=await exportTemplatePdf('invoice',{...invoice,accent});
      else output=await processTool(tool.id,selectedFiles,options);
      setResult(output);await done(tool.id,tool.name,output.kind==='file'?output.name:'Text result');
    }catch(e){setError(e instanceof Error?e.message:String(e));}finally{setBusy(false);}
  };
  useEffect(()=>setVisibleCount(60),[filter,query]);
  const toolSearch=useMemo(()=>tools.filter(t=>(filter==='all'||t.kind===filter)&&`${t.name} ${t.subtitle}`.toLowerCase().includes(query.toLowerCase())),[filter,query]);
  const visibleToolSearch=useMemo(()=>toolSearch.slice(0,visibleCount),[toolSearch,visibleCount]);
  const catalogueResults=useMemo(()=>catalog.filter(x=>`${x.name} ${x.category}`.toLowerCase().includes(query.toLowerCase())),[query]);
  const catalogMap=useMemo(()=>new Map(tools.filter(t=>t.catalog).map(t=>[t.catalog!,t])),[]);
  const headerTitle=tool?tool.name:settingsOpen?'Settings':catalogOpen?'5,000-action roadmap':tab==='home'?'Workspace':tab==='explore'?'All tools':tab==='saved'?'Favorites':'Recent activity';
  const saveDraftNow=async()=>{if(!tool)return;try{await saveDraft(tool.id,tool.id==='cv-builder'?resume:invoice);Alert.alert('Saved locally','Your template draft is saved in SQLite on this device.');}catch(e){Alert.alert('Cannot save draft',String(e));}};
  const saveProfile=async()=>{try{await savePreference('userName',profileName.trim().slice(0,80));Alert.alert('Saved on this device','Your display name was saved locally.');}catch(e){Alert.alert('Could not save name',String(e));}};
  const changeTheme=(next:ThemeSetting)=>{setTheme(next);void savePreference('theme',next).catch(e=>Alert.alert('Theme not saved',String(e)));};
  const changeAccent=(next:string)=>{setAccent(next);void savePreference('accent',next).catch(e=>Alert.alert('Accent not saved',String(e)));};
  const pdfOrImage=tool&&(tool.kind==='pdf'||tool.kind==='image'||tool.kind==='file');
  const textTool=tool?.kind==='text';
  return <SafeAreaView style={{flex:1,backgroundColor:p.background}} edges={['top','bottom']}>
    <StatusBar barStyle={darkMode?'light-content':'dark-content'}/>
    <View style={[s.topbar,{backgroundColor:p.surface,borderBottomColor:p.border}]}>
      <Pressable accessibilityRole="button" onPress={()=>goBack()} style={s.topbarLeft}>
        {tool||settingsOpen||catalogOpen?<View style={[s.roundButton,{backgroundColor:p.surface}]}><Glyph name="arrow-back" color={p.text} size={22}/></View>:<Image source={require('./assets/icon.png')} style={s.logo} resizeMode="contain"/>}
        <View><Text style={[s.brand,{color:p.text}]}>{tool||settingsOpen||catalogOpen?'ToolNest':'ToolNest'}</Text><Text style={{fontSize:10,color:p.muted,marginTop:1}}>{headerTitle}</Text></View>
      </Pressable>
      <View style={s.topbarRight}><View style={[s.offlinePill,{backgroundColor:darkMode?'#143A33':'#E7F7F0'}]}><View style={s.onlineDot}/><Text style={{color:darkMode?'#B7EDCF':'#1D8966',fontSize:10,fontWeight:'800'}}>On device</Text></View>
        <Pressable accessibilityLabel="Settings" accessibilityRole="button" onPress={()=>{setTool(null);setCatalogOpen(false);setSettingsOpen(true);}} style={[s.roundButton,{backgroundColor:p.surface}]}><Glyph name="settings-outline" color={p.text} size={19}/></Pressable>
      </View>
    </View>
    {!ready?<View style={{flex:1,alignItems:'center',justifyContent:'center'}}><ActivityIndicator size="large" color={accent}/><Text style={{color:p.muted,marginTop:14}}>Opening your private workspace…</Text></View>:
    <KeyboardAvoidingView style={{flex:1}} behavior={Platform.OS==='ios'?'padding':undefined}>
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={[s.scrollContent,{paddingHorizontal:isWide?23:17}]}>
      {dbState!==''&&<Pressable onPress={()=>setDbState('')} style={[s.message,{backgroundColor:p.warning}]}><Text style={{color:p.warningText,fontSize:12,flex:1}}>{dbState}</Text><Glyph name="close" color={p.warningText}/></Pressable>}
      {tool? <>
        <View style={s.toolHeading}><View style={[s.largeIcon,{backgroundColor:tool.color+'20'}]}><Glyph name={tool.icon} size={27} color={tool.color}/></View><View style={{flex:1}}><Text style={[s.eyebrow,{color:accent}]}>{tool.kind.toUpperCase()} · 100% LOCAL</Text><Text style={[s.toolTitle,{color:p.text}]}>{tool.name}</Text><Text style={[s.subtitle,{color:p.muted}]}>{tool.subtitle}</Text></View><Pressable accessibilityLabel="Toggle favorite" onPress={()=>void favorite(tool.id)} style={[s.roundButton,{backgroundColor:p.surface}]}><Glyph name={favorites.includes(tool.id)?'star':'star-outline'} color={favorites.includes(tool.id)?'#EFAB41':p.muted}/></Pressable></View>
        <View style={[s.panel,{backgroundColor:p.surface,borderColor:p.border}]}>
          {pdfOrImage&&<><Text style={[s.panelHeading,{color:p.text}]}>1. Select your {tool.kind==='pdf'?'PDF documents':tool.kind==='file'?'files':'image'}</Text>
            <Pressable accessibilityRole="button" onPress={()=>void choose()} style={[s.dropzone,{borderColor:accent+'80',backgroundColor:p.subtle}]}><View style={[s.uploadCircle,{backgroundColor:accent+'18'}]}><Glyph name="cloud-upload-outline" color={accent} size={28}/></View><Text style={{color:p.text,fontWeight:'800',fontSize:14}}>Choose files from device</Text><Text style={{color:p.muted,fontSize:12,marginTop:5}}>No uploads · Files are processed locally</Text></Pressable>
            {Platform.OS==='android'&&<View style={{marginBottom:12}}><SecondaryButton label="Open Android Files (all file types)" icon="folder-open-outline" p={p} accent={accent} onPress={()=>void choose(true)}/></View>}
            {selectedFiles.map((f,i)=><View key={f.uri+i} style={[s.pickedFile,{borderColor:p.border}]}><Glyph name="document-attach-outline" color={accent}/><View style={{flex:1}}><Text style={{color:p.text,fontWeight:'700',fontSize:12}} numberOfLines={1}>{f.name}</Text><Text style={{color:p.muted,fontSize:10}}>{f.size?`${(f.size/1024/1024).toFixed(2)} MB`: 'Selected file'}</Text></View></View>)}
          </>}
          {['extract-pages','remove-pdf-pages','reorder-pdf-pages','duplicate-pdf-pages'].includes(tool.id)&&<InputField label={tool.id==='reorder-pdf-pages'?'New page order, e.g. 3,1,2':tool.id==='remove-pdf-pages'?'Pages to remove':tool.id==='duplicate-pdf-pages'?'Pages to duplicate':'Page range'} placeholder="1-3,5" value={options.pages} onChange={v=>setOptions({...options,pages:v})} p={p}/>}
          {['watermark-pdf','pdf-set-title','pdf-set-author'].includes(tool.id)&&<InputField label={tool.id==='pdf-set-title'?'PDF title':tool.id==='pdf-set-author'?'PDF author':'Watermark (ASCII only)'} value={options.watermark} onChange={v=>setOptions({...options,watermark:v})} p={p}/>}
          {['rotate-pdf','rotate-image'].includes(tool.id)&&<View style={{marginBottom:16}}><Text style={[s.fieldLabel,{color:p.text}]}>Rotation</Text><View style={s.chips}>{[90,180,270].map(a=><Pressable key={a} onPress={()=>setOptions({...options,angle:a})} style={[s.chip,{borderColor:options.angle===a?accent:p.border,backgroundColor:options.angle===a?accent+'18':p.surface}]}><Text style={{color:options.angle===a?accent:p.text,fontWeight:'700'}}>{a}°</Text></Pressable>)}</View></View>}
          {tool.id==='resize-image'&&<InputField label="Output width (pixels)" value={String(options.width)} onChange={v=>setOptions({...options,width:Number(v)})} p={p} keyboardType="numeric"/>}
          {tool.id==='compress-image'&&<InputField label="JPEG quality (20-100)" value={String(options.quality)} onChange={v=>setOptions({...options,quality:Math.min(100,Math.max(20,Number(v)))})} p={p} keyboardType="numeric"/>}
          {tool.id==='convert-image'&&<View style={{marginBottom:14}}><Text style={[s.fieldLabel,{color:p.text}]}>Format</Text><View style={s.chips}>{(['jpg','png'] as const).map(v=><Pressable key={v} onPress={()=>setOptions({...options,format:v})} style={[s.chip,{backgroundColor:options.format===v?accent+'18':p.surface,borderColor:options.format===v?accent:p.border}]}><Text style={{color:options.format===v?accent:p.text,fontWeight:'700'}}>{v.toUpperCase()}</Text></Pressable>)}</View></View>}
          {tool.kind==='unit'&&<><InputField label={`Value in ${getConversion(tool.id)?.from.label||'source units'}`} value={options.inputText} onChange={v=>setOptions({...options,inputText:v})} p={p} placeholder="Enter a number, e.g. 12.5" keyboardType="numeric"/><Text style={{color:p.muted,fontSize:12,marginBottom:10}}>Output unit: {getConversion(tool.id)?.to.label}. Uses local unit factors; results may be rounded.</Text><SecondaryButton label="Swap source and target units" icon="swap-horizontal-outline" p={p} accent={accent} onPress={()=>{const spec=getConversion(tool.id);if(!spec)return;const opposite=byId(`unit-${spec.family.code}-${spec.to.code}-${spec.from.code}`);if(opposite)void openTool(opposite);}}/></>}
          {textTool&&tool.id!=='uuid-generator'&&<InputField label="Input text" value={options.inputText} onChange={v=>setOptions({...options,inputText:v})} p={p} placeholder={tool.id==='json-format'?'{"example":true}':'Enter or paste text'} multiline/>}
          {tool.kind==='qr'&&<><InputField label="URL or text" value={options.inputText} onChange={v=>setOptions({...options,inputText:v})} p={p} placeholder="https://example.com"/><View style={[s.qrPreview,{backgroundColor:'#FFFFFF',borderColor:p.border}]}>{qrSvg?<SvgXml xml={qrSvg} width={190} height={190}/>:<ActivityIndicator color={accent}/>}</View></>}
          {tool.id==='cv-builder'&&<>
            <Text style={[s.panelHeading,{color:p.text}]}>Build your resume</Text>
            <Text style={{color:p.muted,fontSize:12,marginBottom:11}}>Choose a design — preview updates immediately.</Text>
            <View style={{flexDirection:'row',flexWrap:'wrap',gap:9,marginBottom:15}}>{resumeLayouts.map(v=><Pressable accessibilityLabel={`CV style ${v}`} accessibilityState={{selected:resume.layout===v}} key={v} onPress={()=>setResume({...resume,layout:v})} style={{width:'30%',flexGrow:1,backgroundColor:resume.layout===v?accent+'12':p.surface,borderWidth:2,borderColor:resume.layout===v?accent:p.border,borderRadius:11,padding:8}}><View style={{height:65,backgroundColor:'#fff',padding:7,borderTopWidth:['bold','executive','graduate'].includes(v)?12:4,borderTopColor:v==='graduate'?'#249b78':v==='bold'?'#18314c':accent,borderLeftWidth:v==='sidebar'?8:0,borderLeftColor:accent}}><View style={{width:'70%',height:5,backgroundColor:'#243954',marginBottom:7}}/><View style={{width:'85%',height:3,backgroundColor:'#dee5ef',marginBottom:5}}/><View style={{width:'45%',height:3,backgroundColor:accent,marginBottom:6}}/><View style={{width:'100%',height:3,backgroundColor:'#dee5ef',marginBottom:4}}/><View style={{width:'65%',height:3,backgroundColor:'#dee5ef'}}/></View><Text style={{color:p.text,fontSize:10,fontWeight:'700',textAlign:'center',marginTop:5}}>{v}</Text></Pressable>)}</View>
            <View style={{padding:17,backgroundColor:'#fff',borderWidth:1,borderColor:'#d9e1ee',borderRadius:12,marginBottom:15,borderTopWidth:resume.layout==='bold'?12:6,borderTopColor:resume.layout==='graduate'?'#158765':accent}}><Text style={{fontWeight:'900',fontSize:21,color:resume.layout==='classic'?'#24304a':accent}}>{resume.name||'Your name'}</Text><Text style={{color:'#283b58',fontSize:12,marginTop:4}}>{resume.role||'Professional title'}</Text><Text style={{color:'#67748b',fontSize:10,marginTop:4}}>{[resume.email,resume.phone,resume.location].filter(Boolean).join(' · ')||'Email · Phone · Location'}</Text>{([['PROFILE',resume.summary],['EXPERIENCE',resume.experience],['EDUCATION',resume.education],['SKILLS',resume.skills]] as const).map(([label,value])=><View key={label} style={{marginTop:15}}><Text style={{fontSize:10,fontWeight:'900',color:accent,letterSpacing:1,borderBottomWidth:1,borderBottomColor:'#dae1ea',paddingBottom:5}}>{label}</Text><Text style={{fontSize:10,color:'#35445a',lineHeight:16,marginTop:6}}>{value||`Add your ${label.toLowerCase()} details to see them here.`}</Text></View>)}</View>
            {(['name','role','email','phone','location','summary','skills','experience','education'] as const).map(key=><InputField key={key} label={key==='role'?'Professional title':key.charAt(0).toUpperCase()+key.slice(1)} value={resume[key]} onChange={v=>setResume({...resume,[key]:v})} p={p} multiline={['summary','skills','experience','education'].includes(key)}/>)}
          </>}
          {tool.id==='sticker-maker'&&<>
            <Text style={[s.panelHeading,{color:p.text}]}>Emoji keyboard — tap to copy</Text>
            <Text style={{color:p.muted,fontSize:11,marginBottom:12}}>Copy to your clipboard and paste into messages, names or documents. Printable stickers remain optional.</Text>
            <View style={s.chips}>{['All',...Object.keys(mobileEmojiGroups)].map(c=><Pressable key={c} onPress={()=>setStickerMode(c)} style={[s.chip,{borderColor:stickerMode===c?accent:p.border,backgroundColor:stickerMode===c?accent+'20':p.surface}]}><Text style={{color:stickerMode===c?accent:p.text,fontSize:12}}>{c}</Text></Pressable>)}</View>
            <View style={{flexDirection:'row',flexWrap:'wrap',gap:7,marginBottom:15}}>{[...new Set(stickerMode==='All'?Object.values(mobileEmojiGroups).flat():mobileEmojiGroups[stickerMode])].map((e,i)=><Pressable key={`${e}-${i}`} accessibilityLabel={`Copy emoji ${e}`} onPress={()=>{setStickerEmoji(e);void Clipboard.setStringAsync(e)}} style={{width:45,height:46,alignItems:'center',justifyContent:'center',borderRadius:9,borderWidth:1,borderColor:stickerEmoji===e?accent:p.border,backgroundColor:p.subtle}}><Text style={{fontSize:26}}>{e}</Text></Pressable>)}</View>
            <Text style={[s.panelHeading,{color:p.text}]}>Emoji combinations — tap to copy</Text><View style={{flexDirection:'row',flexWrap:'wrap',gap:8,marginBottom:15}}>{emojiMixes.map((text,i)=><Pressable key={i} onPress={()=>void Clipboard.setStringAsync(text)} style={[s.chip,{borderColor:p.border}]}><Text style={{color:p.text,fontSize:14}}>{text}</Text></Pressable>)}</View>
            <InputField label="Make your own combination" placeholder="✨ Your text ✨" value={stickerCustom} onChange={setStickerCustom} p={p}/>
            <SecondaryButton label="Copy your creation" icon="copy-outline" p={p} accent={accent} onPress={()=>void Clipboard.setStringAsync(stickerCustom||`${stickerEmoji} ${options.inputText} ${stickerEmoji}`)}/>
            <View style={{height:16}}/><Text style={[s.panelHeading,{color:p.text}]}>Optional printable sticker PDF</Text><InputField label="Sticker caption" placeholder="KEEP GOING!" value={options.inputText} onChange={v=>setOptions({...options,inputText:v})} p={p}/>
          </>}
          {tool.id==='invoice-builder'&&<>
            <Text style={[s.panelHeading,{color:p.text}]}>Invoice details</Text>
            {(['business','client','number','date','currency','notes'] as const).map(key=><InputField key={key} label={key.charAt(0).toUpperCase()+key.slice(1)} value={invoice[key]} onChange={v=>setInvoice({...invoice,[key]:v})} p={p} multiline={key==='notes'}/>)}
            <Text style={[s.panelHeading,{color:p.text,marginTop:6}]}>Bill items ({(invoice.items||[]).length})</Text>
            {(invoice.items||[]).map((row,i)=><View key={row.id} style={{marginBottom:15,padding:12,borderWidth:1,borderColor:p.border,borderRadius:13}}>
              <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center'}}><Text style={{fontWeight:'700',color:p.text}}>Item {i+1}</Text><Pressable disabled={invoice.items.length<=1} onPress={()=>setInvoice({...invoice,items:invoice.items.filter(x=>x.id!==row.id)})}><Glyph name="trash-outline" color={invoice.items.length<=1?p.muted:'#DE5362'}/></Pressable></View>
              {(['description','quantity','price'] as const).map(key=><InputField key={key} label={key==='price'?'Unit price':key==='quantity'?'Quantity':'Description'} value={row[key]} p={p} keyboardType={key==='description'?'default':'numeric'} onChange={v=>setInvoice(prev=>({...prev,items:prev.items.map(x=>x.id===row.id?{...x,[key]:v}:x)}))}/>)}
            </View>)}
            <SecondaryButton label="Add another item" icon="add-circle-outline" p={p} accent={accent} onPress={()=>setInvoice(prev=>({...prev,items:[...(prev.items||[]),{id:Crypto.randomUUID(),description:'',quantity:'1',price:'0'}]}))}/>
            <Text style={[s.invoiceTotal,{color:p.text,marginTop:16}]}>Total: {invoice.currency} {(invoice.items||[]).reduce((sum,x)=>sum+(Math.max(0,Number(x.quantity)||0)*Math.max(0,Number(x.price)||0)),0).toFixed(2)}</Text>
          </>}
          {error!==''&&<View style={[s.message,{backgroundColor:darkMode?'#4A2730':'#FCE8EB'}]}><Glyph name="alert-circle-outline" color="#DE5362"/><Text style={{flex:1,color:darkMode?'#FFB0BC':'#9D3045',fontSize:12}}>{error}</Text></View>}
          <FilledButton label={busy?'Processing locally…':tool.kind==='template'?'Generate PDF':tool.id==='qr-generator'?'Export QR as SVG':tool.kind==='text'?'Run utility':tool.kind==='unit'?'Convert locally':'Process files'} icon={busy?'hourglass-outline':'sparkles-outline'} accent={accent} disabled={Boolean(busy||(pdfOrImage&&selectedFiles.length===0))} onPress={()=>void run()}/>
          {tool.kind==='template'&&<View style={{marginTop:10}}><SecondaryButton label="Save draft in SQLite" icon="save-outline" p={p} accent={accent} onPress={()=>void saveDraftNow()}/></View>}
        </View>
        {result&&<View style={[s.panel,{backgroundColor:p.surface,borderColor:p.border,marginTop:14}]}><View style={{flexDirection:'row',alignItems:'center',gap:9,marginBottom:11}}><Glyph name="checkmark-circle" color="#19AA7D" size={23}/><Text style={[s.panelHeading,{color:p.text,marginBottom:0}]}>Ready on this device</Text></View>{result.kind==='text'?<><Text selectable style={[s.outputText,{color:p.text,backgroundColor:p.subtle}]}>{result.text}</Text><FilledButton label="Copy result" icon="copy-outline" accent={accent} onPress={()=>void Clipboard.setStringAsync(result.text)}/></>:<><Text style={{color:p.muted,marginBottom:13,fontSize:12}}>{result.name}</Text><FilledButton label="Share or open file" icon="share-outline" accent={accent} onPress={()=>void shareResult(result).catch(e=>Alert.alert('Sharing unavailable',String(e)))}/>{Platform.OS==='android'&&<View style={{marginTop:12}}><SecondaryButton label="Save file to a folder" icon="download-outline" p={p} accent={accent} onPress={()=>void saveResultToFolder(result).then(saved=>{if(saved)Alert.alert('Saved to folder',result.name)}).catch(e=>Alert.alert('Could not save file',String(e)))}/></View>}</>}</View>}
        <Text style={[s.privacyFoot,{color:p.muted}]}><Glyph name="shield-checkmark-outline" color="#19AA7D" size={14}/> Files are processed in app storage; sharing a file to another app is your choice.</Text><MobileAdPlacement placement="tool" p={p}/>
      </>:settingsOpen?<>
        <Heading eyebrow="PREFERENCES" title="Make it yours" subtitle="Saved privately on this device." p={p}/>
        <View style={[s.panel,{backgroundColor:p.surface,borderColor:p.border,marginBottom:14}]}>
          <Text style={[s.panelHeading,{color:p.text}]}>Personal · Your workspace</Text>
          <InputField label="Display name (local only)" placeholder="Your name" value={profileName} onChange={setProfileName} p={p}/>
          <SecondaryButton label="Save personal preferences" icon="save-outline" p={p} accent={accent} onPress={()=>void saveProfile()}/>
          <Text style={{color:p.muted,fontSize:11,marginTop:9}}>No account or network required. This name never leaves device storage through this feature.</Text>
        </View>
        <View style={[s.panel,{backgroundColor:p.surface,borderColor:p.border}]}><Text style={[s.panelHeading,{color:p.text}]}>Appearance</Text><View style={s.chips}>{(['light','dark','system'] as const).map(t=><Pressable key={t} onPress={()=>changeTheme(t)} style={[s.chip,{backgroundColor:theme===t?accent+'19':p.surface,borderColor:theme===t?accent:p.border}]}><Text style={{color:theme===t?accent:p.text,fontWeight:'700'}}>{t.charAt(0).toUpperCase()+t.slice(1)}</Text></Pressable>)}</View>
        <Text style={[s.panelHeading,{color:p.text,marginTop:20}]}>Accent color</Text><View style={s.chips}>{accentChoices.map(c=><Pressable accessibilityLabel={`Choose color ${c}`} key={c} onPress={()=>changeAccent(c)} style={[s.colorSwatch,{backgroundColor:c,borderWidth:accent===c?3:0,borderColor:p.text}]}>{accent===c&&<Glyph name="checkmark" color="#fff" size={20}/>}</Pressable>)}</View></View>
        <View style={[s.panel,{backgroundColor:p.surface,borderColor:p.border,marginTop:13}]}><Text style={[s.panelHeading,{color:p.text}]}>Storage and privacy</Text><Text style={[s.subtitle,{color:p.muted,marginBottom:14}]}>Favorites, recent activity and document drafts are stored in SQLite. Source files and outputs are not uploaded by ToolNest.</Text><SecondaryButton label="Test local SQLite" icon="server-outline" p={p} accent={accent} onPress={()=>void testPersistence().then(()=>Alert.alert('SQLite ready','Database write/read test passed.')).catch(e=>Alert.alert('SQLite failed',String(e)))}/><View style={{height:10}}/><SecondaryButton label="Clear activity history" icon="trash-outline" p={p} accent={accent} onPress={()=>Alert.alert('Clear history?','Your favorites and document drafts will remain.',[{text:'Cancel',style:'cancel'},{text:'Clear',style:'destructive',onPress:()=>void clearActivity().then(()=>setRecent([])).catch(e=>Alert.alert('Error',String(e)))}])}/></View>
        <View style={[s.panel,{backgroundColor:p.surface,borderColor:p.border,marginTop:14}]}><Text style={[s.panelHeading,{color:p.text}]}>Help & company</Text><View style={s.chips}>{(['about','faq','contact'] as const).map(q=><Pressable key={q} onPress={()=>setInfoSection(infoSection===q?null:q)} style={[s.chip,{borderColor:infoSection===q?accent:p.border}]}><Text style={{color:p.text}}>{q==='faq'?'FAQ':q==='about'?'About ToolNest':'Contact'}</Text></Pressable>)}</View>{infoSection==='about'?<View><Text style={{color:p.muted,lineHeight:21}}>ToolNest offers free local-first utilities to make everyday work easier. Developed with ❤ by Eng.Munir Rahman Rahmani.</Text><Text style={{color:p.muted,lineHeight:24,marginTop:10,textAlign:'right'}}>دا وړیا وسیلې د خلکو د کارونو د آسانولو لپاره جوړې سوي دي.</Text><Text style={{color:p.muted,lineHeight:21,marginTop:10}}>The 5,000-action catalog includes planned ideas, not 5,000 completed processors.</Text></View>:infoSection==='faq'?<Text style={{color:p.muted,lineHeight:21}}>Q: Do I need an account? No.{"\n"}Q: Are files uploaded? Local processing does not upload your documents.{"\n"}Q: Why are some tools planned? Those features need native engines.{"\n"}Q: Can I work offline? Supported tools can run after assets are installed.</Text>:infoSection==='contact'?<View><Text style={{color:p.muted,lineHeight:21}}>Developer: Eng.Munir Rahman Rahmani{"\n"}Email: munirrahmanrahmani0@gmail.com</Text><Text style={{color:p.muted,lineHeight:24,marginTop:10,textAlign:'right'}}>د پوښتنو او وړاندیزونو لپاره راسره اړیکه ونیسئ.</Text><Text style={{color:p.muted,lineHeight:21,marginTop:10}}>For bug reports, mention your Android version, tool and the error. Do not attach private documents.</Text><Pressable accessibilityRole="button" onPress={()=>void Linking.openURL('mailto:munirrahmanrahmani0@gmail.com?subject=ToolNest%20feedback').catch(e=>Alert.alert('Cannot open email',String(e)))} style={[s.secondaryButton,{marginTop:12,borderColor:p.border,backgroundColor:p.surface}]}><Glyph name="mail-outline" color={accent}/><Text style={{color:p.text,fontWeight:'700'}}>Email developer · اړیکه</Text></Pressable></View>:null}</View>
        <Pressable onPress={()=>{setCatalogOpen(true);setSettingsOpen(false);setQuery('');}} style={[s.linkRow,{backgroundColor:p.surface,borderColor:p.border}]}><Glyph name="library-outline" color={accent}/><Text style={{flex:1,color:p.text,fontWeight:'700'}}>Browse 5,000-tool roadmap</Text><Glyph name="chevron-forward" color={p.muted}/></Pressable>
      </>:catalogOpen?<>
        <Heading eyebrow="PRODUCT ROADMAP" title="5,000 utility actions" subtitle="Every idea is listed. Only tools with native mobile engines can run here." p={p}/>
        <View style={[s.searchBox,{backgroundColor:p.surface,borderColor:p.border}]}><Glyph name="search" color={p.muted}/><TextInput value={query} onChangeText={v=>{setQuery(v);setCatalogPage(0);}} placeholder="Search every planned tool…" placeholderTextColor={p.muted} style={[s.searchInput,{color:p.text}]}/></View>
        <View style={[s.countBanner,{backgroundColor:p.subtle}]}><Glyph name="information-circle-outline" color={accent}/><Text style={{flex:1,fontSize:12,color:p.muted}}>{tools.filter(t=>t.catalog).length} actions mapped to native mobile tools · remaining entries are planned.</Text></View>
        {catalogueResults.slice(catalogPage*40,catalogPage*40+40).map(entry=>{const mapped=catalogMap.get(entry.number);return <Pressable key={entry.number} onPress={()=>mapped&&void openTool(mapped)} style={[s.catalogRow,{backgroundColor:p.surface,borderColor:p.border}]}><Text style={{fontSize:11,fontWeight:'800',color:accent,minWidth:33}}>{String(entry.number).padStart(3,'0')}</Text><View style={{flex:1}}><Text style={{fontSize:13,fontWeight:'700',color:p.text}}>{entry.name}</Text><Text style={{fontSize:10,color:p.muted,marginTop:4}}>{entry.category}</Text></View><Text style={{fontSize:10,fontWeight:'700',color:mapped?'#179D7D':p.muted}}>{mapped?'OPEN':'PLANNED'}</Text></Pressable>})}
        <View style={[s.pageControls,{justifyContent:'space-between'}]}><SecondaryButton label="Previous" icon="chevron-back" p={p} accent={accent} onPress={()=>setCatalogPage(Math.max(0,catalogPage-1))}/><Text style={{color:p.muted,fontSize:12}}>{catalogPage+1}/{Math.max(1,Math.ceil(catalogueResults.length/40))}</Text><SecondaryButton label="Next" icon="chevron-forward" p={p} accent={accent} onPress={()=>setCatalogPage(Math.min(Math.ceil(catalogueResults.length/40)-1,catalogPage+1))}/></View>
      </>:tab==='home'?<>
        <View style={[s.hero,{backgroundColor:p.hero}]}><View style={s.heroOrbOne}/><View style={s.heroOrbTwo}/><View style={s.heroText}><View style={s.heroBadge}><Glyph name="shield-checkmark" color="#7DF1C7" size={12}/><Text style={{color:'#B8FBE2',fontSize:10,fontWeight:'800',letterSpacing:1}}>PRIVATE WORKSPACE</Text></View><Text style={s.heroHeadline}>{profileName.trim()?`Hello, ${profileName.trim().slice(0,22)}!\n`:''}Your files.{"\n"}<Text style={{color:'#ffbd78'}}>Your device.</Text></Text><Text style={{color:p.heroMuted,fontSize:12,lineHeight:18,marginTop:11,maxWidth:245}}>Powerful PDF, image and document tools. Zero uploads, even when offline.</Text><Pressable onPress={()=>go('explore')} style={[s.heroCta,{backgroundColor:'#FFFFFF'}]}><Text style={{color:'#20355F',fontWeight:'800',fontSize:12}}>Explore all tools</Text><Glyph name="arrow-forward" color="#20355F" size={17}/></Pressable></View><View style={s.heroArt}><View style={s.heroDocument}><Glyph name="document-text-outline" color="#EF5660" size={35}/><View style={{height:6,width:65,backgroundColor:'#E7EAF1',marginTop:14,borderRadius:4}}/><View style={{height:6,width:53,backgroundColor:'#E7EAF1',marginTop:6,borderRadius:4}}/></View><View style={s.heroLock}><Glyph name="lock-closed" color="#18A77E" size={22}/></View></View></View>
        <MobileAdPlacement placement="home" p={p}/>
        <View style={[s.statsRow,{marginTop:17}]}>{[{value:String(tools.length),label:'Mobile tools',icon:'grid-outline'},{value:String(favorites.length),label:'Favorites',icon:'star-outline'},{value:String(recent.length),label:'Recent',icon:'time-outline'}].map(o=><View key={o.label} style={[s.statCard,{backgroundColor:p.surface,borderColor:p.border}]}><Glyph name={o.icon} color={accent} size={17}/><Text style={{fontSize:19,fontWeight:'900',color:p.text,marginTop:7}}>{o.value}</Text><Text style={{fontSize:10,color:p.muted,marginTop:2}}>{o.label}</Text></View>)}</View>
        <View style={s.sectionHeader}><View><Text style={[s.sectionTitle,{color:p.text}]}>Popular tools</Text><Text style={{color:p.muted,fontSize:12,marginTop:4}}>Fast, private and always with you</Text></View><Pressable onPress={()=>go('explore')}><Text style={{color:accent,fontSize:12,fontWeight:'800'}}>View all →</Text></Pressable></View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap:12,paddingRight:18}}>{tools.filter(t=>t.popular).map(t=><ToolTile key={t.id} tool={t} compact p={p} accent={accent} isSaved={favorites.includes(t.id)} onSave={()=>void favorite(t.id)} onOpen={()=>void openTool(t)}/>)}</ScrollView>
        <View style={s.sectionHeader}><View><Text style={[s.sectionTitle,{color:p.text}]}>Browse categories</Text><Text style={{color:p.muted,fontSize:12,marginTop:4}}>Everything in its place</Text></View></View>
        <View style={s.categoryGrid}>{categories.filter(c=>c.id!=='all').map(c=><Pressable key={c.id} onPress={()=>{setFilter(c.id);go('explore');setFilter(c.id);}} style={[s.categoryTile,{backgroundColor:p.surface,borderColor:p.border}]}><View style={{width:46,height:46,alignItems:'center',justifyContent:'center',backgroundColor:accent+'15',borderRadius:12}}><Glyph name={c.icon} color={accent} size={26}/></View><Text style={{color:p.text,fontSize:13,fontWeight:'800',marginTop:9}}>{c.label}</Text><Glyph name="chevron-forward" color={p.muted} size={14}/></Pressable>)}</View>
        <Pressable onPress={()=>{setCatalogOpen(true);setQuery('');}} style={[s.roadmapBanner,{backgroundColor:p.surface,borderColor:p.border}]}><View style={[s.largeIcon,{backgroundColor:'#9170DB22'}]}><Glyph name="library-outline" color="#9170DB" size={24}/></View><View style={{flex:1}}><Text style={{color:p.text,fontSize:14,fontWeight:'800'}}>5,000-action roadmap</Text><Text style={{color:p.muted,fontSize:11,marginTop:5}}>Explore upcoming tools for every platform</Text></View><Glyph name="chevron-forward" color={accent}/></Pressable>
      </>:tab==='explore'?<>
        <Heading eyebrow="ALL OFFLINE TOOLS" title="Your private toolbox" subtitle="PDF, file and 1,500+ offline unit conversions. The 5,000-action catalog contains planned tools too." p={p}/><MobileAdPlacement placement="explore" p={p}/>
        <View style={[s.searchBox,{backgroundColor:p.surface,borderColor:p.border}]}><Glyph name="search-outline" color={p.muted}/><TextInput placeholder="Search PDF, image, text…" placeholderTextColor={p.muted} value={query} onChangeText={setQuery} style={[s.searchInput,{color:p.text}]}/>{query!==''&&<Pressable onPress={()=>setQuery('')}><Glyph name="close-circle" color={p.muted}/></Pressable>}</View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.categoryChips}>{categories.map(c=><Pressable key={c.id} onPress={()=>setFilter(c.id)} style={[s.filterChip,{borderColor:filter===c.id?accent:p.border,backgroundColor:filter===c.id?accent:p.surface}]}><Text style={{color:filter===c.id?'white':p.text,fontWeight:'700',fontSize:12}}>{c.label}</Text></Pressable>)}</ScrollView>
        <Pressable accessibilityRole="button" onPress={()=>{setCatalogOpen(true);setCatalogPage(0);setQuery('');}} style={[s.roadmapBanner,{backgroundColor:p.surface,borderColor:p.border,marginTop:0,marginBottom:14}]}><Glyph name="library-outline" color={accent}/><View style={{flex:1}}><Text style={{fontWeight:'800',color:p.text}}>Browse all 5,000 actions</Text><Text style={{fontSize:11,color:p.muted}}>Planned entries are labeled, not simulated.</Text></View><Glyph name="chevron-forward" color={accent}/></Pressable>
        <Text style={{color:p.muted,fontSize:12,marginBottom:14}}>{toolSearch.length} working tools on this device · {catalog.length.toLocaleString()} roadmap actions</Text>
        <View style={s.tileGrid}>{visibleToolSearch.map(t=><ToolTile key={t.id} tool={t} p={p} accent={accent} isSaved={favorites.includes(t.id)} onSave={()=>void favorite(t.id)} onOpen={()=>void openTool(t)}/>)}</View>{visibleToolSearch.length<toolSearch.length&&<View style={{marginTop:16}}><SecondaryButton label={`Show 60 more (${toolSearch.length-visibleToolSearch.length} remaining)`} icon="chevron-down-outline" p={p} accent={accent} onPress={()=>setVisibleCount(n=>n+60)}/></View>}
      </>:tab==='saved'?<>
        <Heading eyebrow="PERSONAL COLLECTION" title="Your favorites" subtitle="One-tap access to the tools you use most." p={p}/>
        {favorites.length===0?<View style={[s.emptyState,{backgroundColor:p.surface,borderColor:p.border}]}><Glyph name="star-outline" color={accent} size={38}/><Text style={[s.sectionTitle,{color:p.text,marginTop:14}]}>Nothing starred yet</Text><Text style={{color:p.muted,textAlign:'center',marginTop:6}}>Tap the star on any tool to keep it here.</Text><FilledButton label="Explore tools" accent={accent} icon="grid-outline" onPress={()=>go('explore')}/></View>:<View style={s.tileGrid}>{tools.filter(t=>favorites.includes(t.id)).map(t=><ToolTile key={t.id} tool={t} p={p} accent={accent} isSaved onSave={()=>void favorite(t.id)} onOpen={()=>void openTool(t)}/>)}</View>}
      </>:<>
        <Heading eyebrow="LOCAL HISTORY" title="Recent activity" subtitle="Only tool names and output filenames are saved to SQLite." p={p}/>
        {recent.length===0?<View style={[s.emptyState,{backgroundColor:p.surface,borderColor:p.border}]}><Glyph name="time-outline" color={accent} size={42}/><Text style={[s.sectionTitle,{color:p.text,marginTop:14}]}>No activity yet</Text><Text style={{color:p.muted,textAlign:'center',marginTop:6}}>Your successful actions appear here.</Text></View>:<><View style={{marginBottom:13}}><SecondaryButton label="Clear history" icon="trash-outline" p={p} accent={accent} onPress={()=>Alert.alert('Clear history?','This cannot be undone.',[{text:'Cancel',style:'cancel'},{text:'Clear',style:'destructive',onPress:()=>void clearActivity().then(()=>setRecent([]))}])}/></View>{recent.map(r=>{const t=byId(r.toolId);return <Pressable key={r.id} onPress={()=>t&&void openTool(t)} style={[s.activityRow,{backgroundColor:p.surface,borderColor:p.border}]}><View style={[s.tileIcon,{backgroundColor:(t?.color||accent)+'15'}]}><Glyph name={t?.icon||'document-outline'} color={t?.color||accent}/></View><View style={{flex:1}}><Text style={{fontSize:13,fontWeight:'800',color:p.text}}>{r.name}</Text><Text numberOfLines={1} style={{fontSize:11,color:p.muted,marginTop:3}}>{r.description}</Text><Text style={{fontSize:10,color:p.muted,marginTop:4}}>{new Date(r.createdAt).toLocaleString()}</Text></View><Glyph name="chevron-forward" color={p.muted}/></Pressable>})}</>}
      </>}
    </ScrollView>
    </KeyboardAvoidingView>}
    {!tool&&!settingsOpen&&!catalogOpen&&<View style={[s.bottomTabs,{backgroundColor:p.surface,borderTopColor:p.border}]}>{tabs.map(t=><Pressable key={t.id} accessibilityRole="tab" accessibilityState={{selected:tab===t.id}} onPress={()=>go(t.id)} style={s.tab}><View style={[s.tabIcon,tab===t.id&&{backgroundColor:accent+'17'}]}><Glyph name={tab===t.id?t.active:t.icon} color={tab===t.id?accent:p.muted} size={22}/></View><Text style={{fontSize:10,fontWeight:tab===t.id?'800':'600',color:tab===t.id?accent:p.muted}}>{t.label}</Text></Pressable>)}</View>}
  </SafeAreaView>;
}
export default function App(){return <SafeAreaProvider><Main/></SafeAreaProvider>}
const s=StyleSheet.create({
  topbar:{height:76,borderBottomWidth:1,flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingHorizontal:17},topbarLeft:{flexDirection:'row',alignItems:'center',gap:10,flex:1},topbarRight:{flexDirection:'row',alignItems:'center',gap:9},logo:{width:42,height:42,borderRadius:13,justifyContent:'center',alignItems:'center'},brand:{fontSize:17,fontWeight:'900',letterSpacing:-.7},offlinePill:{flexDirection:'row',alignItems:'center',gap:5,borderRadius:20,paddingHorizontal:9,paddingVertical:7},onlineDot:{width:6,height:6,borderRadius:4,backgroundColor:'#30BF87'},roundButton:{width:41,height:41,borderRadius:12,alignItems:'center',justifyContent:'center'},scrollContent:{paddingTop:22,paddingBottom:100},
  hero:{minHeight:252,borderRadius:23,overflow:'hidden',padding:24,position:'relative'},heroText:{zIndex:2},heroBadge:{flexDirection:'row',alignItems:'center',gap:6},heroHeadline:{color:'white',fontSize:31,fontWeight:'900',lineHeight:36,marginTop:13,letterSpacing:-1.2},heroCta:{flexDirection:'row',alignSelf:'flex-start',marginTop:20,borderRadius:11,alignItems:'center',gap:10,paddingVertical:12,paddingHorizontal:15},heroOrbOne:{position:'absolute',width:205,height:205,borderRadius:110,backgroundColor:'#b46d4a',opacity:.35,right:-53,top:-48},heroOrbTwo:{position:'absolute',width:150,height:150,borderRadius:90,backgroundColor:'#ee953f',opacity:.23,right:37,bottom:-84},heroArt:{position:'absolute',right:-10,top:69,width:138,height:174,transform:[{rotate:'13deg'}]},heroDocument:{backgroundColor:'#FFFFFF',borderRadius:15,padding:20,width:109,height:140,shadowColor:'#02091A',shadowOpacity:.18,shadowRadius:10,elevation:4},heroLock:{width:48,height:48,borderRadius:14,backgroundColor:'#D8F9E9',position:'absolute',right:9,bottom:0,alignItems:'center',justifyContent:'center',transform:[{rotate:'-13deg'}]},
  statsRow:{flexDirection:'row',gap:10},statCard:{flex:1,borderWidth:1,borderRadius:14,padding:14,minWidth:0},sectionHeader:{marginTop:31,marginBottom:14,flexDirection:'row',justifyContent:'space-between',alignItems:'flex-end'},sectionTitle:{fontSize:19,fontWeight:'900',letterSpacing:-.45},categoryGrid:{flexDirection:'row',gap:10,flexWrap:'wrap'},categoryTile:{borderRadius:15,borderWidth:1,padding:15,width:'30%',minWidth:95,flexGrow:1,gap:2},roadmapBanner:{marginTop:25,borderWidth:1,borderRadius:17,padding:14,flexDirection:'row',alignItems:'center',gap:13},
  eyebrow:{color:'#ef892c',fontSize:10,fontWeight:'900',letterSpacing:1.5,marginBottom:9},heading:{fontSize:27,fontWeight:'900',letterSpacing:-1.1},subtitle:{fontSize:12,lineHeight:19,marginTop:5},searchBox:{height:51,borderWidth:1,borderRadius:13,flexDirection:'row',gap:9,alignItems:'center',paddingHorizontal:14,marginBottom:16},searchInput:{flex:1,fontSize:13,paddingVertical:8},categoryChips:{gap:8,paddingBottom:19,paddingRight:20},filterChip:{borderRadius:30,borderWidth:1,paddingHorizontal:15,paddingVertical:10,minHeight:40},tileGrid:{flexDirection:'row',flexWrap:'wrap',gap:12},toolTile:{width:'47%',flexGrow:1,minHeight:190,borderWidth:1,borderRadius:15,padding:15},tileTop:{flexDirection:'row',justifyContent:'space-between',alignItems:'flex-start'},tileIcon:{width:52,height:52,borderRadius:14,alignItems:'center',justifyContent:'center'},starButton:{padding:2,minWidth:26,minHeight:26,alignItems:'center',justifyContent:'center'},tileName:{fontSize:14,fontWeight:'800',marginTop:14},tileDescription:{fontSize:11,lineHeight:16,marginTop:6,minHeight:32},tileFooter:{marginTop:'auto',paddingTop:12,flexDirection:'row',alignItems:'center',justifyContent:'space-between'},
  adSlot:{marginTop:18,padding:17,borderWidth:1,borderRadius:14,minHeight:90,flexDirection:'row',alignItems:'center',gap:12},
  bottomTabs:{height:72,borderTopWidth:1,flexDirection:'row',justifyContent:'space-around',alignItems:'center',paddingHorizontal:8},tab:{alignItems:'center',justifyContent:'center',flex:1,gap:2},tabIcon:{width:44,height:34,alignItems:'center',justifyContent:'center',borderRadius:12},
  toolHeading:{flexDirection:'row',gap:13,alignItems:'center',marginBottom:22},toolTitle:{fontSize:22,fontWeight:'900',letterSpacing:-.7},largeIcon:{width:54,height:54,borderRadius:16,justifyContent:'center',alignItems:'center'},panel:{borderWidth:1,borderRadius:18,padding:18},panelHeading:{fontSize:16,fontWeight:'800',marginBottom:14},dropzone:{borderWidth:1.5,borderStyle:'dashed',borderRadius:16,padding:23,alignItems:'center',marginBottom:15},uploadCircle:{width:58,height:58,borderRadius:17,alignItems:'center',justifyContent:'center',marginBottom:11},pickedFile:{borderBottomWidth:1,flexDirection:'row',alignItems:'center',gap:10,paddingVertical:10},field:{borderWidth:1,borderRadius:10,paddingHorizontal:13,minHeight:44,fontSize:13},fieldLabel:{fontSize:12,fontWeight:'700',marginBottom:7},chips:{flexDirection:'row',flexWrap:'wrap',gap:8,marginBottom:12},chip:{paddingHorizontal:15,paddingVertical:10,borderRadius:10,borderWidth:1,minHeight:40,justifyContent:'center'},primary:{height:49,borderRadius:12,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:9,marginTop:8,paddingHorizontal:14},primaryText:{fontSize:13,color:'#FFFFFF',fontWeight:'800'},secondaryButton:{minHeight:43,borderRadius:11,borderWidth:1,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:8,paddingHorizontal:14},message:{borderRadius:11,padding:13,flexDirection:'row',alignItems:'center',gap:9,marginBottom:14},outputText:{fontSize:12,lineHeight:19,borderRadius:9,padding:13,marginBottom:16},privacyFoot:{textAlign:'center',padding:20,fontSize:10,lineHeight:17},qrPreview:{borderWidth:1,borderRadius:15,alignItems:'center',paddingVertical:18,marginBottom:16},invoiceTotal:{fontSize:16,fontWeight:'800',marginBottom:13},colorSwatch:{width:38,height:38,borderRadius:20,alignItems:'center',justifyContent:'center'},
  emptyState:{borderWidth:1,borderRadius:17,padding:28,alignItems:'center',marginTop:13,gap:5},countBanner:{borderRadius:12,padding:12,flexDirection:'row',alignItems:'center',gap:9,marginBottom:15},catalogRow:{borderWidth:1,borderRadius:11,marginBottom:9,padding:13,flexDirection:'row',alignItems:'center',gap:10},pageControls:{flexDirection:'row',alignItems:'center',marginVertical:17,gap:8},linkRow:{padding:15,borderWidth:1,borderRadius:12,flexDirection:'row',alignItems:'center',gap:11,marginTop:14},activityRow:{padding:15,borderWidth:1,borderRadius:13,flexDirection:'row',gap:12,alignItems:'center',marginBottom:10},
});
