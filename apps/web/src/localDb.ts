/** Local-only SQLite-WASM database. The exported SQLite bytes persist in IndexedDB.
 * No files, conversion output blobs, or document contents are recorded in activity history.
 */
import initSqlJs from 'sql.js';
import sqliteWasmUrl from 'sql.js/dist/sql-wasm.wasm?url';
import type { Database } from 'sql.js';

export type Activity = {
  id: string; toolId: string; toolName: string; fileName: string;
  resultName: string; createdAt: number; status: 'completed' | 'failed';
};
export type LocalState = { favorites: string[]; history: Activity[]; preferences: Record<string, string> };

const STORE = 'db';
const DB_KEY = 'localtools-v2.sqlite';
let connection: Promise<Database> | undefined;
let writeSequence = Promise.resolve();

function openStorage(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('LocalTools-Private-Storage', 1);
    request.onupgradeneeded = () => { if (!request.result.objectStoreNames.contains(STORE)) request.result.createObjectStore(STORE); };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('IndexedDB unavailable'));
  });
}
async function readSnapshot(): Promise<Uint8Array | undefined> {
  const storage = await openStorage();
  try {
    return await new Promise((resolve, reject) => {
      const tx = storage.transaction(STORE, 'readonly');
      const req = tx.objectStore(STORE).get(DB_KEY);
      req.onsuccess = () => resolve(req.result instanceof Uint8Array ? req.result : undefined);
      req.onerror = () => reject(req.error);
    });
  } finally { storage.close(); }
}
async function persistSnapshot(bytes: Uint8Array): Promise<void> {
  const storage = await openStorage();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = storage.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put(new Uint8Array(bytes), DB_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error ?? new Error('Local transaction aborted'));
    });
  } finally { storage.close(); }
}
async function getDatabase(): Promise<Database> {
  if (!connection) connection = (async () => {
    const SQL = await initSqlJs({ locateFile: () => sqliteWasmUrl });
    const snapshot = await readSnapshot();
    const db = snapshot ? new SQL.Database(snapshot) : new SQL.Database();
    db.run(`CREATE TABLE IF NOT EXISTS favorites (id TEXT PRIMARY KEY, saved_at INTEGER NOT NULL);
      CREATE TABLE IF NOT EXISTS history (id TEXT PRIMARY KEY, tool_id TEXT NOT NULL,
        tool_name TEXT NOT NULL, file_name TEXT NOT NULL, result_name TEXT NOT NULL,
        created_at INTEGER NOT NULL, status TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS preferences (key TEXT PRIMARY KEY, value TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS documents (key TEXT PRIMARY KEY, json TEXT NOT NULL, updated_at INTEGER NOT NULL);`);
    return db;
  })().catch(e => { connection = undefined; throw e; });
  return connection;
}
function select<T>(db: Database, sql: string, values: (string | number)[] = []): T[] {
  const statement = db.prepare(sql);
  try { statement.bind(values); const rows: T[] = []; while (statement.step()) rows.push(statement.getAsObject() as T); return rows; }
  finally { statement.free(); }
}
function run(db: Database, sql: string, params: (string | number)[]): void {
  const statement = db.prepare(sql);
  try { statement.run(params); } finally { statement.free(); }
}
function mutate(operation: (db: Database) => void): Promise<void> {
  const next = writeSequence.then(async () => {
    const db = await getDatabase();
    operation(db);
    await persistSnapshot(db.export());
  });
  writeSequence = next.catch(() => undefined);
  return next;
}
export async function readLocalState(): Promise<LocalState> {
  await writeSequence;
  const db = await getDatabase();
  const favorites = select<{id:string}>(db, 'SELECT id FROM favorites ORDER BY saved_at DESC').map(x => x.id);
  const history = select<{id:string;tool_id:string;tool_name:string;file_name:string;result_name:string;created_at:number;status:'completed'|'failed'}>(db,
    'SELECT * FROM history ORDER BY created_at DESC LIMIT 100').map(x => ({ id:x.id, toolId:x.tool_id,toolName:x.tool_name,
      fileName:x.file_name,resultName:x.result_name,createdAt:x.created_at,status:x.status }));
  const preferences = Object.fromEntries(select<{key:string;value:string}>(db, 'SELECT key, value FROM preferences').map(x => [x.key,x.value]));
  return { favorites, history, preferences };
}
export function toggleFavorite(toolId: string, add: boolean): Promise<void> {
  return mutate(db => {
    if (add) run(db, 'INSERT OR REPLACE INTO favorites(id, saved_at) VALUES (?,?)',[toolId,Date.now()]);
    else run(db, 'DELETE FROM favorites WHERE id=?',[toolId]);
  });
}
export function setPreference(key:string,value:string):Promise<void> {
  return mutate(db => run(db,'INSERT OR REPLACE INTO preferences(key,value) VALUES (?,?)',[key,value]));
}
export function addActivity(activity:Activity):Promise<void> {
  return mutate(db => {
    run(db,'INSERT INTO history(id,tool_id,tool_name,file_name,result_name,created_at,status) VALUES (?,?,?,?,?,?,?)',[
      activity.id,activity.toolId,activity.toolName,activity.fileName,activity.resultName,activity.createdAt,activity.status
    ]);
    db.run('DELETE FROM history WHERE id NOT IN (SELECT id FROM history ORDER BY created_at DESC LIMIT 100)');
  });
}
export function clearHistory():Promise<void> { return mutate(db => db.run('DELETE FROM history')); }
export async function readDocument<T>(key:string):Promise<T|null> {
  await writeSequence;
  const db=await getDatabase();
  const rows=select<{json:string}>(db,'SELECT json FROM documents WHERE key=?',[key]);
  return rows.length ? JSON.parse(rows[0].json) as T : null;
}
export function saveDocument(key:string,value:unknown):Promise<void> {
  return mutate(db => run(db,'INSERT OR REPLACE INTO documents(key,json,updated_at) VALUES (?,?,?)',[key,JSON.stringify(value),Date.now()]));
}
export function deleteDocument(key:string):Promise<void> { return mutate(db => run(db,'DELETE FROM documents WHERE key=?',[key])); }