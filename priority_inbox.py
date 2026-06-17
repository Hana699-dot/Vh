"""
Campus Notifications - Priority Inbox (Stage 1)
Affordmed Campus Hiring Evaluation

Approach:
- Fetch notifications from the provided API
- Score each notification: Placement=3, Result=2, Event=1
- Use recency as a tiebreaker (newer = higher priority)
- Use a min-heap of size n to efficiently maintain the top-n notifications
  as new ones stream in — O(N log n) time, O(n) space
"""

import heapq
import json
import urllib.request
import urllib.error
from datetime import datetime

# ──────────────────────────────────────────────
# Logging Middleware (stub — replace with your
# actual middleware module from Pre-Test Setup)
# ──────────────────────────────────────────────
import logging

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
logger = logging.getLogger("priority_inbox")


# ──────────────────────────────────────────────
# Constants
# ──────────────────────────────────────────────
API_URL = "http://4.224.186.213/evaluation-service/notifications"

TYPE_WEIGHT = {
    "Placement": 3,
    "Result": 2,
    "Event": 1,
}

DEFAULT_TOP_N = 10


# ──────────────────────────────────────────────
# Fetch notifications from the API
# ──────────────────────────────────────────────
def fetch_notifications(api_url: str) -> list[dict]:
    logger.info(f"Fetching notifications from {api_url}")
    try:
        with urllib.request.urlopen(api_url, timeout=10) as resp:
            raw = resp.read().decode("utf-8")
            data = json.loads(raw)
            notifications = data.get("notifications", [])
            logger.info(f"Fetched {len(notifications)} notifications")
            return notifications
    except urllib.error.URLError as e:
        logger.error(f"Network error fetching notifications: {e}")
        raise
    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse API response: {e}")
        raise


# ──────────────────────────────────────────────
# Scoring
# ──────────────────────────────────────────────
def parse_timestamp(ts_str: str) -> datetime:
    """Parse the API timestamp format 'YYYY-MM-DD HH:MM:SS'."""
    return datetime.strptime(ts_str, "%Y-%m-%d %H:%M:%S")


def score_notification(notification: dict) -> tuple[int, datetime]:
    """Return (type_weight, timestamp) for sorting."""
    weight = TYPE_WEIGHT.get(notification["Type"], 0)
    ts = parse_timestamp(notification["Timestamp"])
    return weight, ts


# ──────────────────────────────────────────────
# Core Algorithm — Min-Heap of size n
# ──────────────────────────────────────────────
def get_top_n_priority(notifications: list[dict], n: int = DEFAULT_TOP_N) -> list[dict]:
    """
    Return the top-n notifications by priority.

    Priority = (type_weight DESC, timestamp DESC)

    Algorithm:
      Maintain a min-heap of size n.
      The heap key is (type_weight ASC, timestamp ASC) so the *least*
      important item is always at the root and can be evicted when a
      higher-priority notification arrives.

    Complexity: O(N log n) time  |  O(n) space
    This scales well as new notifications keep coming in — we never
    need to re-sort the entire dataset; just compare against the root.
    """
    logger.info(f"Computing top-{n} priority notifications from {len(notifications)} items")

    heap: list[tuple] = []  # (weight, timestamp, notification)

    for notif in notifications:
        weight, ts = score_notification(notif)
        # heap stores (weight, ts, notif) — Python heapq is a min-heap
        entry = (weight, ts, notif)

        if len(heap) < n:
            heapq.heappush(heap, entry)
            logger.debug(f"Added to heap: [{notif['Type']}] {notif['Message']} @ {notif['Timestamp']}")
        else:
            # If this notification is better than the worst in our top-n, replace it
            if entry > heap[0]:
                evicted = heapq.heapreplace(heap, entry)
                logger.debug(
                    f"Replaced [{evicted[2]['Type']}] {evicted[2]['Message']} "
                    f"with [{notif['Type']}] {notif['Message']}"
                )

    # Sort descending: highest weight first, then most recent
    top_n = sorted(heap, key=lambda x: (x[0], x[1]), reverse=True)
    logger.info(f"Top-{n} computed successfully")
    return [entry[2] for entry in top_n]


# ──────────────────────────────────────────────
# Display
# ──────────────────────────────────────────────
def display_priority_inbox(top_notifications: list[dict], n: int) -> None:
    print(f"\n{'═' * 60}")
    print(f"  🔔  PRIORITY INBOX  —  Top {n} Notifications")
    print(f"{'═' * 60}")

    type_icons = {"Placement": "💼", "Result": "📋", "Event": "🎉"}

    for rank, notif in enumerate(top_notifications, start=1):
        icon = type_icons.get(notif["Type"], "🔔")
        weight = TYPE_WEIGHT.get(notif["Type"], 0)
        print(f"\n  #{rank:>2}  {icon}  [{notif['Type']}]  (weight={weight})")
        print(f"        Message   : {notif['Message']}")
        print(f"        Timestamp : {notif['Timestamp']}")
        print(f"        ID        : {notif['ID']}")

    print(f"\n{'═' * 60}\n")


# ──────────────────────────────────────────────
# Entry point
# ──────────────────────────────────────────────
def main(top_n: int = DEFAULT_TOP_N) -> None:
    logger.info(f"Priority Inbox started — requesting top {top_n} notifications")

    notifications = fetch_notifications(API_URL)
    top_notifications = get_top_n_priority(notifications, n=top_n)
    display_priority_inbox(top_notifications, n=top_n)

    # Also save output to JSON for screenshot/submission
    output = {
        "top_n": top_n,
        "priority_notifications": top_notifications,
    }
    with open("priority_output.json", "w") as f:
        json.dump(output, f, indent=2, default=str)
    logger.info("Output saved to priority_output.json")


if __name__ == "__main__":
    import sys
    n = int(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_TOP_N
    main(top_n=n)
