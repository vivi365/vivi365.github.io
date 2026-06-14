---
layout: post
title: "Patches as Correctness Oracles in Smart Contract Exploit Generation"
date: 2026-05-19
excerpt: "How we evaluated PoCo, our agentic system for generating proof-of-concept exploits for smart contract vulnerabilities, using security patches as a correctness oracle."
paper_url: "https://arxiv.org/abs/2511.02780"
paper_label: "Paper"
artifact_url: "https://github.com/ASSERT-KTH/Proof-of-Patch/"
artifact_label: "Dataset"
dek: "This post is about how to evaluate whether LLM-generated proof-of-concept exploits are logically correct, not simply superficially plausible. I explain the patch-based oracle we used in PoCo, why it gives a strong signal compares to alternative oracles, and what assumptions and limitations come with that choice."
---

## What is PoCo and the patch-based oracle

In mid 2025, we built PoCo to answer a practical question: can an LLM agent generate proof-of-concept exploits for smart contract vulnerabilities? It can, for most cases. This post is about the harder question that followed: how do we know the generated exploits are correct?

PoCo is joint work with Sofia Bobadilla, Harald Hobbelhagen, and Martin Monperrus, accepted for the TOSEM special issue on Agentic AI.

Vulnerability detection sits between two extremes. On one side, static analysis produces alerts that may or may not matter, and many get dismissed. On the other side, post-exploitation forensics tells you with certainty that a vulnerability was real, but only after damage is done. PoCs land in the middle: they prove a vulnerability is exploitable without waiting for an attacker to do it.

In the smart contract domain specifically, security audits are done before deployment, and in this step, auditors submit findings of vulnerabilities. The community has converged towards requiring PoCs showing how a bad state is reachable. A PoC in Foundry is a Solidity test function that sets up a scenario, executes the exploit, and asserts a post-condition such as a balance change or a privilege escalation.

However, crafting these PoCs has historically been manual work, requiring deep knowledge of the codebase and its runtime state. This creates a tension: time spent demonstrating existing findings is time not spent searching for new ones.

Under a budget cap of three dollars per vulnerability, PoCo generates correct PoCs for 17 of 23 cases. We also found that the agentic capabilities contribute more to success than the underlying model: our weakest open-weights model with the agent beats frontier models without it.

## Patches as a correctness oracle

During generation, PoCo has no external oracle telling it whether the PoC actually triggers the described vulnerability. Its only proxy for success is compilation and testing feedback. So we must evaluate true correctness post-hoc.

Our core insight is simple: a logically correct PoC exploit must pass (exploit succeeds) on the vulnerable version and fail (exploit is prevented) on the patched version.

Concretely, in the evaluation phase, after generation, we execute the PoC against the vulnerable codebase and observe the outcome. The PoC is well-formed if it passes on the vulnerable version, along with a few other requirements such as containing at least one assertion. We discard any PoCs that do not fulfill this (ill-formed). However, the PoC may still not make any sense; arbitrary assertions can be written to produce passing security tests. Therefore, we apply the patch to the codebase and execute the PoC again. If at least one test in the PoC fails, we consider the PoC logically correct, i.e., it was exercising a vulnerable path.

### Why we trust it

We have two necessary patch conditions for this to hold.

First, every patch in our dataset is accepted by the project's core developers and merged to main to mitigate the specific vulnerability. This gives a strong signal of patch correctness while avoiding author bias on deciding how to encode the vulnerability oracle. There is still a risk the patch is incomplete.

Second, we source only minimal patches. A common issue in patch-based evaluations is bundled changes: a commit that fixes the vulnerability alongside refactoring or other improvements. If the PoC fails on the patched version due to unrelated changes, we get a false signal. To avoid this, we manually curated a smaller but high-quality dataset. We only adopt patches where we can isolate the concrete vulnerability-fixing code. If we cannot distinguish it, we exclude the sample. The result is a benchmark of 23 real-world vulnerabilities called Proof-of-Patch.

Here are examples of the types of patches we source.

**A missing call.** In Basin's `Well.sol`, the patch replaces a plain array allocation with a call to `_updatePumps`. The vulnerable code computed reserves without updating pump state, which an attacker could exploit to manipulate pricing. The fix is a one-line substitution in two locations:

```diff
--- a/2023-07-basin/src/Well.sol
+++ b/2023-07-basin/src/Well.sol
@@ -355,7 +355,7 @@
         address recipient
     ) external nonReentrant returns (uint256 amountOut) {
         IERC20[] memory _tokens = tokens();
-        uint256[] memory reserves = new uint256[](_tokens.length);
+        uint256[] memory reserves = _updatePumps(_tokens.length);
```

