#!/usr/bin/env python3
"""
Robust Data Aggregation Pipeline
Orchestrates enrichment of franchise location data with multiple data sources.

Features:
- Structured logging and error reporting
- Retry logic for resilience
- Data validation at each stage
- Progress tracking
- Comprehensive quality metrics
- Graceful degradation on missing dependencies
"""

import json
import logging
import os
import subprocess
import sys
import time
from dataclasses import dataclass, asdict
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Tuple, Any


# ============================================================================
# CONFIGURATION & CONSTANTS
# ============================================================================

class Config:
    """Pipeline configuration."""
    MAX_RETRIES = 2
    RETRY_DELAY = 5  # seconds
    SUBPROCESS_TIMEOUT = 300  # 5 minutes per stage
    TOTAL_PIPELINE_TIMEOUT = 1200  # 20 minutes total
    MIN_LOCATIONS_THRESHOLD = 100  # Warn if fewer than this
    LOG_FORMAT = '%(asctime)s [%(levelname)s] %(name)s: %(message)s'
    LOG_DATE_FORMAT = '%Y-%m-%d %H:%M:%S'


# ============================================================================
# LOGGING SETUP
# ============================================================================

def setup_logging(log_file: Optional[str] = None) -> logging.Logger:
    """Configure structured logging."""
    logger = logging.getLogger("DataAggregation")
    logger.setLevel(logging.DEBUG)

    # Console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(logging.INFO)
    console_format = logging.Formatter(Config.LOG_FORMAT, Config.LOG_DATE_FORMAT)
    console_handler.setFormatter(console_format)
    logger.addHandler(console_handler)

    # File handler (optional)
    if log_file:
        try:
            file_handler = logging.FileHandler(log_file, mode='w', encoding='utf-8')
            file_handler.setLevel(logging.DEBUG)
            file_handler.setFormatter(console_format)
            logger.addHandler(file_handler)
        except Exception as e:
            logger.warning(f"Failed to create log file: {e}")

    return logger


logger = setup_logging()


# ============================================================================
# DATA CLASSES
# ============================================================================

@dataclass
class StageResult:
    """Result of a pipeline stage."""
    name: str
    status: str  # 'completed', 'skipped', 'error', 'timeout', 'warning'
    duration: float
    message: str
    details: Dict[str, Any] = None

    def __post_init__(self):
        if self.details is None:
            self.details = {}


@dataclass
class QualityMetrics:
    """Data quality metrics."""
    total_locations: int = 0
    with_attributes: int = 0
    with_scores: int = 0
    with_demographics: int = 0
    with_accessibility: int = 0
    with_crime_data: int = 0
    with_employment_data: int = 0
    with_transit_data: int = 0
    demographic_coverage: float = 0.0
    accessibility_coverage: float = 0.0
    crime_coverage: float = 0.0
    employment_coverage: float = 0.0
    transit_coverage: float = 0.0


# ============================================================================
# VALIDATION UTILITIES
# ============================================================================

class DataValidator:
    """Validates data integrity and structure."""

    @staticmethod
    def is_valid_json_file(file_path: Path) -> Tuple[bool, str]:
        """Validate JSON file integrity."""
        try:
            if not file_path.exists():
                return False, f"File not found: {file_path}"

            if not file_path.is_file():
                return False, f"Not a file: {file_path}"

            if file_path.stat().st_size == 0:
                return False, "File is empty"

            with open(file_path, 'r', encoding='utf-8') as f:
                json.load(f)

            return True, "Valid"
        except json.JSONDecodeError as e:
            return False, f"JSON decode error: {e}"
        except Exception as e:
            return False, f"Validation error: {e}"

    @staticmethod
    def validate_location(location: Dict) -> bool:
        """Validate location object has required fields."""
        required = ['id', 'ticker', 'n', 'lat', 'lng']
        return all(key in location for key in required)

    @staticmethod
    def validate_brand_file(file_path: Path) -> Tuple[bool, List[str], int]:
        """
        Validate brand data file.
        Returns: (is_valid, errors, location_count)
        """
        errors = []
        location_count = 0

        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)

            if not isinstance(data, list):
                errors.append("Data is not a list")
                return False, errors, 0

            if len(data) == 0:
                errors.append("Data list is empty")
                return False, errors, 0

            invalid_count = 0
            for i, loc in enumerate(data):
                if not isinstance(loc, dict):
                    errors.append(f"Location {i} is not a dict")
                    invalid_count += 1
                elif not DataValidator.validate_location(loc):
                    errors.append(f"Location {i} missing required fields")
                    invalid_count += 1

            if invalid_count > 0:
                if invalid_count > 10:
                    errors = errors[:10]
                    errors.append(f"... and {invalid_count - 10} more")
                return False, errors, len(data)

            location_count = len(data)
            return True, [], location_count

        except Exception as e:
            errors.append(f"Exception: {str(e)}")
            return False, errors, 0


