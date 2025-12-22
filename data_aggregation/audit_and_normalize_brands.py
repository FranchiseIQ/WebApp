#!/usr/bin/env python3
"""
FranchiseMap Brand Data Audit & Normalization Script

This script identifies and reports on:
1. Duplicate brands (slug-based vs ticker-based entries)
2. Incomplete brand location counts
3. Missing display names
4. Data quality issues

It generates a comprehensive audit report and can optionally:
- Clean up manifest.json by removing duplicates
- Normalize brand display names
- Flag suspicious location counts
"""

import json
import os
from pathlib import Path
from collections import defaultdict
from typing import Dict, List, Tuple, Any

# Define slug to ticker mappings for known duplicates
SLUG_TO_TICKER = {
    'chipotle': 'CMG',
    'dominos': 'DPZ',
    'mcdonalds': 'MCD',
    'planetfitness': 'PLNT',
    'shakeshack': 'SHAK',
    'starbucks': 'SBUX',
    'wendys': 'WEN',
    'wingstop': 'WING',
}

# Define canonical display names for major brands
CANONICAL_NAMES = {
    'CMG': 'Chipotle',
    'DPZ': "Domino's",
    'MCD': "McDonald's",
    'PLNT': 'Planet Fitness',
    'SHAK': 'Shake Shack',
    'SBUX': 'Starbucks',
    'WEN': "Wendy's",
    'WING': 'Wingstop',
}

# Define minimum location thresholds for major brands
MIN_LOCATION_THRESHOLDS = {
    'MCD': 500,
    'SBUX': 500,
    'DPZ': 200,
    'CMG': 200,
    'PLNT': 200,
    'WEN': 200,
    'WING': 200,
    'DENN': 200,
    'SHAK': 50,
}

def load_manifest(manifest_path: str) -> List[Dict]:
    """Load manifest.json"""
    with open(manifest_path, 'r') as f:
        return json.load(f)

def load_brand_metadata(metadata_path: str) -> Dict:
    """Load brand_metadata.json"""
    if os.path.exists(metadata_path):
        with open(metadata_path, 'r') as f:
            return json.load(f)
    return {}

def count_locations_in_file(file_path: str) -> int:
    """Count locations in a brand JSON file"""
    try:
        with open(file_path, 'r') as f:
            data = json.load(f)
            if isinstance(data, list):
                return len(data)
            return 0
    except Exception as e:
        print(f"Error reading {file_path}: {e}")
        return 0

