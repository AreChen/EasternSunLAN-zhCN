# AGENTS.md

This repository maintains the Simplified Chinese localization pack for EasternSunLAN LAN.

Use this file as the operational guide for future agents. Keep changes scoped, preserve runtime string contracts, and verify packages before claiming a release is ready.

## Project Scope

- Repository: `AreChen/EasternSunLAN-zhCN`
- Local repo path used during setup: `H:\D2RLAN\EasternSunLAN-zhCN`
- Current mod working copy, if available: `H:\D2RLAN\D2R\Mods\EasternSunLAN`
- Older high-quality reference, if available: `H:\D2RLAN\REF\EasternSunLANx`

This repo contains only localization assets and release tooling. Do not add the full mod, save files, gameplay data, HD assets, or generated zip files to git history.

## Directory Structure

- `strings/`
  - Authoritative D2R string JSON files.
  - These are packaged into `EasternSunLAN.mpq/data/local/lng/strings` in the release zip.
- `strings/translated_strings/`
  - Mirror files used by the current localization workflow.
  - When changing zhCN in a main file and the same key exists in the matching `translated_*.json`, keep both values identical.
- `strings/metadata/`
  - Metadata files copied into releases. Do not translate unless there is a clear localization reason.
- `localization/`
  - Audit notes, batch records, and translation work logs.
  - JSONL batch records should generally use `{ "file", "Key", "enUS", "zhCN" }`.
- `tools/build-pack.ps1`
  - Builds a release zip from `strings/`.
- `tools/verify-pack.ps1`
  - Expands a release zip and checks manifest hashes, package structure, and JSON parsing.
- `dist/`
  - Generated output, ignored by git. Release zip files belong here locally and in GitHub Releases, not in commits.
- `VERSION`
  - Source of truth for `MOD_VERSION`, `PACK_VERSION`, and `BUILD_DATE`.
- `CHANGELOG.md`
  - Human-readable release notes.
- `.github/workflows/build.yml`
  - CI build and verification for pushes and pull requests.

## Translation Rules

- Edit `zhCN` values only unless an upstream sync explicitly requires structural changes.
- Never change `Key` values.
- Do not change `enUS` unless syncing from a newer upstream mod version and documenting that sync.
- Preserve JSON structure and array order unless there is a strong reason to do otherwise.
- Preserve D2R color codes such as `ÿc1`, `ÿc2`, `ÿc@`, and reset codes. If a source zhCN string contains color codes, the replacement must intentionally preserve or justify any change.
- Preserve non-positional printf placeholders in source order, for example `%d`, `%s`, `%+d`.
- Positional placeholders such as `%0`, `%1`, `%2` may be reordered when Chinese grammar requires it.
- Preserve escaped newlines, tabs, punctuation with gameplay meaning, and formula-like text.
- Keep rune names in English. Do not import older reference translations that Chinese-localize rune names.
- Do not blindly copy the old reference folder. It is useful for terminology and quality, but it can be version-stale.

Preferred terminology:

- `Attack Rating` -> `攻击准确率`
- Attribute `Energy` -> `精力`
- `Cold Absorb` -> `冰冷吸收`
- Skill `Hydra` -> `九头蛇`
- Skill `Frozen Orb` -> `冰霜之球`
- `Amplify Damage` -> `伤害加深`
- `Magic Find` / item finding stat -> `魔法物品获取率`

When uncertain, compare current `enUS`, current `zhCN`, and the reference version. Prefer accurate game terminology over literal translation.

## Localization Workflow

1. Inspect scope with `git status -sb`.
2. Identify target files under `strings/`.
3. For broad review, split read-only analysis by domain:
   - items: `item-names`, `item-gems`, `item-nameaffixes`, `item-modifiers`
   - skills and modifiers: `skills`, `item-modifiers`
   - world text: `levels`, `monsters`, `npcs`, `quests`, `objects`, `ui`
4. Build a candidate list before bulk editing. Prefer JSONL records with file, key, English guard text, and replacement zhCN.
5. Apply changes conservatively.
6. Sync corresponding `translated_strings/translated_*.json` entries when they exist.
7. Run verification before committing or releasing.

