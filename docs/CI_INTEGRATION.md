# Running SentriCodeX in Your Own CI Pipeline

SentriCodeX's scanning engine is a standalone CLI with zero runtime
dependencies (see `engine/README.md`), which means it already works
in any CI system today — no special integration needed.

## GitHub Actions Example

```yaml
name: Security Scan

on: [push, pull_request]

jobs:
  sentricodex-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: "3.12"

      - name: Clone SentriCodeX engine
        run: git clone --depth 1 https://github.com/sentricodex/sentricodex.git /tmp/sentricodex

      - name: Run scan
        env:
          PYTHONPATH: /tmp/sentricodex/engine
        run: |
          python -m sentricodex --path . --pretty > scan-result.json
          python -c "
          import json, sys
          result = json.load(open('scan-result.json'))
          print(f\"Security Score: {result['security_score']}/100\")
          print(f\"Findings: {result['summary']['findings_count']}\")
          critical = result['summary']['severity_breakdown'].get('critical', 0)
          if critical > 0:
              print(f'{critical} critical finding(s) - failing build')
              sys.exit(1)
          "

      - name: Upload scan result
        uses: actions/upload-artifact@v4
        with:
          name: sentricodex-scan-result
          path: scan-result.json
```

This checks out your repository, runs a real SentriCodeX scan against
it, fails the build if any **Critical** severity findings are present,
and uploads the full JSON result as a build artifact.

## Adjusting the Failure Threshold

Change which severities fail the build by adjusting the check:
```python
critical = result['summary']['severity_breakdown'].get('critical', 0)
high = result['summary']['severity_breakdown'].get('high', 0)
if critical > 0 or high > 0:
    sys.exit(1)
```

## Other CI Systems

Since this is just a Python CLI, the same pattern (checkout → set
`PYTHONPATH` → run `python -m sentricodex --path .` → check exit code
and parse JSON) works identically in GitLab CI, CircleCI, Jenkins, or
any other system that can run Python.

## Future: A Dedicated GitHub Action

A packaged, reusable GitHub Action (`uses: sentricodex/scan-action@v1`)
that wraps the steps above is tracked as a post-v1.0 roadmap item — see
`ROADMAP.md`. The manual workflow above is fully functional today and
requires no additional SentriCodeX development to use.
