# CLI reference

Run from the repository root on Node 22 or later. `node scripts/assets.mjs help` lists the same operations. All commands accept --json. Quote argument values containing spaces. Mutations require --actor except init. Each write is transactional with history. Actor labels are not authentication.


```bash
node scripts/assets.mjs assets 
```

```bash
node scripts/assets.mjs rights-watch 
```

```bash
node scripts/assets.mjs campaign-check 
```

```bash
node scripts/assets.mjs withdrawals 
```

```bash
node scripts/assets.mjs attention 
```

```bash
node scripts/assets.mjs compliance 
```

```bash
node scripts/assets.mjs followups 
```

```bash
node scripts/assets.mjs privacy-review 
```

```bash
node scripts/assets.mjs show <asset>
```

```bash
node scripts/assets.mjs insights 
```

```bash
node scripts/assets.mjs history <asset>
```

```bash
node scripts/assets.mjs permissions <asset>
```

```bash
node scripts/assets.mjs init --name=<business>
```

```bash
node scripts/assets.mjs add --name=<asset> --filename=<file> --actor=<person>
```

```bash
node scripts/assets.mjs review-asset <asset> --file-ref=<location> --credit=<creator> --usage-note=<terms> --release=YYYY-MM-DD [--expiry=YYYY-MM-DD] --personal=yes|no [--purpose=<lawful purpose> --privacy-review=YYYY-MM-DD] --actor=<person>
```

```bash
node scripts/assets.mjs record-rights <asset> --licensor=<name> --channel=<channel> --territory=<territory> --purpose=<purpose> --start=YYYY-MM-DD --end=YYYY-MM-DD --evidence=<reference> --actor=<person>
```

```bash
node scripts/assets.mjs revoke-rights <permission-id> --reason=<reason> --actor=<person>
```

```bash
node scripts/assets.mjs plan-use <asset> --permission=<id> --campaign=<name> --channel=<channel> --territory=<territory> --purpose=<purpose> --start=YYYY-MM-DD --end=YYYY-MM-DD --location=<location> --owner=<person> --actor=<person>
```

```bash
node scripts/assets.mjs record-live <placement-id> --actor=<person>
```

```bash
node scripts/assets.mjs confirm-removed <placement-id> --evidence=<reference> --actor=<person>
```

```bash
node scripts/assets.mjs withdraw <asset> --reason=<reason> --actor=<person>
```

```bash
node scripts/assets.mjs add-followup <asset> --note=<work> --owner=<person> --due=YYYY-MM-DD --actor=<person>
```

```bash
node scripts/assets.mjs complete-followup <followup-id> --evidence=<reference> --actor=<person>
```

```bash
node scripts/assets.mjs log <asset> --note=<record> --actor=<person>
```

```bash
node scripts/assets.mjs draft-withdrawal <asset>
```

```bash
node scripts/assets.mjs weekly-review 
```

```bash
node scripts/assets.mjs import brandkit <csv-file> [--dry-run] --actor=<person>
```

```bash
node scripts/assets.mjs export 
```

Asset lookup accepts a case-insensitive full name or leading id characters. Ambiguous matches list candidate ids and exit 1. Permission, placement and follow-up commands use id prefixes. Dates are ISO calendar dates in UTC. Permission end dates are inclusive. Channel, territory and purpose compare case-insensitively and exactly, with no wildcards. Record separate permissions for separate scopes.

review-asset activates reviewed metadata, not permission for a campaign. Omitting expiry preserves the current expiry. New imports remain held regardless of source approval. Archived and withdrawn assets cannot be reactivated by normal commands. Use a new reviewed version if rights genuinely change. plan-use validates the whole planned period. record-live records confirmed external use; it does not publish. confirm-removed records external removal evidence; it does not remove media. A read is a current check of stored facts, not legal advice or verified external evidence.

--dry-run makes no data changes. export and drafts write private files under OUTPUT_DIR when set, otherwise exports/ and drafts/. The export contains no media and has no automatic restore command. Avoid concurrent writers: the base is a single-operator tool.
