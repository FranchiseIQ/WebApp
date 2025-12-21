#!/usr/bin/env python3
"""
Adaptive Batch Processor with Intelligent Retry Logic

Processes batches of brands with automatic error recovery:
- Starts with 50-100 random brands
- Reduces batch size on API failures
- Retries with smaller batches
- Adapts to network/API issues
- Logs all attempts for monitoring

Usage:
    python -m data_aggregation.pipelines.franchise.adaptive_batch_processor [--max-attempts 3] [--min-batch 5]
"""

import sys
import json
import random
import time
import logging
from pathlib import Path
from datetime import datetime
from subprocess import run, PIPE

# Add repo root to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent.parent.parent))

from data_aggregation.config.paths_config import FRANCHISEMAP_DATA_DIR
from data_aggregation.pipelines.franchise.batch_processor import (
    get_next_batch, mark_batch_complete, parse_processed_file
)

# Setup logging
LOG_DIR = Path(__file__).parent.parent.parent / 'logs'
LOG_DIR.mkdir(parents=True, exist_ok=True)
LOG_FILE = LOG_DIR / f"batch_processing_{datetime.now().strftime('%Y%m%d')}.log"

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(LOG_FILE),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Configuration
INITIAL_BATCH_SIZE = random.randint(50, 100)
MIN_BATCH_SIZE = 5
MAX_RETRY_ATTEMPTS = 3
RETRY_BACKOFF = 2  # Seconds between retries


def run_command(cmd, timeout=3600):
    """
    Run a shell command and capture output.

    Args:
        cmd: Command to execute
        timeout: Maximum execution time in seconds (default 1 hour)

    Returns:
        Tuple of (success, stdout, stderr)
    """
    try:
        result = run(cmd, shell=True, capture_output=True, text=True, timeout=timeout)
        return result.returncode == 0, result.stdout, result.stderr
    except Exception as e:
        return False, "", str(e)


def extract_batch_from_output(output):
    """Extract batch list from processor output."""
    try:
        lines = output.split('\n')
        start_idx = None
        end_idx = None

        for i, line in enumerate(lines):
            if '--- JSON OUTPUT START ---' in line:
                start_idx = i + 1
            elif '--- JSON OUTPUT END ---' in line:
                end_idx = i
                break

        if start_idx and end_idx:
            json_str = '\n'.join(lines[start_idx:end_idx])
            data = json.loads(json_str)
            return data.get('batch', [])
    except Exception as e:
        logger.warning(f"Failed to parse batch output: {e}")

    return []


def get_location_counts():
    """Get location counts from manifest.json."""
    manifest_path = FRANCHISEMAP_DATA_DIR / 'manifest.json'
    if manifest_path.exists():
        try:
            with open(manifest_path) as f:
                manifest = json.load(f)
                return {item['ticker']: item['count'] for item in manifest}
        except Exception as e:
            logger.warning(f"Failed to read manifest: {e}")
    return {}


