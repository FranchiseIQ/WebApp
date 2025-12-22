#!/usr/bin/env python3
"""
Roark Portfolio Tagging and Manifest Augmentation

This script:
1. Loads the Roark portfolio from roark_portfolio.json
2. Loads the existing manifest from manifest.json
3. Matches Roark brands to manifest brands using robust normalization
4. Augments manifest entries with Roark metadata
5. Generates a match report for QA verification

Output:
- FranchiseMap/data/brands_manifest.json (augmented manifest with Roark fields)
- FranchiseMap/data/roark_match_report.json (QA report showing matched/unmatched)
"""

import json
import os
from pathlib import Path
from typing import Dict, List, Any, Tuple
from collections import defaultdict
import sys

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent))

from roark_brand_aliases import normalize_brand_name, match_brand_name, ROARK_ALIASES

def load_roark_portfolio(portfolio_path: str) -> List[Dict[str, Any]]:
    """Load roark_portfolio.json"""
    with open(portfolio_path, 'r') as f:
        return json.load(f)


def load_manifest(manifest_path: str) -> List[Dict[str, Any]]:
    """Load manifest.json"""
    with open(manifest_path, 'r') as f:
        return json.load(f)


def build_normalized_brand_lookup(manifest: List[Dict]) -> Dict[str, str]:
    """
    Build a lookup dict from normalized brand names to original ticker.

    Maps normalized names to ticker for efficient matching.
    """
    lookup = {}
    for entry in manifest:
        ticker = entry.get('ticker', '')
        name = entry.get('name', '')

        if ticker and name:
            normalized = normalize_brand_name(name)
            lookup[normalized] = ticker

    return lookup


def find_roark_brand_in_manifest(roark_brand: str, normalized_lookup: Dict[str, str]) -> Tuple[bool, str, str]:
    """
    Find a Roark brand in the manifest using conservative matching.

    Args:
        roark_brand: Brand name from Roark portfolio
        normalized_lookup: Dict mapping normalized brand names to tickers

    Returns:
        Tuple of (found: bool, ticker: str, normalized_name: str)
    """
    normalized_roark = normalize_brand_name(roark_brand)

    # Strategy 1: Direct normalized match (exact) - highest confidence
    if normalized_roark in normalized_lookup:
        ticker = normalized_lookup[normalized_roark]
        return True, ticker, normalized_roark

    # Strategy 2: Check alias mapping (aliases are manually verified)
    for alias_key, canonical_name in ROARK_ALIASES.items():
        if normalized_roark in alias_key:
            # Found in alias, look for canonical name in manifest
            canonical_normalized = normalize_brand_name(canonical_name)
            if canonical_normalized in normalized_lookup:
                ticker = normalized_lookup[canonical_normalized]
                return True, ticker, canonical_normalized

    # Strategy 3: Reverse alias check - check if manifest brand is in aliases
    for manifest_normalized, ticker in normalized_lookup.items():
        for alias_key, canonical_name in ROARK_ALIASES.items():
            if manifest_normalized in alias_key:
                canonical_normalized = normalize_brand_name(canonical_name)
                if canonical_normalized == normalized_roark:
                    return True, ticker, manifest_normalized

    # Strategy 4: Very conservative substring matching
    # Avoid matching to generic single/double-letter tickers
    # Only match if brand names have substantial overlap
    if len(normalized_roark) >= 7:  # Require longer names for fuzzy matching
        for manifest_normalized, ticker in normalized_lookup.items():
            # Don't match to short generic tickers (H, DIN, etc.)
            if len(manifest_normalized) < 4:
                continue

            # Check for exact substring match with substantial overlap
            if normalized_roark in manifest_normalized:
                overlap_ratio = len(normalized_roark) / len(manifest_normalized)
                if overlap_ratio >= 0.8:  # At least 80% overlap
                    return True, ticker, manifest_normalized
            elif manifest_normalized in normalized_roark:
                overlap_ratio = len(manifest_normalized) / len(normalized_roark)
                if overlap_ratio >= 0.8:
                    return True, ticker, manifest_normalized

    return False, "", ""


