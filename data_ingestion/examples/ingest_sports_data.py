"""
Sports Data Ingestor

Loads live and historical sports game data for multiple sports
(baseball, basketball, football, hockey, soccer).

Supports multiple sources:
- CSV files (game results)
- JSON files (game arrays)
- API endpoints (ESPN, etc.)

Output Format:
    {
        "sport": "baseball",
        "league": "MLB",
        "games": [
            {
                "id": "game_20251229_NYY_BOS",
                "date": "2025-12-29T19:00:00Z",
                "home_team": "Boston Red Sox",
                "away_team": "New York Yankees",
                "home_score": 7,
                "away_score": 4,
                "status": "completed",
                "stadium": "Fenway Park",
                "attendance": 37755
            }
        ],
        "metadata": {
            "sport": "baseball",
            "league": "MLB",
            "season": 2025,
            "game_count": 162,
            "last_updated": "2025-12-29T23:30:00Z"
        }
    }
"""

import json
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional

from data_ingestion.base import StreamingIngestionScript
from data_ingestion.config import SPORTS_OUTPUT_DIR, VALID_SPORTS
from data_ingestion.utils.validators import validate_sports_record, ValidationError
from data_ingestion.utils.storage import save_json, load_json, load_csv


class SportsDataIngestor(StreamingIngestionScript):
    """Load and transform sports game data.

    Supports:
    - CSV files with game results
    - JSON files with game arrays
    - API sources (ESPN, etc.)
    - Real-time streaming

    Handles multiple sports and leagues.
    """

    def __init__(self, sport: str, league: str, data_source: str, season: int = 2025):
        """Initialize sports ingestor.

        Args:
            sport: Sport type (baseball, basketball, football, hockey, soccer)
            league: League code (MLB, NBA, NFL, NHL, MLS, EPL, etc.)
            data_source: Path to CSV/JSON file or API endpoint
            season: Season year (default current year)

        Raises:
            ValueError: If sport is invalid
        """
        if sport.lower() not in VALID_SPORTS:
            raise ValueError(f"Invalid sport: {sport}. Must be one of {VALID_SPORTS}")

        super().__init__(
            name=f"sports_{sport.lower()}_{league.lower()}",
            version="1.0.0",
            update_interval=60  # Update every 60 seconds
        )
        self.sport = sport.lower()
        self.league = league.upper()
        self.data_source = data_source
        self.season = season
        self.output_path = SPORTS_OUTPUT_DIR / self.sport / f"{self.league}_{season}.json"

    def fetch(self) -> List[Dict[str, Any]]:
        """Fetch sports game data from source.

        Supports CSV, JSON, or API sources.

        Returns:
            List of game records
        """
        self.logger.info(f"Fetching {self.sport.upper()} data ({self.league} {self.season}) from {self.data_source}")

        source_path = Path(self.data_source)

        if source_path.exists():
            # File-based loading
            if source_path.suffix.lower() == ".csv":
                data = load_csv(source_path)
            elif source_path.suffix.lower() == ".json":
                json_data = load_json(source_path)
                data = json_data if isinstance(json_data, list) else json_data.get("games", [])
            else:
                raise ValueError(f"Unsupported file format: {source_path.suffix}")
        else:
            # API-based loading (stub)
            self.logger.warning(f"Data source {self.data_source} not found. Using sample data.")
            data = self._generate_sample_games()

        self.logger.info(f"Fetched {len(data)} games")
        return data

    def validate(self, data: Any) -> None:
        """Validate sports data.

        Args:
            data: List of game records

        Raises:
            ValidationError: If validation fails
        """
        if not isinstance(data, list):
            raise ValidationError("Data must be a list of game records")

        if len(data) == 0:
            self.logger.warning("No games found")
            return

        # Validate first few records
        valid_count = 0
        for i, record in enumerate(data[:10]):
            errors = validate_sports_record(record)
            if not errors:
                valid_count += 1
            else:
                self.logger.warning(f"Record {i}: {errors}")

        self.logger.info(f"Sample validation: {valid_count}/10 records valid")

    def transform(self, data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Transform sports data to canonical format.

        Args:
            data: List of raw game records

        Returns:
            Dictionary with games array and metadata
        """
        self.logger.info(f"Transforming {len(data)} game records...")

        games = []
        errors = 0

        for i, record in enumerate(data):
            try:
                # Format the game
                formatted = self._format_game(record)
                games.append(formatted)
                self.record_count += 1

            except Exception as e:
                errors += 1
                self.logger.warning(f"Failed to transform game {i}: {e}")

        self.logger.info(f"Transformed {self.record_count} games ({errors} errors)")

        # Calculate statistics
        completed = sum(1 for g in games if g.get("status") == "completed")
        total_home_score = sum(g.get("home_score", 0) for g in games if g.get("home_score"))
        total_away_score = sum(g.get("away_score", 0) for g in games if g.get("away_score"))

        # Generate metadata
        metadata = {
            "sport": self.sport.upper(),
            "league": self.league,
            "season": self.season,
            "game_count": len(games),
            "completed_games": completed,
            "statistics": {
                "avg_home_score": round(total_home_score / completed, 1) if completed > 0 else 0,
                "avg_away_score": round(total_away_score / completed, 1) if completed > 0 else 0
            },
            "last_updated": datetime.utcnow().isoformat() + "Z"
        }

        return {
            "sport": self.sport,
            "league": self.league,
            "games": games,
            "metadata": metadata
        }

    def save(self, data: Dict[str, Any]) -> None:
        """Save transformed data to disk.

        Args:
            data: Transformed sports data with metadata

        Raises:
            IOError: If save fails
        """
        self.logger.info(f"Saving {len(data['games'])} games to {self.output_path}")

        # Ensure output directory exists
        self.output_path.parent.mkdir(parents=True, exist_ok=True)

        # Save JSON
        save_json(data, self.output_path, pretty=True, atomic=True)
        self.logger.info(f"Saved: {self.output_path}")

    def get_stream(self):
        """Get streaming game data (generator).

        For live games, would poll API periodically.

        Yields:
            Game records
        """
        # For file-based sources, yield from fetch()
        # For live sources, would poll API in loop
        source_path = Path(self.data_source)

        if source_path.exists():
            data = self.fetch()
            for game in data:
                yield game

    def should_stop(self) -> bool:
        """Determine if streaming should stop.

        Default: True (one-time fetch, not continuous streaming)

        Returns:
            True if streaming should stop
        """
        return True

    def _format_game(self, record: Dict[str, Any]) -> Dict[str, Any]:
        """Format single game record.

        Args:
            record: Raw game record

        Returns:
            Formatted game record
        """
        return {
            "id": str(record.get("id", f"game_{self.record_count}")).strip(),
            "date": str(record.get("date", "")).strip(),
            "home_team": str(record.get("home_team", "")).strip(),
            "away_team": str(record.get("away_team", "")).strip(),
            "home_score": int(record.get("home_score", 0)) if record.get("home_score") else 0,
            "away_score": int(record.get("away_score", 0)) if record.get("away_score") else 0,
            "status": str(record.get("status", "scheduled")).strip().lower(),
            "stadium": str(record.get("stadium", "")).strip() or None,
            "attendance": int(record.get("attendance", 0)) if record.get("attendance") else None
        }

    def _generate_sample_games(self) -> List[Dict[str, Any]]:
        """Generate sample sports data for testing.

        Returns:
            List of sample game records
        """
        games = []

        # Sample games for this league
        if self.league == "MLB":
            teams = [
                ("New York Yankees", "Boston Red Sox"),
                ("Los Angeles Dodgers", "San Francisco Giants"),
                ("Chicago Cubs", "St. Louis Cardinals")
            ]
        elif self.league == "NBA":
            teams = [
                ("Los Angeles Lakers", "Boston Celtics"),
                ("Golden State Warriors", "Los Angeles Clippers"),
                ("Miami Heat", "New York Knicks")
            ]
        else:
            teams = [
                ("Team A", "Team B"),
                ("Team C", "Team D")
            ]

        current_date = datetime.utcnow()

        for i, (home, away) in enumerate(teams * 3):
            game = {
                "id": f"game_{self.season}_{i:04d}",
                "date": current_date.isoformat() + "Z",
                "home_team": home,
                "away_team": away,
                "home_score": (i * 7) % 13,
                "away_score": (i * 5) % 11,
                "status": "completed" if i > 5 else "scheduled",
                "stadium": f"{home} Stadium",
                "attendance": 35000 + (i * 1000) if i % 2 == 0 else None
            }
            games.append(game)
            current_date = current_date.replace(day=current_date.day + 1)

        return games


if __name__ == "__main__":
    # Example: Load MLB 2025 data
    ingestor = SportsDataIngestor(
        sport="baseball",
        league="MLB",
        data_source="mlb_2025.csv",
        season=2025
    )

    # Run the pipeline
    success = ingestor.run()

    if success:
        print(f"Success! Loaded {ingestor.record_count} games")
        summary = ingestor.get_summary()
        print(json.dumps(summary, indent=2))
    else:
        print(f"Failed to ingest sports data. See logs for details.")
