#!/usr/bin/env python3
"""
Generate brand_metadata.json for ownership-model filtering in FranchiseMap.

Creates a centralized metadata file that classifies all brands by:
- Ownership Model (franchise, non-franchise, unknown)
- Primary Sub-Type (licensed, corporate, independent, unknown)

This is the single source of truth for brand ownership classification.
Metadata is merged into location objects client-side during initial load.

Output:
- FranchiseMap/data/brand_metadata.json

Run via: python -m data_aggregation.pipelines.franchise.build_brand_metadata
"""

import sys
import json
from pathlib import Path
from datetime import datetime
from typing import Dict, List

# Add repo root to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent.parent.parent))

from data_aggregation.config.paths_config import BRAND_METADATA_JSON, FRANCHISEMAP_DATA_DIR

# ============================================================================
# SEED LISTS: Brand ownership classification
# ============================================================================
# These seed lists define the canonical ownership model for each ticker.
# Maps tickers to ownership_model and primary_subtype.

FRANCHISE_LICENSED = {
    'MCD': "McDonald's",
    'SBUX': 'Starbucks',
    'YUM': 'Yum! Brands (KFC, Taco Bell, Pizza Hut)',
    'QSR': 'Restaurant Brands (Burger King, Tim Hortons)',
    'WEN': "Wendy's",
    'DPZ': "Domino's Pizza",
    'CMG': 'Chipotle',
    'JACK': "Jack in the Box",
    'WING': 'Wingstop',
    'SHAK': 'Shake Shack',
    'PZZA': "Papa John's",
    'DNUT': 'Krispy Kreme',
    'NATH': "Nathan's Famous",
    'CHIPOTLE': 'Chipotle',
    'DOMINOS': "Domino's",
    'MCDONALDS': "McDonald's",
    'STARBUCKS': 'Starbucks',
}

FRANCHISE_INDEPENDENT = {
    'DENN': "Denny's",
    'DIN': 'Dine Global (IHOP, Applebee\'s)',
    'CBRL': 'Cracker Barrel',
    'TXRH': 'Texas Roadhouse',
    'BLMN': 'Bloomin\' Brands (Outback, Carrabba\'s)',
    'CAKE': 'The Cheesecake Factory',
    'BJRI': "BJ's Restaurants",
    'CHUY': "Chuy's",
    'EAT': "Ark Restaurants (Chili's, Maggiano's)",
    'DRI': 'Dine Global Holdings (Olive Garden, LongHorn)',
    'RRGB': 'Red Robin',
    'PLAY': "Dave & Buster's",
}

NON_FRANCHISE_CORPORATE = {
    'SUB': 'Subway',
    'CFA': 'Chick-fil-A',
    'PANDA': 'Panda Express',
    'DQ': 'Dairy Queen',
    'LCE': "Little Caesars",
    'JM': "Jersey Mike's",
    'FIVE': 'Five Guys',
    'CANE': "Raising Cane's",
    'WHATA': 'Whataburger',
    'ZAX': "Zaxby's",
    'BO': 'Bojangles',
    'WAWA': 'Wawa',
    'SHEETZ': 'Sheetz',
    'INNOUT': 'In-N-Out Burger',
    'PANERA': 'Panera Bread',
    'DUTCH': 'Dutch Bros',
}

HOTELS_LICENSED = {
    'MAR': 'Marriott',
    'HLT': 'Hilton',
    'H': 'Hyatt',
    'IHG': 'IHG',
    'WH': 'Wyndham',
    'CHH': 'Choice Hotels',
    'BW': 'Best Western',
    'G6': 'G6 Hospitality',
    'VAC': 'Vici Properties',
    'TNL': 'Travel Leaders',
}

SERVICES_LICENSED = {
    'MCW': 'Massage Envy',
    'PLNT': 'Planet Fitness',
    'XPOF': 'Xponential',
    'HRB': 'H&R Block',
    'SERV': 'ServiceMaster',
    'ROL': 'Rollover',
    'HLE': 'Healthylife',
    'CAR': 'Carmax',
    'UHAL': 'U-Haul',
    'DRIVEN': 'Driven',
}

# Roark Capital group (mixed ownership, but primarily franchise for mapping purposes)
ROARK_GROUP = {
    'INSPIRE': 'Inspire Brands',
    'FOCUS': 'Focusrite',
}

# Additional tickers (mapped from manifest)
ADDITIONAL_TICKERS = {
    'PLANETFITNESS': 'Planet Fitness',
    'SHAKESHACK': 'Shake Shack',
    'WENDYS': "Wendy's",
    'WINGSTOP': 'Wingstop',
}


