"""
Data Formatting Utilities

Standardize and normalize data (locations, addresses, phone numbers, etc.).
"""

import re
from typing import Any, Dict, Optional, Tuple


# ============================================================================
# LOCATION FORMATTING
# ============================================================================


def format_location(location: Dict[str, Any]) -> Dict[str, Any]:
    """Format location record to canonical structure.

    Normalizes field names, types, and values.

    Args:
        location: Raw location dictionary

    Returns:
        Formatted location dictionary
    """
    formatted = {
        "id": str(location.get("id", "")).strip(),
        "brand": str(location.get("brand", "")).strip(),
        "symbol": str(location.get("symbol", "")).strip(),
        "latitude": float(location.get("latitude", 0)),
        "longitude": float(location.get("longitude", 0)),
        "address": str(location.get("address", "")).strip(),
        "city": str(location.get("city", "")).strip(),
        "state": str(location.get("state", "")).strip().upper(),
        "zip": str(location.get("zip", "")).strip(),
        "phone": normalize_phone(location.get("phone", "")),
        "website": str(location.get("website", "")).strip() or None,
        "franchisee": str(location.get("franchisee", "")).strip() or None,
        "opened": int(location.get("opened")) if location.get("opened") else None,
        "status": str(location.get("status", "operational")).strip().lower(),
        "score": float(location.get("score", 50)),
        "units_nearby": int(location.get("units_nearby", 0)),
    }

    return formatted


def parse_address(address: str) -> Dict[str, str]:
    """Parse address into components.

    Simple parser that handles "Street, City, State ZIP" format.

    Args:
        address: Full address string

    Returns:
        Dictionary with street, city, state, zip components
    """
    parts = address.split(",")
    result = {
        "street": "",
        "city": "",
        "state": "",
        "zip": ""
    }

    if len(parts) >= 1:
        result["street"] = parts[0].strip()
    if len(parts) >= 2:
        result["city"] = parts[1].strip()
    if len(parts) >= 3:
        # Try to parse "State ZIP"
        state_zip = parts[2].strip().split()
        if state_zip:
            result["state"] = state_zip[0].upper()
        if len(state_zip) > 1:
            result["zip"] = state_zip[1]

    return result


# ============================================================================
# PHONE NUMBER FORMATTING
# ============================================================================


def normalize_phone(phone: Optional[str]) -> Optional[str]:
    """Normalize phone number to (555) 123-4567 format.

    Args:
        phone: Phone number in any format

    Returns:
        Normalized phone number or None
    """
    if not phone:
        return None

    phone = str(phone).strip()
    if not phone:
        return None

    # Extract digits only
    digits = "".join(c for c in phone if c.isdigit())

    # Handle +1 prefix
    if digits.startswith("1") and len(digits) == 11:
        digits = digits[1:]

    # Format: (555) 123-4567
    if len(digits) == 10:
        return f"({digits[:3]}) {digits[3:6]}-{digits[6:]}"
    elif len(digits) == 11 and digits[0] == "1":
        return f"+1 ({digits[1:4]}) {digits[4:7]}-{digits[7:]}"

    # Return original if can't parse
    return phone


# ============================================================================
# STOCK DATA FORMATTING
# ============================================================================


def format_stock_price(price: float, currency: str = "USD") -> str:
    """Format stock price for display.

    Args:
        price: Price value
        currency: Currency code

    Returns:
        Formatted price string
    """
    if currency == "USD":
        return f"${price:.2f}"
    else:
        return f"{currency} {price:.2f}"


def format_stock_record(record: Dict[str, Any]) -> Dict[str, Any]:
    """Format stock OHLCV record.

    Args:
        record: Raw OHLCV record

    Returns:
        Formatted record
    """
    formatted = {
        "date": str(record.get("date", "")),
        "open": float(record.get("open", 0)),
        "high": float(record.get("high", 0)),
        "low": float(record.get("low", 0)),
        "close": float(record.get("close", 0)),
        "volume": int(record.get("volume", 0)),
        "adjusted_close": float(record.get("adjusted_close", record.get("close", 0))),
    }
    return formatted


