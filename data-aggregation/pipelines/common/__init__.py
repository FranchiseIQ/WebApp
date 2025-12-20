"""
Common utilities and helpers for data aggregation pipelines.

This package provides shared functionality used across all pipeline scripts:
- utils: General utility functions for files, validation, processing
- data_quality: Data validation and quality reporting
- api_handlers: API request handling with retry logic and rate limiting
"""

from .utils import (
    load_json,
    save_json,
    load_json_safe,
    ensure_directory,
    get_file_count,
    get_total_size,
    validate_required_fields,
    validate_data_types,
    validate_value_range,
    retry_operation,
    normalize_score,
    scale_score,
    merge_dicts,
    filter_dict,
    calculate_statistics,
    print_progress,
    print_summary,
)

from .data_quality import (
    DataQualityReport,
    LocationDataValidator,
    SportsDataValidator,
    NewsDataValidator,
)

from .api_handlers import (
    APIHandler,
    rate_limit,
    log_requests,
    ESPNAPIHandler,
    OverpassAPIHandler,
    FinnhubAPIHandler,
    YouTubeAPIHandler,
    batch_api_calls,
)

__all__ = [
    # Utils
    "load_json",
    "save_json",
    "load_json_safe",
    "ensure_directory",
    "get_file_count",
    "get_total_size",
    "validate_required_fields",
    "validate_data_types",
    "validate_value_range",
    "retry_operation",
    "normalize_score",
    "scale_score",
    "merge_dicts",
    "filter_dict",
    "calculate_statistics",
    "print_progress",
    "print_summary",
    # Data Quality
    "DataQualityReport",
    "LocationDataValidator",
    "SportsDataValidator",
    "NewsDataValidator",
    # API Handlers
    "APIHandler",
    "rate_limit",
    "log_requests",
    "ESPNAPIHandler",
    "OverpassAPIHandler",
    "FinnhubAPIHandler",
    "YouTubeAPIHandler",
    "batch_api_calls",
]
