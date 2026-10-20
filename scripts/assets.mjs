import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { getDb,REPO_ROOT } from './lib/db.mjs';
import { parseCsv,pick } from './lib/csv.mjs';
import { table } from './lib/format.mjs';

export const reads={
 assets:'select id,name,status,credit,release_date,expiry_date,personal_data from assets order by name',
 'rights-watch':"select name,channel,territory,ends_on,reason from rights_watch where reason<>'Current' order by ends_on nulls first,name",
 'campaign-check':'select id,name,campaign,owner,ends_on,check_result from campaign_check order by campaign,name',
 withdrawals:"select id,name,campaign,owner,location,check_result from campaign_check where check_result<>'Within recorded scope' order by campaign,name",
 attention:'select name,reason,due_on from attention order by due_on nulls first,name',
 compliance:'select name,rule,finding from compliance_checks order by name,rule',
 followups:'select f.id,a.name,f.note,f.owner,f.due_on,f.done from followups f join assets a on a.id=f.asset_id order by f.done,f.due_on',
 'privacy-review':"select id,name,personal_data,lawful_purpose,privacy_review from assets where status<>'archived' and (personal_data='unknown' or (personal_data='yes' and (lawful_purpose='' or privacy_review is null or privacy_review<current_date))) order by name"
};
export const insights=[
 ['Which live placements have an expired permission?',"select a.name,u.campaign,u.owner,p.ends_on from placements u join assets a on a.id=u.asset_id join permissions p on p.id=u.permission_id where u.status='live' and p.ends_on<current_date"],
 ['Which campaigns still use withdrawn assets?',"select name,campaign,owner,location from campaign_check where check_result='Asset withdrawn'"],
 ['Which people own overdue follow-ups?',"select owner,count(*) as overdue from followups where not done and due_on<current_date group by owner"],
 ['Which assets have no permission history?',"select a.name,a.status from assets a where not exists(select 1 from permissions p where p.asset_id=a.id)"],
 ['Which active assets have an unknown privacy scope?',"select name from assets where status='active' and personal_data='unknown'"],
 ['Which channels have permissions ending within 30 days?',"select channel,territory,count(*) as permissions_ending from permissions where not revoked and ends_on between current_date and current_date+30 group by channel,territory"],
 ['Which personal images need a retention review?',"select name,privacy_review,lawful_purpose from assets where personal_data='yes' and status<>'archived' and (privacy_review is null or privacy_review<current_date or lawful_purpose='')"],
 ['Which campaign uses exceed their recorded rights?',"select name,campaign,check_result from campaign_check where check_result in ('Use outside recorded scope','Use exceeds permission period','Use exceeds asset expiry')"],
 ['Which assets are on hold without a follow-up?',"select a.name from assets a where a.status='hold' and not exists(select 1 from followups f where f.asset_id=a.id and not f.done)"],
 ['Which problem placements have no open asset follow-up?',"select c.name,c.campaign,c.owner,c.check_result from campaign_check c where check_result<>'Within recorded scope' and not exists(select 1 from followups f where f.asset_id=c.asset_id and not f.done)"]
];
export const syntax={
 ...Object.fromEntries(Object.keys(reads).map(k=>[k,''])),
 show:'<asset>', insights:'', history:'<asset>', permissions:'<asset>',
 init:'--name=<business>',
 add:'--name=<asset> --filename=<file> --actor=<person>',
 'review-asset':'<asset> --file-ref=<location> --credit=<creator> --usage-note=<terms> --release=YYYY-MM-DD [--expiry=YYYY-MM-DD] --personal=yes|no [--purpose=<lawful purpose> --privacy-review=YYYY-MM-DD] --actor=<person>',
 'record-rights':'<asset> --licensor=<name> --channel=<channel> --territory=<territory> --purpose=<purpose> --start=YYYY-MM-DD --end=YYYY-MM-DD --evidence=<reference> --actor=<person>',
 'revoke-rights':'<permission-id> --reason=<reason> --actor=<person>',
 'plan-use':'<asset> --permission=<id> --campaign=<name> --channel=<channel> --territory=<territory> --purpose=<purpose> --start=YYYY-MM-DD --end=YYYY-MM-DD --location=<location> --owner=<person> --actor=<person>',
 'record-live':'<placement-id> --actor=<person>',
 'confirm-removed':'<placement-id> --evidence=<reference> --actor=<person>',
 withdraw:'<asset> --reason=<reason> --actor=<person>',
 'add-followup':'<asset> --note=<work> --owner=<person> --due=YYYY-MM-DD --actor=<person>',
 'complete-followup':'<followup-id> --evidence=<reference> --actor=<person>',
 log:'<asset> --note=<record> --actor=<person>',
 'draft-withdrawal':'<asset>', 'weekly-review':'',
 import:'brandkit <csv-file> [--dry-run] --actor=<person>', export:''
};
function parse(args){const opts={},pos=[];for(const a of args){if(a.startsWith('--')){const i=a.indexOf('=');const k=a.slice(2,i<0?undefined:i);if(k in opts)throw Error(`Repeated option: ${k}`);opts[k]=i<0?true:a.slice(i+1);}else pos.push(a);}return {opts,pos};}
function req(o,k){if(typeof o[k]!=='string'||!o[k].trim())throw Error(`Required --${k}=<value>`);return o[k].trim();}
function date(s,label){if(typeof s!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(s)||!Number.isFinite(Date.parse(s+'T00:00:00Z'))||new Date(s+'T00:00:00Z').toISOString().slice(0,10)!==s)throw Error(`Invalid ${label}: use YYYY-MM-DD`);return s;}
async function match(db,t,s){if(!s)throw Error('Specify a record name or id');const hasName=t==='assets';const rows=await db.query(`select * from ${t} where left(id::text,length($1))=lower($1) ${hasName?'or lower(name)=lower($1)':''}`,[s]);if(rows.length!==1){const e=Error(rows.length?'Ambiguous record; use an id':'Record not found');e.candidates=rows.map(r=>({id:r.id,...(r.name?{name:r.name}:{})}));throw e;}return rows[0];}
async function audit(db,id,action,actor,detail){await db.query('insert into history(asset_id,action,actor,detail) values($1,$2,$3,$4)',[id,action,actor,JSON.stringify(detail)]);}
async function atomic(db,fn){await db.exec('BEGIN');try{const v=await fn();await db.exec('COMMIT');return v;}catch(e){await db.exec('ROLLBACK');throw e;}}
function outputFile(dir,ext,data){const root=path.resolve(process.env.OUTPUT_DIR||REPO_ROOT,dir);fs.mkdirSync(root,{recursive:true,mode:0o700});const file=path.join(root,`${Date.now()}-${crypto.randomUUID()}.${ext}`);fs.writeFileSync(file,data,{mode:0o600});return [{file}];}
function bool(v,label){if(v==='')return false;if(!/^(true|false)$/i.test(v))throw Error(`Invalid ${label}; expected TRUE or FALSE`);return /^true$/i.test(v);}
function normalise(row){
 const source_id=pick(row,'id').trim(),filename=pick(row,'filename').trim();
 if(!source_id||!filename)throw Error('Every Brandkit row needs id and filename');
 const release=pick(row,'release'),expiry=pick(row,'expiry');if(release)date(release,'release');if(expiry)date(expiry,'expiry');if(release&&expiry&&expiry<release)throw Error('Expiry precedes release');
 const archived=bool(pick(row,'archived'),'archived');bool(pick(row,'unapproved'),'unapproved');
 return {source_id,filename,name:pick(row,'caption')||filename,asset_type:pick(row,'asset_type')||'Image',description:pick(row,'description'),credit:pick(row,'credit'),usage_note:pick(row,'usage_note'),source_licence:pick(row,'licenses'),tags:pick(row,'tags'),brands:pick(row,'brands'),version:pick(row,'version'),release_date:release||null,expiry_date:expiry||null,status:archived?'archived':'hold',source_record:Object.fromEntries(Object.entries(row).sort(([a],[b])=>a.localeCompare(b)))};
}
async function importBrandkit(db,file,o){
 if(!file)throw Error('Specify the Brandkit CSV path');const actor=req(o,'actor');const content=fs.readFileSync(path.resolve(file),'utf8');const rows=parseCsv(content).map(normalise);if(!rows.length)throw Error('CSV has no asset records');
 if(new Set(rows.map(r=>r.source_id)).size!==rows.length)throw Error('Duplicate source id in import');
 const checksum=crypto.createHash('sha256').update(content).digest('hex');
 return atomic(db,async()=>{let inserted=0,skipped=0;for(const r of rows){
  const existing=await db.query('select id,source_record from assets where source_id=$1',[r.source_id]);
  if(existing.length){const canonical=x=>JSON.stringify(Object.fromEntries(Object.entries(x||{}).sort(([a],[b])=>a.localeCompare(b))));if(canonical(existing[0].source_record)!==canonical(r.source_record))throw Error(`Changed source id ${r.source_id}; reconcile before importing`);skipped++;continue;}
  inserted++;if(o['dry-run'])continue;
  const columns=Object.keys(r);const values=columns.map(k=>k==='source_record'?JSON.stringify(r[k]):r[k]);
  const [a]=await db.query(`insert into assets(${columns.join(',')}) values(${values.map((_,i)=>'$'+(i+1)).join(',')}) returning id`,values);
  await audit(db,a.id,'import',actor,{source_id:r.source_id,checksum});
 }
 if(!o['dry-run'])await db.query('insert into import_batches(checksum,inserted,skipped,actor) values($1,$2,$3,$4)',[checksum,inserted,skipped,actor]);
 return [{inserted,skipped,dry_run:!!o['dry-run']}];});
}
export async function run(db,args){
 const {opts:o,pos}=parse(args);const [cmd='help',key,extra]=pos;
 if(cmd==='help')return Object.entries(syntax).map(([command,arguments_])=>({command,arguments:arguments_}));
 if(!(cmd in syntax))throw Error(`Unknown command: ${cmd}`);
 const allowed=new Set(['json',...(syntax[cmd].match(/--[a-z-]+/g)||[]).map(x=>x.slice(2))]);
 for(const k of Object.keys(o))if(!allowed.has(k))throw Error(`Unknown option --${k}`);
 for(const k of ['json','dry-run'])if(k in o&&o[k]!==true)throw Error(`--${k} takes no value`);
 const expected=cmd==='import'?3:['show','history','permissions','review-asset','record-rights','revoke-rights','plan-use','record-live','confirm-removed','withdraw','add-followup','complete-followup','log','draft-withdrawal'].includes(cmd)?2:1;
 if(pos.length!==expected)throw Error(`Usage: ${cmd} ${syntax[cmd]}`);
 if(reads[cmd])return db.query(reads[cmd]);
 if(cmd==='show'){const a=await match(db,'assets',key);return [a];}
 if(cmd==='history'||cmd==='permissions'){const a=await match(db,'assets',key);return db.query(`select * from ${cmd} where asset_id=$1 order by created_at,id`,[a.id]);}
 if(cmd==='insights'){const result=[];for(const [question,sql] of insights)result.push({question,rows:await db.query(sql)});return result;}
 if(cmd==='export'){const archive={format:'brand-assets/v1',exported_at:new Date().toISOString(),records:{}};await db.exec('BEGIN READ ONLY');try{for(const t of ['workspace','assets','permissions','placements','followups','history','import_batches'])archive.records[t]=await db.query(`select * from ${t} order by id`);}finally{await db.exec('ROLLBACK');}return outputFile('exports','json',JSON.stringify(archive,null,2));}
 if(cmd==='weekly-review'){let body='# Weekly brand rights review\n\nDraft, not sent.\n';for(const name of ['attention','rights-watch','campaign-check'])body+=`\n## ${name}\n\n${display(await db.query(reads[name]))}\n`;return outputFile('drafts','md',body);}
 if(cmd==='draft-withdrawal'){const a=await match(db,'assets',key);const uses=await db.query("select * from campaign_check where asset_id=$1 and check_result<>'Within recorded scope'",[a.id]);const history=await db.query('select action,actor,detail,created_at from history where asset_id=$1 order by created_at',[a.id]);return outputFile('drafts','md',`# Withdrawal follow-up: ${a.name}\n\nDraft for internal review, not sent. Check the recorded issue and ask the placement owner to confirm removal outside this system.\n\n${display(uses)}\n\n## Recorded history\n${display(history)}\n`);}
 if(cmd==='import'){if(key!=='brandkit')throw Error('Supported import: brandkit');return importBrandkit(db,extra,o);}
 if(cmd==='init'){const name=req(o,'name');if((await db.query('select * from workspace')).length)throw Error('Workspace already initialised');return db.query('insert into workspace(name) values($1) returning name',[name]);}
 const actor=req(o,'actor');
 return atomic(db,async()=>{
  let assetId=null,result;
  if(cmd==='add'){
   const [a]=await db.query('insert into assets(name,filename) values($1,$2) returning *',[req(o,'name'),req(o,'filename')]);assetId=a.id;result=[a];
  }else if(['revoke-rights','record-live','confirm-removed','complete-followup'].includes(cmd)){
   const t=cmd==='revoke-rights'?'permissions':cmd==='complete-followup'?'followups':'placements';const r=await match(db,t,key);assetId=r.asset_id;
   if(cmd==='revoke-rights'){req(o,'reason');result=await db.query('update permissions set revoked=true where id=$1 returning id,revoked',[r.id]);}
   if(cmd==='record-live'){
    if(r.status!=='planned')throw Error('Only planned placements can be recorded live');
    const [today]=await db.query('select current_date::text as day');if(today.day<r.starts_on||today.day>r.ends_on)throw Error('Placement is outside its scheduled dates');
    const [check]=await db.query('select check_result from campaign_check where id=$1',[r.id]);if(check.check_result!=='Within recorded scope')throw Error(check.check_result);
    result=await db.query("update placements set status='live' where id=$1 returning id,status",[r.id]);
   }
   if(cmd==='confirm-removed'){result=await db.query("update placements set status='removed',removal_ref=$2 where id=$1 returning id,status,removal_ref",[r.id,req(o,'evidence')]);}
   if(cmd==='complete-followup'){req(o,'evidence');result=await db.query('update followups set done=true where id=$1 returning id,done',[r.id]);}
  }else{
   const a=await match(db,'assets',key);assetId=a.id;
   if(['review-asset','record-rights','plan-use'].includes(cmd)&&['archived','withdrawn'].includes(a.status))throw Error('Archived or withdrawn assets cannot be reactivated by this command');
   if(cmd==='review-asset'){
    const personal=req(o,'personal');if(!['yes','no'].includes(personal))throw Error('personal must be yes or no');
    const release=date(req(o,'release'),'release');const expiry=o.expiry?date(o.expiry,'expiry'):a.expiry_date;
    const purpose=personal==='yes'?req(o,'purpose'):'';const review=personal==='yes'?date(req(o,'privacy-review'),'privacy-review'):null;
    result=await db.query("update assets set status='active',file_ref=$2,credit=$3,usage_note=$4,release_date=$5,expiry_date=$6,personal_data=$7,lawful_purpose=$8,privacy_review=$9 where id=$1 returning id,name,status",[a.id,req(o,'file-ref'),req(o,'credit'),req(o,'usage-note'),release,expiry,personal,purpose,review]);
   }
   if(cmd==='record-rights')result=await db.query('insert into permissions(asset_id,licensor,channel,territory,purpose,starts_on,ends_on,evidence_ref,actor) values($1,$2,$3,$4,$5,$6,$7,$8,$9) returning *',[a.id,req(o,'licensor'),req(o,'channel'),req(o,'territory'),req(o,'purpose'),date(req(o,'start'),'start'),date(req(o,'end'),'end'),req(o,'evidence'),actor]);
   if(cmd==='plan-use'){
    const p=await match(db,'permissions',req(o,'permission'));if(p.asset_id!==a.id)throw Error('Permission belongs to another asset');
    result=await db.query('insert into placements(asset_id,permission_id,campaign,channel,territory,purpose,starts_on,ends_on,location,owner) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) returning *',[a.id,p.id,req(o,'campaign'),req(o,'channel'),req(o,'territory'),req(o,'purpose'),date(req(o,'start'),'start'),date(req(o,'end'),'end'),req(o,'location'),req(o,'owner')]);
    const [check]=await db.query('select check_result from campaign_check where id=$1',[result[0].id]);if(check.check_result!=='Within recorded scope')throw Error(check.check_result);
   }
   if(cmd==='withdraw'){req(o,'reason');result=await db.query("update assets set status='withdrawn' where id=$1 returning id,name,status",[a.id]);}
   if(cmd==='add-followup')result=await db.query('insert into followups(asset_id,note,owner,due_on) values($1,$2,$3,$4) returning *',[a.id,req(o,'note'),req(o,'owner'),date(req(o,'due'),'due')]);
   if(cmd==='log'){req(o,'note');result=[{id:a.id,note:o.note}];}
  }
  if(!result)throw Error(`Not implemented: ${cmd}`);
  await audit(db,assetId,cmd,actor,{...o,result_ids:result.map(r=>r.id).filter(Boolean)});return result;
 });
}
export function display(rows){if(rows.length&&'question'in rows[0])return rows.map(r=>r.question+'\n'+display(r.rows)).join('\n\n');if(!rows.length)return '  (none)';const keys=Object.keys(rows[0]);return table(rows,keys.map(key=>({key,label:key.replaceAll('_',' '),width:100,format:v=>typeof v==='object'&&v!==null?JSON.stringify(v):v})));}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){let db;try{db=await getDb();const rows=await run(db,process.argv.slice(2));console.log(process.argv.includes('--json')?JSON.stringify(rows,null,2):display(rows));}catch(e){if(process.argv.includes('--json'))console.error(JSON.stringify({error:e.message,candidates:e.candidates||[]}));else{console.error(e.message);if(e.candidates)console.error(display(e.candidates));}process.exitCode=1;}finally{await db?.close();}}
