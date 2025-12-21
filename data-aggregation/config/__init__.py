"""Configuration module for data aggregation pipelines."""

from .paths_config import (
    REPO_ROOT,
    DATA_AGGREGATION_ROOT,
    STOCKS_DATA_DIR,
    SPORTS_DATA_DIR,
    BRANDS_DATA_DIR,
    ensure_dir_exists,
    get_output_dir,
    get_log_file,
)

__all__ = [
    "REPO_ROOT",
    "DATA_AGGREGATION_ROOT",
    "STOCKS_DATA_DIR",
    "SPORTS_DATA_DIR",
    "BRANDS_DATA_DIR",
    "ensure_dir_exists",
    "get_output_dir",
    "get_log_file",
]