**A missing validation.** In Cally's `Cally.sol`, the patch adds a single `require` statement checking that the token address contains code. Without this check, an attacker could create vaults with non-contract addresses. The fix is one added line:

```diff
--- a/2022-05-cally/contracts/src/Cally.sol
+++ b/2022-05-cally/contracts/src/Cally.sol
@@ -169,6 +169,7 @@
         require(durationDays > 0, "durationDays too small");
         require(tokenType == TokenType.ERC721 || tokenType == TokenType.ERC20, "Invalid token type");
+        require(token.code.length > 0, "token is not contract");
```

**A reordering of operations.** In Kelp's `LRTDepositPool.sol`, the patch moves the minting call (`_mintRsETH`) before the validation checks instead of after (checks-effects-interactions pattern). The original version was susceptible to reentrancy:

```diff
--- a/2023-11-kelp/src/LRTDepositPool.sol
+++ b/2023-11-kelp/src/LRTDepositPool.sol
@@ -125,6 +125,11 @@
         nonReentrant
         onlySupportedAsset(asset)
     {
+
+        // interactions
+        uint256 rsethAmountMinted = _mintRsETH(asset, depositAmount);
+
+
         // checks
         if (depositAmount == 0) {
             revert InvalidAmount();
@@ -137,8 +142,6 @@
             revert TokenTransferFailed();
         }

-        // interactions
-        uint256 rsethAmountMinted = _mintRsETH(asset, depositAmount);
```

Each of these patches changes only the vulnerability-relevant behavior: no refactoring, no feature additions, no formatting cleanup. This is what lets us trust the differential signal.

In contrast, we excluded a vulnerability whose only connected PR had 1630 additions and 1800 deletions, as we cannot isolate the vulnerability-fixing changes.

This means PoCo must produce a PoC that exercises specific protocol behavior that the patch removes. Because the patch is not available during generation, there is no risk of patch overfitting.

However, this correctness is not a formal guarantee. Two things could go wrong.

First, **semantic breakage**: the patch could break compilation of the PoC through interface changes, removed imports, or renamed functions. We catch this mechanically. If the PoC does not compile on the patched version, we do not count it as a failure signal.

Second, and more subtly, **incomplete reach**. An exploit may require multiple steps, and the PoC might only exercise some of them. If the patch affects an early step, the PoC fails on the patched version, and our oracle marks it as correct, even though the PoC never actually triggered the vulnerability. The PoC reached patched code without demonstrating the security violation. This is a real false-positive risk, although with minimal patches we hypothesize that reaching patched code is meaningful evidence.

To check for this, we manually verified against auditor-written reference PoCs for the subset where they exist. We found no case where the patch-differential criterion was satisfied by a PoC that missed the intended vulnerability.

### Alternative oracle models

Oracle choice determines what "correct" means. The table below summarizes how different approaches compare:

| | Signal type | Online? | Strength | Limitation |
|---|---|---|---|---|
| **Task-specific** (PoCGen) | Observable symptom | Yes | Guides generation | May pass for wrong reason |
| **Profitability** (A1) | Net balance change | Yes | Hard to fake | Misses non-profitable vulnerabilities |
| **Assertion-based** (Prompt2Pwn) | Foundry assertion | No | Easy to automate | May not align with the vulnerability |
| **Patch-based** (PoCo, EVMBench*) | Behavioral diff | No | Encodes causal change | Requires minimal trusted patch |

