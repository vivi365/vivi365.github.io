---
layout: page
title: Projects
permalink: /projects/
---

<ul class="project-list">
  {% for project in site.projects %}
    <li>
      <a href="{{ project.url | relative_url }}">{{ project.title }}</a>
    </li>
  {% endfor %}
</ul>