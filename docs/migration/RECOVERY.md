# Cutover and recovery runbook

Status: proposed operational procedure. No persistent preview or production restore
has been rehearsed, and no resource, credential, domain or main change is authorized
by this document. The disposable local suites prove content and storage behavior;
they do not prove recovery of a real site's data.

## Release record and stop/go decision

Before requesting cutover approval, the parent and named release operator must
record the following in the release evidence. A missing field is a stop condition.

- Reviewed integration commit, lockfile hash, Node/pnpm versions, generated target
  binding configuration, compiled artifact identifier and all validation results.
- Last known good legacy commit, Worker version/artifact identifier, static asset
  inventory, build settings and domain/route configuration. Preserve that version
  through the rollback window; do not replace it with an unreviewed rebuild.
- Exact isolated preview and proposed production Worker, DB, MEDIA and SESSION
  identifiers; stable admin origin; access policy; deployment operator and reviewer.
- Backup timestamp/checkpoint, D1 backup identifier, matching R2 object inventory
  with byte hashes, schema/EmDash version, and secure encryption-key recovery owner.
  Never put secret values in this record or the repository.
- Expected recovery point/time objectives, editing freeze window, rollback decision
  deadline, incident owner and explicit user approval for main/production changes.

Stop cutover for failed parity, missing required published records, leaked draft
content, unsafe links, login/preview/session failures, missing media, unexpected
binding targets, missing backup evidence or an unsuccessful isolated restore.
The operator records the go decision only after the reviewer checks every gate.

## Backup and isolated restore rehearsal

Run this procedure only after approval of a persistent preview and its backup
operations. The parent must supply reviewed commands for the chosen resource IDs
and backup tooling; none are inferred from the current local placeholder config.

1. Pause content writes and importer/publication jobs at an agreed checkpoint.
   Capture D1 schema/content/settings and inventory R2 media referenced by that
   checkpoint. Keep uploads paused or prove how the object snapshot matches the
   database snapshot. Record hashes/counts and restore prerequisites.
2. Store backups encrypted in approved storage, with tested access for the named
   operator. Securely preserve the EmDash encryption key separately. SESSION KV is
   session state: define session invalidation and re-login rather than assuming a
   cross-service atomic backup. Origin changes require their own passkey plan.
3. Restore D1 and media into separately approved isolated resources using the
   matching app/schema version. Never restore over a database containing later
   edits during a rehearsal. Validate all 17 required records, identities, order,
   publication status, exact text and media byte hashes.
4. Check public rendering and generic 503 failure behavior, authenticated editing,
   draft preview isolation, publish, media picker/replacement, login/logout and
   sessions at the intended origin. A new restore origin does not prove production
   domain-bound passkeys; plan and test that boundary separately.
5. Measure elapsed recovery time and checkpoint age against the agreed objectives.
   Record exact backup/artifact/config identifiers, checks and operator. Fail the
   gate for missing bytes, mismatched schema/key, inaccessible backups or auth errors.
6. Release the editing freeze only after the owner accepts the rehearsal. Retain
   the consistent backup and legacy artifacts through the rollback window.

## Cutover

After explicit main/domain/production approval, the named operator uses the
reviewed release record and deployment plan. Reconfirm target config and backup
checkpoint immediately before writes. Keep editing frozen while routing changes
and public/CMS checks run. Verify required CMS content and assets, auth, preview
isolation and error handling. Record the released artifact and observation window.
Only then reopen editing, with a ledger of changes made after the checkpoint.

## Rollback decision and execution

Trigger incident review for public unavailability, missing media/content, unintended
draft exposure, broken authentication, unexpected target bindings or failed data
migration. Freeze editing/jobs immediately and preserve logs plus a new snapshot
of post-cutover data before choosing a recovery path.

For a public-app regression, the approved operator restores the recorded legacy
Worker/artifact and route configuration. Confirm the public site and asset links,
and leave CMS editing paused while investigating. Preserve the new CMS database
and media; switching public code does not revert those resources.

For database/media/schema corruption, choose the last verified consistent backup
under the agreed recovery objectives and restore into isolated replacement
resources first. Reconcile or explicitly accept loss of edits after its checkpoint
with Hugo before switching. Do not blindly downgrade EmDash against a migrated
database or rerun the seed importer over editor data. If no safe restore has been
proved, keep the known good legacy public version and investigate offline.

Verify recovery using the same public/content/media/auth checks as the rehearsal.
Record the chosen checkpoint, retained later edits, recovery duration, released
artifact/config, incident cause and user decision before reopening CMS editing.
No cutover or rollback commands should be run from a coding task with production
credentials or the legacy broad build token.