*\*Reverse direction: in EVMBench, the PoC validates the patch. See also ["Do automated fixes truly mitigate smart contract exploits?" Bobadilla, Jin, Monperrus, TSE 2025](https://arxiv.org/abs/2501.04600).*

A common alternative is task-specific oracles. PoCGen, for example, uses vulnerability-type-specific checks: for command injection, it verifies whether a command was executed; for prototype pollution, it checks whether a property was added to `Object.prototype` [[Simsek et al. 2025]](https://arxiv.org/abs/2506.04962). The clear advantage is that these can provide feedback *during* generation, not just post-hoc. But they vary in strength. For prototype pollution, as the authors note, an agent can directly assign a property to `Object.prototype` without exercising the vulnerable code path. For command injection, the oracle checks whether a specific binary can be executed, but it is not clear what prevents the agent from calling that binary directly rather than through the vulnerable code path. Task-specific oracles also require designing a check for each vulnerability type. Our dataset spans a wide range, from reentrancy to access control to logic errors, where protocol-specific invariants resist generic encoding.

In the smart contract domain, A1 uses money extraction as the success criterion: the agent must produce an exploit that results in net positive balance [[Gervais and Zhou 2025]](https://arxiv.org/abs/2507.05558). This is a strong oracle for DeFi exploits with extractable value, but it does not cover governance attacks, access control violations, or DoS conditions where no funds move. It also requires deployed contracts with on-chain state; we work in the pre-deployment auditing phase, where no such state exists.

Prompt2Pwn takes yet another approach: the exploit must compile and pass a Foundry assertion tied to a vulnerability-class invariant [[Xiao et al. 2025]](https://arxiv.org/abs/2508.01371). An open question is how the framework verifies that the assertion meaningfully captures the intended vulnerability.

Interestingly, EVMBench arrived at the same core idea we did, applied to patching rather than PoC generation: if the exploit fails after applying the fix, the fix is correct [[Wang et al. 2026]](https://arxiv.org/abs/2603.04915). Worth noting that patch incompleteness is a bigger concern in their setting. Their oracle says "this fix blocks the known exploit," but the fix might leave alternative paths open. We ask the reverse: does the PoC exercise the behavior the patch removes?

In summary, patch-based oracles encode a causal change that should remove the vulnerability, which makes them difficult to fool. This relies on focused patches without unrelated changes. The method requires curating verified minimal patches, provides no signal during generation, and only applies when a patch exists. In our experience, the precision justified these costs.

## Closing thoughts

Evaluating agentic security tools requires defining what "correct" means. For smart contract PoC exploits, patch-based oracles offer a strong, vulnerability-agnostic signal that resists gaming in a way that symptom-based oracles may not. Yet it is not a formal guarantee; it depends on minimal, well-curated patches such as those in Proof-of-Patch.

Correctness is only one axis. The PoCs we generate vary widely in function and style across models, and we have no ground truth for what makes an exploit useful to a human protocol stakeholder, or whether usefulness should be a criterion at all.

A second missing axis is partial success. Some of our agents failed by exhausting their budget while on the right track, one iteration away from a correct PoC. That is more meaningful than never approaching a solution at all, yet a binary correct/incorrect metric equates them. Capturing "almost there," in the style of process-based rewards [[Uesato et al. 2022]](https://arxiv.org/abs/2211.14275), would tell us more about where current agentic systems struggle. As models start to saturate such benchmarks [[AISI 2026]](https://www.aisi.gov.uk/blog/how-fast-is-autonomous-ai-cyber-capability-advancing), these nuances matter more.

---

## Cite this paper

<div class="post-citation-block">
<button class="copy-citation-button" type="button" aria-label="Copy BibTeX citation" title="Copy BibTeX citation">
  <svg class="copy-icon" viewBox="0 0 24 24" aria-hidden="true">
    <rect x="9" y="9" width="10" height="10" rx="1.5"></rect>
    <path d="M15 9V6.5A1.5 1.5 0 0 0 13.5 5h-7A1.5 1.5 0 0 0 5 6.5v7A1.5 1.5 0 0 0 6.5 15H9"></path>
  </svg>
  <svg class="copied-icon" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M7 12.5l3.1 3.1L17.2 8.5"></path>
  </svg>
</button>
<pre><code>@article{andersson2025poco,
author = {Andersson, Vivi and Bobadilla, Sofia and Hobbelhagen, Harald and Monperrus, Martin},
title = {PoCo: Agentic Proof-of-Concept Exploit Generation for Smart Contracts},
year = {2025},
doi = {10.1145/3816704},
journal = {ACM Trans. Softw. Eng. Methodol.}
}</code></pre>
</div>

## References

<div class="post-references">

<p>AI Security Institute. "How fast is autonomous AI cyber capability advancing?" <em>AISI Blog</em>, May 2026.</p>

<p>Bobadilla, Sofia, Monica Jin, and Martin Monperrus. "Do automated fixes truly mitigate smart contract exploits?" <em>IEEE Transactions on Software Engineering</em>, 2025.</p>

<p>Gervais, Arthur, and Liyi Zhou. "AI Agent Smart Contract Exploit Generation." <em>arXiv preprint arXiv:2507.05558</em>, 2025.</p>

<p>Simsek, Deniz, Aryaz Eghbali, and Michael Pradel. "PoCGen: Generating Proof-of-Concept Exploits for Vulnerabilities in npm Packages." <em>arXiv preprint arXiv:2506.04962</em>, 2025.</p>

<p>Uesato, Jonathan, Nate Kushman, Ramana Kumar, et al. "Solving math word problems with process- and outcome-based feedback." <em>arXiv preprint arXiv:2211.14275</em>, 2022.</p>

<p>Wang, Justin, Andreas Bigger, Xiaohai Xu, et al. "EVMbench: Evaluating AI Agents on Smart Contract Security." <em>arXiv preprint arXiv:2603.04915</em>, 2026.</p>

<p>Xiao, Zeke, Qin Wang, Yuekang Li, and Shiping Chen. "Prompt to Pwn: Automated Exploit Generation for Smart Contracts." <em>arXiv preprint arXiv:2508.01371</em>, 2025.</p>

</div>
