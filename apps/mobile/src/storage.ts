import * as SQLite from 'expo-sqlite';

export type RecentItem={id:number;toolId:string;name:string;description:string;createdAt:number};
export type SavedState={favorites:string[];recent:RecentItem[];theme:'light'|'dark'|'system';accent:string};
let connection: Promise<SQLite.SQLiteDatabase>|undefined;
async function database(){
  if(!connection)connection=(async()=>{
    const db=await SQLite.openDatabaseAsync('localtools-mobile.db');
    await db.execAsync(`PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS favorites (tool_id TEXT PRIMARY KEY NOT NULL);
      CREATE TABLE IF NOT EXISTS activity (id INTEGER PRIMARY KEY AUTOINCREMENT, tool_id TEXT NOT NULL, name TEXT NOT NULL, description TEXT NOT NULL, created_at INTEGER NOT NULL);
      CREATE TABLE IF NOT EXISTS preferences (name TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL);
      CREATE INDEX IF NOT EXISTS idx_activity_created ON activity(created_at DESC);
      CREATE TABLE IF NOT EXISTS drafts (kind TEXT PRIMARY KEY NOT NULL, data TEXT NOT NULL, saved_at INTEGER NOT NULL);`);
    return db;
  })().catch(e=>{connection=undefined;throw e;});
  return connection;
}
export async function loadState():Promise<SavedState>{
  const db=await database();
  const [favs,recent,prefs]=await Promise.all([
    db.getAllAsync<{tool_id:string}>('SELECT tool_id FROM favorites ORDER BY tool_id'),
    db.getAllAsync<{id:number;tool_id:string;name:string;description:string;created_at:number}>('SELECT * FROM activity ORDER BY id DESC LIMIT 60'),
    db.getAllAsync<{name:string;value:string}>('SELECT name,value FROM preferences')
  ]);
  const settings=Object.fromEntries(prefs.map(p=>[p.name,p.value]));
  return {favorites:favs.map(f=>f.tool_id),recent:recent.map(r=>({id:r.id,toolId:r.tool_id,name:r.name,description:r.description,createdAt:r.created_at})),theme:settings.theme==='dark'||settings.theme==='system'?settings.theme:'light',accent:/^#[0-9a-f]{6}$/i.test(settings.accent||'')?settings.accent:'#4775F5'};
}
export async function setFavorite(id:string,on:boolean){const db=await database();if(on)await db.runAsync('INSERT OR IGNORE INTO favorites(tool_id) VALUES (?)',id);else await db.runAsync('DELETE FROM favorites WHERE tool_id=?',id);}
export async function recordUse(toolId:string,name:string,description:string){const db=await database();await db.runAsync('INSERT INTO activity(tool_id,name,description,created_at) VALUES (?,?,?,?)',toolId,name,description.slice(0,140),Date.now());}
export async function savePreference(name:'theme'|'accent',value:string){const db=await database();await db.runAsync('INSERT INTO preferences(name,value) VALUES(?,?) ON CONFLICT(name) DO UPDATE SET value=excluded.value',name,value);}
export async function clearActivity(){const db=await database();await db.runAsync('DELETE FROM activity');}
export async function testPersistence(){const db=await database();const key='self_test';const value=`ok-${Date.now()}`;await db.runAsync('INSERT INTO preferences(name,value) VALUES(?,?) ON CONFLICT(name) DO UPDATE SET value=excluded.value',key,value);const row=await db.getFirstAsync<{value:string}>('SELECT value FROM preferences WHERE name=?',key);if(row?.value!==value)throw Error('SQLite read-back verification failed.');}

export async function saveDraft(kind:string,data:object){const db=await database();await db.runAsync('INSERT INTO drafts(kind,data,saved_at) VALUES (?,?,?) ON CONFLICT(kind) DO UPDATE SET data=excluded.data,saved_at=excluded.saved_at',kind,JSON.stringify(data),Date.now());}
export async function loadDraft(kind:string):Promise<Record<string,string>|null>{const db=await database();const row=await db.getFirstAsync<{data:string}>('SELECT data FROM drafts WHERE kind=?',kind);return row?JSON.parse(row.data) as Record<string,string>:null;}
