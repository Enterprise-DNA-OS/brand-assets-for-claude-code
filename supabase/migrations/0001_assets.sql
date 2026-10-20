create table workspace (id boolean primary key default true check(id), name text not null, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table assets (
 id uuid primary key default gen_random_uuid(), source_id text unique, name text not null check(length(trim(name))>0), filename text not null,
 asset_type text not null default 'Image', description text not null default '', credit text not null default '', usage_note text not null default '',
 source_licence text not null default '', tags text not null default '', brands text not null default '', version text not null default '',
 file_ref text not null default '', status text not null default 'hold' check(status in ('hold','active','withdrawn','archived')),
 release_date date, expiry_date date, personal_data text not null default 'unknown' check(personal_data in ('unknown','yes','no')),
 lawful_purpose text not null default '', privacy_review date, source_record jsonb,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 check(expiry_date is null or release_date is null or expiry_date >= release_date)
);
create table permissions (
 id uuid primary key default gen_random_uuid(), asset_id uuid not null references assets(id), licensor text not null check(length(trim(licensor))>0),
 channel text not null check(length(trim(channel))>0), territory text not null check(length(trim(territory))>0), purpose text not null check(length(trim(purpose))>0),
 starts_on date not null, ends_on date not null check(ends_on >= starts_on), evidence_ref text not null check(length(trim(evidence_ref))>0),
 revoked boolean not null default false, actor text not null, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table placements (
 id uuid primary key default gen_random_uuid(), asset_id uuid not null references assets(id), permission_id uuid not null references permissions(id),
 campaign text not null check(length(trim(campaign))>0), channel text not null, territory text not null, purpose text not null,
 starts_on date not null, ends_on date not null check(ends_on >= starts_on), location text not null check(length(trim(location))>0), owner text not null check(length(trim(owner))>0),
 status text not null default 'planned' check(status in ('planned','live','removed')), removal_ref text not null default '',
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table followups (
 id uuid primary key default gen_random_uuid(), asset_id uuid not null references assets(id), note text not null check(length(trim(note))>0),
 owner text not null check(length(trim(owner))>0), due_on date not null, done boolean not null default false,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table history (
 id uuid primary key default gen_random_uuid(), asset_id uuid references assets(id), action text not null, actor text not null check(length(trim(actor))>0),
 detail jsonb not null, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table import_batches (
 id uuid primary key default gen_random_uuid(), checksum text not null, inserted integer not null, skipped integer not null, actor text not null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create function touch_updated() returns trigger language plpgsql as $$ begin new.updated_at=now(); return new; end $$;
create function immutable_history() returns trigger language plpgsql as $$ begin raise exception 'History is append-only'; end $$;
create trigger history_immutable before update or delete on history for each row execute function immutable_history();
do $$ declare t text; begin foreach t in array array['workspace','assets','permissions','placements','followups','import_batches'] loop
 execute format('create trigger %I before update on %I for each row execute function touch_updated()',t||'_touch',t);
 end loop;
 foreach t in array array['workspace','assets','permissions','placements','followups','history','import_batches'] loop
 execute format('alter table %I enable row level security',t); execute format('revoke all on %I from public',t);
 end loop; end $$;
create index permissions_asset on permissions(asset_id);
create index placements_asset on placements(asset_id);
create index followups_asset on followups(asset_id);
create view rights_watch as
 select a.id,a.name,a.status,p.id as permission_id,p.channel,p.territory,p.ends_on,
 case when p.id is null then 'No permission recorded' when p.revoked then 'Permission revoked'
 when p.ends_on < current_date then 'Permission expired' when p.starts_on > current_date then 'Permission not started'
 when p.ends_on <= current_date+30 then 'Permission ends within 30 days' else 'Current' end as reason
 from assets a left join permissions p on p.asset_id=a.id where a.status <> 'archived';
create view campaign_check as
 select u.id,a.id as asset_id,a.name,u.campaign,u.channel,u.territory,u.purpose,u.owner,u.location,u.starts_on,u.ends_on,u.status,
 case when a.status <> 'active' then 'Asset '||a.status
 when a.release_date is null then 'Release date missing'
 when u.starts_on < a.release_date then 'Use before release'
 when a.expiry_date is not null and u.ends_on > a.expiry_date then 'Use exceeds asset expiry'
 when p.revoked then 'Permission revoked'
 when u.starts_on < p.starts_on or u.ends_on > p.ends_on then 'Use exceeds permission period'
 when lower(u.channel) <> lower(p.channel) or lower(u.territory) <> lower(p.territory) or lower(u.purpose) <> lower(p.purpose) then 'Use outside recorded scope'
 when a.personal_data = 'unknown' then 'Privacy scope unknown'
 when a.personal_data='yes' and (a.lawful_purpose='' or a.privacy_review is null or a.privacy_review < greatest(current_date,u.ends_on)) then 'Privacy review required'
 when u.status='live' and u.ends_on < current_date then 'Live use past end date'
 when u.status='live' and u.starts_on > current_date then 'Live use before start date'
 else 'Within recorded scope' end as check_result
 from placements u join assets a on a.id=u.asset_id join permissions p on p.id=u.permission_id where u.status <> 'removed';
create view attention as
 select a.id as asset_id,a.name,'Asset '||a.status as reason,a.expiry_date as due_on from assets a where a.status in ('hold','withdrawn')
 union all select a.id,a.name,'Asset expiry due',a.expiry_date from assets a where a.status='active' and a.expiry_date<=current_date+30
 union all select asset_id,name,check_result,ends_on from campaign_check where check_result<>'Within recorded scope'
 union all select f.asset_id,a.name,'Follow-up: '||f.note,f.due_on from followups f join assets a on a.id=f.asset_id where not f.done and f.due_on<current_date;
create view compliance_checks as
 select id as asset_id,name,'NZ-COPYRIGHT' as rule,'Missing permission evidence' as finding from assets a where status='active' and not exists(select 1 from permissions p where p.asset_id=a.id and not p.revoked and current_date between p.starts_on and p.ends_on)
 union all select id,name,'NZ-PRIVACY-9','Privacy scope not classified' from assets where status<>'archived' and personal_data='unknown'
 union all select id,name,'NZ-PRIVACY-9','Retention purpose or review missing/overdue' from assets where status<>'archived' and personal_data='yes' and (lawful_purpose='' or privacy_review is null or privacy_review<current_date)
 union all select asset_id,name,'LICENCE-SCOPE',check_result from campaign_check where check_result<>'Within recorded scope';
