import re
from typing import List, Set

# Common free email providers to block
FREE_EMAIL_DOMAINS: Set[str] = {
    "gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "aol.com",
    "icloud.com", "protonmail.com", "yandex.com", "mail.ru", "zoho.com",
    "fastmail.com", "tutanota.com", "gmx.com", "web.de", "freenet.de"
}


def extract_domain(email: str) -> str:
    """Extract domain from email address."""
    if "@" not in email:
        raise ValueError("Invalid email format")
    return email.split("@")[1].lower()


def is_corporate_email(email: str) -> bool:
    """Check if email is from a corporate domain (not free email)."""
    domain = extract_domain(email)
    return domain not in FREE_EMAIL_DOMAINS


def validate_email_format(email: str) -> bool:
    """Basic email format validation."""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email))


def is_verified_domain(domain: str, verified_domains: List[str]) -> bool:
    """Check if domain is in the verified domains list."""
    return domain.lower() in [d.lower() for d in verified_domains]