def process_batch_with_retry(batch_size, max_attempts=MAX_RETRY_ATTEMPTS, min_size=MIN_BATCH_SIZE):
    """
    Process a batch with intelligent retry and size reduction.

    Args:
        batch_size: Initial batch size
        max_attempts: Maximum retry attempts
        min_size: Minimum batch size before giving up

    Returns:
        Tuple of (success, batch_tickers, locations_processed)
    """
    current_batch_size = batch_size
    attempt = 0

    while attempt < max_attempts and current_batch_size >= min_size:
        attempt += 1
        logger.info(f"\n{'='*70}")
        logger.info(f"ATTEMPT {attempt}/{max_attempts} - Batch Size: {current_batch_size}")
        logger.info(f"{'='*70}")

        # Get next batch
        logger.info("Extracting next batch from queue...")
        batch, remaining = get_next_batch(current_batch_size)

        if not batch:
            logger.info("✅ All brands already processed!")
            return True, [], {}

        batch_tickers = [b['ticker'] for b in batch]
        logger.info(f"Batch: {', '.join(batch_tickers[:5])}{'...' if len(batch_tickers) > 5 else ''}")
        logger.info(f"Batch size: {len(batch_tickers)}, Remaining in queue: {remaining}")

        # Generate locations
        logger.info("\nGenerating locations from OpenStreetMap...")
        batch_str = ','.join(batch_tickers)
        cmd = f"python -m data_aggregation.pipelines.franchise.generate_locations --batch \"{batch_str}\""

        success, stdout, stderr = run_command(cmd, timeout=7200)  # 2 hour timeout

        if success:
            logger.info("✅ Location generation successful")
            logger.debug(f"Output: {stdout}")

            # Build metadata
            logger.info("Building updated brand metadata...")
            success_meta, stdout_meta, stderr_meta = run_command(
                "python -m data_aggregation.pipelines.franchise.build_brand_metadata"
            )

            if success_meta:
                logger.info("✅ Metadata generation successful")

                # Get location counts
                counts = get_location_counts()
                locations_total = sum(counts.get(t, 0) for t in batch_tickers)

                logger.info(f"✅ BATCH SUCCESSFUL: {len(batch_tickers)} brands, {locations_total:,} locations")

                return True, batch_tickers, counts
            else:
                logger.error(f"❌ Metadata generation failed: {stderr_meta}")
                # Continue to retry with smaller batch

        else:
            # Parse error to understand failure type
            error_msg = stderr or stdout
            logger.error(f"❌ Location generation failed (Attempt {attempt}/{max_attempts})")
            logger.error(f"Error: {error_msg}")

            # Check if it's a timeout/rate limit error
            if 'timeout' in error_msg.lower() or '429' in error_msg:
                logger.warning("⚠️  API rate limit or timeout detected")
            elif 'connection' in error_msg.lower():
                logger.warning("⚠️  Network connection error detected")

        # Retry with smaller batch
        if attempt < max_attempts:
            new_size = max(min_size, current_batch_size // 2)
            if new_size < current_batch_size:
                logger.warning(f"⏳ Reducing batch size: {current_batch_size} → {new_size}")
                current_batch_size = new_size
                sleep_time = RETRY_BACKOFF * attempt
                logger.info(f"Waiting {sleep_time}s before retry...")
                time.sleep(sleep_time)
            else:
                logger.error("❌ Cannot reduce batch size further")
                break
        else:
            logger.error(f"❌ All {max_attempts} attempts failed")

    return False, [], {}


def main():
    """Main adaptive batch processing loop."""
    logger.info(f"\n{'='*70}")
    logger.info("🚀 FranchiseMap Adaptive Batch Processor Started")
    logger.info(f"{'='*70}")
    logger.info(f"Timestamp: {datetime.now().isoformat()}")
    logger.info(f"Initial batch size: {INITIAL_BATCH_SIZE} (50-100 randomized)")
    logger.info(f"Min batch size: {MIN_BATCH_SIZE}")
    logger.info(f"Max retry attempts: {MAX_RETRY_ATTEMPTS}")

    # Check current status
    processed_tickers, total_processed = parse_processed_file()
    from data_aggregation.pipelines.franchise.batch_processor import parse_queue_file
    queued_brands, total_queued = parse_queue_file()
    processed_set = set(processed_tickers)
    remaining = [b for b in queued_brands if b['ticker'] not in processed_set]

    logger.info(f"\nQueue Status:")
    logger.info(f"  Total queued: {total_queued}")
    logger.info(f"  Total processed: {total_processed}")
    logger.info(f"  Remaining: {len(remaining)}")

    if len(remaining) == 0:
        logger.info("✅ All brands already processed! Nothing to do.")
        return True

    # Process with adaptive retry
    success, batch_tickers, counts = process_batch_with_retry(
        INITIAL_BATCH_SIZE,
        max_attempts=MAX_RETRY_ATTEMPTS,
        min_size=MIN_BATCH_SIZE
    )

    if success and batch_tickers:
        logger.info("\n📝 Marking batch as processed...")
        try:
            mark_batch_complete(batch_tickers, counts)
            logger.info("✅ Batch marked as processed")

            # Log final status
            logger.info(f"\n{'='*70}")
            logger.info("📊 Final Status:")
            updated_processed, updated_total = parse_processed_file()
            from data_aggregation.pipelines.franchise.batch_processor import parse_queue_file
            updated_queued, _ = parse_queue_file()
            updated_remaining = [b for b in updated_queued if b['ticker'] not in set(updated_processed)]
            logger.info(f"  Processed: {updated_total}")
            logger.info(f"  Remaining: {len(updated_remaining)}")
            logger.info(f"{'='*70}\n")

        except Exception as e:
            logger.error(f"Failed to mark batch complete: {e}")
            return False

        return True
    else:
        logger.error("\n❌ Batch processing failed after all retry attempts")
        logger.error("Manual intervention may be required")
        return False


if __name__ == '__main__':
    try:
        success = main()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        logger.info("\n⏹️  Process interrupted by user")
        sys.exit(1)
    except Exception as e:
        logger.exception(f"Unexpected error: {e}")
        sys.exit(1)