def augment_manifest_with_roark(
    manifest: List[Dict],
    portfolio: List[Dict],
    normalized_lookup: Dict[str, str]
) -> Tuple[List[Dict], Dict[str, Any]]:
    """
    Augment manifest entries with Roark metadata.

    Returns:
        Tuple of (augmented_manifest, match_report)
    """
    # Create mapping from ticker to Roark metadata
    roark_metadata = {}
    for portfolio_entry in portfolio:
        brand_name = portfolio_entry.get('brand', '')
        found, ticker, normalized_name = find_roark_brand_in_manifest(brand_name, normalized_lookup)

        if found:
            roark_metadata[ticker] = {
                'is_roark': True,
                'roark_platform': portfolio_entry.get('platform', ''),
                'roark_acquisition_year': portfolio_entry.get('acquisition_year'),
                'roark_website_url': portfolio_entry.get('website_url', ''),
                'roark_notes': portfolio_entry.get('notes', ''),
                'portfolio_brand': brand_name
            }

    # Augment manifest
    augmented_manifest = []
    for entry in manifest:
        ticker = entry.get('ticker', '')

        # Add Roark fields
        if ticker in roark_metadata:
            entry['is_roark'] = roark_metadata[ticker]['is_roark']
            entry['roark_platform'] = roark_metadata[ticker]['roark_platform']
            entry['roark_acquisition_year'] = roark_metadata[ticker]['roark_acquisition_year']
            entry['roark_website_url'] = roark_metadata[ticker]['roark_website_url']
            entry['roark_notes'] = roark_metadata[ticker]['roark_notes']
        else:
            # Not a Roark brand
            entry['is_roark'] = False
            entry['roark_platform'] = None
            entry['roark_acquisition_year'] = None
            entry['roark_website_url'] = None
            entry['roark_notes'] = None

        augmented_manifest.append(entry)

    # Generate match report
    matched_brands = []
    unmatched_roark_brands = []

    for portfolio_entry in portfolio:
        brand_name = portfolio_entry.get('brand', '')
        found, ticker, normalized_name = find_roark_brand_in_manifest(brand_name, normalized_lookup)

        if found:
            matched_brands.append({
                'portfolio_brand': brand_name,
                'ticker': ticker,
                'manifest_name': next((e['name'] for e in manifest if e['ticker'] == ticker), ''),
                'platform': portfolio_entry.get('platform', ''),
                'acquisition_year': portfolio_entry.get('acquisition_year'),
                'match_type': 'exact' if normalize_brand_name(brand_name) in normalized_lookup else 'fuzzy'
            })
        else:
            unmatched_roark_brands.append({
                'portfolio_brand': brand_name,
                'platform': portfolio_entry.get('platform', ''),
                'notes': f"Brand '{brand_name}' not found in current manifest. May not have location data yet."
            })

    # Count by platform
    platform_counts = defaultdict(lambda: {'matched': 0, 'unmatched': 0})
    for matched in matched_brands:
        platform = matched['platform']
        platform_counts[platform]['matched'] += 1
    for unmatched in unmatched_roark_brands:
        platform = unmatched['platform']
        platform_counts[platform]['unmatched'] += 1

    match_report = {
        'summary': {
            'total_roark_brands': len(portfolio),
            'matched_count': len(matched_brands),
            'unmatched_count': len(unmatched_roark_brands),
            'match_rate': f"{len(matched_brands) / len(portfolio) * 100:.1f}%" if portfolio else "0%"
        },
        'platform_summary': dict(platform_counts),
        'matched_brands': matched_brands,
        'unmatched_roark_brands': unmatched_roark_brands,
        'manifest_roark_brands': len([e for e in augmented_manifest if e.get('is_roark')])
    }

    return augmented_manifest, match_report


