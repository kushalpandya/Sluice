export const STATUSES = ["new", "promoted", "spam", "archived"];

export const WINDOW_LABELS = {
  "24h": "the last 24 hours",
  "7d": "the last 7 days",
  "30d": "the last 30 days",
  all: "all time",
};

// Left-nav sections. `key` is the `status` query param sent to /admin/reports
// ('' = unfiltered, i.e. everything).
export const SECTIONS = [
  { key: "", label: "Home", icon: "layers", hint: "Every report" },
  { key: "new", label: "New", icon: "inbox", hint: "Awaiting triage" },
  { key: "promoted", label: "Promoted", icon: "rocket", hint: "Filed on GitHub" },
  { key: "archived", label: "Archived", icon: "archive", hint: "Triaged, kept" },
  { key: "spam", label: "Spam", icon: "ban", hint: "Marked as junk" },
];

export const SECTION_LABEL = Object.fromEntries(SECTIONS.map((s) => [s.key, s.label]));

// Report category → badge presentation. Colours come from the semantic tokens
// in styles.css, so they adapt to light/dark automatically.
const CATEGORY_META = {
  crash: { label: "Crash", icon: "bolt", class: "bg-bad-soft text-bad" },
  bug: { label: "Bug", icon: "bug", class: "bg-warn-soft text-warn" },
  feature: { label: "Feature", icon: "lightbulb", class: "bg-ok-soft text-ok" },
  other: { label: "Other", icon: "info", class: "bg-neutral-soft text-ink-soft" },
};

const FALLBACK = { icon: "info", class: "bg-neutral-soft text-ink-soft" };

export const categoryMeta = (v) =>
  CATEGORY_META[v] || { ...FALLBACK, label: v || "—" };

// Report status → badge presentation.
const STATUS_META = {
  new: { label: "New", class: "bg-info-soft text-info" },
  promoted: { label: "Promoted", class: "bg-ok-soft text-ok" },
  spam: { label: "Spam", class: "bg-warn-soft text-warn" },
  archived: { label: "Archived", class: "bg-neutral-soft text-ink-soft" },
};

export const statusMeta = (v) => STATUS_META[v] || { ...FALLBACK, label: v || "—" };

// The two halves of a triage action, kept together so the button in the reader
// and the toast it produces can't drift apart.
//   TRIAGE_VERB  status being set     → what the toast says once it lands
//   RESTORE      status being left    → how to offer sending it back to 'new'
export const TRIAGE_VERB = { archived: "Archived", spam: "Marked as spam" };

export const RESTORE = {
  spam: { action: "Not spam", done: "Restored" },
  archived: { action: "Unarchive", done: "Unarchived" },
};
