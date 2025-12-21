"""
Common utility functions for data aggregation pipelines.

Provides shared functionality across all pipeline scripts including:
- File I/O operations
- Directory management
- Data validation
- Error handling
- Logging and progress reporting
"""

import json
import time
import logging
from pathlib import Path
from typing import Any, Dict, List, Optional


# Configure logging
logger = logging.getLogger(__name__)


# ============================================================================
# File I/O Operations
# ============================================================================

def load_json(filepath: Path) -> Dict[str, Any]:
    """
    Load JSON file with error handling.

    Args:
        filepath: Path to JSON file

    Returns:
        Dictionary containing parsed JSON data

    Raises:
        FileNotFoundError: If file doesn't exist
        json.JSONDecodeError: If JSON is invalid
    """
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        logger.error(f"File not found: {filepath}")
        raise
    except json.JSONDecodeError as e:
        logger.error(f"Invalid JSON in {filepath}: {e}")
        raise


def save_json(data: Any, filepath: Path, pretty: bool = True) -> None:
    """
    Save data to JSON file with error handling.

    Args:
        data: Data to save
        filepath: Path to output file
        pretty: Whether to use indentation (pretty print)
    """
    try:
        filepath.parent.mkdir(parents=True, exist_ok=True)
        with open(filepath, 'w', encoding='utf-8') as f:
            kwargs = {'indent': 2} if pretty else {'separators': (',', ':')}
            json.dump(data, f, ensure_ascii=False, **kwargs)
        logger.info(f"Saved: {filepath}")
    except Exception as e:
        logger.error(f"Error saving {filepath}: {e}")
        raise


def load_json_safe(filepath: Path, default: Optional[Dict] = None) -> Dict[str, Any]:
    """
    Load JSON file, returning default if file doesn't exist.

    Args:
        filepath: Path to JSON file
        default: Default value to return if file not found

    Returns:
        Dictionary containing parsed JSON data, or default value
    """
    if not filepath.exists():
        logger.warning(f"File not found, using default: {filepath}")
        return default or {}

    try:
        return load_json(filepath)
    except json.JSONDecodeError:
        logger.warning(f"Invalid JSON, using default: {filepath}")
        return default or {}


# ============================================================================
# Directory & Path Management
# ============================================================================

def ensure_directory(dirpath: Path) -> Path:
    """
    Ensure directory exists, creating if necessary.

    Args:
        dirpath: Directory path to ensure exists

    Returns:
        The directory path (for chaining)
    """
    dirpath.mkdir(parents=True, exist_ok=True)
    return dirpath


def get_file_count(dirpath: Path, pattern: str = "*") -> int:
    """
    Count files in directory matching pattern.

    Args:
        dirpath: Directory to scan
        pattern: File pattern to match (e.g., "*.json")

    Returns:
        Number of matching files
    """
    if not dirpath.exists():
        return 0
    return len(list(dirpath.glob(pattern)))


def get_total_size(dirpath: Path, pattern: str = "*") -> int:
    """
    Get total size of files in directory.

    Args:
        dirpath: Directory to scan
        pattern: File pattern to match

    Returns:
        Total size in bytes
    """
    if not dirpath.exists():
        return 0
    return sum(f.stat().st_size for f in dirpath.glob(pattern) if f.is_file())


# ============================================================================
# Data Validation
# ============================================================================

def validate_required_fields(obj: Dict, required_fields: List[str]) -> bool:
    """
    Validate that object has all required fields.

    Args:
        obj: Object to validate
        required_fields: List of required field names

    Returns:
        True if all fields present, False otherwise
    """
    missing = [f for f in required_fields if f not in obj]
    if missing:
        logger.warning(f"Missing required fields: {missing}")
        return False
    return True


def validate_data_types(obj: Dict, type_map: Dict[str, type]) -> bool:
    """
    Validate that object fields have correct types.

    Args:
        obj: Object to validate
        type_map: Mapping of field names to expected types

    Returns:
        True if all types correct, False otherwise
    """
    errors = []
    for field, expected_type in type_map.items():
        if field not in obj:
            continue
        if not isinstance(obj[field], expected_type):
            errors.append(f"{field}: expected {expected_type.__name__}, got {type(obj[field]).__name__}")

    if errors:
        logger.warning(f"Type validation errors: {'; '.join(errors)}")
        return False
    return True


def validate_value_range(value: float, min_val: float, max_val: float, field_name: str = "value") -> bool:
    """
    Validate that value is within range.

    Args:
        value: Value to validate
        min_val: Minimum acceptable value
        max_val: Maximum acceptable value
        field_name: Name of field for logging

    Returns:
        True if value in range, False otherwise
    """
    if not (min_val <= value <= max_val):
        logger.warning(f"{field_name} out of range: {value} (expected {min_val}-{max_val})")
        return False
    return True