def audit_brands(manifest_path: str, brands_dir: str) -> Dict[str, Any]:
    """Perform comprehensive brand audit"""

    manifest = load_manifest(manifest_path)

    audit_report = {
        'total_brands_in_manifest': len(manifest),
        'duplicate_entries': [],
        'incomplete_brands': [],
        'missing_display_names': [],
        'file_path_mismatches': [],
        'suspicious_low_counts': [],
        'all_brands': []
    }

    # Track which tickers we've seen
    tickers_seen = defaultdict(list)

    # First pass: identify duplicates
    for entry in manifest:
        ticker = entry.get('ticker', 'UNKNOWN')
        tickers_seen[ticker].append(entry.get('name', 'UNKNOWN'))

    # Find duplicate tickers in manifest
    for ticker, names in tickers_seen.items():
        if len(names) > 1:
            audit_report['duplicate_entries'].append({
                'ticker': ticker,
                'entries': names,
                'count': len(names)
            })

    # Second pass: check each brand entry
    for entry in manifest:
        ticker = entry.get('ticker', 'UNKNOWN')
        file_path = entry.get('file', '')
        name = entry.get('name', '')
        count = entry.get('count', 0)

        brand_info = {
            'ticker': ticker,
            'name': name,
            'file': file_path,
            'manifest_count': count,
            'actual_count': 0,
            'issues': []
        }

        # Check for missing display name
        if not name or name == ticker:
            brand_info['issues'].append('Missing or generic display name')
            audit_report['missing_display_names'].append(ticker)

        # Check if file exists and count actual locations
        full_path = os.path.join(brands_dir, os.path.basename(file_path))
        if os.path.exists(full_path):
            actual_count = count_locations_in_file(full_path)
            brand_info['actual_count'] = actual_count

            # Check if counts match
            if actual_count != count:
                brand_info['issues'].append(
                    f'Location count mismatch: manifest={count}, file={actual_count}'
                )
        else:
            brand_info['issues'].append(f'File not found: {full_path}')

        # Check if this is a slug-based duplicate
        for slug, canonical_ticker in SLUG_TO_TICKER.items():
            if ticker.lower() == slug:
                brand_info['issues'].append(
                    f'Slug-based entry (should use {canonical_ticker} instead)'
                )
                # Check if canonical ticker also exists
                canonical_in_manifest = any(
                    e.get('ticker') == canonical_ticker for e in manifest
                )
                if canonical_in_manifest:
                    brand_info['issues'].append(
                        f'Duplicate: Canonical {canonical_ticker} also in manifest'
                    )

        # Check for suspiciously low counts for major brands
        if ticker in MIN_LOCATION_THRESHOLDS:
            threshold = MIN_LOCATION_THRESHOLDS[ticker]
            if brand_info['actual_count'] > 0 and brand_info['actual_count'] < threshold:
                audit_report['suspicious_low_counts'].append({
                    'ticker': ticker,
                    'name': name,
                    'count': brand_info['actual_count'],
                    'threshold': threshold,
                    'deficit': threshold - brand_info['actual_count']
                })
                brand_info['issues'].append(
                    f'Suspiciously low count: {brand_info["actual_count"]} < {threshold}'
                )

        if brand_info['issues']:
            audit_report['incomplete_brands'].append(brand_info)

        audit_report['all_brands'].append(brand_info)

    # Sort suspicious brands by deficit (largest first)
    audit_report['suspicious_low_counts'].sort(
        key=lambda x: x['deficit'],
        reverse=True
    )

    return audit_report

def generate_clean_manifest(manifest_path: str, brands_dir: str) -> List[Dict]:
    """
    Generate a cleaned manifest by:
    1. Removing slug-based duplicate entries
    2. Keeping ticker-based canonical entries
    3. Updating display names to canonical versions
    """
    manifest = load_manifest(manifest_path)

    # Filter out slug-based duplicates
    cleaned = []
    ticker_set = set()

    # First, collect all tickers
    for entry in manifest:
        ticker = entry.get('ticker', '')
        if ticker and ticker not in SLUG_TO_TICKER:
            ticker_set.add(ticker)
        elif ticker in SLUG_TO_TICKER.values():
            ticker_set.add(ticker)

    # Add entries, skipping slug-based duplicates
    for entry in manifest:
        ticker = entry.get('ticker', '')

        # Skip if this is a slug that maps to a ticker we already have
        if ticker.lower() in SLUG_TO_TICKER:
            canonical_ticker = SLUG_TO_TICKER[ticker.lower()]
            if canonical_ticker in ticker_set:
                # Skip this slug, we have the canonical version
                continue

        # Update display name if we have a canonical version
        if ticker in CANONICAL_NAMES:
            entry['name'] = CANONICAL_NAMES[ticker]
            entry['brands'] = [CANONICAL_NAMES[ticker]]

        cleaned.append(entry)

    return cleaned

