"""
Data quality validation and reporting module.

Provides functionality for validating data integrity, completeness,
and consistency across pipeline outputs.
"""

import json
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple
from datetime import datetime


class DataQualityReport:
    """Generate and manage data quality reports."""

    def __init__(self, name: str):
        """
        Initialize quality report.

        Args:
            name: Name/identifier for this report
        """
        self.name = name
        self.timestamp = datetime.utcnow().isoformat() + "Z"
        self.checks: List[Dict[str, Any]] = []
        self.summary: Dict[str, Any] = {}

    def add_check(self, check_name: str, passed: bool, details: Optional[str] = None) -> None:
        """
        Add a quality check result.

        Args:
            check_name: Name of the check
            passed: Whether the check passed
            details: Optional details about the check
        """
        self.checks.append({
            "name": check_name,
            "passed": passed,
            "details": details
        })

    def add_summary(self, key: str, value: Any) -> None:
        """
        Add summary metric.

        Args:
            key: Metric name
            value: Metric value
        """
        self.summary[key] = value

    def get_report(self) -> Dict[str, Any]:
        """
        Get complete report as dictionary.

        Returns:
            Report dictionary
        """
        passed_checks = sum(1 for c in self.checks if c['passed'])
        total_checks = len(self.checks)

        return {
            "name": self.name,
            "timestamp": self.timestamp,
            "checks": {
                "total": total_checks,
                "passed": passed_checks,
                "failed": total_checks - passed_checks,
                "details": self.checks
            },
            "summary": self.summary,
            "status": "PASS" if passed_checks == total_checks else "FAIL"
        }

    def save(self, filepath: Path) -> None:
        """
        Save report to JSON file.

        Args:
            filepath: Path to save report
        """
        filepath.parent.mkdir(parents=True, exist_ok=True)
        with open(filepath, 'w') as f:
            json.dump(self.get_report(), f, indent=2)

    def print_summary(self) -> None:
        """Print summary of quality report to console."""
        report = self.get_report()
        checks = report['checks']

        print(f"\n{'='*70}")
        print(f"Data Quality Report: {self.name}")
        print(f"{'='*70}")
        print(f"Status: {report['status']}")
        print(f"Checks: {checks['passed']}/{checks['total']} passed")

        if self.summary:
            print(f"\nSummary Metrics:")
            for key, value in self.summary.items():
                if isinstance(value, (int, float)):
                    if isinstance(value, float) and value < 100:
                        print(f"  {key}: {value:.2f}")
                    else:
                        print(f"  {key}: {value:,}")
                else:
                    print(f"  {key}: {value}")

        if checks['failed'] > 0:
            print(f"\nFailed Checks:")
            for check in checks['details']:
                if not check['passed']:
                    print(f"  ✗ {check['name']}")
                    if check['details']:
                        print(f"    {check['details']}")

        print(f"{'='*70}\n")


class LocationDataValidator:
    """Validate franchise location data."""

    REQUIRED_LOCATION_FIELDS = ['id', 'ticker', 'n', 'a', 'lat', 'lng', 's']
    REQUIRED_ATTRIBUTES_FIELDS = ['medianIncome', 'populationDensity']

    @staticmethod
    def validate_location(loc: Dict[str, Any]) -> Tuple[bool, Optional[str]]:
        """
        Validate individual location record.

        Args:
            loc: Location object to validate

        Returns:
            Tuple of (is_valid, error_message)
        """
        # Check required fields
        missing = [f for f in LocationDataValidator.REQUIRED_LOCATION_FIELDS if f not in loc]
        if missing:
            return False, f"Missing fields: {missing}"

        # Validate coordinates
        try:
            lat = float(loc['lat'])
            lng = float(loc['lng'])
            if not (-90 <= lat <= 90):
                return False, f"Invalid latitude: {lat}"
            if not (-180 <= lng <= 180):
                return False, f"Invalid longitude: {lng}"
        except (ValueError, TypeError):
            return False, "Invalid coordinate format"

        # Validate score
        try:
            score = int(loc.get('s', 0))
            if not (0 <= score <= 100):
                return False, f"Score out of range: {score}"
        except (ValueError, TypeError):
            return False, "Invalid score format"

        return True, None

    @staticmethod
    def validate_dataset(data: List[Dict[str, Any]]) -> DataQualityReport:
        """
        Validate entire location dataset.

        Args:
            data: List of location objects

        Returns:
            DataQualityReport object
        """
        report = DataQualityReport("Location Dataset")

        if not data:
            report.add_check("Non-empty dataset", False, "Dataset is empty")
            return report

        # Check 1: All records have required fields
        invalid_count = 0
        for loc in data:
            valid, error = LocationDataValidator.validate_location(loc)
            if not valid:
                invalid_count += 1

        report.add_check(
            "Location record format",
            invalid_count == 0,
            f"{invalid_count} invalid records" if invalid_count > 0 else None
        )

        # Check 2: Coordinate distribution
        try:
            lats = [float(loc['lat']) for loc in data if 'lat' in loc]
            lngs = [float(loc['lng']) for loc in data if 'lng' in loc]

            if lats and lngs:
                lat_range = max(lats) - min(lats)
                lng_range = max(lngs) - min(lngs)
                report.add_check(
                    "Geographic diversity",
                    lat_range > 0 and lng_range > 0,
                    f"Lat range: {lat_range:.2f}, Lng range: {lng_range:.2f}"
                )
        except (ValueError, TypeError):
            report.add_check("Geographic diversity", False, "Invalid coordinate data")

        # Check 3: Score distribution
        try:
            scores = [int(loc.get('s', 0)) for loc in data if 's' in loc]
            if scores:
                avg_score = sum(scores) / len(scores)
                min_score = min(scores)
                max_score = max(scores)
                report.add_check(
                    "Score distribution",
                    0 <= avg_score <= 100,
                    f"Min: {min_score}, Avg: {avg_score:.1f}, Max: {max_score}"
                )
        except (ValueError, TypeError):
            report.add_check("Score distribution", False, "Invalid score data")

        # Summary metrics
        report.add_summary("Total Records", len(data))
        report.add_summary("Invalid Records", invalid_count)
        report.add_summary("Coverage", f"{((len(data) - invalid_count) / len(data) * 100):.1f}%")

        return report


