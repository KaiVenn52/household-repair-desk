CREATE TABLE repair_sessions (
  session_id TEXT PRIMARY KEY NOT NULL,
  revision INTEGER NOT NULL DEFAULT 0,
  payload TEXT NOT NULL,
  expires_at INTEGER NOT NULL
);
--> statement-breakpoint
CREATE INDEX repair_sessions_expiry ON repair_sessions(expires_at);