For large translation passes, use subagents only for read-only discovery and candidate generation. The main agent should own final edits, placeholder checks, and release packaging.

## Validation Commands

Run these from the repository root.

Parse all JSON files:

```powershell
$errors = @()
Get-ChildItem -LiteralPath .\strings -Recurse -File -Filter *.json | ForEach-Object {
  try {
    $null = Get-Content -LiteralPath $_.FullName -Raw | ConvertFrom-Json
  } catch {
    $errors += $_.FullName
  }
}
if ($errors.Count -gt 0) { $errors; exit 1 }
"JSON OK"
```

Build and verify the package:

```powershell
pwsh ./tools/build-pack.ps1
pwsh ./tools/verify-pack.ps1 -ZipPath ./dist/EasternSunLAN_zhCN_pack_v3.11.09-zhCN.1.zip
```

The verification output must show:

- `hashMismatches`: `0`
- `jsonErrors`: `0`
- `stringsRootPresent`: `true`

If the pack version changes, update the zip path accordingly.

## Versioning

Release tags use:

```text
v{MOD_VERSION}-zhCN.{revision}
```

Examples:

- First pack for mod `3.11.09`: `v3.11.09-zhCN.1`
- Translation-only update for the same mod: `v3.11.09-zhCN.2`
- New upstream mod `3.11.10`: `v3.11.10-zhCN.1`

Before release:

1. Update `VERSION`.
2. Update `CHANGELOG.md`.
3. Rebuild the zip.
4. Verify the zip.
5. Commit source changes.
6. Create a GitHub Release and upload the zip.

## Git and Release Workflow

If the local network requires the known proxy, set it before GitHub operations:

```powershell
$env:HTTP_PROXY = "http://127.0.0.1:18085"
$env:HTTPS_PROXY = "http://127.0.0.1:18085"
$env:ALL_PROXY = "http://127.0.0.1:18085"
git config http.proxy http://127.0.0.1:18085
git config https.proxy http://127.0.0.1:18085
```

Normal release sequence:

```powershell
git status -sb
pwsh ./tools/build-pack.ps1
pwsh ./tools/verify-pack.ps1 -ZipPath ./dist/EasternSunLAN_zhCN_pack_v3.11.09-zhCN.1.zip
git add .gitattributes .github .gitignore AGENTS.md CHANGELOG.md README.md VERSION localization strings tools
git commit -m "Update zhCN pack for v3.11.09-zhCN.1"
git push
gh release create v3.11.09-zhCN.1 ./dist/EasternSunLAN_zhCN_pack_v3.11.09-zhCN.1.zip --repo AreChen/EasternSunLAN-zhCN --target main --title "EasternSunLAN zhCN Pack v3.11.09-zhCN.1" --notes-file ./release-notes/v3.11.09-zhCN.1.md
```

If there is no release notes file, pass concise notes with `--notes`.

After release, verify:

```powershell
git ls-remote origin refs/heads/main refs/tags/v3.11.09-zhCN.1
gh release view v3.11.09-zhCN.1 --repo AreChen/EasternSunLAN-zhCN --json tagName,url,name,isDraft,isPrerelease,assets
```

The release should not be draft unless explicitly requested. The asset should be a zip with state `uploaded`.

## What Not To Do

- Do not commit `dist/` or generated zip files.
- Do not commit the full `EasternSunLAN.mpq` folder from the mod.
- Do not bulk replace current translations from the reference folder without reviewing version drift.
- Do not remove or rename keys to make translation easier.
- Do not ignore placeholder or color-code mismatches.
- Do not mark a release complete until the build and verify scripts have run successfully.

## Current Known Baseline

At the time this file was created:

- `MOD_VERSION=3.11.09`
- `PACK_VERSION=3.11.09-zhCN.1`
- GitHub Release: `v3.11.09-zhCN.1`
- Release asset: `EasternSunLAN_zhCN_pack_v3.11.09-zhCN.1.zip`
- Package structure: `EasternSunLAN.mpq/data/local/lng/strings`
