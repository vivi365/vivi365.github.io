# AGENTS.md

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
