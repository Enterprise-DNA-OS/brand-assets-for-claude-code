# Move the rights desk from Brandkit

## Export the metadata

Brandkit documents **Admin > Settings > Manage Metadata** for an authorised user. Request Export Asset Metadata and download the generated CSV. Keep an untouched copy and use UTF-8. The [vendor guide](https://brandkit.com/asset-page/113843-manage-metadata-how-do-i-bulk-export-and-or-import-asset-metadata) was checked on 20 October 2026. It describes the classic metadata export; verify the headers in your account before importing.

```bash
npm run migrate
node scripts/assets.mjs init --name="Your business"
node scripts/assets.mjs import brandkit imports/assets.csv --dry-run --actor="Your name"
node scripts/assets.mjs import brandkit imports/assets.csv --actor="Your name"
```

One command loads the supported metadata. It does not complete the whole platform migration in a day. A clean export imports in one session; evidence reconciliation and media delivery are separate work. Nothing is sent back to Brandkit.

## Mapping

| Brandkit column | Local field |
|---|---|
| id | source_id, unique and stable |
| filename | filename |
| caption | name, falling back to filename |
| asset_type, description, credit, usage_note | Same named fields |
| release, expiry | release_date, expiry_date, calendar dates |
| licenses | source_licence, descriptive only |
| version, tags, brands | Preserved text |
| archived | Archived if TRUE, otherwise held for review |
| unapproved | Validated and retained in the source record, never treated as permission |
| All other columns | Preserved in source_record, not promoted to working fields |

Required columns are id and filename. Headers match without case sensitivity. TRUE/FALSE and YYYY-MM-DD are accepted for documented booleans and dates. An empty date stays unknown. Malformed CSV, duplicate headers, duplicate IDs, impossible dates, changed source rows and expiry before release stop the entire batch. Identical imports skip records, preserving local reviews and work. A source change needs reconciliation, not silent overwrite. Review the changed original with /show and /history; there is no automated merge command.

## Review before using

Run /attention. For each asset, verify its file location and attribution, classify personal information and record a lawful purpose and review date where required. Record the actual licence evidence with /record-rights. Imported licence names do not confer rights. Then plan each campaign use and check it before recording that it went live. Every imported non-archived asset starts on hold.

## Carry the files separately

Metadata export does not contain original media, signed permissions, portal users, download logs or historic campaign placements. [Brandkit documents](https://brandkit.com/asset-page/780555-q-does-brandkit-have-an-export-feature-to-download-all-our-assets) basket downloads, an Enterprise Backup option for enabled accounts, and a quoted assisted export. Arrange an original-file copy you control, verify counts and checksums, then record those file references. The importer does not fetch files, follow links, resize images or move public content.

Compare source and imported counts, inspect samples and review open campaign uses before retiring any existing work. Your public portal and distribution connections need separately agreed implementation and acceptance. Keep Brandkit available until that work has been tested.

## Export and restore

/export writes a private JSON archive of all seven domain tables, including original source records and history. It is not a media archive and has no automatic restore command. Back up the actual PGlite directory while the process is stopped or use your Postgres backup tools; test restoration in a separate database before relying on a backup.
