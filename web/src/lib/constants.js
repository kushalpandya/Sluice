export const STATUSES = ["new", "promoted", "spam", "archived"];

export const WINDOW_LABELS = {
  "24h": "the last 24 hours",
  "7d": "the last 7 days",
  "30d": "the last 30 days",
  all: "all time",
};

// Solid colours (theme-adaptive contrast); '' = plain tag that follows the scheme.
// Avoid Bulma's `is-light`, which is a fixed pale colour that ignores dark mode.
export const TAG_COLOR = {
  bug: "is-warning",
  crash: "is-danger",
  feature: "is-success",
  other: "",
  new: "is-info",
  promoted: "is-success",
  spam: "is-warning",
  archived: "is-dark",
};

// [sortKey, header label]. Order = column order in the table.
export const COLUMNS = [
  ["created", "Received"],
  ["category", "Type"],
  ["summary", "Summary"],
  ["email", "From"],
  ["attachment_count", "Files"],
  ["status", "Status"],
];
