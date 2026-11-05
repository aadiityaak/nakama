# Deploying this fork

Production runs a fork, not upstream directly. The deploy script builds one
ref and swaps `apps/*/dist`, `package.json`, and runtime `node_modules` into
`/opt/nakama/app`; everything outside those paths stays.

## Refs

- `main` — integration branch. Merge upstream here and resolve conflicts.
- `production` — deployed ref. Fast-forward it only after `main` passes.
- Tag `prod-<version>-<date>` — known-good rollback point.

Deploy:

```bash
sudo /usr/local/sbin/nakama-deploy --ref production
```

## Customizations that must survive

| Area | File / runtime path | Verifier check |
|---|---|---|
| OMP chat agent preset | `apps/server/src/providers/acp/acp-agent-presets.ts` | bundle contains `command: "omp"` |
| SSH to Terate allowlist | `apps/server/src/providers/acp/acp-command-policy.ts` + `acp-provider.ts` | bundle contains `isTerateSshCommand` |
| Shared agent visibility | `packages/db/src/adapters/sqlite.ts` | `shared_agent_instances` profiles have `shared_with_team=1` |
| omp runtime | `/usr/local/bin/omp`, `/var/lib/nakama/.omp` | binary + config exist |
| Nakama SSH key | `/var/lib/nakama/.ssh/id_terate_nakama` | file exists |
| Terate workspace | `/var/lib/nakama/orgs/.../profiles/5LX4Q9Bzet2ZP9GzG2eVq` | `AGENTS.md`, `MEMORY.md`, skills |
| CCTV skills assigned | `profile_skills` for the Terate profile | >= 7 matching skills |
| Terate stats | `terate-camera-stats` + timer on `terate` | SSH command returns JSON |

The deploy script runs `/usr/local/sbin/nakama-verify-customizations` after the
health check. Any failure restores the previous build automatically.

## Updating from upstream

```bash
cd /var/lib/nakama-deploy/build       # or a normal clone
git fetch upstream
git checkout main
git merge upstream/main               # resolve conflicts, keep the table above
bun install --frozen-lockfile --ignore-scripts
bun run --filter @nakama/server build
bun test apps/server/src/providers/acp packages/db/src
git push origin main
git push origin main:production       # fast-forward only
sudo /usr/local/sbin/nakama-deploy --ref production
```

If a conflict drops a customization, the verifier fails the deploy and rolls
back. Never reset the fork to upstream; merge instead.

## Runtime assets outside git

A full server rebuild must restore these separately:

- `/usr/local/bin/omp`
- `/var/lib/nakama/.omp/{agent,9router}`
- `/var/lib/nakama/.ssh/{config,id_terate_nakama,known_hosts}`
- the Terate profile workspace
- `/usr/local/bin/terate-camera-stats` and `terate-camera-stats.timer` on `terate`
- `/var/lib/nakama/nakama.sqlite` and backups
