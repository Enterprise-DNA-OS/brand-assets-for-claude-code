import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import {getDb,REPO_ROOT} from './lib/db.mjs';
import {migrate} from './migrate.mjs';
import {seed} from './seed.mjs';
import {run,display} from './assets.mjs';
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'brand-assets-demo-'));
process.env.DATABASE_URL='';process.env.DATA_DIR=path.join(dir,'db');process.env.OUTPUT_DIR=dir;
let db=await getDb();
try{
 await migrate(db);await seed(db);const screens=[];
 for(const [command,title,ask] of [['rights-watch','Permission dates','Which permissions need a review?'],['withdrawals','Campaign follow-up','Which campaign uses need to stop or be checked?'],['privacy-review','Personal image review','Which personal images need a retention review?']]){
  const output=display(await run(db,[command]));screens.push({title,ask,command:`node scripts/assets.mjs ${command}`,output});console.log(`\n${title}\n${output}`);
 }
 fs.writeFileSync(path.join(dir,'screens.json'),JSON.stringify(screens,null,2));
 await db.close();db=null;
 for(const cmd of ['docs','view']){const p=spawnSync(process.execPath,[path.join(REPO_ROOT,'scripts',cmd+'.mjs')],{cwd:REPO_ROOT,env:process.env,encoding:'utf8',windowsHide:true});if(p.status!==0)throw Error(p.stderr||p.stdout);console.log(p.stdout);}
 console.log(`Demo output: ${dir}`);
}finally{await db?.close();if(!process.argv.includes('--keep'))fs.rmSync(dir,{recursive:true,force:true});}
