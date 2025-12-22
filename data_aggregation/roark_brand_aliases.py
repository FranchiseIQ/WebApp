#!/usr/bin/env python3
"""
Roark Brand Name Normalization and Alias Mapping

This module provides utilities for matching Roark portfolio brands against
franchise dataset brands, handling common punctuation and naming variations.
"""

import re
from typing import Dict, Set, Tuple

# Known brand name variations that should match the same brand
# Maps (variant_normalized, ...) tuple keys to canonical name
ROARK_ALIASES = {
    # Inspire Brands restaurant chains
    ("dunkin", "dunkins"): "Dunkin'",
    ("arbys", "arby's"): "Arby's",
    ("jimmyjohns", "jimmy johns"): "Jimmy John's",
    ("moes southwest grill", "moe's southwest grill"): "Moe's Southwest Grill",
    ("moes", "moe's"): "Moe's Southwest Grill",

    # Focus Brands
    ("schlotzskys", "schlotzsky's"): "Schlotzsky's",
    ("mcalisters deli", "mcalister's deli"): "McAlister's Deli",
    ("cinnabon",): "Cinnabon",
    ("auntieAnnes", "auntie annes"): "Auntie Anne's",

    # ServiceMaster Brands
    ("servicemaster clean",): "ServiceMaster Clean",
    ("servicemaster restore",): "ServiceMaster Restore",
    ("trugreen", "true green"): "TruGreen",
    ("terminix",): "Terminix",

    # Car Rental brands
    ("enterpriserentalcar", "enterprise rent-a-car"): "Enterprise Rent-A-Car",

    # QSR chains
    ("wendys", "wendy's"): "Wendy's",
    ("mcdonalds", "mcdonald's"): "McDonald's",
    ("taco bell",): "Taco Bell",
    ("starbucks",): "Starbucks",
    ("subway",): "Subway",
    ("sonic drivein", "sonic drive-in"): "Sonic Drive-In",
    ("popeyes",): "Popeyes",
    ("buffalo wild wings", "buffal wild wings"): "Buffalo Wild Wings",
    ("nothingbundtcakes", "nothing bundt cakes"): "Nothing Bundt Cakes",
    ("firehousesubs", "firehouse subs"): "Firehouse Subs",
    ("tropicalsmoothiecafe", "tropical smoothie cafe"): "Tropical Smoothie Cafe",
    ("cornerbakerycafe", "corner bakery cafe"): "Corner Bakery Cafe",
    ("tacocabana", "taco cabana"): "Taco Cabana",
    ("whataburger",): "Whataburger",
    ("torchys tacos", "torchy's tacos"): "Torchy's Tacos",
    ("mod pizza", "modpizza"): "MOD Pizza",
    ("sweetfrog", "sweet frog"): "Sweet Frog",
    ("baskinrobbins", "baskin-robbins"): "Baskin-Robbins",
    ("jambajuice", "jamba juice"): "Jamba Juice",
    ("carvel",): "Carvel",

    # Fitness brands
    ("orangetheory",): "Orangetheory",
    ("cyclebar", "cyclebarfitness"): "CycleBar",
    ("lifetime",): "LifeTime",

    # Other brands
    ("culvers",): "Culver's",
    ("planetfitness", "planet fitness"): "Planet Fitness",
    ("shak", "shakeshack", "shake shack"): "Shake Shack",
    ("chipotle",): "Chipotle",
    ("plnt", "planetfitness"): "Planet Fitness",
}

def normalize_brand_name(name: str) -> str:
    """
    Normalize a brand name for comparison.

    Rules:
    1. Convert to lowercase
    2. Remove leading/trailing whitespace
    3. Remove punctuation (apostrophes, periods, hyphens, ampersands)
    4. Collapse multiple spaces into single space
    5. Strip again

    Args:
        name: Raw brand name

    Returns:
        Normalized brand name
    """
    # Lowercase
    normalized = name.lower().strip()

    # Remove punctuation: apostrophes, periods, hyphens, ampersands
    normalized = re.sub(r"['.&-]", "", normalized)

    # Collapse multiple spaces
    normalized = re.sub(r'\s+', ' ', normalized)

    # Final strip
    normalized = normalized.strip()

    return normalized


def match_brand_name(roark_brand: str, manifest_brands: Set[str]) -> Tuple[bool, str]:
    """
    Attempt to match a Roark brand name to a brand in the dataset.

    Uses a multi-strategy approach:
    1. Exact match (normalized)
    2. Alias lookup
    3. Partial match (contains or contained by)

    Args:
        roark_brand: Brand name from Roark portfolio
        manifest_brands: Set of available brand names from manifest (normalized keys)

    Returns:
        Tuple of (matched: bool, matched_brand: str or "")
    """
    normalized_roark = normalize_brand_name(roark_brand)

    # Strategy 1: Direct normalized match
    if normalized_roark in manifest_brands:
        return True, normalized_roark

    # Strategy 2: Check alias mapping
    for alias_key, canonical_name in ROARK_ALIASES.items():
        if normalized_roark in alias_key:
            # Found in alias, now look for any brand in manifest that matches canonical
            canonical_normalized = normalize_brand_name(canonical_name)
            if canonical_normalized in manifest_brands:
                return True, canonical_normalized
            # Also try to find partial match for canonical
            for manifest_brand in manifest_brands:
                if canonical_normalized in manifest_brand or manifest_brand in canonical_normalized:
                    return True, manifest_brand

    # Strategy 3: Fuzzy partial match (substring matching)
    for manifest_brand in manifest_brands:
        # Check if roark normalized is contained in manifest brand or vice versa
        if normalized_roark in manifest_brand or manifest_brand in normalized_roark:
            # Require minimum overlap to avoid false positives
            # (e.g., don't match "taco" to "taco bell" unless explicitly configured)
            min_overlap = min(len(normalized_roark), len(manifest_brand)) / 2
            if len(normalized_roark) >= 6 or len(manifest_brand) >= 6:  # Longer names are safer
                return True, manifest_brand

    return False, ""


def get_roark_aliases_for_brand(roark_brand: str) -> str:
    """
    Get the canonical brand name from aliases if it exists.

    Args:
        roark_brand: Brand name from Roark portfolio

    Returns:
        Canonical brand name or original brand name if not found in aliases
    """
    normalized = normalize_brand_name(roark_brand)

    for alias_key, canonical_name in ROARK_ALIASES.items():
        if normalized in alias_key:
            return canonical_name

    return roark_brand


if __name__ == '__main__':
    # Simple test cases
    test_cases = [
        ("Dunkin'", ["Dunkin", "Dunkins"]),
        ("Arby's", ["Arbys", "Arby's"]),
        ("Moe's Southwest Grill", ["Moes Southwest Grill"]),
        ("Schlotzsky's", ["Schlotzskys"]),
    ]

    for roark_brand, variants in test_cases:
        print(f"\nTesting: {roark_brand}")
        normalized_roark = normalize_brand_name(roark_brand)
        print(f"  Normalized: {normalized_roark}")

        for variant in variants:
            normalized_variant = normalize_brand_name(variant)
            print(f"  Variant '{variant}' → '{normalized_variant}'")
            canonical = get_roark_aliases_for_brand(roark_brand)
            print(f"  Canonical: {canonical}")
