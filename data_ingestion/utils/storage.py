"""
File Storage Utilities

Safe file I/O with atomic operations, compression, and format support.
"""

import csv
import json
import shutil
import tempfile
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional, Union


# ============================================================================
# JSON FILE OPERATIONS
# ============================================================================


def save_json(data: Any, file_path: Union[str, Path], pretty: bool = True, atomic: bool = True) -> None:
    """Save data to JSON file with optional atomic operation.

    Atomic mode: writes to temp file, then renames. Prevents corruption
    if write fails partway through.

    Args:
        data: Data to save (dict, list, etc.)
        file_path: Output file path
        pretty: Format JSON with indentation
        atomic: Use atomic write (temp file then rename)

    Raises:
        IOError: If write fails
    """
    file_path = Path(file_path)
    file_path.parent.mkdir(parents=True, exist_ok=True)

    indent = 2 if pretty else None

    if atomic:
        # Write to temp file in same directory (ensures same filesystem)
        with tempfile.NamedTemporaryFile(
            mode="w",
            dir=file_path.parent,
            delete=False,
            suffix=".tmp",
            encoding="utf-8"
        ) as tmp:
            json.dump(data, tmp, indent=indent, default=str)
            tmp_path = tmp.name

        try:
            # Atomic rename
            tmp_path = Path(tmp_path)
            tmp_path.replace(file_path)
        except Exception as e:
            # Clean up temp file on error
            try:
                tmp_path.unlink()
            except Exception:
                pass
            raise IOError(f"Failed to write {file_path}: {e}")
    else:
        # Direct write
        try:
            with open(file_path, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=indent, default=str)
        except Exception as e:
            raise IOError(f"Failed to write {file_path}: {e}")


def load_json(file_path: Union[str, Path]) -> Any:
    """Load data from JSON file.

    Args:
        file_path: Input file path

    Returns:
        Parsed data

    Raises:
        IOError: If file not found or parse fails
    """
    file_path = Path(file_path)

    if not file_path.exists():
        raise IOError(f"File not found: {file_path}")

    try:
        with open(file_path, "r", encoding="utf-8") as f:
            return json.load(f)
    except json.JSONDecodeError as e:
        raise IOError(f"Invalid JSON in {file_path}: {e}")
    except Exception as e:
        raise IOError(f"Failed to read {file_path}: {e}")


# ============================================================================
# CSV FILE OPERATIONS
# ============================================================================


