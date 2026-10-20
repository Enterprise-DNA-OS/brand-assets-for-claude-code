insert into workspace(name) values('Harbour Brand Demo') on conflict do nothing;
insert into assets(id,name,filename,credit,usage_note,file_ref,status,release_date,expiry_date,personal_data,lawful_purpose,privacy_review) values
 ('10000000-0000-4000-8000-000000000001','Winter coast campaign','coast.jpg','Fictional Coast Studio','NZ website only','demo/coast.jpg','active',current_date-100,current_date-2,'no','',null),
 ('10000000-0000-4000-8000-000000000002','Summer growers portrait','growers.jpg','Fictional Orchard Studio','AU website campaign','demo/growers.jpg','active',current_date-20,current_date+90,'yes','Seasonal campaign with recorded permission',current_date+90),
 ('10000000-0000-4000-8000-000000000003','Harbour brand mark','harbour.svg','Harbour Demo','Brand mark owned by business','demo/harbour.svg','active',current_date-100,null,'no','',null),
 ('10000000-0000-4000-8000-000000000004','Team portrait pending review','team.jpg','','','demo/team.jpg','hold',null,null,'unknown','',null),
 ('10000000-0000-4000-8000-000000000005','Withdrawn partner image','partner.jpg','Fictional Partner Studio','Permission withdrawn','demo/partner.jpg','withdrawn',current_date-100,null,'yes','Old campaign',current_date-10)
 on conflict do nothing;
insert into permissions(id,asset_id,licensor,channel,territory,purpose,starts_on,ends_on,evidence_ref,revoked,actor) values
 ('20000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','Coast Studio','website','NZ','winter',current_date-100,current_date-2,'demo/permission-coast',false,'Demo curator'),
 ('20000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000002','Orchard Studio','website','AU','summer',current_date-20,current_date+12,'demo/permission-growers',false,'Demo curator'),
 ('20000000-0000-4000-8000-000000000003','10000000-0000-4000-8000-000000000003','Harbour Demo','website','NZ','brand',current_date-100,current_date+365,'demo/ownership-mark',false,'Demo curator'),
 ('20000000-0000-4000-8000-000000000005','10000000-0000-4000-8000-000000000005','Partner Studio','website','NZ','partner',current_date-100,current_date+60,'demo/permission-partner',true,'Demo curator') on conflict do nothing;
insert into placements(id,asset_id,permission_id,campaign,channel,territory,purpose,starts_on,ends_on,location,owner,status) values
 ('30000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001','Winter coast','website','NZ','winter',current_date-20,current_date-2,'Example homepage','Mara','live'),
 ('30000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000002','20000000-0000-4000-8000-000000000002','Summer growers','website','AU','summer',current_date-5,current_date+12,'Example summer page','Jo','live'),
 ('30000000-0000-4000-8000-000000000005','10000000-0000-4000-8000-000000000005','20000000-0000-4000-8000-000000000005','Partner launch','website','NZ','partner',current_date-10,current_date+10,'Example partner page','Mara','live') on conflict do nothing;
insert into followups(id,asset_id,note,owner,due_on) values('40000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','Confirm removal from homepage','Mara',current_date-1) on conflict do nothing;
