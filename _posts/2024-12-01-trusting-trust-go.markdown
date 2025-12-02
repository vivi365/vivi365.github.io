---
layout: post
title: "Trusting Trust: A Compiler Backdoor Demo in Go"
date: 2024-12-01
excerpt: "A demonstration of the Trusting Trust Attack, i.e. the elegant compiler backdoor, originally described by Ken Thompson in his 1984 Turing Award lecture."
---

<a href="https://github.com/vivi365/trustingtrust-go" class="repo-link" target="_blank" rel="noopener"><svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" width="16" height="16" style="display: inline-block; vertical-align: text-bottom; margin-right: 4px;"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>github.com/vivi365/trustingtrust-go</a>

A demonstration of the **Trusting Trust Attack**, i.e. compiler backdoor, originally described by Ken Thompson in his 1984 Turing Award lecture.

## The Attack

A compromised compiler can inject malicious code into binaries during compilation, even when the source code is clean. The attack persists through bootstrapping: when you compile a new version of the compiler from source, the malicious compiler infects the new version. This means the compromise survives compiler updates, making it difficult to detect and remove.

## The Demo

My implementation targets the Go compiler, demonstrating how a backdoored toolchain can:
- Inject malicious code into seemingly benign programs (like a login system)
- Persist across compiler rebuilds through bootstrapping
- Operate invisibly, leaving source code untouched

The demo is packaged in a Docker container for easy reproduction and includes a detailed technical explanation of the attack mechanism and potential defenses like reproducible builds and diverse double-compilation.

This was created for the Ethical Hacking course (FEP3370) at KTH, building upon prior work by [yrjan's untrustworthy_go](https://github.com/yrjan/untrustworthy_go) project.
