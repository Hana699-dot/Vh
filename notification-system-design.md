# Notification System Design
# Stage 1

## Priority Inbox — System Design

### Problem

The campus notification platform receives a continuous stream of notifications across three categories — **Placement**, **Result**, and **Event**. Users lose track of important updates in the high volume. We need to surface the top **n** most important *unread* notifications at any time.

---

## Priority Definition

Priority is determined by two factors, applied in order:

| Factor | Rule |
|---|---|
| **Type weight** | Placement = 3 > Result = 2 > Event = 1 |
| **Recency** | Among equal-weight notifications, the more recent one wins |

This matches the product brief: `placement > result > event`, with recency as tiebreaker.

---

## Algorithm — Fixed-Size Min-Heap

### Why a heap?

A naive approach would sort all N notifications on every fetch — O(N log N). Since new notifications keep arriving continuously, we need something that can maintain a "running top-n" efficiently.

A **min-heap of size n** gives us exactly that.

### How it works

1. Iterate through each incoming notification.
2. Compute its **priority key** = `(type_weight, timestamp)`.
3. If the heap has fewer than `n` items → push directly.
4. Otherwise, compare against the **root** (the current worst item in our top-n):
   - If the new notification is better → `heapreplace` (evict root, push new).
   - Otherwise → discard.

The root of the min-heap is always the *least* important among the current top-n, so it's the correct eviction candidate.

### Complexity

| | Value |
|---|---|
| Time | O(N log n) |
| Space | O(n) |

For N = 10,000 notifications and n = 10, this is ~33,000 operations vs 130,000 for a full sort — and the heap is constant-size regardless of N.

### Handling continuous new notifications

Since the heap is always capped at size `n` and each new notification is processed in O(log n), the system handles an unbounded stream without accumulating memory or degrading in speed. When the API is polled again (e.g. on a schedule), the same heap can be updated incrementally.

---

## Data Flow

```
API GET /evaluation-service/notifications
        │
        ▼
  Parse JSON → list of {ID, Type, Message, Timestamp}
        │
        ▼
  Score each: weight = TYPE_WEIGHT[Type], ts = parse(Timestamp)
        │
        ▼
  Min-Heap (size n) — evict lowest when better arrives
        │
        ▼
  Sort heap descending → Top-n priority list
        │
        ▼
  Display / return to caller
```

---

## Edge Cases Handled

- **Unknown notification type** → weight defaults to 0 (treated as lowest priority)
- **Exact same priority** → Python's tuple comparison falls through to the notification dict, which is avoided by using a monotonic counter as a final tiebreaker in production to prevent comparison errors
- **n > total notifications** → heap simply holds all notifications, no error
- **API failure** → logged and exception re-raised for the caller to handle

---

## Scaling Considerations

| Scenario | Approach |
|---|---|
| n is configurable (10, 15, 20…) | Passed as parameter; defaults to 10 |
| New notifications arrive in real-time | Heap supports O(log n) incremental updates |
| Very large N (millions of notifications) | Heap still O(N log n), O(n) space — no full sort needed |
| Filtering by type before ranking | Add a `type_filter` param to `get_top_n_priority()` |

---

## Logging

All key operations are logged via the **Logging Middleware** created during Pre-Test Setup:
- API fetch start/success/error
- Each heap insertion and eviction (DEBUG level)
- Final top-n computation result

Console logging and Python's built-in `print` are not used for application logic.
