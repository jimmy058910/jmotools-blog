---
title: "JMo Security v1.0.5 — Cleaner Tool Installs, Smarter Merge Workflow"
description: "v1.0.5 tightens two rough edges DevSecOps teams hit regularly: platform-aware scanner installation prompts and the /merge-pr skill for AI-assisted PR security gates."
pubDate: 2026-04-30
author: "Jimmy"
tags: ["security", "devsecops", "open-source", "python", "devtools"]
draft: true
---

Tool installation in security pipelines is one of those things that shouldn't require a documentation deep-dive every time. v1.0.5 tightens two rough edges that SOC engineers and DevSecOps teams hit regularly: getting the right scanners installed for your platform, and keeping pull requests clean while security checks are running.

## What's New in v1.0.5

### Smarter `jmo tools install` — Platform-Aware Prompts

The tool installation experience got a significant UX pass. On platforms where some scanners require manual installation steps (Windows PowerShell-based tools, macOS Homebrew dependencies, certain Linux packages), `jmo tools install` now prompts you interactively with the exact command to run rather than silently skipping or logging a generic error.

Before v1.0.5:
```
[WARN] Prowler requires manual install on Windows. See docs.
```

After v1.0.5:
```
Prowler requires manual setup on Windows.
Run in PowerShell (Admin): winget install prowler-cloud.prowler
Skip this tool? [y/N]:
```

This is especially important for the tools that sit in `MANUAL_INSTALL_TOOLS` — the subset of the 28-scanner suite that can't be fully automated cross-platform. You now get precise, copy-pasteable instructions rather than a trip to the documentation.

Full manual installation reference: [docs.jmotools.com/MANUAL_INSTALLATION](https://docs.jmotools.com/MANUAL_INSTALLATION)

### `/merge-pr` Skill for AI-Assisted PR Cleanup

For teams using JMo Security with Claude Code (via the MCP integration), v1.0.5 ships the `/merge-pr` skill — a structured workflow that handles the pre-merge security gate.

The skill:
1. Runs JMo Security against the diff surface of the PR
2. Surfaces only findings introduced by the PR (not pre-existing)
3. Generates a structured finding summary the reviewer can act on
4. Proposes suppressions for false positives, with rationale

The goal is to make "run security before merge" a habit that takes under two minutes rather than an interruption that gets skipped. See [MCP Setup](https://docs.jmotools.com/MCP_SETUP) for configuration.

### Clean Release Streak

v1.0.5 continues the post-1.0.0 release cadence: five consecutive releases with no regressions against the 8,000+ test suite, 87%+ coverage maintained.

## Getting v1.0.5

```bash
# pip
pip install --upgrade jmo-security

# Docker
docker pull ghcr.io/jimmy058910/jmo-security:latest

# Verify
jmo --version
```

Full changelog: [github.com/jimmy058910/jmo-security-repo/releases/tag/v1.0.5](https://github.com/jimmy058910/jmo-security-repo/releases/tag/v1.0.5)

## What's Next

The next focus area is compliance reporting ergonomics — making the six-framework mapping (OWASP, CWE, NIST CSF, PCI DSS, CIS, MITRE ATT&CK) more useful in audit handoffs. If you use JMo Security for compliance prep and have a workflow you've built around it, I'd like to hear it: [open a discussion](https://github.com/jimmy058910/jmo-security-repo/discussions).

---

*JMo Security is an open-source terminal-first security audit toolkit built by a SOC engineer who got tired of stitching together five different tools. It orchestrates 28 scanners with cross-tool deduplication, local SQLite audit history, and six-framework compliance mapping.*

*[GitHub](https://github.com/jimmy058910/jmo-security-repo) · [Documentation](https://docs.jmotools.com) · [Ko-fi](https://ko-fi.com/jmosecurity) · [GitHub Sponsors](https://github.com/sponsors/jimmy058910)*