def build_metadata() -> Dict:
    """
    Generate brand_metadata.json from seed lists.

    Returns:
        Dictionary with schema_version, generated_date, and brands object
    """

    metadata = {
        "schema_version": "1.0",
        "generated_date": datetime.utcnow().isoformat() + "Z",
        "brands": {}
    }

    # Combine all seed lists with their ownership/subtype classifications
    all_classifications = [
        [(ticker, name, 'franchise', 'licensed')
         for ticker, name in FRANCHISE_LICENSED.items()],
        [(ticker, name, 'franchise', 'independent')
         for ticker, name in FRANCHISE_INDEPENDENT.items()],
        [(ticker, name, 'non-franchise', 'corporate')
         for ticker, name in NON_FRANCHISE_CORPORATE.items()],
        [(ticker, name, 'franchise', 'licensed')
         for ticker, name in HOTELS_LICENSED.items()],
        [(ticker, name, 'franchise', 'licensed')
         for ticker, name in SERVICES_LICENSED.items()],
        [(ticker, name, 'franchise', 'licensed')
         for ticker, name in ROARK_GROUP.items()],
        [(ticker, name, 'franchise', 'licensed')
         for ticker, name in ADDITIONAL_TICKERS.items()],
    ]

    # Load location counts from manifest
    manifest_path = FRANCHISEMAP_DATA_DIR / 'manifest.json'
    manifest_counts = {}
    if manifest_path.exists():
        try:
            with open(manifest_path, 'r') as f:
                manifest_data = json.load(f)
                manifest_counts = {item['ticker']: item['count'] for item in manifest_data}
        except (json.JSONDecodeError, KeyError, TypeError) as e:
            print(f"⚠️  Warning: Could not read manifest counts: {e}")

    # Build final metadata
    for classifications in all_classifications:
        for ticker, brand_name, ownership_model, subtype in classifications:
            # Skip if already processed (prevent duplicates)
            if ticker in metadata['brands']:
                continue

            metadata['brands'][ticker] = {
                'name': brand_name,
                'ownership_model': ownership_model,
                'primary_subtype': subtype,
                'count': manifest_counts.get(ticker, 0),
                'notes': ''
            }

    # Add unknown placeholder for unmapped tickers
    metadata['brands']['UNKNOWN'] = {
        'name': 'Unknown',
        'ownership_model': 'unknown',
        'primary_subtype': 'unknown',
        'count': 0,
        'notes': 'Placeholder for unclassified brands'
    }

    return metadata


def validate_metadata(metadata: Dict) -> List[str]:
    """
    Validate metadata structure and values.

    Args:
        metadata: Dictionary to validate

    Returns:
        List of error messages (empty if valid)
    """
    errors = []

    # Check schema version
    if 'schema_version' not in metadata:
        errors.append("Missing schema_version")

    # Check generated_date
    if 'generated_date' not in metadata:
        errors.append("Missing generated_date")

    # Check brands object
    if 'brands' not in metadata or not isinstance(metadata['brands'], dict):
        errors.append("Missing or invalid brands object")
        return errors

    # Validate each brand
    valid_ownership = {'franchise', 'non-franchise', 'unknown'}
    valid_subtypes = {'licensed', 'corporate', 'independent', 'unknown'}

    for ticker, brand in metadata['brands'].items():
        if not isinstance(brand, dict):
            errors.append(f"Brand {ticker} is not an object")
            continue

        if 'ownership_model' not in brand:
            errors.append(f"Brand {ticker} missing ownership_model")
        elif brand['ownership_model'] not in valid_ownership:
            errors.append(f"Brand {ticker} has invalid ownership_model: {brand['ownership_model']}")

        if 'primary_subtype' not in brand:
            errors.append(f"Brand {ticker} missing primary_subtype")
        elif brand['primary_subtype'] not in valid_subtypes:
            errors.append(f"Brand {ticker} has invalid primary_subtype: {brand['primary_subtype']}")

        if 'name' not in brand:
            errors.append(f"Brand {ticker} missing name")

        if 'count' not in brand or not isinstance(brand['count'], int):
            errors.append(f"Brand {ticker} missing or invalid count")

    return errors


def main():
    """Generate and save brand_metadata.json."""

    print("Generating brand metadata...")

    # Generate metadata
    metadata = build_metadata()

    # Validate
    errors = validate_metadata(metadata)
    if errors:
        print("❌ Validation errors found:")
        for error in errors:
            print(f"   {error}")
        return False

    # Save
    output_path = BRAND_METADATA_JSON
    output_path.parent.mkdir(parents=True, exist_ok=True)

    with open(output_path, 'w') as f:
        json.dump(metadata, f, indent=2)

    # Print summary
    franchise_count = sum(1 for b in metadata['brands'].values() if b['ownership_model'] == 'franchise')
    non_franchise_count = sum(1 for b in metadata['brands'].values() if b['ownership_model'] == 'non-franchise')
    unknown_count = sum(1 for b in metadata['brands'].values() if b['ownership_model'] == 'unknown')

    licensed_count = sum(1 for b in metadata['brands'].values() if b['primary_subtype'] == 'licensed')
    corporate_count = sum(1 for b in metadata['brands'].values() if b['primary_subtype'] == 'corporate')
    independent_count = sum(1 for b in metadata['brands'].values() if b['primary_subtype'] == 'independent')

    print(f"\n✅ Generated {output_path}")
    print(f"\n📊 Brand Summary:")
    print(f"   Total brands: {len(metadata['brands'])}")
    print(f"\n   Ownership Models:")
    print(f"      Franchise: {franchise_count}")
    print(f"      Non-Franchise: {non_franchise_count}")
    print(f"      Unknown: {unknown_count}")
    print(f"\n   Primary Sub-Types:")
    print(f"      Licensed: {licensed_count}")
    print(f"      Corporate: {corporate_count}")
    print(f"      Independent: {independent_count}")
    print(f"      Unknown: {unknown_count}")

    total_locations = sum(b['count'] for b in metadata['brands'].values())
    print(f"\n   Total Locations: {total_locations:,}")

    return True


if __name__ == '__main__':
    success = main()
    sys.exit(0 if success else 1)
