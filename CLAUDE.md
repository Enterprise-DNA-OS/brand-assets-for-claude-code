# Brand Assets for Claude Code

This is a private brand asset rights desk for one trusted operator. Start with current CLI reads, never remembered records. Read README.md, docs/cli.md, docs/replace-brandkit.md and docs/compliance.md before modifying records.

## One route for each job

| Request | Recipe |
|---|---|
| assets | /assets |
| rights watch | /rights-watch |
| campaign check | /campaign-check |
| withdrawals | /withdrawals |
| attention | /attention |
| compliance | /compliance |
| followups | /followups |
| privacy review | /privacy-review |
| show | /show |
| insights | /insights |
| history | /history |
| permissions | /permissions |
| init | /init |
| add | /add |
| review asset | /review-asset |
| record rights | /record-rights |
| revoke rights | /revoke-rights |
| plan use | /plan-use |
| record live | /record-live |
| confirm removed | /confirm-removed |
| withdraw | /withdraw |
| add followup | /add-followup |
| complete followup | /complete-followup |
| log | /log |
| draft withdrawal | /draft-withdrawal |
| weekly review | /weekly-review |
| import | /import |
| export | /export |
| Change a field or check | /customise |
| Add a read-only view | /new-view |
| Rights paperwork | /documents |
| The week in read-only views | /views |

## Rules

- Never infer a permission from a filename, credit, source approval flag or licence label.
- Read /show, /permissions and /history before writing about an asset. Use the operator's real actor label for mutations.
- Never guess missing scope or dates. List ambiguous matches and use a specific id.
- Draft only. No sending, public sharing, media deletion, remote fetching or live website changes.
- A record of live use or removal requires external confirmation. The command itself performs neither.
- Keep the database and generated output private. This is not an authenticated shared service.
- Use numbered migrations for changes and run npm test. Never edit applied migrations or rewrite history.
- No customer data in examples, commits or screenshots. Use fictional demo data for verification.

AGENTS.md routes all other coding agents here. Scripts live in scripts/, migrations in supabase/migrations/, recipes in .claude/commands/. Original media stays in operator-controlled storage. Enterprise DNA installs and operates the custom version through Omni by Enterprise DNA.
