# Personal Website

This is a Jekyll-based personal website designed to showcase my research, projects, and publications.

## Structure

- `_config.yml`: Site configuration
- `_layouts/`: HTML templates for different page types
- `_includes/`: Reusable HTML components
- `_posts/`: News and blog posts
- `_projects/`: Project pages
- `assets/`: CSS, JavaScript, and images
- `index.markdown`: Homepage
- `about.markdown`: About page
- `projects.md`: Projects listing page

## Development

### Prerequisites

- Ruby 2.7.0 or higher
- Bundler

### Setup

1. Clone the repository
2. Run `bundle install` to install dependencies
3. Run `bundle exec jekyll serve` to start the development server

### Adding Content

#### News Posts

Create a new file in `_posts/` with the format `YYYY-MM-DD-title.markdown`:

```markdown
---
layout: post
title: "Post Title"
date: YYYY-MM-DD HH:MM:SS -0700
emoji: "📝"
---
Post content here.
```

#### Projects

Create a new file in `_projects/` with the format `project-name.md`:

```markdown
---
layout: project
title: "Project Title"
permalink: /projects/project-name
---
Project description here.
```

## Deployment

The site is automatically deployed to GitHub Pages when changes are pushed to the main branch.