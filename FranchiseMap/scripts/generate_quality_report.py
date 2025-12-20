#!/usr/bin/env python3
"""Generate data quality summary for GitHub Actions step output."""

import json
import sys
from pathlib import Path


def main():
    """Generate and print quality report."""
    report_path = Path('FranchiseMap/data/data_quality_report.json')

    if not report_path.exists():
        print("⚠️ No data quality report found")
        return

    try:
        with open(report_path, 'r') as f:
            report = json.load(f)

        summary = report.get('summary', {})

        # Print to stdout (will be captured by GitHub Actions)
        print("\n### Quality Metrics")
        print(f"- Total Locations: {summary.get('totalLocations', 0):,}")
        print(f"- With Demographics: {summary.get('locationsWithDemographics', 0):,}")
        print(f"- With Accessibility: {summary.get('locationsWithAccessibility', 0):,}")
        print(f"- With Traffic Data: {summary.get('locationsWithTraffic', 0):,}")

        print("\n### Coverage")
        print(f"- Demographics: {summary.get('demographicCoverage', 0):.1f}%")
        print(f"- Accessibility: {summary.get('accessibilityCoverage', 0):.1f}%")
        print(f"- Traffic: {summary.get('trafficCoverage', 0):.1f}%")

    except Exception as e:
        print(f"❌ Error reading quality report: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    main()
