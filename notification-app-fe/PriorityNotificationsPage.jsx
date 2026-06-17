import React, { useEffect, useState } from "react";
import {
  Box, Typography, CircularProgress, Alert, Button,
  Slider, Stack, Chip, Divider, Select, MenuItem,
  FormControl, InputLabel, Paper,
} from "@mui/material";
import StarIcon from "@mui/icons-material/Star";
import RefreshIcon from "@mui/icons-material/Refresh";
import NotificationCard from "../components/NotificationCard";
import { createLogger } from "../middleware/logger";

const logger = createLogger("PriorityPage");

const TYPE_WEIGHTS = { Placement: 3, Result: 2, Event: 1 };
const TYPES = ["All", "Placement", "Result", "Event"];

export default function PriorityNotificationsPage({
  loading, error, load, isRead, markRead, getPriorityNotifications,
}) {
  const [topN, setTopN] = useState(10);
  const [typeFilter, setTypeFilter] = useState("All");

  useEffect(() => {
    logger.info("Priority page mounted");
    load({ limit: 100 });
  }, [load]);

  const priorityList = getPriorityNotifications(topN);

  const filtered = typeFilter === "All"
    ? priorityList
    : priorityList.filter((n) => n.Type === typeFilter);

  function handleRefresh() {
    logger.info("Priority refresh", { topN, typeFilter });
    load({ limit: 100 });
  }

  const placementCount = priorityList.filter((n) => n.Type === "Placement").length;
  const resultCount    = priorityList.filter((n) => n.Type === "Result").length;
  const eventCount     = priorityList.filter((n) => n.Type === "Event").length;

  return (
    <Box maxWidth={720} mx="auto" px={2} py={3}>
      {/* Header */}
      <Box display="flex" alignItems="center" gap={1} mb={0.5}>
        <StarIcon color="warning" />
        <Typography variant="h5" fontWeight={700}>Priority Inbox</Typography>
      </Box>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Top notifications ranked by importance (Placement › Result › Event) and recency.
      </Typography>

      {/* Controls card */}
      <Paper variant="outlined" sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <Stack spacing={2}>
          <Box>
            <Typography variant="caption" fontWeight={600} color="text.secondary" gutterBottom>
              SHOW TOP-N NOTIFICATIONS
            </Typography>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Slider
                value={topN}
                min={5} max={30} step={5}
                marks={[5,10,15,20,25,30].map((v) => ({ value: v, label: String(v) }))}
                onChange={(_, v) => {
                  logger.info("Top-N changed", { topN: v });
                  setTopN(v);
                }}
                sx={{ flex: 1 }}
              />
              <Chip label={`Top ${topN}`} color="primary" size="small" sx={{ fontWeight: 700 }} />
            </Stack>
          </Box>

          <Box>
            <Typography variant="caption" fontWeight={600} color="text.secondary" display="block" mb={1}>
              FILTER BY TYPE
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              {TYPES.map((t) => (
                <Chip
                  key={t}
                  label={t}
                  onClick={() => {
                    logger.info("Priority type filter changed", { type: t });
                    setTypeFilter(t);
                  }}
                  variant={typeFilter === t ? "filled" : "outlined"}
                  color={typeFilter === t ? "primary" : "default"}
                  size="small"
                  sx={{ fontWeight: 600, cursor: "pointer", mb: 0.5 }}
                />
              ))}
            </Stack>
          </Box>
        </Stack>
      </Paper>

      {/* Stats strip */}
      {!loading && priorityList.length > 0 && (
        <Stack direction="row" spacing={1} mb={2} flexWrap="wrap">
          {[
            { label: "Placements", count: placementCount, color: "#3730A3", bg: "#EEF2FF" },
            { label: "Results",    count: resultCount,    color: "#166534", bg: "#F0FDF4" },
            { label: "Events",     count: eventCount,     color: "#92400E", bg: "#FFFBEB" },
          ].map(({ label, count, color, bg }) => (
            <Paper key={label} variant="outlined"
              sx={{ px: 2, py: 0.75, borderRadius: 2, bgcolor: bg, borderColor: `${color}22` }}>
              <Typography variant="caption" fontWeight={700} color={color}>
                {count} {label}
              </Typography>
            </Paper>
          ))}
        </Stack>
      )}

      <Divider sx={{ mb: 2 }} />

      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
        <Typography variant="body2" color="text.secondary">
          Showing {filtered.length} notifications
        </Typography>
        <Button size="small" startIcon={<RefreshIcon />}
          onClick={handleRefresh} disabled={loading} variant="outlined">
          Refresh
        </Button>
      </Box>

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

      {!loading && !error && filtered.length === 0 && (
        <Box textAlign="center" py={6}>
          <Typography color="text.secondary">No priority notifications match your filters.</Typography>
        </Box>
      )}

      {!loading && filtered.map((n, i) => (
        <NotificationCard
          key={n.ID}
          notification={n}
          isRead={isRead(n.ID)}
          onRead={markRead}
          rank={typeFilter === "All" ? i + 1 : undefined}
        />
      ))}
    </Box>
  );
}
