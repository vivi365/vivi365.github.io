---
layout: page
title: ""
permalink: /posts/
---

<p class="posts-feed-link">
  <a href="{{ '/feed.xml' | relative_url }}" aria-label="Subscribe to the writing RSS feed">
    <span class="rss-icon" aria-hidden="true">
      <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
        <circle cx="3" cy="13" r="1.5" fill="currentColor"/>
        <path d="M2 8.5a5.5 5.5 0 0 1 5.5 5.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
        <path d="M2 4a10 10 0 0 1 10 10" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
      </svg>
    </span>
  </a>
</p>

<div class="posts-list">
  {% for post in site.posts %}
    <article class="post-item">
      <h2><a href="{{ post.url | relative_url }}">{{ post.title }}</a></h2>
      <p class="post-date">{{ post.date | date: "%B %d, %Y" }}</p>
      <div class="post-excerpt">{{ post.excerpt }}</div>
    </article>
  {% endfor %}
</div>
