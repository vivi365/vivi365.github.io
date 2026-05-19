# AGENTS.md

## Local Build

This site is a Jekyll app.

Preferred native workflow:

1. Use `Ruby >= 2.7.0`
2. Run `bundle install`
3. Run `bundle exec jekyll serve --livereload --host 127.0.0.1 --port 4000`
4. Open `http://127.0.0.1:4000`

If the host Ruby is too old for the pinned Jekyll version, use Docker:

```sh
docker run --rm -p 4000:4000 -p 35729:35729 \
  -v /Users/viviandersson/code/vivi365.github.io:/srv/jekyll \
  -w /srv/jekyll \
  -u 501:20 \
  -e HOME=/tmp \
  -e GEM_HOME=/tmp/gems \
  -e BUNDLE_PATH=/srv/jekyll/vendor/bundle \
  -e BUNDLE_APP_CONFIG=/srv/jekyll/.bundle \
  ruby:3.3 \
  sh -lc 'gem install --user-install bundler -v 2.4.22 && export PATH=/tmp/gems/bin:$PATH && bundle _2.4.22_ install && bundle _2.4.22_ exec jekyll serve --livereload --host 0.0.0.0 --port 4000'
```

Notes:

- This repository currently pins `jekyll ~> 4.4.1`, which requires `Ruby >= 2.7.0`.
- The Docker workflow installs gems into `vendor/bundle` in the repo, so subsequent runs are faster.
- LiveReload listens on port `35729`.

## Adding a Post

Posts live in [`_posts/`](/Users/viviandersson/code/vivi365.github.io/_posts).

When adding a new post:

1. Create a file named `YYYY-MM-DD-short-slug.markdown`
2. Use `layout: post`
3. Include `title`, `date`, and `excerpt` in the front matter
4. Add `dek` when the post benefits from a subtitle under the title/date
5. Keep the body in Markdown unless inline HTML is clearly needed

Recommended front matter:

```yaml
---
layout: post
title: "Post Title"
date: 2026-05-19
excerpt: "One-sentence summary used in post listings and metadata."
dek: "Optional subtitle shown on the post page under the title and date."
---
```

Post formatting notes:

- `excerpt` should be short and descriptive. It is used outside the post body, so it should work as a standalone summary.
- `dek` can be longer than `excerpt` and should frame the argument or scope of the post, not just repeat the title.
- Long-form post prose should read like an article, so prefer normal Markdown paragraphs and headings over homepage-style centered presentation.
- For patches or code diffs, use fenced `diff` blocks so added and removed lines are styled correctly:

```diff
--- a/file.sol
+++ b/file.sol
@@ -1,3 +1,3 @@
-old line
+new line
```

- Markdown tables are supported and will render with the post table styling.

## Publication Sync

Publications on the homepage are synced by [`scripts/sync_publications.py`](/Users/viviandersson/code/vivi365.github.io/scripts/sync_publications.py), with behavior documented in [`scripts/README.md`](/Users/viviandersson/code/vivi365.github.io/scripts/README.md).

Author formatting policy:

1. Bold `Vivi Andersson` inline using `<span class="author-highlight">...</span>`.
2. Show up to 3 authors before `et al.`
3. Use consistent separators:
   - one author: `Name`
   - two authors: `Name and Name`
   - three authors: `Name, Name, and Name`
   - more than three authors: `Name, Name, Name, et al.`
4. Publication entries use explicit HTML wrappers:
   - title: `<span class="publication-title">...</span>`
   - authors: `<span class="publication-authors">...</span>`
   - meta: `<span class="publication-meta">...</span>`
5. Do not use Markdown `**...**` to identify publication titles or author emphasis.
   Use `.publication-title` for titles and `.author-highlight` for inline name emphasis.
6. Use title-based overrides in [`scripts/publication_overrides.yml`](/Users/viviandersson/code/vivi365.github.io/scripts/publication_overrides.yml) for special cases like equal-contribution markers or custom author-line notes such as `· Supervised by Javier Ron`.

When changing publication formatting, update:

1. [`scripts/sync_publications.py`](/Users/viviandersson/code/vivi365.github.io/scripts/sync_publications.py)
2. [`scripts/publication_overrides.yml`](/Users/viviandersson/code/vivi365.github.io/scripts/publication_overrides.yml) if exceptions are needed
3. The current publication entries in [`index.markdown`](/Users/viviandersson/code/vivi365.github.io/index.markdown) if they need to be brought into sync immediately

## Adding a Talk

Talks are stored in [`_data/talks.yml`](/Users/viviandersson/code/vivi365.github.io/_data/talks.yml). The homepage shows only entries with `featured: true`. The full archive lives at [`/talks/`](/Users/viviandersson/code/vivi365.github.io/talks.markdown).

When adding a new talk:

1. Copy the slide deck into [`assets/talks/`](/Users/viviandersson/code/vivi365.github.io/assets/talks) using a date-first filename.
2. Prefer the schema `YYYY-MM-DD-short-slug.pdf`.
3. Add a new entry to [`_data/talks.yml`](/Users/viviandersson/code/vivi365.github.io/_data/talks.yml) with these fields:
   - `title`: full talk title as displayed
   - `location`: venue and city/country
   - `date_display`: human-readable date shown on the site
   - `sort_date`: ISO date used for ordering, `YYYY-MM-DD`
   - `description`: short summary
   - `featured`: `true` if it should appear on the homepage, otherwise `false`
   - `links`: a list of links with `label`, `url`, and `kind`

### Supported link kinds

- `slides`: rendered with the slide icon
- `watch`: rendered with the play icon
- `external`: rendered as plain text, useful for seminar or event pages

### Example

```yaml
- title: "Dagstuhl Seminar 26192. Evaluating Logical Correctness in Agentic PoC Exploit Generation"
  location: "Dagstuhl, Germany"
  date_display: "6 May 2026"
  sort_date: "2026-05-06"
  description: "A Dagstuhl talk focused on how we evaluated PoCo's logical correctness."
  featured: true
  links:
    - label: "Seminar"
      url: "https://www.dagstuhl.de/26192"
      kind: "external"
    - label: "Slides"
      url: "/assets/talks/2026-05-06-dagstuhl-poco-logical-correctness.pdf"
      kind: "slides"
```
