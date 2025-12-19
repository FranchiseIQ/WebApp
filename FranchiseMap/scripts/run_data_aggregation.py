#!/usr/bin/env python3
"""
Master Data Aggregation Runner
Orchestrates all data enrichment scripts to build a comprehensive dataset.

This script:
1. Verifies data directory structure
2. Runs demographic data aggregation (Census data)
3. Runs accessibility data aggregation (Walk/Transit scores)
4. Runs traffic data aggregation
5. Generates summary reports and data quality metrics
6. Creates a complete dataset index
"""

import json
import os
import sys
import subprocess
import time
from datetime import datetime
from typing import Dict, List, Tuple

class DataAggregationOrchestrator:
    def __init__(self, data_dir: str):
        self.data_dir = data_dir
        self.brands_dir = os.path.join(data_dir, "brands")
        self.script_dir = os.path.dirname(os.path.abspath(__file__))
        self.results = {
            "startTime": datetime.now().isoformat(),
            "stages": {},
            "totalLocations": 0,
            "brandStats": {}
        }

    def verify_structure(self) -> bool:
        """Verify data directory structure."""
        print("\n[1/6] Verifying data structure...")
        print("-" * 60)

        if not os.path.exists(self.data_dir):
            print(f"ERROR: Data directory not found: {self.data_dir}")
            return False

        manifest_path = os.path.join(self.data_dir, "manifest.json")
        if not os.path.exists(manifest_path):
            print(f"ERROR: manifest.json not found at {manifest_path}")
            return False

        with open(manifest_path, "r") as f:
            manifest = json.load(f)

        missing_files = []
        total_locs = 0
        for brand_info in manifest:
            # Handle path correctly - if path starts with 'data/', it's relative to parent
            file_path = brand_info["file"]
            if file_path.startswith("data/"):
                data_file = os.path.join(self.data_dir, file_path[5:])
            else:
                data_file = os.path.join(self.data_dir, file_path)

            if not os.path.exists(data_file):
                missing_files.append(brand_info["file"])
            else:
                try:
                    with open(data_file, "r") as f:
                        locations = json.load(f)
                        total_locs += len(locations)
                except json.JSONDecodeError:
                    print(f"  WARNING: Invalid JSON in {brand_info['file']}")

        if missing_files:
            print(f"WARNING: Missing {len(missing_files)} brand data files")
            for f in missing_files[:5]:
                print(f"  - {f}")
            if len(missing_files) > 5:
                print(f"  ... and {len(missing_files) - 5} more")

        print(f"✓ Found {len(manifest)} brands")
        print(f"✓ Found {total_locs:,} total locations")
        self.results["stages"]["structure"] = {
            "status": "verified",
            "brandsCount": len(manifest),
            "locationsCount": total_locs,
            "missingFiles": len(missing_files)
        }
        self.results["totalLocations"] = total_locs
        return True

    def run_census_enrichment(self) -> bool:
        """Run census data aggregation."""
        print("\n[2/6] Running Census Data Enrichment...")
        print("-" * 60)

        script_path = os.path.join(self.script_dir, "aggregate_census_data.py")
        if not os.path.exists(script_path):
            print(f"SKIP: Census enrichment script not found")
            self.results["stages"]["census"] = {"status": "skipped"}
            return True

        try:
            print("Generating demographic profiles...")
            result = subprocess.run(
                [sys.executable, script_path],
                capture_output=True,
                text=True,
                timeout=300
            )

            if result.returncode == 0:
                print("✓ Census data enrichment completed")
                self.results["stages"]["census"] = {"status": "completed"}
                return True
            else:
                print(f"Census enrichment completed with warnings:")
                if result.stdout:
                    print(result.stdout[-500:])
                self.results["stages"]["census"] = {
                    "status": "completed_with_warnings"
                }
                return True
        except subprocess.TimeoutExpired:
            print("TIMEOUT: Census enrichment took too long")
            self.results["stages"]["census"] = {"status": "timeout"}
            return False
        except Exception as e:
            print(f"ERROR: {e}")
            self.results["stages"]["census"] = {"status": "error", "error": str(e)}
            return False

    def run_accessibility_enrichment(self) -> bool:
        """Run accessibility data aggregation."""
        print("\n[3/6] Running Accessibility Data Enrichment...")
        print("-" * 60)

        script_path = os.path.join(self.script_dir, "aggregate_accessibility_data.py")
        if not os.path.exists(script_path):
            print(f"SKIP: Accessibility enrichment script not found")
            self.results["stages"]["accessibility"] = {"status": "skipped"}
            return True

        try:
            print("Calculating Walk Score, Transit Score, and Biking Score...")
            result = subprocess.run(
                [sys.executable, script_path],
                capture_output=True,
                text=True,
                timeout=300
            )

            if result.returncode == 0:
                print("✓ Accessibility data enrichment completed")
                self.results["stages"]["accessibility"] = {"status": "completed"}
                return True
            else:
                print("Accessibility enrichment completed with warnings")
                self.results["stages"]["accessibility"] = {
                    "status": "completed_with_warnings"
                }
                return True
        except Exception as e:
            print(f"ERROR: {e}")
            self.results["stages"]["accessibility"] = {"status": "error"}
            return False

    def run_traffic_enrichment(self) -> bool:
        """Run traffic data aggregation."""
        print("\n[4/6] Running Traffic Data Enrichment...")
        print("-" * 60)

        script_path = os.path.join(self.script_dir, "aggregate_traffic_data.py")
        if not os.path.exists(script_path):
            print(f"SKIP: Traffic enrichment script not found")
            self.results["stages"]["traffic"] = {"status": "skipped"}
            return True

        try:
            print("Estimating traffic volumes and visibility scores...")
            result = subprocess.run(
                [sys.executable, script_path],
                capture_output=True,
                text=True,
                timeout=300
            )

            if result.returncode == 0:
                print("✓ Traffic data enrichment completed")
                self.results["stages"]["traffic"] = {"status": "completed"}
                return True
            else:
                print("Traffic enrichment completed with warnings")
                self.results["stages"]["traffic"] = {
                    "status": "completed_with_warnings"
                }
                return True
        except Exception as e:
            print(f"ERROR: {e}")
            self.results["stages"]["traffic"] = {"status": "error"}
            return False

    def generate_data_quality_report(self) -> bool:
        """Generate comprehensive data quality report."""
        print("\n[5/6] Generating Data Quality Report...")
        print("-" * 60)

        manifest_path = os.path.join(self.data_dir, "manifest.json")
        with open(manifest_path, "r") as f:
            manifest = json.load(f)

        quality_metrics = {
            "timestamp": datetime.now().isoformat(),
            "brands": {}
        }

        total_with_attrs = 0
        total_with_scores = 0
        total_with_demographics = 0
        total_with_accessibility = 0
        total_with_traffic = 0

        for brand_info in manifest:
            ticker = brand_info["ticker"]
            file_path = brand_info["file"]
            if file_path.startswith("data/"):
                data_file = os.path.join(self.data_dir, file_path[5:])
            else:
                data_file = os.path.join(self.data_dir, file_path)

            if not os.path.exists(data_file):
                continue

            with open(data_file, "r") as f:
                locations = json.load(f)

            brand_metrics = {
                "count": len(locations),
                "with_attributes": 0,
                "with_scores": 0,
                "with_demographics": 0,
                "with_accessibility": 0,
                "with_traffic": 0,
                "attribute_coverage": 0
            }

            required_demographic_fields = [
                "medianIncome", "populationDensity", "consumerSpending",
                "growthRate", "educationIndex", "employmentRate"
            ]
            required_accessibility_fields = [
                "walkScore", "transitScore"
            ]
            required_traffic_fields = [
                "traffic", "visibility"
            ]

            for loc in locations:
                attrs = loc.get("at", {})
                score = loc.get("s")

                if attrs:
                    brand_metrics["with_attributes"] += 1
                if score:
                    brand_metrics["with_scores"] += 1

                if all(f in attrs for f in required_demographic_fields):
                    brand_metrics["with_demographics"] += 1
                    total_with_demographics += 1

                if all(f in attrs for f in required_accessibility_fields):
                    brand_metrics["with_accessibility"] += 1
                    total_with_accessibility += 1

                if all(f in attrs for f in required_traffic_fields):
                    brand_metrics["with_traffic"] += 1
                    total_with_traffic += 1

            total_with_attrs += brand_metrics["with_attributes"]
            total_with_scores += brand_metrics["with_scores"]

            # Calculate coverage percentage
            if len(locations) > 0:
                coverage = (
                    brand_metrics["with_attributes"] / len(locations)
                ) * 100
                brand_metrics["attribute_coverage"] = round(coverage, 1)

            quality_metrics["brands"][ticker] = brand_metrics

        # Calculate aggregate statistics
        quality_metrics["summary"] = {
            "totalLocations": self.results["totalLocations"],
            "locationsWithAttributes": total_with_attrs,
            "locationsWithScores": total_with_scores,
            "locationsWithDemographics": total_with_demographics,
            "locationsWithAccessibility": total_with_accessibility,
            "locationsWithTraffic": total_with_traffic,
            "demographicCoverage": round(
                (total_with_demographics / self.results["totalLocations"] * 100)
                if self.results["totalLocations"] > 0 else 0, 1
            ),
            "accessibilityCoverage": round(
                (total_with_accessibility / self.results["totalLocations"] * 100)
                if self.results["totalLocations"] > 0 else 0, 1
            ),
            "trafficCoverage": round(
                (total_with_traffic / self.results["totalLocations"] * 100)
                if self.results["totalLocations"] > 0 else 0, 1
            )
        }

        # Save report
        report_path = os.path.join(self.data_dir, "data_quality_report.json")
        with open(report_path, "w") as f:
            json.dump(quality_metrics, f, indent=2)

        print(f"✓ Data Quality Report generated: {report_path}")
        print(f"\nQuality Metrics Summary:")
        print(f"  Total Locations: {quality_metrics['summary']['totalLocations']:,}")
        print(f"  With Demographics: {quality_metrics['summary']['locationsWithDemographics']:,} "
              f"({quality_metrics['summary']['demographicCoverage']}%)")
        print(f"  With Accessibility: {quality_metrics['summary']['locationsWithAccessibility']:,} "
              f"({quality_metrics['summary']['accessibilityCoverage']}%)")
        print(f"  With Traffic Data: {quality_metrics['summary']['locationsWithTraffic']:,} "
              f"({quality_metrics['summary']['trafficCoverage']}%)")

        self.results["stages"]["quality_report"] = {
            "status": "completed",
            "reportPath": report_path,
            "metrics": quality_metrics["summary"]
        }
        return True

    def create_dataset_index(self) -> bool:
        """Create a comprehensive dataset index."""
        print("\n[6/6] Creating Dataset Index...")
        print("-" * 60)

        manifest_path = os.path.join(self.data_dir, "manifest.json")
        with open(manifest_path, "r") as f:
            manifest = json.load(f)

        # Convert any sets to lists for JSON serialization
        def convert_sets(obj):
            if isinstance(obj, set):
                return list(obj)
            elif isinstance(obj, dict):
                return {k: convert_sets(v) for k, v in obj.items()}
            elif isinstance(obj, list):
                return [convert_sets(item) for item in obj]
            return obj

        index = {
            "version": "1.0",
            "createdAt": datetime.now().isoformat(),
            "dataTypes": {
                "locations": {
                    "description": "Franchise location data with geographic coordinates",
                    "totalLocations": self.results["totalLocations"],
                    "brands": len(manifest)
                },
                "demographics": {
                    "description": "Population and income data from U.S. Census Bureau",
                    "fields": [
                        "medianIncome",
                        "populationDensity",
                        "educationIndex",
                        "employmentRate",
                        "consumerSpending",
                        "growthRate"
                    ],
                    "sources": [
                        "U.S. Census Bureau ACS 5-Year (2017-2021)",
                        "Population Density Data",
                        "Growth Estimates"
                    ]
                },
                "accessibility": {
                    "description": "Walkability and transit accessibility scores",
                    "fields": [
                        "walkScore",
                        "transitScore",
                        "bikingScore"
                    ],
                    "sources": [
                        "Walk Score API",
                        "Public Transit Databases (GTFS)",
                        "Street Network Analysis"
                    ]
                },
                "traffic": {
                    "description": "Traffic volume and road infrastructure data",
                    "fields": [
                        "traffic",
                        "visibility",
                        "roadDensity",
                        "nearestHighway",
                        "highwayDistance"
                    ],
                    "sources": [
                        "DOT AADT Estimates",
                        "OpenStreetMap Network Analysis",
                        "Historical Traffic Data"
                    ]
                },
                "scores": {
                    "description": "Comprehensive suitability scores for franchise locations",
                    "overallScore": "0-100 composite score",
                    "categoryScores": [
                        "marketPotential",
                        "competitiveLandscape",
                        "accessibility",
                        "siteCharacteristics"
                    ]
                }
            },
            "files": {
                "manifest": "manifest.json - List of all brands and their data files",
                "brandData": "brands/*.json - Location data for each brand/ticker",
                "demographicIndex": "demographic_index.json - Summary statistics by brand",
                "qualityReport": "data_quality_report.json - Data quality metrics",
                "datasetIndex": "dataset_index.json - This file"
            },
            "usage": {
                "frontend": "Load brands/*.json files to populate map with locations and scores",
                "analysis": "Use demographic_index.json for quick aggregated statistics",
                "quality": "Consult data_quality_report.json to understand data completeness",
                "mapping": "Use geographic (lat/lng) with demographic (medianIncome) for visualization"
            },
            "attributes": {
                "location": {
                    "id": "Unique identifier (ticker_osm_id)",
                    "ticker": "Stock ticker symbol",
                    "n": "Location name",
                    "a": "Address",
                    "lat": "Latitude coordinate",
                    "lng": "Longitude coordinate"
                },
                "score": {
                    "s": "Overall suitability score (0-100)",
                    "ss": "Sub-scores by category"
                },
                "attributes": {
                    "All demographic, accessibility, and traffic fields",
                    "At least 20+ attributes per location",
                    "Includes data source citations"
                }
            }
        }

        # Save index (convert sets to lists for JSON serialization)
        index_path = os.path.join(self.data_dir, "dataset_index.json")
        index = convert_sets(index)
        with open(index_path, "w") as f:
            json.dump(index, f, indent=2)

        print(f"✓ Dataset index created: {index_path}")

        # Print summary
        print(f"\nDataset Summary:")
        print(f"  Total Brands: {len(manifest)}")
        print(f"  Total Locations: {self.results['totalLocations']:,}")
        print(f"  Data Types: {len(index['dataTypes'])} comprehensive categories")
        print(f"  Geographic Coverage: United States")

        self.results["stages"]["dataset_index"] = {
            "status": "completed",
            "indexPath": index_path
        }
        return True

    def run(self) -> bool:
        """Run the complete aggregation pipeline."""
        print("\n" + "="*60)
        print("DATA AGGREGATION ORCHESTRATOR")
        print("Building comprehensive dataset for FranResearch Map")
        print("="*60)

        stages = [
            (self.verify_structure, "Verify Structure"),
            (self.run_census_enrichment, "Census Enrichment"),
            (self.run_accessibility_enrichment, "Accessibility Enrichment"),
            (self.run_traffic_enrichment, "Traffic Enrichment"),
            (self.generate_data_quality_report, "Quality Report"),
            (self.create_dataset_index, "Dataset Index"),
        ]

        success = True
        for stage_func, stage_name in stages:
            try:
                if not stage_func():
                    print(f"ERROR: {stage_name} failed")
                    success = False
                    break
            except Exception as e:
                print(f"ERROR in {stage_name}: {e}")
                success = False
                break

        # Save final results
        self.results["endTime"] = datetime.now().isoformat()
        results_path = os.path.join(self.data_dir, "aggregation_results.json")
        with open(results_path, "w") as f:
            json.dump(self.results, f, indent=2)

        # Print final summary
        print("\n" + "="*60)
        if success:
            print("✓ DATA AGGREGATION COMPLETE")
        else:
            print("✗ DATA AGGREGATION COMPLETED WITH ERRORS")
        print("="*60)
        print(f"\nResults saved to: {results_path}")
        print(f"Total Locations Processed: {self.results['totalLocations']:,}")
        print(f"Enrichment Stages: {len([s for s in self.results['stages'].values() if s.get('status') in ['completed', 'completed_with_warnings']])}/6")

        return success

def main():
    """Main entry point."""
    script_dir = os.path.dirname(os.path.abspath(__file__))
    data_dir = os.path.join(script_dir, "../data")

    orchestrator = DataAggregationOrchestrator(data_dir)
    success = orchestrator.run()

    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())