class SportsDataValidator:
    """Validate sports data."""

    REQUIRED_GAME_FIELDS = ['id', 'league', 'homeTeam', 'awayTeam', 'homeScore', 'awayScore', 'status']

    @staticmethod
    def validate_game(game: Dict[str, Any]) -> Tuple[bool, Optional[str]]:
        """
        Validate individual game record.

        Args:
            game: Game object to validate

        Returns:
            Tuple of (is_valid, error_message)
        """
        missing = [f for f in SportsDataValidator.REQUIRED_GAME_FIELDS if f not in game]
        if missing:
            return False, f"Missing fields: {missing}"

        # Validate scores
        try:
            home_score = int(game.get('homeScore', 0))
            away_score = int(game.get('awayScore', 0))
            if home_score < 0 or away_score < 0:
                return False, "Negative scores"
        except (ValueError, TypeError):
            return False, "Invalid score format"

        # Validate status
        valid_statuses = ['scheduled', 'in_progress', 'final']
        if game.get('status') not in valid_statuses:
            return False, f"Invalid status: {game.get('status')}"

        return True, None

    @staticmethod
    def validate_dataset(data: Dict[str, Any]) -> DataQualityReport:
        """
        Validate sports dataset.

        Args:
            data: Sports data dictionary

        Returns:
            DataQualityReport object
        """
        report = DataQualityReport("Sports Dataset")

        total_games = 0
        invalid_count = 0

        for league, league_data in data.items():
            if league in ['last_updated']:
                continue

            games = league_data.get('games', [])
            total_games += len(games)

            for game in games:
                valid, error = SportsDataValidator.validate_game(game)
                if not valid:
                    invalid_count += 1

        report.add_check(
            "Game record format",
            invalid_count == 0,
            f"{invalid_count}/{total_games} invalid" if invalid_count > 0 else None
        )

        report.add_summary("Total Games", total_games)
        report.add_summary("Invalid Games", invalid_count)
        report.add_summary("Leagues Represented", len([k for k in data.keys() if k != 'last_updated']))

        return report


class NewsDataValidator:
    """Validate news data."""

    REQUIRED_ARTICLE_FIELDS = ['id', 'title', 'url', 'publishedAt', 'sourceId']

    @staticmethod
    def validate_article(article: Dict[str, Any]) -> Tuple[bool, Optional[str]]:
        """
        Validate individual article record.

        Args:
            article: Article object to validate

        Returns:
            Tuple of (is_valid, error_message)
        """
        missing = [f for f in NewsDataValidator.REQUIRED_ARTICLE_FIELDS if f not in article]
        if missing:
            return False, f"Missing fields: {missing}"

        # Validate URL format
        if not article.get('url', '').startswith('http'):
            return False, "Invalid URL format"

        # Validate date format
        try:
            date_str = article.get('publishedAt', '')
            # Basic ISO date validation
            if not date_str or len(date_str) < 8:
                return False, "Invalid date format"
        except Exception:
            return False, "Invalid date format"

        return True, None

    @staticmethod
    def validate_dataset(data: List[Dict[str, Any]]) -> DataQualityReport:
        """
        Validate news dataset.

        Args:
            data: List of article objects

        Returns:
            DataQualityReport object
        """
        report = DataQualityReport("News Dataset")

        if not data:
            report.add_check("Non-empty dataset", False, "Dataset is empty")
            return report

        invalid_count = 0
        sources = set()

        for article in data:
            valid, error = NewsDataValidator.validate_article(article)
            if not valid:
                invalid_count += 1
            sources.add(article.get('sourceId', 'unknown'))

        report.add_check(
            "Article record format",
            invalid_count == 0,
            f"{invalid_count}/{len(data)} invalid" if invalid_count > 0 else None
        )

        report.add_summary("Total Articles", len(data))
        report.add_summary("Invalid Articles", invalid_count)
        report.add_summary("News Sources", len(sources))

        return report
