#!/usr/bin/env python3
"""
Batch Processor for FranchiseMap Brand Generation Pipeline

Manages the queue of brands to process, extracts batches, and tracks progress.
This script coordinates between the brands_queue.txt file and the actual
location generation pipeline.

Usage:
    # Get next batch for processing
    python -m data_aggregation.pipelines.franchise.batch_processor --action get_batch --batch_size 50

    # Mark batch as completed
    python -m data_aggregation.pipelines.franchise.batch_processor --action complete_batch --batch "MCD,SBUX,YUM,..."

    # Show queue status
    python -m data_aggregation.pipelines.franchise.batch_processor --action status

Run via: python -m data_aggregation.pipelines.franchise.batch_processor
"""

import sys
import json
import argparse
from pathlib import Path
from datetime import datetime
from typing import List, Tuple, Dict

# Add repo root to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent.parent.parent))

from data_aggregation.config.paths_config import FRANCHISEMAP_DATA_DIR

BRANDS_QUEUE_FILE = Path(__file__).parent.parent.parent / 'brands_queue.txt'
PROCESSED_BRANDS_FILE = Path(__file__).parent.parent.parent / 'processed_brands.txt'


def parse_queue_file() -> Tuple[List[Dict], int]:
    """
    Parse the brands_queue.txt file.

    Returns:
        Tuple of (list of brand dicts, total queued count)
    """
    brands = []
    total_queued = 0

    if not BRANDS_QUEUE_FILE.exists():
        print(f"⚠️  Queue file not found: {BRANDS_QUEUE_FILE}")
        return [], 0

    with open(BRANDS_QUEUE_FILE, 'r') as f:
        for line in f:
            line = line.strip()
            # Skip comments and empty lines
            if not line or line.startswith('#'):
                continue

            # Parse brand line: TICKER|BrandName|Category
            parts = line.split('|')
            if len(parts) >= 3:
                brands.append({
                    'ticker': parts[0].strip(),
                    'name': parts[1].strip(),
                    'category': parts[2].strip()
                })
                total_queued += 1

    return brands, total_queued


def parse_processed_file() -> Tuple[List[str], int]:
    """
    Parse the processed_brands.txt file.

    Returns:
        Tuple of (list of processed tickers, count)
    """
    processed = []

    if not PROCESSED_BRANDS_FILE.exists():
        return [], 0

    with open(PROCESSED_BRANDS_FILE, 'r') as f:
        for line in f:
            line = line.strip()
            # Skip comments and empty lines
            if not line or line.startswith('#'):
                continue

            # Parse processed line: TICKER|BrandName|Category|Date|Count
            parts = line.split('|')
            if len(parts) >= 1:
                processed.append(parts[0].strip())

    return processed, len(processed)


def get_next_batch(batch_size: int = 50) -> Tuple[List[Dict], int]:
    """
    Get the next unprocessed batch of brands.

    Args:
        batch_size: Maximum brands per batch (default 50)

    Returns:
        Tuple of (batch list, remaining count)
    """
    queued_brands, total_queued = parse_queue_file()
    processed_tickers, total_processed = parse_processed_file()
    processed_set = set(processed_tickers)

    # Filter out already processed brands
    remaining = [b for b in queued_brands if b['ticker'] not in processed_set]
    remaining_count = len(remaining)

    # Extract batch
    batch = remaining[:batch_size]

    return batch, remaining_count


def mark_batch_complete(batch_tickers: List[str], locations_count: Dict[str, int]) -> bool:
    """
    Mark a batch as completed and move brands to processed file.

    Args:
        batch_tickers: List of ticker symbols in the batch
        locations_count: Dict mapping tickers to location counts

    Returns:
        True if successful
    """
    if not batch_tickers:
        print("⚠️  No tickers provided for completion")
        return False

    try:
        # Append to processed file
        with open(PROCESSED_BRANDS_FILE, 'a') as f:
            for ticker in batch_tickers:
                count = locations_count.get(ticker, 0)
                timestamp = datetime.utcnow().isoformat() + "Z"
                # Find brand name from queue
                queued_brands, _ = parse_queue_file()
                brand_dict = next((b for b in queued_brands if b['ticker'] == ticker), None)
                if brand_dict:
                    line = f"{ticker}|{brand_dict['name']}|{brand_dict['category']}|{timestamp}|{count}\n"
                    f.write(line)

        print(f"✅ Marked {len(batch_tickers)} brands as processed")
        return True

    except Exception as e:
        print(f"❌ Error marking batch complete: {e}")
        return False


def show_status() -> None:
    """Display current queue status."""
    queued_brands, total_queued = parse_queue_file()
    processed_tickers, total_processed = parse_processed_file()
    processed_set = set(processed_tickers)

    remaining = [b for b in queued_brands if b['ticker'] not in processed_set]
    remaining_count = len(remaining)

    # Count by category
    category_counts = {}
    for brand in remaining:
        cat = brand['category']
        category_counts[cat] = category_counts.get(cat, 0) + 1

    print(f"\n📊 FranchiseMap Brand Queue Status")
    print(f"   Total Queued: {total_queued}")
    print(f"   Total Processed: {total_processed}")
    print(f"   Remaining: {remaining_count}")
    print(f"\n   Remaining by Category:")
    for cat in sorted(category_counts.keys()):
        print(f"      {cat}: {category_counts[cat]}")

    if remaining_count > 0:
        # Show next batch preview
        next_batch, _ = get_next_batch(5)
        print(f"\n   Next 5 Brands in Queue:")
        for i, brand in enumerate(next_batch, 1):
            print(f"      {i}. {brand['ticker']} - {brand['name']}")

    print()


def main():
    parser = argparse.ArgumentParser(description='FranchiseMap Batch Processor')
    parser.add_argument('--action', choices=['get_batch', 'complete_batch', 'status'],
                        default='status', help='Action to perform')
    parser.add_argument('--batch_size', type=int, default=50, help='Brands per batch')
    parser.add_argument('--batch', help='Comma-separated list of tickers to mark complete')
    parser.add_argument('--counts', help='JSON dict of ticker:count for processed brands')

    args = parser.parse_args()

    if args.action == 'get_batch':
        print(f"Getting next batch (max {args.batch_size} brands)...\n")
        batch, remaining = get_next_batch(args.batch_size)

        if not batch:
            print("✅ All brands processed!")
            return True

        print(f"📦 Batch ({len(batch)} brands, {remaining} remaining):\n")
        for brand in batch:
            print(f"   {brand['ticker']}")

        # Output JSON for workflow consumption
        print(f"\n--- JSON OUTPUT START ---")
        print(json.dumps({
            'batch': [b['ticker'] for b in batch],
            'count': len(batch),
            'remaining': remaining
        }))
        print(f"--- JSON OUTPUT END ---")

        return True

    elif args.action == 'complete_batch':
        if not args.batch:
            print("⚠️  --batch parameter required")
            return False

        tickers = [t.strip() for t in args.batch.split(',')]
        counts = {}
        if args.counts:
            try:
                counts = json.loads(args.counts)
            except json.JSONDecodeError:
                print("⚠️  Invalid JSON for --counts")
                return False

        success = mark_batch_complete(tickers, counts)
        return success

    elif args.action == 'status':
        show_status()
        return True

    return False


if __name__ == '__main__':
    success = main()
    sys.exit(0 if success else 1)
