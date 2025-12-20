#!/usr/bin/env python3
"""
Validate generated franchise map data before publishing to live directory.

This script ensures:
1. Required files exist (manifest.json, brands/*.json)
2. JSON files are valid and parseable
3. Manifest has required fields and non-zero counts
4. Brand files are arrays with location objects
5. Expected minimum counts are met
"""

import json
import os
import sys
from pathlib import Path

def validate_franchise_data(data_dir):
    """
    Validate franchise data directory.

    Args:
        data_dir: Path to data directory to validate

    Returns:
        tuple: (success: bool, errors: list, summary: dict)
    """
    errors = []
    warnings = []
    summary = {
        "manifest_exists": False,
        "manifest_valid": False,
        "brand_files": 0,
        "total_locations": 0,
        "brands_in_manifest": 0
    }

    # Check if directory exists
    if not os.path.isdir(data_dir):
        errors.append(f"Data directory does not exist: {data_dir}")
        return False, errors, summary

    # Check manifest.json
    manifest_path = os.path.join(data_dir, "manifest.json")
    if not os.path.exists(manifest_path):
        errors.append("manifest.json not found")
        return False, errors, summary

    summary["manifest_exists"] = True

    try:
        with open(manifest_path, 'r') as f:
            manifest = json.load(f)
    except json.JSONDecodeError as e:
        errors.append(f"manifest.json is not valid JSON: {e}")
        return False, errors, summary
    except Exception as e:
        errors.append(f"Failed to read manifest.json: {e}")
        return False, errors, summary

    # Validate manifest structure
    if not isinstance(manifest, list):
        errors.append("manifest.json must be an array")
        return False, errors, summary

    if len(manifest) == 0:
        errors.append("manifest.json is empty")
        return False, errors, summary

    summary["brands_in_manifest"] = len(manifest)

    # Validate each manifest entry
    for i, item in enumerate(manifest):
        if not isinstance(item, dict):
            errors.append(f"Manifest entry {i} is not an object")
            continue

        # Check required fields
        required_fields = ["ticker", "brands", "name", "file", "count"]
        for field in required_fields:
            if field not in item:
                errors.append(f"Manifest entry {i} ({item.get('ticker', '?')}): missing '{field}'")
            elif field == "count" and item[field] <= 0:
                errors.append(f"Manifest entry {i} ({item.get('ticker')}): count must be > 0, got {item[field]}")

        # Check that file path has correct prefix
        if "file" in item:
            if not item["file"].startswith("data/brands/"):
                errors.append(f"Manifest entry {i} ({item.get('ticker')}): file path should start with 'data/brands/', got '{item['file']}'")

    if errors:
        return False, errors, summary

    summary["manifest_valid"] = True

    # Validate brand files exist and are valid
    brands_dir = os.path.join(data_dir, "brands")
    if not os.path.isdir(brands_dir):
        errors.append(f"brands directory not found: {brands_dir}")
        return False, errors, summary

    for item in manifest:
        ticker = item.get("ticker", "?")
        file_ref = item.get("file", "")
        expected_count = item.get("count", 0)

        # Construct full path
        filename = os.path.basename(file_ref)
        file_path = os.path.join(brands_dir, filename)

        # Check file exists
        if not os.path.exists(file_path):
            errors.append(f"Brand file missing: {filename} (ticker: {ticker})")
            continue

        # Check file is valid JSON and is an array
        try:
            with open(file_path, 'r') as f:
                data = json.load(f)

            if not isinstance(data, list):
                errors.append(f"{filename}: brand file must be array, got {type(data).__name__}")
                continue

            if len(data) == 0:
                warnings.append(f"{filename}: brand file is empty array")
                continue

            # Validate location objects
            for j, loc in enumerate(data):
                if not isinstance(loc, dict):
                    errors.append(f"{filename}[{j}]: location is not an object")
                    continue

                # Check required location fields
                required_loc_fields = ["id", "ticker", "lat", "lng", "s"]
                for field in required_loc_fields:
                    if field not in loc:
                        errors.append(f"{filename}[{j}]: missing field '{field}'")

            actual_count = len(data)
            summary["total_locations"] += actual_count
            summary["brand_files"] += 1

            # Warn if count doesn't match
            if actual_count != expected_count:
                warnings.append(f"{filename}: manifest says {expected_count} locations, file has {actual_count}")

        except json.JSONDecodeError as e:
            errors.append(f"{filename}: invalid JSON: {e}")
        except Exception as e:
            errors.append(f"{filename}: read error: {e}")

    # Final checks
    if summary["brand_files"] == 0:
        errors.append("No brand files were validated")

    if summary["total_locations"] == 0:
        errors.append("No locations found across all brands")

    success = len(errors) == 0

    return success, errors, warnings, summary


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python validate_franchise_data.py <data_dir>")
        sys.exit(1)

    data_dir = sys.argv[1]
    success, errors, warnings, summary = validate_franchise_data(data_dir)

    print("=" * 60)
    print("FRANCHISE DATA VALIDATION REPORT")
    print("=" * 60)
    print(f"\nDirectory: {data_dir}")
    print(f"\nSummary:")
    print(f"  Brands in manifest: {summary['brands_in_manifest']}")
    print(f"  Brand files validated: {summary['brand_files']}")
    print(f"  Total locations: {summary['total_locations']}")
    print(f"  Manifest valid: {summary['manifest_valid']}")

    if warnings:
        print(f"\nWarnings ({len(warnings)}):")
        for w in warnings:
            print(f"  ⚠️  {w}")

    if errors:
        print(f"\nErrors ({len(errors)}):")
        for e in errors:
            print(f"  ❌ {e}")
    else:
        print("\n✅ All validations passed!")

    print("\n" + "=" * 60)

    # Exit with appropriate code
    sys.exit(0 if success else 1)