def save_csv(data: List[Dict[str, Any]], file_path: Union[str, Path], fieldnames: Optional[List[str]] = None) -> None:
    """Save list of dictionaries to CSV file.

    Args:
        data: List of dictionaries to save
        file_path: Output file path
        fieldnames: CSV column names (auto-detected if None)

    Raises:
        IOError: If write fails
    """
    file_path = Path(file_path)
    file_path.parent.mkdir(parents=True, exist_ok=True)

    if not data:
        # Empty CSV with just headers
        fieldnames = fieldnames or []
        with open(file_path, "w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
        return

    # Auto-detect fieldnames from first record
    if fieldnames is None:
        fieldnames = list(data[0].keys())

    try:
        with open(file_path, "w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(data)
    except Exception as e:
        raise IOError(f"Failed to write CSV {file_path}: {e}")


def load_csv(file_path: Union[str, Path]) -> List[Dict[str, str]]:
    """Load CSV file into list of dictionaries.

    Args:
        file_path: Input file path

    Returns:
        List of dictionaries

    Raises:
        IOError: If file not found or parse fails
    """
    file_path = Path(file_path)

    if not file_path.exists():
        raise IOError(f"File not found: {file_path}")

    try:
        with open(file_path, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            return list(reader)
    except Exception as e:
        raise IOError(f"Failed to read CSV {file_path}: {e}")


# ============================================================================
# BACKUP AND VERSIONING
# ============================================================================


def backup_file(file_path: Union[str, Path], keep_count: int = 3) -> Optional[Path]:
    """Create timestamped backup of file.

    Keeps only the most recent `keep_count` backups.

    Args:
        file_path: File to backup
        keep_count: Number of backups to keep

    Returns:
        Path to backup file, or None if file doesn't exist
    """
    file_path = Path(file_path)

    if not file_path.exists():
        return None

    # Create backup directory
    backup_dir = file_path.parent / ".backups"
    backup_dir.mkdir(exist_ok=True)

    # Create backup with timestamp
    timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    backup_path = backup_dir / f"{file_path.stem}_{timestamp}{file_path.suffix}"

    try:
        shutil.copy2(file_path, backup_path)
    except Exception as e:
        raise IOError(f"Failed to backup {file_path}: {e}")

    # Clean up old backups
    backups = sorted(backup_dir.glob(f"{file_path.stem}_*{file_path.suffix}"))
    for old_backup in backups[:-keep_count]:
        try:
            old_backup.unlink()
        except Exception:
            pass

    return backup_path


def restore_file(file_path: Union[str, Path], backup_path: Union[str, Path]) -> None:
    """Restore file from backup.

    Args:
        file_path: File to restore to
        backup_path: Backup file to restore from

    Raises:
        IOError: If restore fails
    """
    file_path = Path(file_path)
    backup_path = Path(backup_path)

    if not backup_path.exists():
        raise IOError(f"Backup not found: {backup_path}")

    try:
        shutil.copy2(backup_path, file_path)
    except Exception as e:
        raise IOError(f"Failed to restore {file_path}: {e}")


# ============================================================================
# FILE UTILITIES
# ============================================================================


def file_size_mb(file_path: Union[str, Path]) -> float:
    """Get file size in megabytes.

    Args:
        file_path: Path to file

    Returns:
        File size in MB
    """
    file_path = Path(file_path)
    if not file_path.exists():
        return 0.0
    return file_path.stat().st_size / (1024 * 1024)


def file_age_minutes(file_path: Union[str, Path]) -> int:
    """Get age of file in minutes.

    Args:
        file_path: Path to file

    Returns:
        Age in minutes
    """
    file_path = Path(file_path)
    if not file_path.exists():
        return -1

    mod_time = file_path.stat().st_mtime
    now = datetime.utcnow().timestamp()
    return int((now - mod_time) / 60)


def is_file_recent(file_path: Union[str, Path], max_age_hours: int = 24) -> bool:
    """Check if file is recent (modified within specified hours).

    Args:
        file_path: Path to file
        max_age_hours: Maximum age in hours

    Returns:
        True if file is recent
    """
    age_minutes = file_age_minutes(file_path)
    return age_minutes >= 0 and age_minutes <= (max_age_hours * 60)


# ============================================================================
# METADATA OPERATIONS
# ============================================================================


def save_metadata(file_path: Union[str, Path], metadata: Dict[str, Any]) -> None:
    """Save metadata sidecar file (.meta.json).

    Args:
        file_path: Original file path
        metadata: Metadata dictionary

    Raises:
        IOError: If write fails
    """
    file_path = Path(file_path)
    meta_path = file_path.parent / f"{file_path.stem}.meta.json"

    metadata["_updated"] = datetime.utcnow().isoformat()
    save_json(metadata, meta_path)


def load_metadata(file_path: Union[str, Path]) -> Optional[Dict[str, Any]]:
    """Load metadata sidecar file (.meta.json).

    Args:
        file_path: Original file path

    Returns:
        Metadata dictionary or None
    """
    file_path = Path(file_path)
    meta_path = file_path.parent / f"{file_path.stem}.meta.json"

    if not meta_path.exists():
        return None

    try:
        return load_json(meta_path)
    except Exception:
        return None


# ============================================================================
# BATCH OPERATIONS
# ============================================================================


def merge_json_files(input_paths: List[Union[str, Path]], output_path: Union[str, Path]) -> None:
    """Merge multiple JSON files into one.

    Assumes each file contains a list of objects. Concatenates all lists.

    Args:
        input_paths: List of input file paths
        output_path: Output file path

    Raises:
        IOError: If any file operation fails
    """
    merged = []

    for input_path in input_paths:
        data = load_json(input_path)
        if isinstance(data, list):
            merged.extend(data)
        else:
            merged.append(data)

    save_json(merged, output_path)


def split_json_file(input_path: Union[str, Path], output_dir: Union[str, Path], chunk_size: int = 1000) -> List[Path]:
    """Split JSON file into smaller chunks.

    Args:
        input_path: Input JSON file (must contain list)
        output_dir: Output directory
        chunk_size: Records per chunk

    Returns:
        List of output file paths

    Raises:
        IOError: If any file operation fails
    """
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    data = load_json(input_path)
    if not isinstance(data, list):
        raise ValueError("Input file must contain a JSON list")

    output_files = []
    for i in range(0, len(data), chunk_size):
        chunk = data[i:i+chunk_size]
        chunk_num = i // chunk_size
        output_path = output_dir / f"chunk_{chunk_num:04d}.json"
        save_json(chunk, output_path)
        output_files.append(output_path)

    return output_files