# ============================================================================
# SUBPROCESS UTILITIES
# ============================================================================

class ProcessRunner:
    """Handles subprocess execution with retry logic."""

    @staticmethod
    def run_script(
        script_path: Path,
        timeout: int = Config.SUBPROCESS_TIMEOUT,
        max_retries: int = Config.MAX_RETRIES,
        env: Optional[Dict] = None
    ) -> Tuple[bool, str, str]:
        """
        Run a Python script with retry logic.
        Returns: (success, stdout, stderr)
        """
        if not script_path.exists():
            return False, "", f"Script not found: {script_path}"

        env = env or {}
        merged_env = os.environ.copy()
        merged_env.update(env)

        last_error = None

        for attempt in range(max_retries + 1):
            try:
                result = subprocess.run(
                    [sys.executable, str(script_path)],
                    capture_output=True,
                    text=True,
                    timeout=timeout,
                    env=merged_env
                )

                if result.returncode == 0:
                    return True, result.stdout, result.stderr
                else:
                    last_error = result.stderr or "Non-zero exit code"

                    if attempt < max_retries:
                        logger.warning(
                            f"Attempt {attempt + 1} failed, retrying in {Config.RETRY_DELAY}s..."
                        )
                        time.sleep(Config.RETRY_DELAY)
                    else:
                        return False, result.stdout, last_error

            except subprocess.TimeoutExpired:
                last_error = f"Process timeout after {timeout}s"
                if attempt < max_retries:
                    logger.warning(
                        f"Timeout on attempt {attempt + 1}, retrying..."
                    )
                    time.sleep(Config.RETRY_DELAY)
                else:
                    return False, "", last_error

            except Exception as e:
                last_error = str(e)
                if attempt < max_retries:
                    logger.warning(f"Exception on attempt {attempt + 1}: {e}")
                    time.sleep(Config.RETRY_DELAY)
                else:
                    return False, "", last_error

        return False, "", last_error


# ============================================================================
# MAIN ORCHESTRATOR
# ============================================================================

