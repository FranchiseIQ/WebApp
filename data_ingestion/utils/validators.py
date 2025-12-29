"""
Data Validation Utilities

Schema validation and data quality checks for geographic, stock, and sports data.
"""

import json
from datetime import datetime
from typing import Any, Dict, List, Optional

try:
    import jsonschema
except ImportError:
    jsonschema = None

from ..config import (
    MIN_LATITUDE, MAX_LATITUDE, MIN_LONGITUDE, MAX_LONGITUDE,
    VALID_US_STATES, VALID_CANADIAN_PROVINCES, VALID_COUNTRIES,
    MIN_STOCK_PRICE, MAX_STOCK_PRICE, MIN_HISTORICAL_RECORDS
)


class ValidationError(ValueError):
    """Custom exception for validation errors."""
    pass


# ============================================================================
# SCHEMA VALIDATION
# ============================================================================


def validate_schema(data: Any, schema: Dict[str, Any]) -> None:
    """Validate data against JSON Schema.

    Args:
        data: Data to validate
        schema: JSON Schema definition

    Raises:
        ValidationError: If validation fails
    """
    if jsonschema is None:
        raise ImportError("jsonschema required: pip install jsonschema")

    try:
        jsonschema.validate(instance=data, schema=schema)
    except jsonschema.ValidationError as e:
        raise ValidationError(f"Schema validation failed: {e.message}")
    except jsonschema.SchemaError as e:
        raise ValidationError(f"Invalid schema: {e.message}")


# ============================================================================
# LOCATION VALIDATION
# ============================================================================


def validate_location(location: Dict[str, Any]) -> List[str]:
    """Validate a location record.

    Returns list of errors (empty if valid).

    Args:
        location: Location dictionary

    Returns:
        List of error messages (empty if valid)
    """
    errors = []

    # Required fields
    required_fields = ["id", "brand", "latitude", "longitude", "address", "city", "state"]
    for field in required_fields:
        if field not in location:
            errors.append(f"Missing required field: {field}")

    # Latitude bounds
    if "latitude" in location:
        lat = location["latitude"]
        if not isinstance(lat, (int, float)):
            errors.append(f"latitude must be numeric, got {type(lat).__name__}")
        elif not (MIN_LATITUDE <= lat <= MAX_LATITUDE):
            errors.append(f"latitude {lat} outside valid range [{MIN_LATITUDE}, {MAX_LATITUDE}]")

    # Longitude bounds
    if "longitude" in location:
        lon = location["longitude"]
        if not isinstance(lon, (int, float)):
            errors.append(f"longitude must be numeric, got {type(lon).__name__}")
        elif not (MIN_LONGITUDE <= lon <= MAX_LONGITUDE):
            errors.append(f"longitude {lon} outside valid range [{MIN_LONGITUDE}, {MAX_LONGITUDE}]")

    # State validation (US or Canada)
    if "state" in location:
        state = location["state"].upper()
        if state not in VALID_US_STATES and state not in VALID_CANADIAN_PROVINCES:
            errors.append(f"Invalid state/province: {state}")

    # Optional zip code (5-digit or 9-digit format)
    if "zip" in location and location["zip"]:
        zip_code = str(location["zip"]).strip()
        if not (len(zip_code) == 5 or len(zip_code) == 9 or "-" in zip_code):
            errors.append(f"Invalid zip code: {zip_code}")

    # Phone format (optional)
    if "phone" in location and location["phone"]:
        phone = str(location["phone"]).strip()
        # Remove common formatting characters
        phone_digits = "".join(c for c in phone if c.isdigit())
        if phone_digits and len(phone_digits) not in [10, 11]:
            errors.append(f"Invalid phone: {phone}")

    # Score bounds (optional, 0-100)
    if "score" in location:
        score = location["score"]
        if not isinstance(score, (int, float)):
            errors.append(f"score must be numeric")
        elif not (0 <= score <= 100):
            errors.append(f"score {score} outside valid range [0, 100]")

    # Opened year (optional)
    if "opened" in location:
        opened = location["opened"]
        if opened and not isinstance(opened, int):
            errors.append(f"opened must be year (integer)")
        elif isinstance(opened, int) and (opened < 1900 or opened > datetime.now().year + 1):
            errors.append(f"opened year {opened} outside reasonable range")

    return errors


