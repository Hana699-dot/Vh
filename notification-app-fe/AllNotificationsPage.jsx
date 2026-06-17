import React, { useEffect, useState } from "react";
import {
  Box, Typography, CircularProgress, Alert, Button,
  MenuItem, Select, FormControl, InputLabel, Stack,
  Pagination, Chip, Divider,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import NotificationCard from "../components/NotificationCard";
import { createLogger } from "../middleware/logger";

const logger = createLogger("AllNotificationsPage");

const TYPES = ["All", "Placement", "Result", "Event"];
const PAGE_SIZE = 10;

export default function AllNotificationsPage({
  notifications, loading, error, load, isRead, markRead, markAllRead,
}) {
  const [typeFilter, setTypeFilter] = useState("All");
  const [page, setPage] = useState(1);

  useEffect(() => {
    logger.info("All Notifications page mounted");
    load({ limit: 50 });
  }, [load]);

  // Filter by type
  const filtered = typeFilter === "All"
    ? notifications
    : notifications.filter((n) => n.Type === typeFilter);

  // Paginate
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const unreadCount = filtered.filter((n) => !isRead(n.ID)).length;

  function handleTypeChange(e) {
    logger.info("Filter changed", { type: e.target.value });
    setTypeFilter(e.target.value);
    setPage(1);
  }

  function handleMarkAllRead() {
    markAllRead(filtered.map((n) => n.ID));
  }

  function handleRefresh() {
    logger.info("Manual refresh triggered");
    load({ limit: 50 });
  }

  return (
    <Box maxWidth={720} mx="auto" px={2} py={3}>
      {/* Header */}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2} flexWrap="wrap" gap={1}>
        <Box>
          <Typography variant="h5" fontWeight={700}>All Notifications</Typography>
          <Typography variant="body2" color="text.secondary">
            {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          {unreadCount > 0 && (
            <Button size="small" startIcon={<DoneAllIcon />}
              onClick={handleMarkAllRead} variant="outlined">
              Mark all read
            </Button>
          )}
          <Button size="small" startIcon={<RefreshIcon />}
            onClick={handleRefresh} variant="outlined" disabled={loading}>
            Refresh
          </Button>
        </Stack>
      </Box>

      {/* Filter row */}
      <Stack direction="row" spacing={1} mb={2} alignItems="center" flexWrap="wrap">
        {TYPES.map((t) => (
          <Chip
            key={t}
            label={t}
            onClick={() => handleTypeChange({ target: { value: t } })}
            variant={typeFilter === t ? "filled" : "outlined"}
            color={typeFilter === t ? "primary" : "default"}
            size="small"
            sx={{ fontWeight: 600, cursor: "pointer" }}
          />
        ))}
        <Box flex={1} />
        <Typography variant="caption" color="text.secondary">
          {filtered.length} notifications
        </Typography>
      </Stack>

      <Divider sx={{ mb: 2 }} />

      {/* State handling */}
      {loading && (
        <Box display="flex" justifyContent="center" py={6}>
          <CircularProgress />
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error} — <Button size="small" onClick={handleRefresh}>Retry</Button>
        </Alert>
      )}

      {!loading && !error && paginated.length === 0 && (
        <Box textAlign="center" py={6}>
          <Typography color="text.secondary">No notifications found.</Typography>
        </Box>
      )}

      {!loading && paginated.map((n) => (
        <NotificationCard
          key={n.ID}
          notification={n}
          isRead={isRead(n.ID)}
          onRead={markRead}
        />
      ))}

      {totalPages > 1 && (
        <Box display="flex" justifyContent="center" mt={3}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(_, v) => { setPage(v); window.scrollTo(0, 0); }}
            color="primary"
            size="small"
          />
        </Box>
      )}
    </Box>
  );
}
