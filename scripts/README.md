# Google Scholar Publication Sync

Automatically syncs publications from Google Scholar to `index.markdown`.

## Usage

**Test locally:**
```bash
uv run --with "scholarly==1.7.11" --with "pyyaml==6.0.1" --with "httpx<0.28" python scripts/sync_publications.py --dry-run
```

**Run live:**
```bash
uv run --with "scholarly==1.7.11" --with "pyyaml==6.0.1" --with "httpx<0.28" python scripts/sync_publications.py
```

## Automation

Runs weekly via GitHub Actions (Sundays 00:00 UTC). Creates PRs when new publications are detected.

**Manual trigger:** Go to Actions → "Sync Google Scholar Publications" → Run workflow

## How it works

1. Fetches publications from Google Scholar profile (user: XanNuj4AAAAJ)
2. Compares with existing publications in `index.markdown`
3. Normalizes author display to the site's house style:
   - bold `Vivi Andersson`
   - show up to 3 authors before `et al.`
   - use consistent separators
4. Applies title-based overrides from `scripts/publication_overrides.yml` for special cases like equal contribution markers
   and custom author-line notes such as thesis supervision
5. Writes publications using explicit HTML wrappers for title, authors, and metadata
6. Creates PR for review
