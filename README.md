# Brand Assets for Claude Code

Know which brand assets you can use, where they are being used and whose follow-up is overdue. A private database with Claude Code, Codex, OpenCode or Cursor. MIT licensed. This is the asset rights desk, with original media kept in storage you control.

## Three ways to use it

- **Do it yourself:** run the free code and own the database. Hosting, media storage and your agent subscription are your costs.
- **We customise it:** Enterprise DNA brings your Brandkit metadata across and builds your fields, rules, staff screens and storage connections, with a different stack where you need one.
- **We run it for you:** Omni by Enterprise DNA installs, connects and operates your version. One setup fee, then a retainer. [Book a call](https://enterprisedna.co/omni/book/?offer=replace-software&utm_campaign=brandkit&utm_medium=readme).

## Try the fictional demo

```bash
npm install
npm test
npm run demo
```

The demo uses a temporary database and removes it afterward. `npm run demo -- --keep` retains the private documents, views and captured command output in the displayed temporary directory. For a persistent fictional workspace, run npm run migrate then npm run seed. Seeding refuses a named business workspace.

## Start your own desk

```bash
npm run migrate
node scripts/assets.mjs init --name="Your business"
node scripts/assets.mjs import brandkit imports/assets.csv --dry-run --actor="Your name"
node scripts/assets.mjs import brandkit imports/assets.csv --actor="Your name"
```

The [switching guide](docs/replace-brandkit.md) lists every mapped field and exclusion. Original files and actual licence evidence move separately. Imported records start on hold. A Brandkit approval flag is not permission to use an asset. Identical repeat imports are skipped; changed source rows stop the whole batch for reconciliation.

DATABASE_URL selects private Postgres; otherwise DATA_DIR selects local PGlite. OUTPUT_DIR relocates private output. Use one trusted operator per database. No authentication, public portal or media-processing service is supplied. Keep imports, exports, drafts and storage credentials out of git.

## The weekly rituals

Use /rights-watch for expiry dates, /campaign-check before a campaign, /withdrawals for uses needing action, /privacy-review for retention questions and /weekly-review for Monday's handover. /record-rights keeps evidence beside exact permission scope. /plan-use rejects a campaign outside that scope. /record-live and /confirm-removed record work already confirmed outside this system. They never publish or remove anything.

There are 28 CLI operations and 32 slash recipes. [Full syntax](docs/cli.md). /compliance checks the records against [cited NZ rules](docs/compliance.md), without pretending a stored reference certifies legal rights. Every change has an actor label and append-only history.

## Documents and read-only views

Set brand.json to your business name, logo and colours. npm run docs renders a rights register, campaign usage sheet and withdrawal brief for each asset. npm run view renders the week, permission dates and campaign checks. Text is escaped and output stays private. [What a screen adds](docs/why-no-front-end.md).

## Ten questions answered from your records

/insights answers these today. These are working joins across your records, not claims that Brandkit cannot be configured to answer them.

1. Which live placements have an expired permission?
2. Which campaigns still use withdrawn assets?
3. Which people own overdue follow-ups?
4. Which assets have no permission history?
5. Which active assets have an unknown privacy scope?
6. Which channels have permissions ending within 30 days?
7. Which personal images need a retention review?
8. Which campaign uses exceed their recorded rights?
9. Which assets are on hold without a follow-up?
10. Which problem placements have no open asset follow-up?

## Your first hour: ten things to ask for

1. Show permissions ending this month.
2. Find campaigns still using withdrawn images.
3. Show which image records have no permission evidence.
4. Import a test copy of our Brandkit metadata.
5. Record the written licence we have checked.
6. Check an Australian website campaign against its permission.
7. Draft a withdrawal follow-up for the recorded owner.
8. Put our name on the rights register.
9. Add a read-only view by campaign owner.
10. Add our agency job reference through /customise.

## Verification and operating limits

[Verification](docs/verification.md) records the checks run. Tests exercise every CLI operation, safe imports, scope and date rejection, review controls, history, private exports and HTML escaping. The workflow covers Windows, Linux and Postgres.

The base does not search image pixels, host originals, grant legal permission, interpret contracts, send notices or remove external content. Your actual evidence and file locations must be checked by a person. Back up the database and test restoring it. Actor labels are not verified identities.