def print_audit_report(report: Dict[str, Any]):
    """Print formatted audit report"""
    print("\n" + "="*80)
    print("FRANCHISE MAP BRAND DATA AUDIT REPORT")
    print("="*80 + "\n")

    print(f"Total brands in manifest: {report['total_brands_in_manifest']}\n")

    # Duplicate entries
    if report['duplicate_entries']:
        print("⚠️  DUPLICATE ENTRIES IN MANIFEST:")
        for dup in report['duplicate_entries']:
            print(f"   {dup['ticker']}: {dup['entries']}")
        print()
    else:
        print("✓ No duplicate ticker entries in manifest\n")

    # Missing display names
    if report['missing_display_names']:
        print(f"⚠️  MISSING DISPLAY NAMES ({len(report['missing_display_names'])} brands):")
        for ticker in report['missing_display_names']:
            print(f"   - {ticker}")
        print()
    else:
        print("✓ All brands have display names\n")

    # Suspicious low counts (TOP 10)
    if report['suspicious_low_counts']:
        print(f"⚠️  SUSPICIOUSLY LOW LOCATION COUNTS (Top 10 deficits):")
        print(f"{'Ticker':<10} {'Name':<25} {'Count':<8} {'Threshold':<10} {'Deficit':<8}")
        print("-"*70)
        for item in report['suspicious_low_counts'][:10]:
            print(f"{item['ticker']:<10} {item['name']:<25} {item['count']:<8} {item['threshold']:<10} {item['deficit']:<8}")
        print()
    else:
        print("✓ No suspiciously low location counts detected\n")

    # Summary of issues
    if report['incomplete_brands']:
        print(f"⚠️  BRANDS WITH ISSUES ({len(report['incomplete_brands'])}):")
        for brand in report['incomplete_brands']:
            if brand['issues']:
                print(f"   {brand['ticker']} ({brand['name']}):")
                for issue in brand['issues']:
                    print(f"      • {issue}")
        print()

    # Summary statistics
    print("SUMMARY STATISTICS:")
    print(f"  Total brands audited: {len(report['all_brands'])}")
    print(f"  Brands with issues: {len(report['incomplete_brands'])}")
    print(f"  Duplicate entries: {len(report['duplicate_entries'])}")
    print(f"  Missing display names: {len(report['missing_display_names'])}")
    print(f"  Suspiciously low counts: {len(report['suspicious_low_counts'])}")
    print()

def save_audit_report(report: Dict[str, Any], output_path: str):
    """Save audit report as JSON"""
    with open(output_path, 'w') as f:
        json.dump(report, f, indent=2)
    print(f"✓ Audit report saved to {output_path}")

if __name__ == '__main__':
    base_path = Path(__file__).parent.parent / 'FranchiseMap'
    manifest_path = base_path / 'data' / 'manifest.json'
    brands_dir = base_path / 'data' / 'brands'
    audit_report_path = base_path / 'data' / 'data_quality_report.json'

    print("Running FranchiseMap Brand Data Audit...")

    # Run audit
    report = audit_brands(str(manifest_path), str(brands_dir))

    # Print report
    print_audit_report(report)

    # Save report
    save_audit_report(report, str(audit_report_path))

    print("\n" + "="*80)
    print("RECOMMENDATIONS:")
    print("="*80 + "\n")

    if report['duplicate_entries'] or any(
        'Slug-based entry' in issue
        for brand in report['incomplete_brands']
        for issue in brand['issues']
    ):
        print("1. REMOVE SLUG-BASED DUPLICATES:")
        print("   The manifest contains both ticker-based and slug-based entries.")
        print("   Example: Both 'DOMINOS' and 'DPZ' point to Domino's locations.")
        print("   → Remove slug entries, keep canonical ticker entries\n")

    if report['missing_display_names']:
        print("2. UPDATE DISPLAY NAMES:")
        print("   Use canonical display names from brand_metadata.json")
        print("   Example: Use 'Domino's' not 'DOMINOS' or 'Domino's Pizza'\n")

    if report['suspicious_low_counts']:
        print("3. INVESTIGATE LOW COUNTS:")
        print("   These major brands have suspiciously low location counts:")
        for item in report['suspicious_low_counts'][:5]:
            print(f"   - {item['ticker']}: {item['count']} locations (expected ~{item['threshold']}+)")
        print("   → May indicate incomplete data import or weak Overpass query terms\n")

    print("="*80 + "\n")