def calculate_price_change(open_price: float, close_price: float) -> Dict[str, float]:
    """Calculate price change and percentage.

    Args:
        open_price: Opening price
        close_price: Closing price

    Returns:
        Dictionary with change and change_percent
    """
    change = close_price - open_price
    change_percent = (change / open_price * 100) if open_price > 0 else 0

    return {
        "change": round(change, 2),
        "change_percent": round(change_percent, 2)
    }


# ============================================================================
# TEXT FORMATTING
# ============================================================================


def slugify(text: str) -> str:
    """Convert text to URL-friendly slug.

    Example: "McDonald's USA" -> "mcdonalds-usa"

    Args:
        text: Text to slugify

    Returns:
        Slugified text
    """
    text = text.lower()
    text = re.sub(r"[^a-z0-9]+", "-", text)
    text = text.strip("-")
    return text


def title_case(text: str) -> str:
    """Convert to title case, preserving special words.

    Args:
        text: Text to convert

    Returns:
        Title-cased text
    """
    # Special words that should be lowercase
    lowercase_words = {"and", "or", "the", "a", "an", "in", "of"}

    words = text.split()
    result = []

    for i, word in enumerate(words):
        if i == 0 or word.lower() not in lowercase_words:
            result.append(word.capitalize())
        else:
            result.append(word.lower())

    return " ".join(result)


def clean_text(text: Optional[str]) -> Optional[str]:
    """Clean text: trim whitespace, remove extra spaces.

    Args:
        text: Text to clean

    Returns:
        Cleaned text or None
    """
    if not text:
        return None

    text = str(text).strip()
    text = re.sub(r"\s+", " ", text)  # Replace multiple spaces with single
    return text if text else None


# ============================================================================
# DATE FORMATTING
# ============================================================================


def format_date(date_str: str, format: str = "%Y-%m-%d") -> str:
    """Format date string.

    Args:
        date_str: Date string
        format: Desired output format

    Returns:
        Formatted date string
    """
    from datetime import datetime

    try:
        # Try to parse as ISO format first
        dt = datetime.fromisoformat(date_str.replace("Z", "+00:00"))
        return dt.strftime(format)
    except (ValueError, AttributeError):
        return date_str


# ============================================================================
# CURRENCY FORMATTING
# ============================================================================


def parse_currency(currency_str: str) -> float:
    """Parse currency string to float.

    Handles: "$1,234.56", "1.234,56", "$1234.56", etc.

    Args:
        currency_str: Currency string

    Returns:
        Float value
    """
    if not currency_str:
        return 0.0

    # Remove common currency symbols
    for symbol in ["$", "€", "£", "¥"]:
        currency_str = currency_str.replace(symbol, "")

    # Determine decimal separator
    comma_count = currency_str.count(",")
    dot_count = currency_str.count(".")

    if comma_count > dot_count:
        # European format: 1.234,56
        currency_str = currency_str.replace(".", "").replace(",", ".")
    else:
        # US format: 1,234.56
        currency_str = currency_str.replace(",", "")

    try:
        return float(currency_str.strip())
    except ValueError:
        return 0.0


def format_currency(value: float, currency: str = "USD") -> str:
    """Format value as currency.

    Args:
        value: Numeric value
        currency: Currency code or symbol

    Returns:
        Formatted currency string
    """
    if currency == "USD":
        return f"${value:,.2f}"
    elif currency == "EUR":
        return f"{value:,.2f}€"
    else:
        return f"{currency} {value:,.2f}"


# ============================================================================
# PERCENTAGE FORMATTING
# ============================================================================


def parse_percentage(percent_str: str) -> float:
    """Parse percentage string to float (0-100 scale).

    Args:
        percent_str: Percentage string ("75%", "75", etc.)

    Returns:
        Float value (0-100)
    """
    percent_str = str(percent_str).strip()
    percent_str = percent_str.rstrip("%")
    try:
        return float(percent_str)
    except ValueError:
        return 0.0


def format_percentage(value: float, decimals: int = 1) -> str:
    """Format value as percentage.

    Args:
        value: Value (0-100 scale)
        decimals: Decimal places

    Returns:
        Formatted percentage string
    """
    return f"{value:.{decimals}f}%"