# ============================================================================
# Error Handling & Retries
# ============================================================================

def retry_operation(func, max_retries: int = 3, delay: float = 1.0, backoff: float = 2.0):
    """
    Retry an operation with exponential backoff.

    Args:
        func: Callable to retry
        max_retries: Maximum number of retry attempts
        delay: Initial delay in seconds
        backoff: Backoff multiplier for each retry

    Returns:
        Result of successful function call

    Raises:
        Exception: If all retries fail
    """
    last_error = None
    current_delay = delay

    for attempt in range(max_retries):
        try:
            return func()
        except Exception as e:
            last_error = e
            if attempt < max_retries - 1:
                logger.warning(f"Attempt {attempt + 1} failed: {e}. Retrying in {current_delay}s...")
                time.sleep(current_delay)
                current_delay *= backoff
            else:
                logger.error(f"All {max_retries} attempts failed. Last error: {e}")

    raise last_error


# ============================================================================
# Data Processing
# ============================================================================

def normalize_score(value: float, min_val: float, max_val: float) -> float:
    """
    Normalize a value to 0-1 range.

    Args:
        value: Value to normalize
        min_val: Minimum value in range
        max_val: Maximum value in range

    Returns:
        Normalized value (0-1)
    """
    if max_val == min_val:
        return 0.5
    return max(0.0, min(1.0, (value - min_val) / (max_val - min_val)))


def scale_score(normalized: float, scale_min: float = 0, scale_max: float = 100) -> float:
    """
    Scale a normalized value (0-1) to a target range.

    Args:
        normalized: Value in 0-1 range
        scale_min: Minimum value in target scale
        scale_max: Maximum value in target scale

    Returns:
        Scaled value
    """
    return scale_min + (normalized * (scale_max - scale_min))


def merge_dicts(*dicts: Dict) -> Dict:
    """
    Deep merge multiple dictionaries.

    Args:
        *dicts: Variable number of dictionaries to merge

    Returns:
        Merged dictionary
    """
    result = {}
    for d in dicts:
        for key, value in d.items():
            if key in result and isinstance(result[key], dict) and isinstance(value, dict):
                result[key] = merge_dicts(result[key], value)
            else:
                result[key] = value
    return result


def filter_dict(d: Dict, keys: List[str]) -> Dict:
    """
    Filter dictionary to only include specified keys.

    Args:
        d: Dictionary to filter
        keys: List of keys to keep

    Returns:
        Filtered dictionary
    """
    return {k: v for k, v in d.items() if k in keys}


# ============================================================================
# Statistics & Metrics
# ============================================================================

def calculate_statistics(values: List[float]) -> Dict[str, float]:
    """
    Calculate basic statistics for a list of values.

    Args:
        values: List of numeric values

    Returns:
        Dictionary with min, max, mean, median, stdev
    """
    if not values:
        return {"min": 0, "max": 0, "mean": 0, "median": 0, "count": 0}

    sorted_vals = sorted(values)
    count = len(values)
    mean = sum(values) / count

    # Calculate median
    if count % 2 == 0:
        median = (sorted_vals[count // 2 - 1] + sorted_vals[count // 2]) / 2
    else:
        median = sorted_vals[count // 2]

    # Calculate standard deviation
    variance = sum((x - mean) ** 2 for x in values) / count
    stdev = variance ** 0.5

    return {
        "min": sorted_vals[0],
        "max": sorted_vals[-1],
        "mean": round(mean, 2),
        "median": round(median, 2),
        "stdev": round(stdev, 2),
        "count": count
    }


# ============================================================================
# Progress & Reporting
# ============================================================================

def print_progress(current: int, total: int, label: str = "Progress") -> None:
    """
    Print progress indicator.

    Args:
        current: Current item number
        total: Total items
        label: Label for progress message
    """
    if total > 0:
        percentage = (current / total) * 100
        bar_length = 30
        filled = int(bar_length * current / total)
        bar = '█' * filled + '░' * (bar_length - filled)
        print(f"\r{label}: [{bar}] {percentage:.1f}% ({current}/{total})", end='', flush=True)


def print_summary(title: str, stats: Dict[str, Any]) -> None:
    """
    Print formatted summary report.

    Args:
        title: Report title
        stats: Dictionary of statistics to display
    """
    print(f"\n{'='*70}")
    print(f"{title}")
    print(f"{'='*70}")
    for key, value in stats.items():
        if isinstance(value, (int, float)):
            if isinstance(value, float):
                print(f"  {key}: {value:.2f}")
            else:
                print(f"  {key}: {value:,}")
        else:
            print(f"  {key}: {value}")
    print(f"{'='*70}\n")
