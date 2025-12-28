# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.2.x   | :white_check_mark: |

## Reporting a Vulnerability

I take security seriously and appreciate your help in keeping Zammy CLI safe for everyone.

This is a solo project, and I'm always glad to hear from the community. If you discover a security vulnerability, please don't hesitate to report it—no matter how small it may seem. I won't judge or dismiss your findings, and I genuinely appreciate the time you take to help improve this project.

### How to Report

1. **Please do not open a public GitHub issue** for security vulnerabilities, as this could put other users at risk
2. Instead, use [GitHub's private security advisory](https://github.com/aayushadhikari7/zammy-cli/security/advisories/new) to report the issue securely
3. Include whatever details you can:
   - Description of the vulnerability
   - Steps to reproduce (if known)
   - Potential impact
   - Suggested fix (optional, but welcome!)

Don't worry if you're unsure about the severity or if your report is "good enough"—I'd rather hear about a potential issue than miss a real one.

### What to Expect

- **Acknowledgment** within 48 hours
- **Regular updates** on the fix progress
- **Credit** in the release notes (unless you prefer to remain anonymous)
- **No legal action** for responsible disclosure—I'm grateful for your help

### Scope

This security policy applies to:
- The `zammy` npm package
- This GitHub repository

## Security Overview

For transparency, here's what Zammy CLI does and doesn't do:

**Does NOT:**
- Collect telemetry or analytics
- Store or transmit personal data
- Make network requests without explicit user commands
- Execute code without user input

**Does:**
- Require explicit user input for all shell commands
- Use timeouts on all external operations
- Respect your local environment and working directory

---

Thank you for helping keep Zammy CLI secure. Community feedback—whether it's bug reports, feature ideas, or security concerns—is always welcome and appreciated.