class DataAggregationPipeline:
    """Orchestrates the complete data aggregation pipeline."""

    def __init__(self, data_dir: Path):
        self.data_dir = Path(data_dir)
        self.script_dir = Path(__file__).parent
        self.brands_dir = self.data_dir / "brands"
        self.manifest_path = self.data_dir / "manifest.json"

        self.stages: List[StageResult] = []
        self.manifest: List[Dict] = []
        self.quality_metrics = QualityMetrics()
        self.pipeline_start_time = datetime.now()

        logger.info(f"Pipeline initialized")
        logger.info(f"Data directory: {self.data_dir}")
        logger.info(f"Scripts directory: {self.script_dir}")

    def verify_prerequisites(self) -> bool:
        """Verify all prerequisites are met."""
        logger.info("\n" + "="*70)
        logger.info("STAGE 0: Verifying Prerequisites")
        logger.info("="*70)

        # Check data directory
        if not self.data_dir.exists():
            logger.error(f"Data directory not found: {self.data_dir}")
            return False

        # Check manifest
        if not self.manifest_path.exists():
            logger.error(f"Manifest not found: {self.manifest_path}")
            return False

        # Load and validate manifest
        try:
            with open(self.manifest_path, 'r', encoding='utf-8') as f:
                self.manifest = json.load(f)

            if not isinstance(self.manifest, list) or len(self.manifest) == 0:
                logger.error("Manifest is empty or not a list")
                return False

            logger.info(f"✓ Manifest loaded: {len(self.manifest)} brands")

        except Exception as e:
            logger.error(f"Failed to load manifest: {e}")
            return False

        return True

    def load_manifest(self) -> bool:
        """Load and validate the manifest file."""
        logger.info("Loading manifest...")

        try:
            with open(self.manifest_path, 'r', encoding='utf-8') as f:
                self.manifest = json.load(f)

            logger.info(f"✓ Manifest loaded: {len(self.manifest)} brands")
            return True

        except Exception as e:
            logger.error(f"Failed to load manifest: {e}")
            return False

    def verify_brand_data(self) -> StageResult:
        """Verify all brand data files exist and are valid."""
        logger.info("\n" + "="*70)
        logger.info("STAGE 1: Verifying Brand Data")
        logger.info("="*70)

        start_time = time.time()
        missing_files = []
        invalid_files = []
        total_locations = 0

        for brand_info in self.manifest:
            ticker = brand_info.get('ticker', 'UNKNOWN')
            file_rel = brand_info.get('file', '')

            # Resolve file path
            if file_rel.startswith('data/'):
                file_path = self.data_dir / file_rel[5:]
            else:
                file_path = self.data_dir / file_rel

            # Check existence
            if not file_path.exists():
                missing_files.append(ticker)
                logger.warning(f"  ✗ {ticker}: File not found")
                continue

            # Validate content
            is_valid, errors, loc_count = DataValidator.validate_brand_file(file_path)
            if not is_valid:
                invalid_files.append((ticker, errors))
                logger.warning(f"  ✗ {ticker}: Invalid - {errors[0]}")
            else:
                total_locations += loc_count
                logger.info(f"  ✓ {ticker}: {loc_count:,} locations")

        self.quality_metrics.total_locations = total_locations

        # Build result
        duration = time.time() - start_time
        status = 'error' if missing_files or invalid_files else 'completed'

        details = {
            'brands_verified': len(self.manifest) - len(missing_files) - len(invalid_files),
            'total_brands': len(self.manifest),
            'missing_files': missing_files,
            'invalid_files': {t: e[0] for t, e in invalid_files},
            'total_locations': total_locations
        }

        message = (
            f"Verified {details['brands_verified']}/{details['total_brands']} brands, "
            f"{total_locations:,} total locations"
        )
        if missing_files or invalid_files:
            message += f" (⚠ {len(missing_files)} missing, {len(invalid_files)} invalid)"

        result = StageResult(
            name="Brand Data Verification",
            status=status,
            duration=duration,
            message=message,
            details=details
        )

        logger.info(f"  {message}")
        self.stages.append(result)
        return result

    def run_enrichment_stage(
        self,
        stage_num: int,
        stage_name: str,
        script_name: str,
        env_vars: Optional[Dict] = None,
        optional: bool = False
    ) -> StageResult:
        """Run a data enrichment stage."""
        logger.info("\n" + "="*70)
        logger.info(f"STAGE {stage_num}: {stage_name}")
        logger.info("="*70)

        script_path = self.script_dir / script_name
        env_vars = env_vars or {}

        # Check if script exists
        if not script_path.exists():
            status = 'skipped' if optional else 'error'
            message = f"Script not found: {script_name}"
            logger.warning(f"  {message}")

            result = StageResult(
                name=stage_name,
                status=status,
                duration=0.0,
                message=message
            )
            self.stages.append(result)
            return result

        # Run script with retry logic
        start_time = time.time()
        success, stdout, stderr = ProcessRunner.run_script(
            script_path,
            env=env_vars
        )
        duration = time.time() - start_time

        # Process output
        if success:
            status = 'completed'
            message = f"Completed successfully in {duration:.1f}s"
            # Try to extract useful info from stdout
            if stdout:
                lines = stdout.split('\n')
                for line in lines[-5:]:
                    if line.strip() and '✓' in line:
                        message = line.strip()
                        break
            logger.info(f"  ✓ {message}")
        else:
            status = 'error' if not optional else 'skipped'
            message = f"Failed: {stderr[:200]}" if stderr else "Unknown error"
            logger.error(f"  ✗ {message}")
            logger.debug(f"Full stderr: {stderr}")

        result = StageResult(
            name=stage_name,
            status=status,
            duration=duration,
            message=message,
            details={
                'script': script_name,
                'success': success,
                'stderr_preview': stderr[:500] if stderr else None
            }
        )

        self.stages.append(result)
        return result

    def calculate_quality_metrics(self) -> bool:
        """Calculate comprehensive data quality metrics."""
        logger.info("\n" + "="*70)
        logger.info("STAGE 5: Calculating Quality Metrics")
        logger.info("="*70)

        try:
            required_demographic_fields = [
                'medianIncome', 'populationDensity', 'consumerSpending',
                'growthRate', 'educationIndex', 'employmentRate'
            ]
            required_accessibility_fields = ['walkScore', 'transitScore']
            crime_fields = ['crimeIndex']
            employment_fields = ['employmentRate']
            transit_fields = ['transitScore']

            for brand_info in self.manifest:
                file_rel = brand_info.get('file', '') if isinstance(brand_info, dict) else ''

                # Resolve file path
                if file_rel.startswith('data/'):
                    file_path = self.data_dir / file_rel[5:]
                else:
                    file_path = self.data_dir / file_rel

                if not file_path.exists():
                    continue

                with open(file_path, 'r', encoding='utf-8') as f:
                    locations = json.load(f)

                # Skip if not a list
                if not isinstance(locations, list):
                    continue

                for loc in locations:
                    attrs = loc.get('at', {})
                    score = loc.get('s')

                    if attrs:
                        self.quality_metrics.with_attributes += 1
                    if score:
                        self.quality_metrics.with_scores += 1

                    if all(f in attrs for f in required_demographic_fields):
                        self.quality_metrics.with_demographics += 1

                    if all(f in attrs for f in required_accessibility_fields):
                        self.quality_metrics.with_accessibility += 1

                    if any(f in attrs for f in crime_fields):
                        self.quality_metrics.with_crime_data += 1

                    if any(f in attrs for f in employment_fields):
                        self.quality_metrics.with_employment_data += 1

                    if any(f in attrs for f in transit_fields):
                        self.quality_metrics.with_transit_data += 1

            # Calculate percentages
            total = self.quality_metrics.total_locations
            if total > 0:
                self.quality_metrics.demographic_coverage = (
                    self.quality_metrics.with_demographics / total * 100
                )
                self.quality_metrics.accessibility_coverage = (
                    self.quality_metrics.with_accessibility / total * 100
                )
                self.quality_metrics.crime_coverage = (
                    self.quality_metrics.with_crime_data / total * 100
                )
                self.quality_metrics.employment_coverage = (
                    self.quality_metrics.with_employment_data / total * 100
                )
                self.quality_metrics.transit_coverage = (
                    self.quality_metrics.with_transit_data / total * 100
                )

            logger.info(f"  ✓ Quality metrics calculated")
            logger.info(f"    - Demographics: {self.quality_metrics.demographic_coverage:.1f}%")
            logger.info(f"    - Accessibility: {self.quality_metrics.accessibility_coverage:.1f}%")
            logger.info(f"    - Crime Data: {self.quality_metrics.crime_coverage:.1f}%")
            logger.info(f"    - Employment: {self.quality_metrics.employment_coverage:.1f}%")
            logger.info(f"    - Transit: {self.quality_metrics.transit_coverage:.1f}%")

            return True

        except Exception as e:
            logger.error(f"Failed to calculate metrics: {e}")
            return False

    def save_quality_report(self) -> bool:
        """Save quality metrics report."""
        logger.info("\nSaving quality report...")

        try:
            report_path = self.data_dir / "data_quality_report.json"

            report = {
                'timestamp': datetime.now().isoformat(),
                'totalLocations': self.quality_metrics.total_locations,
                'coverage': {
                    'demographic': round(self.quality_metrics.demographic_coverage, 1),
                    'accessibility': round(self.quality_metrics.accessibility_coverage, 1),
                    'crimeData': round(self.quality_metrics.crime_coverage, 1),
                    'employment': round(self.quality_metrics.employment_coverage, 1),
                    'transit': round(self.quality_metrics.transit_coverage, 1)
                },
                'counts': {
                    'withAttributes': self.quality_metrics.with_attributes,
                    'withScores': self.quality_metrics.with_scores,
                    'withDemographics': self.quality_metrics.with_demographics,
                    'withAccessibility': self.quality_metrics.with_accessibility,
                    'withCrimeData': self.quality_metrics.with_crime_data,
                    'withEmployment': self.quality_metrics.with_employment_data,
                    'withTransit': self.quality_metrics.with_transit_data
                }
            }

            with open(report_path, 'w', encoding='utf-8') as f:
                json.dump(report, f, indent=2)

            logger.info(f"  ✓ Quality report saved: {report_path}")
            return True

        except Exception as e:
            logger.error(f"Failed to save quality report: {e}")
            return False

    def save_pipeline_summary(self) -> bool:
        """Save complete pipeline execution summary."""
        logger.info("Saving pipeline summary...")

        try:
            summary_path = self.data_dir / "aggregation_results.json"
            total_duration = (datetime.now() - self.pipeline_start_time).total_seconds()

            summary = {
                'executedAt': self.pipeline_start_time.isoformat(),
                'completedAt': datetime.now().isoformat(),
                'totalDuration': round(total_duration, 1),
                'stages': [asdict(stage) for stage in self.stages],
                'metrics': {
                    'totalLocations': self.quality_metrics.total_locations,
                    'coverage': {
                        'demographic': round(self.quality_metrics.demographic_coverage, 1),
                        'accessibility': round(self.quality_metrics.accessibility_coverage, 1),
                        'crimeData': round(self.quality_metrics.crime_coverage, 1),
                        'employment': round(self.quality_metrics.employment_coverage, 1),
                        'transit': round(self.quality_metrics.transit_coverage, 1)
                    }
                },
                'success': self.is_successful()
            }

            with open(summary_path, 'w', encoding='utf-8') as f:
                json.dump(summary, f, indent=2)

            logger.info(f"  ✓ Summary saved: {summary_path}")
            return True

        except Exception as e:
            logger.error(f"Failed to save summary: {e}")
            return False

    def is_successful(self) -> bool:
        """Check if pipeline completed successfully."""
        failed_stages = [s for s in self.stages if s.status == 'error']
        return len(failed_stages) == 0

    def run(self) -> int:
        """Execute the complete pipeline."""
        logger.info("\n" + "="*70)
        logger.info("DATA AGGREGATION PIPELINE")
        logger.info("="*70)

        # Stage 0: Prerequisites
        if not self.verify_prerequisites():
            logger.error("✗ Prerequisites check failed")
            return 1

        # Stage 1: Verify brand data
        verify_result = self.verify_brand_data()
        if verify_result.status == 'error':
            logger.warning("⚠ Brand data verification found issues")

        # Get API keys from environment
        env_vars = {
            'CENSUS_API_KEY': os.environ.get('CENSUS_API_KEY', ''),
            'GOV_DATA_KEY': os.environ.get('GOV_DATA_KEY', ''),
            'BLS_KEY': os.environ.get('BLS_KEY', '')
        }

        # Stage 2: Census enrichment
        self.run_enrichment_stage(
            2,
            "Census Data Enrichment",
            "aggregate_census_data.py",
            env_vars={'CENSUS_API_KEY': env_vars['CENSUS_API_KEY']}
        )

        # Stage 3: Crime data enrichment
        self.run_enrichment_stage(
            3,
            "Crime Data Enrichment",
            "aggregate_crime_data.py",
            env_vars={'GOV_DATA_KEY': env_vars['GOV_DATA_KEY']},
            optional=True
        )

        # Stage 4: Employment data enrichment
        self.run_enrichment_stage(
            4,
            "Employment Data Enrichment",
            "aggregate_employment_data.py",
            env_vars={'BLS_KEY': env_vars['BLS_KEY']},
            optional=True
        )

        # Stage 5: Quality metrics
        logger.info("\n" + "="*70)
        logger.info("STAGE 5: Quality Metrics & Reports")
        logger.info("="*70)

        if not self.calculate_quality_metrics():
            logger.error("Failed to calculate quality metrics")

        if not self.save_quality_report():
            logger.error("Failed to save quality report")

        if not self.save_pipeline_summary():
            logger.error("Failed to save pipeline summary")

        # Final report
        logger.info("\n" + "="*70)
        logger.info("PIPELINE EXECUTION SUMMARY")
        logger.info("="*70)

        completed_stages = [s for s in self.stages if s.status == 'completed']
        failed_stages = [s for s in self.stages if s.status == 'error']

        logger.info(f"\nTotal Locations: {self.quality_metrics.total_locations:,}")
        logger.info(f"Stages Completed: {len(completed_stages)}/{len(self.stages)}")
        logger.info(f"Data Coverage:")
        logger.info(f"  • Demographics: {self.quality_metrics.demographic_coverage:.1f}%")
        logger.info(f"  • Accessibility: {self.quality_metrics.accessibility_coverage:.1f}%")
        logger.info(f"  • Crime Data: {self.quality_metrics.crime_coverage:.1f}%")
        logger.info(f"  • Employment: {self.quality_metrics.employment_coverage:.1f}%")
        logger.info(f"  • Transit: {self.quality_metrics.transit_coverage:.1f}%")

        total_duration = (datetime.now() - self.pipeline_start_time).total_seconds()
        logger.info(f"\nExecution Time: {total_duration:.1f}s")

        if self.is_successful():
            logger.info("\n✓ PIPELINE COMPLETED SUCCESSFULLY")
            return 0
        else:
            logger.error(f"\n✗ PIPELINE COMPLETED WITH {len(failed_stages)} ERROR(S)")
            for stage in failed_stages:
                logger.error(f"  - {stage.name}: {stage.message}")
            return 1


# ============================================================================
# MAIN ENTRY POINT
# ============================================================================

def main() -> int:
    """Main entry point."""
    try:
        script_dir = Path(__file__).parent
        data_dir = script_dir.parent / "data"

        pipeline = DataAggregationPipeline(data_dir)
        return pipeline.run()

    except KeyboardInterrupt:
        logger.warning("\nPipeline interrupted by user")
        return 130

    except Exception as e:
        logger.exception(f"Unexpected error: {e}")
        return 1


if __name__ == "__main__":
    sys.exit(main())
