---
layout: page
title: Posts
permalink: /posts/
---

<div class="posts-list">
  {% for post in site.posts %}
    <article class="post-item">
      <h2><a href="{{ post.url | relative_url }}">{{ post.title }}</a></h2>
      <p class="post-date">{{ post.date | date: "%B %d, %Y" }}</p>
      <div class="post-excerpt">{{ post.excerpt }}</div>
    </article>
  {% endfor %}
</div>