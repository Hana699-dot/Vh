# notification-app-fe

Campus notification frontend 

## Setup

```bash
cd notification-app-fe
npm install
npm start        # runs on http://localhost:3000
```

## Features

### Page 1 — All Notifications (`/`)
- Fetches all notifications from the API
- Filter by type: All / Placement / Result / Event
- Paginated (10 per page)
- Unread badge count in nav
- Click card or ✉ icon to mark as read
- "Mark all read" bulk action
- Read vs unread visually distinguished (bold, blue dot, "New" chip)

### Page 2 — Priority Inbox (`/priority`)
- Ranks notifications by: **Placement (3) > Result (2) > Event (1)**, then recency
- Configurable top-N slider (5 to 30)
- Filter by notification type
- Stats strip showing breakdown across types
- Rank badge shown on each card

## Architecture

```
src/
├── middleware/
│   └── logger.js          ← Logging middleware (all app logging goes here)
├── utils/
│   └── notificationService.js  ← API calls + priority algorithm
├── hooks/
│   └── useNotifications.js     ← State management, read/unread tracking
├── components/
│   ├── NavBar.jsx
│   └── NotificationCard.jsx
└── pages/
    ├── AllNotificationsPage.jsx
    └── PriorityNotificationsPage.jsx
```

## Logging

All logging uses the custom middleware (`src/middleware/logger.js`). 
Direct `console.log` is not used in application code.
The `apiFetch` wrapper logs every API request/response with timing.

## Tech

- React 18
- Material UI v5 (exclusively — no ShadCN, no raw CSS frameworks)
- React Router v6
- Read state persisted in `localStorage`
