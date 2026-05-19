---
layout: post
title: "Patches as Correctness Oracles in Smart Contract Exploit Generation"
date: 2025-05-19
excerpt: "How we evaluated PoCo, our agentic system for generating proof-of-concept exploits for smart contract vulnerabilities, using security patches as a correctness oracle."
paper_url: "https://arxiv.org/abs/2511.02780"
paper_label: "Paper"
artifact_url: "https://github.com/ASSERT-KTH/Proof-of-Patch/"
artifact_label: "Dataset"
dek: "This post is about how to evaluate whether LLM-generated proof-of-concept exploits are genuinely correct, not just superficially plausible. I explain the patch-based oracle we used in PoCo, why it gives a stronger signal than common alternatives, and what assumptions and limitations come with that choice."
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

*\*Reverse direction: in EVMBench, the PoC validates the patch. See also "Do automated fixes truly mitigate smart contract exploits?" Bobadilla, Jin, Monperrus, TSE 2025.*

A common alternative is task-specific oracles. PoCGen, for example, uses vulnerability-type-specific checks: for command injection, it verifies whether a command was executed; for prototype pollution, it checks whether a property was added to `Object.prototype`. The clear advantage is that these can provide feedback *during* generation, not just post-hoc. But they vary in strength. For prototype pollution, as the authors note, an agent can directly assign a property to `Object.prototype` without exercising the vulnerable code path. For command injection, the oracle checks whether a specific binary can be executed, but it is not clear what prevents the agent from calling that binary directly rather than through the vulnerable code path. Task-specific oracles also require designing a check for each vulnerability type. Our dataset spans a wide range, from reentrancy to access control to logic errors, where protocol-specific invariants resist generic encoding.

In the smart contract domain, A1 (Gervais and Zhou, 2025) uses money extraction as the success criterion: the agent must produce an exploit that results in net positive balance. This is a strong oracle for DeFi exploits with extractable value, but it does not cover governance attacks, access control violations, or DoS conditions where no funds move. It also requires deployed contracts with on-chain state; we work in the pre-deployment auditing phase, where no such state exists.

Prompt2Pwn takes yet another approach: the exploit must compile and pass a Foundry assertion tied to a vulnerability-class invariant. An open question is how the framework verifies that the assertion meaningfully captures the intended vulnerability.

Interestingly, EVMBench (OpenAI, March 2026) arrived at the same core idea we did, applied to patching rather than PoC generation: if the exploit fails after applying the fix, the fix is correct. Worth noting that patch incompleteness is a bigger concern in their setting. Their oracle says "this fix blocks the known exploit," but the fix might leave alternative paths open. We ask the reverse: does the PoC exercise the behavior the patch removes?

In summary, patch-based oracles encode a causal change that should remove the vulnerability, which makes them difficult to fool. This relies on focused patches without unrelated changes. The method requires curating verified minimal patches, provides no signal during generation, and only applies when a patch exists. In our experience, the precision justified these costs.

## Closing thoughts

Evaluating agentic security tools forces you to confront what "correct" means. For PoC generation, patch-based oracles offer a strong, vulnerability-agnostic signal that is resistant to gaming in a way that symptom-based oracles are not. It is not a formal guarantee; it depends on minimal, well-curated patches and says nothing about the qualities beyond correctness.

A PoC with a single assertion verifying a balance change tells you the exploit worked. A PoC with multiple assertions checking intermediate state, such as role assignment, storage changes, or control flow, tells you *how* it worked. The second is more useful to a developer trying to understand and fix the issue. We saw wide variation across models but had no ground truth for what good assertion practice looks like in generated exploits. Whether this matters depends on the deployment context: automated verification may not need human-readable output, but auditor-facing tools do.

We also lack ways to measure partial success. Some of our agents failed by exhausting their budget while on the right track, one iteration from a correct PoC. That is fundamentally different from never finding the right code path, but our evaluation treats both the same. Capturing "almost there," the kind of near-miss a human collaborator could finish, would tell us more about where these systems actually break down.

---

*PoCo: Agentic Proof-of-Concept Exploit Generation for Smart Contracts.* Andersson, V., Bobadilla, S., Hobbelhagen, H., & Monperrus, M. (2025). ACM Transactions on Software Engineering and Methodology (TOSEM), Special Issue on Agentic AI.
