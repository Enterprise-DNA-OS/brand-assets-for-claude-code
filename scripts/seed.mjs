import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { getDb,REPO_ROOT } from './lib/db.mjs';
export async function seed(db) {
 const rows=await db.query('select name from workspace');
 if(rows.length&&rows[0].name!=='Harbour Brand Demo') throw Error('Demo seed refuses a business workspace');
 await db.exec('BEGIN');
 try{await db.exec(fs.readFileSync(path.join(REPO_ROOT,'supabase/seed.sql'),'utf8'));await db.exec('COMMIT');}
 catch(e){await db.exec('ROLLBACK');throw e;}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){const db=await getDb();try{await seed(db);console.log('Fictional brand assets seeded');}finally{await db.close();}}
