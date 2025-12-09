# Google Scholar Publication Sync

Automatically syncs publications from Google Scholar to `index.markdown`.

## Usage

**Test locally:**
```bash
uv run --with scholarly --with pyyaml python scripts/sync_publications.py --dry-run
```

**Run live:**
```bash
uv run --with scholarly --with pyyaml python scripts/sync_publications.py
```

## Automation

Runs weekly via GitHub Actions (Sundays 00:00 UTC). Creates PRs when new publications are detected.

**Manual trigger:** Go to Actions → "Sync Google Scholar Publications" → Run workflow

## How it works

1. Fetches publications from Google Scholar profile (user: XanNuj4AAAAJ)
2. Compares with existing publications in `index.markdown`
3. Adds new publications with matching formatting
4. Creates PR for review
