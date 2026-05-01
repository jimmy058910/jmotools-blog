---
title: "JMo Security v1.0.0: One Command to Run 28 Security Scanners"
description: "Introducing JMo Security — a terminal-first, open-source toolkit that orchestrates 28 scanners, normalizes output, deduplicates findings, and maps to 6 compliance frameworks in one command."
pubDate: 2026-04-15
author: "Jimmy"
tags: ["devsecops", "security", "open-source", "python", "devtools"]
draft: true
---

Running security tools on your codebase is table stakes for any serious engineering team. But the reality is painful: you need TruffleHog for secrets, Semgrep for static analysis, Trivy for container vulnerabilities, Checkov for IaC misconfigurations, OWASP ZAP for web endpoints, and a dozen others — each with different output formats, different severity scales, and different ways to invoke them.

Most teams run one or two of these. The rest get skipped because nobody has time to wire up 28 different tools.

That's exactly the problem JMo Security was built to solve.

---

## What is JMo Security?

**JMo Security** is a terminal-first, open-source security audit toolkit that orchestrates 28+ industry-standard security scanners through a single unified CLI.

One command. Every category. Normalized output.

```bash
jmo scan --profile balanced
```

That's it. JMo invokes up to 18 tools in parallel — secrets detection, SAST, SCA, SBOM generation, IaC scanning, container analysis, DAST, shell linting, malware scanning — normalizes every finding to a common schema, deduplicates across tools (cutting noise by 30–40%), maps to 6 compliance frameworks, and outputs results in JSON, SARIF, Markdown, CSV, or an interactive HTML dashboard.

---

## The Problem: Security Tool Fragmentation

Modern application security requires coverage across at least 8 categories:

| Category | What it catches |
|----------|----------------|
| Secrets | API keys, tokens, credentials in code |
| SAST | Code-level vulnerabilities |
| SCA | Vulnerable dependencies |
| SBOM | Software inventory and license risk |
| IaC | Terraform, Kubernetes, Helm misconfigs |
| Container | Image-level CVEs and misconfigurations |
| DAST | Live web endpoint vulnerabilities |
| Compliance | Policy violations (CIS, NIST, PCI DSS) |

Running these individually means:
- Different invocation syntax per tool
- Different output formats (JSON, XML, SARIF, text…)
- Duplicate findings across tools (TruffleHog and Semgrep both flag the same secret)
- No unified severity scale
- No compliance mapping
- No historical tracking to measure improvement

Engineering teams either build custom glue scripts (fragile, maintenance burden) or just skip most tools (security gaps).

---

## JMo's Solution: The Two-Phase Architecture

JMo uses a clean two-phase approach:

### Phase 1: Scan

Invokes tools in parallel based on your chosen profile. Each tool writes its raw output to a structured results directory.

### Phase 2: Report

Normalizes every tool's output to the **CommonFinding schema v1.2.0**, deduplicates using fingerprint-based similarity clustering (0.65 threshold), enriches with compliance framework mappings, and produces unified output.

This separation means you can re-run reports on existing results without re-scanning, swap in new output formats, and build CI/CD pipelines that consume structured JSON.

---

## 28 Tools, 12 Categories

JMo Security v1.0.0 integrates 28 scanners across 12 security categories:

| Category | Tools |
|----------|-------|
| Secrets | TruffleHog, Nosey Parker, Semgrep-Secrets |
| SAST | Semgrep, Bandit, Gosec, Horusec, Bearer |
| SBOM | Syft, CDXgen, ScanCode |
| SCA | Trivy, Grype, OWASP Dependency-Check |
| IaC | Checkov, Checkov-CICD |
| Cloud/CSPM | Prowler, Kubescape |
| DAST | OWASP ZAP, Nuclei, Akto |
| Dockerfile/Shell | Hadolint, ShellCheck |
| Malware | YARA |
| Mobile | MobSF |
| System | Lynis |
| Policy | OPA |

Not every tool runs every time. JMo's **scan profiles** let you choose depth vs. speed:

| Profile | Tools | Time |
|---------|-------|------|
| `fast` | 9 tools | 5–10 min |
| `slim` | 14 tools | 12–18 min |
| `balanced` | 18 tools | 18–25 min |
| `deep` | 28 tools | 40–70 min |

---

## Key Features

### 6 Compliance Framework Mappings

Every finding is automatically mapped to applicable compliance controls:

- **OWASP Top 10** — Web application security
- **CWE** — Common Weakness Enumeration
- **NIST CSF** — Cybersecurity Framework
- **PCI DSS** — Payment card security
- **CIS Controls** — Center for Internet Security benchmarks
- **MITRE ATT&CK** — Adversarial tactics and techniques

Your security report doubles as a compliance audit artifact.

### Cross-Tool Deduplication

When three secrets scanners all flag the same hardcoded API key, you shouldn't see three separate findings. JMo's similarity clustering identifies and deduplicates findings across tools, typically reducing alert volume by **30–40%**. Less noise means your team focuses on real issues.

### SQLite Historical Storage

Track your security posture over time. Every scan is stored in a local SQLite database, enabling:

```bash
jmo history list          # view all scans
jmo history compare id1 id2  # diff two scans
jmo trends analyze --days 30  # trend analysis
```

This lets you measure improvement, demonstrate compliance progress, and catch regressions before they ship.

### CI/CD Integration

```bash
jmo ci --fail-on HIGH
```

One command for pipeline integration. Returns exit code 1 if findings exceed your threshold. Supports machine-readable JSON output and SARIF for GitHub Security tab integration.

---

## 5-Minute Quickstart

### Install

```bash
pip install jmo-security
jmo wizard --yes  # non-interactive setup
```

Or with Docker (no local tool installation needed):

```bash
docker pull jmogaming/jmo-security:latest
docker run -v $PWD:/scan jmogaming/jmo-security:latest scan --profile fast
```

### Run a Scan

```bash
# Scan current repo (fast profile — 5-10 min)
jmo scan --profile fast

# Scan a container image
jmo scan --image nginx:latest

# Scan IaC files
jmo scan --iac ./terraform/

# Scan a web endpoint
jmo scan --url https://your-api.com
```

### View Results

```bash
jmo report ./results     # Generate HTML dashboard + JSON/SARIF
```

Open `results/summaries/dashboard.html` in your browser for the interactive dashboard.

---

## Open Source and Free

JMo Security is **100% free and open source** under the MIT OR Apache 2.0 dual license.

- **GitHub:** [jimmy058910/jmo-security-repo](https://github.com/jimmy058910/jmo-security-repo)
- **PyPI:** `pip install jmo-security`
- **Docker:** `docker pull jmogaming/jmo-security`
- **Docs:** [docs.jmotools.com](https://docs.jmotools.com)

The project was built as a capstone for the **Institute of Data × Michigan Tech University Cybersecurity Bootcamp** (graduated October 2025) and has grown into a production-grade platform with 87% test coverage across 8,000+ tests.

---

## What's Next

The roadmap includes:
- API security scanning (REST endpoint enumeration)
- AI/ML model scanning for supply chain risk
- Web dashboard for multi-project views
- Contributor portal for community adapters

Follow along on [GitHub](https://github.com/jimmy058910/jmo-security-repo) or [subscribe to the newsletter](https://jmotools.com/subscribe.html).

---

## Try It Now

```bash
pip install jmo-security
jmo scan --profile fast
```

Questions or feedback? [Open an issue](https://github.com/jimmy058910/jmo-security-repo/issues) or leave a comment below.