def validate_locations_batch(locations: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Validate batch of locations.

    Returns summary with error details.

    Args:
        locations: List of location dictionaries

    Returns:
        Dictionary with validation summary
    """
    valid_count = 0
    invalid_count = 0
    error_details = []

    for i, location in enumerate(locations):
        errors = validate_location(location)
        if errors:
            invalid_count += 1
            error_details.append({
                "record": i,
                "id": location.get("id", "unknown"),
                "errors": errors
            })
        else:
            valid_count += 1

    return {
        "total": len(locations),
        "valid": valid_count,
        "invalid": invalid_count,
        "error_details": error_details,
        "is_valid": invalid_count == 0
    }


# ============================================================================
# STOCK DATA VALIDATION
# ============================================================================


def validate_stock_record(record: Dict[str, Any]) -> List[str]:
    """Validate a single stock OHLCV record.

    Args:
        record: Stock record with date, open, high, low, close, volume

    Returns:
        List of error messages (empty if valid)
    """
    errors = []

    # Required fields
    required_fields = ["date", "open", "high", "low", "close", "volume"]
    for field in required_fields:
        if field not in record:
            errors.append(f"Missing required field: {field}")

    # Date format
    if "date" in record:
        date_str = str(record["date"])
        try:
            datetime.fromisoformat(date_str.replace("Z", "+00:00"))
        except (ValueError, AttributeError):
            errors.append(f"Invalid date format: {date_str}")

    # Price fields
    for field in ["open", "high", "low", "close"]:
        if field in record:
            price = record[field]
            if not isinstance(price, (int, float)):
                errors.append(f"{field} must be numeric")
            elif not (MIN_STOCK_PRICE <= price <= MAX_STOCK_PRICE):
                errors.append(f"{field} {price} outside valid range")

    # Price ordering: low <= open <= high, low <= close <= high
    if all(k in record for k in ["open", "high", "low", "close"]):
        low = record["low"]
        high = record["high"]
        open_p = record["open"]
        close = record["close"]

        if not (low <= open_p <= high):
            errors.append(f"open {open_p} outside [low {low}, high {high}]")
        if not (low <= close <= high):
            errors.append(f"close {close} outside [low {low}, high {high}]")

    # Volume (non-negative)
    if "volume" in record:
        volume = record["volume"]
        if not isinstance(volume, int) or volume < 0:
            errors.append(f"volume must be non-negative integer")

    return errors


def validate_stock_data(data: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Validate batch of stock records.

    Args:
        data: List of stock records

    Returns:
        Dictionary with validation summary
    """
    if len(data) < MIN_HISTORICAL_RECORDS:
        return {
            "valid": False,
            "reason": f"Insufficient records: {len(data)} < {MIN_HISTORICAL_RECORDS}",
            "record_count": len(data)
        }

    valid_count = 0
    invalid_count = 0
    error_details = []

    for i, record in enumerate(data):
        errors = validate_stock_record(record)
        if errors:
            invalid_count += 1
            error_details.append({"record": i, "errors": errors})
        else:
            valid_count += 1

    return {
        "valid": invalid_count == 0,
        "total": len(data),
        "valid_records": valid_count,
        "invalid_records": invalid_count,
        "error_details": error_details[:10]  # Show first 10 errors
    }


# ============================================================================
# SPORTS DATA VALIDATION
# ============================================================================


def validate_sports_record(record: Dict[str, Any]) -> List[str]:
    """Validate a sports game record.

    Args:
        record: Sports record with game details

    Returns:
        List of error messages (empty if valid)
    """
    errors = []

    # Required fields
    required_fields = ["date", "home_team", "away_team", "home_score", "away_score"]
    for field in required_fields:
        if field not in record:
            errors.append(f"Missing required field: {field}")

    # Score bounds (non-negative)
    for field in ["home_score", "away_score"]:
        if field in record:
            score = record[field]
            if not isinstance(score, int) or score < 0:
                errors.append(f"{field} must be non-negative integer")

    return errors


# ============================================================================
# CUSTOM VALIDATORS
# ============================================================================


def is_valid_email(email: str) -> bool:
    """Basic email validation.

    Args:
        email: Email address

    Returns:
        True if valid format
    """
    return "@" in email and "." in email.split("@")[-1]


def is_valid_url(url: str) -> bool:
    """Basic URL validation.

    Args:
        url: URL string

    Returns:
        True if valid format
    """
    return url.startswith(("http://", "https://"))


def is_valid_phone(phone: str) -> bool:
    """Validate phone number (10 or 11 digits).

    Args:
        phone: Phone string

    Returns:
        True if valid format
    """
    digits = "".join(c for c in phone if c.isdigit())
    return len(digits) in [10, 11]
