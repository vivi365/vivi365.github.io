---
layout: page
title: Talks
permalink: /talks/
---

<section id="talks-archive" markdown="1">
{% assign all_talks = site.data.talks | sort: "sort_date" | reverse %}
{% for talk in all_talks %}
<p><strong>{{ talk.title }}</strong>
<em>{{ talk.location }}, {{ talk.date_display }}</em>{% for link in talk.links %} · <a href="{{ link.url }}" target="_blank"{% unless link.url contains '/assets/' %} rel="noopener"{% endunless %} class="slides-link">{% if link.kind == "slides" %}<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M9 11H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm2-7h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11z"/></svg>{% elsif link.kind == "watch" %}<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M8 5v14l11-7z"/></svg>{% endif %} {{ link.label }}</a>{% endfor %}
<br>{{ talk.description }}</p>
{% endfor %}

</section>
