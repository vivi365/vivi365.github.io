---
layout: home
title: Home
---

<section id="publications" markdown="1">

## Publications

<p class="publication-entry"><span class="publication-title">PoCo: Agentic Proof-of-Concept Exploit Generation for Smart Contracts</span><span class="publication-authors"><span class="author-highlight">Vivi Andersson</span>*, Sofia Bobadilla*, Harald Hobbelhagen, et al.</span><span class="publication-links"> · <a href="https://arxiv.org/abs/2511.02780" target="_blank" class="paper-link"><svg fill="currentColor" stroke="currentColor" stroke-width="15"><use href="#icon-arxiv"/></svg>Paper</a></span><span class="publication-meta"><em>Accepted for the ACM TOSEM Special Issue on Agentic AI in Software</em>, 2026</span></p>

<p class="publication-entry"><span class="publication-title">Evaluating Cryptographic API Misuse Detectors for Go</span><span class="publication-authors"><span class="author-highlight">Vivi Andersson</span> and Martin Monperrus</span><span class="publication-links"> · <a href="https://arxiv.org/abs/2604.24085" target="_blank" class="paper-link"><svg fill="currentColor" stroke="currentColor" stroke-width="15"><use href="#icon-arxiv"/></svg>Paper</a></span><span class="publication-meta"><em>Proceedings of the 4th International Workshop on Software Vulnerability Management (SVM '26)</em>, 2026</span></p>

<p class="publication-entry"><span class="publication-title">GoSurf: Identifying Software Supply Chain Attack Vectors in Go</span><span class="publication-authors">Carmine Cesarano, <span class="author-highlight">Vivi Andersson</span>, Roberto Natella, et al.</span><span class="publication-links"> · <a href="https://dl.acm.org/doi/10.1145/3666019.3666906" target="_blank" class="paper-link"><svg fill="currentColor" stroke="currentColor" stroke-width="15"><use href="#icon-arxiv"/></svg>Paper</a></span><span class="publication-meta"><em>Proceedings of the 2024 Workshop on Software Supply Chain Offensive Research and Ecosystem Defenses</em>, pp. 33-42, 2024</span></p>

<p class="publication-entry"><span class="publication-title">Geth Rebuild: Verifiable Builds for Go Ethereum</span><span class="publication-authors"><span class="author-highlight">Vivi Andersson</span> · Supervised by Javier Ron</span><span class="publication-links"> · <a href="https://urn.kb.se/resolve?urn=urn:nbn:se:kth:diva-355285" target="_blank" class="paper-link"><svg fill="currentColor" stroke="currentColor" stroke-width="15"><use href="#icon-arxiv"/></svg>Paper</a></span><span class="publication-meta"><em>MSc Thesis, KTH Royal Institute of Technology</em>, 2024</span></p>

---

<p class="publication-entry"><span class="publication-title">AI Agents Decline Free Beer🍺 but Have a Big Heart❤️</span><span class="publication-authors">Carmine Cesarano, <span class="author-highlight">Vivi Andersson</span>, Julien Malka, et al.</span><span class="publication-links"> · <a href="https://www.diva-portal.org/smash/record.jsf?pid=diva2:2055070" target="_blank" class="paper-link"><svg fill="currentColor" stroke="currentColor" stroke-width="15"><use href="#icon-arxiv"/></svg>Paper</a></span><span class="publication-meta"><em>SIGBOVIK: A Record of the Proceedings of SIGBOVIK 2026</em>, 2026</span></p>


<p class="publication-entry"><span class="publication-title">UPPERCASE IS ALL YOU NEED</span><span class="publication-authors"><span class="author-highlight">Vivi Andersson</span>, Benoit Baudry, Sofia Bobadilla, et al.</span><span class="publication-links"> · <a href="https://sigbovik.org/2025/proceedings.pdf" target="_blank" class="paper-link"><svg fill="currentColor" stroke="currentColor" stroke-width="15"><use href="#icon-arxiv"/></svg>Paper</a></span><span class="publication-meta"><em>SIGBOVIK: A Record of the Proceedings of SIGBOVIK 2025</em>, pp. 24-35, 2025</span></p>

</section>

<section id="talks" markdown="1">

## Talks

{% assign featured_talks = site.data.talks | where: "featured", true | sort: "sort_date" | reverse %}
{% for talk in featured_talks %}
<p><strong>{{ talk.title }}</strong>
<em>{{ talk.location }}, {{ talk.date_display }}</em>{% for link in talk.links %} · <a href="{{ link.url }}" target="_blank"{% unless link.url contains '/assets/' %} rel="noopener"{% endunless %} class="slides-link">{% if link.kind == "slides" %}<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M9 11H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm2-7h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11z"/></svg>{% elsif link.kind == "watch" %}<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M8 5v14l11-7z"/></svg>{% endif %} {{ link.label }}</a>{% endfor %}
<br>{{ talk.description }}</p>
{% endfor %}

<p class="talks-archive-link"><a href="{{ '/talks/' | relative_url }}">See all talks</a></p>
</section>

<section id="teaching" markdown="1">

## Teaching

**EP120U Computer Systems**
Teaching Assistant.
Responsible for teaching modules on operating systems, high-level languages, virtual machines, and assembly.

**MSc Theses Supervision**
Supervisor.
Topics on machine learning for vulnerability detection, open source software analysis, and software supply chain security.

Finished supervised theses:
Ouday Ahmed, *An Empirical Study of Code Pre-trained Model Embeddings for Software Vulnerability Detection* Feb 2026.


</section>