def print_match_report(report: Dict[str, Any]):
    """Print formatted match report"""
    print("\n" + "=" * 80)
    print("ROARK PORTFOLIO MATCHING REPORT")
    print("=" * 80 + "\n")

    summary = report['summary']
    print("SUMMARY:")
    print(f"  Total Roark portfolio brands: {summary['total_roark_brands']}")
    print(f"  Successfully matched: {summary['matched_count']}")
    print(f"  Unmatched (not in dataset): {summary['unmatched_count']}")
    print(f"  Match rate: {summary['match_rate']}\n")

    # Platform breakdown
    if report['platform_summary']:
        print("BREAKDOWN BY PLATFORM:")
        print(f"{'Platform':<30} {'Matched':<10} {'Unmatched':<10}")
        print("-" * 50)
        for platform, counts in sorted(report['platform_summary'].items()):
            print(f"{platform:<30} {counts['matched']:<10} {counts['unmatched']:<10}")
        print()

    # Show unmatched brands
    if report['unmatched_roark_brands']:
        print(f"UNMATCHED ROARK BRANDS ({len(report['unmatched_roark_brands'])}):")
        for brand in report['unmatched_roark_brands']:
            print(f"  • {brand['portfolio_brand']} ({brand['platform']})")
        print()

    # Matched brands sample (first 10)
    if report['matched_brands']:
        print(f"SAMPLE MATCHED BRANDS (first 10 of {len(report['matched_brands'])}):")
        print(f"{'Portfolio Brand':<25} {'Ticker':<8} {'Manifest Name':<25} {'Platform':<20}")
        print("-" * 80)
        for brand in report['matched_brands'][:10]:
            print(f"{brand['portfolio_brand']:<25} {brand['ticker']:<8} {brand['manifest_name']:<25} {brand['platform']:<20}")
        print()

    print("=" * 80 + "\n")


def save_outputs(
    augmented_manifest: List[Dict],
    match_report: Dict[str, Any],
    output_manifest_path: str,
    output_report_path: str
):
    """Save augmented manifest and match report"""
    # Save augmented manifest
    with open(output_manifest_path, 'w') as f:
        json.dump(augmented_manifest, f, indent=2)
    print(f"✓ Augmented manifest saved to {output_manifest_path}")

    # Save match report
    with open(output_report_path, 'w') as f:
        json.dump(match_report, f, indent=2)
    print(f"✓ Match report saved to {output_report_path}")


if __name__ == '__main__':
    # Set up paths
    base_path = Path(__file__).parent.parent / 'FranchiseMap'
    manifest_path = base_path / 'data' / 'manifest.json'
    portfolio_path = base_path / 'data' / 'roark_portfolio.json'
    output_manifest_path = base_path / 'data' / 'brands_manifest.json'
    output_report_path = base_path / 'data' / 'roark_match_report.json'

    print("Building Roark portfolio tagging...\n")

    # Load data
    print(f"Loading Roark portfolio from {portfolio_path}")
    portfolio = load_roark_portfolio(str(portfolio_path))
    print(f"  Found {len(portfolio)} portfolio entries")

    print(f"Loading manifest from {manifest_path}")
    manifest = load_manifest(str(manifest_path))
    print(f"  Found {len(manifest)} manifest entries\n")

    # Build lookup
    print("Building normalized brand lookup...")
    normalized_lookup = build_normalized_brand_lookup(manifest)
    print(f"  Created lookup with {len(normalized_lookup)} normalized entries\n")

    # Augment and match
    print("Matching Roark brands to manifest entries...")
    augmented_manifest, match_report = augment_manifest_with_roark(
        manifest, portfolio, normalized_lookup
    )

    # Print report
    print_match_report(match_report)

    # Save outputs
    print("Saving outputs...")
    save_outputs(
        augmented_manifest,
        match_report,
        str(output_manifest_path),
        str(output_report_path)
    )

    print("\n✓ Roark portfolio tagging complete!")
    print(f"\nNext steps:")
    print(f"1. Review {output_report_path} for unmatched brands")
    print(f"2. Update map.js to use 'is_roark' field from {output_manifest_path}")
    print(f"3. Test Roark filter in Market Analysis panel")
