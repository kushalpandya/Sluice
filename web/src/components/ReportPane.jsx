import { useEffect, useMemo, useRef } from 'preact/hooks';
import { Icon } from './Icon.jsx';
import { Menu } from './Menu.jsx';
import { CategoryBadge, StatusBadge } from './Badge.jsx';
import { RESTORE } from '../lib/constants.js';
import { when, timeAgo, initials, formatSize, attachmentIcon } from '../lib/utils.js';

function Field({ label, children }) {
  return (
    <div>
      <dt class="text-[11px] font-semibold tracking-wide text-ink-faint uppercase">{label}</dt>
      <dd class="mt-0.5 text-sm break-words">{children}</dd>
    </div>
  );
}

function Attachment({ a, onOpen, onDownload }) {
  return (
    <li class="flex items-center gap-3 rounded-lg border border-line bg-subtle px-3 py-2">
      <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-surface text-ink-soft">
        <Icon name={attachmentIcon(a.content_type)} size={16} />
      </span>
      <span class="min-w-0 flex-1">
        <span class="block truncate text-sm font-medium">{a.name}</span>
        <span class="block text-xs text-ink-faint">
          {formatSize(a.size)}
          {a.content_type ? ` · ${a.content_type}` : ''}
        </span>
      </span>
      <button class="btn btn-icon" title="Preview" aria-label={`Preview ${a.name}`} onClick={() => onOpen(a)}>
        <Icon name="eye" size={16} />
      </button>
      <button
        class="btn btn-icon"
        title="Download"
        aria-label={`Download ${a.name}`}
        onClick={() => onDownload(a)}
      >
        <Icon name="download" size={16} />
      </button>
    </li>
  );
}

function Placeholder({ busy }) {
  return (
    <div class="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
      <span class="flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-soft text-ink-faint">
        <Icon name={busy ? 'refresh' : 'mail'} size={24} class={busy ? 'animate-spin' : ''} />
      </span>
      <p class="text-sm font-medium">{busy ? 'Opening report…' : 'No report selected'}</p>
      {!busy && (
        <p class="max-w-xs text-xs text-ink-soft">
          Pick a report from the list to read it, then triage it from the actions in this
          panel's header.
        </p>
      )}
    </div>
  );
}

export function ReportPane({
  detail,
  busy,
  onClose,
  onOpenAttachment,
  onDownloadAttachment,
  onDelete,
  onStatus,
  onPromote,
}) {
  const paneRef = useRef(null);
  const id = detail && detail.id;

  // Opening a report moves focus into the reader, so the next Tab continues
  // from here. On phones the reader covers the list, which would otherwise
  // leave focus on a row nobody can see.
  useEffect(() => {
    if (id && paneRef.current) paneRef.current.focus();
  }, [id]);

  // Metadata can be arbitrarily large and rarely changes, so don't re-parse it
  // on every render of the surrounding app.
  const meta = useMemo(() => {
    if (!detail || !detail.metadata) return '(none)';
    try {
      return JSON.stringify(JSON.parse(detail.metadata), null, 2);
    } catch {
      return detail.metadata;
    }
  }, [detail && detail.metadata]);

  if (!detail) {
    return (
      <section class="hidden h-full min-w-0 flex-1 bg-canvas md:block" aria-label="Report">
        <Placeholder busy={busy} />
      </section>
    );
  }

  const attachments = detail.attachments || [];

  // A spam/archived report gets a single restore action; anything else can be
  // archived or junked (mirrors the statuses the Worker accepts).
  const restore = RESTORE[detail.status];
  // Already filed? The primary action becomes a way back to that issue.
  const issueUrl = detail.github_url;

  const actions = restore
    ? [{ label: restore.action, icon: 'check', onClick: () => onStatus('new') }]
    : [
        { label: 'Archive', icon: 'archive', onClick: () => onStatus('archived') },
        { label: 'Mark as spam', icon: 'ban', onClick: () => onStatus('spam') },
      ];

  return (
    <section
      ref={paneRef}
      tabindex="-1"
      aria-label="Report"
      class="absolute inset-0 z-30 flex h-full min-w-0 flex-1 flex-col bg-surface md:static md:z-auto"
    >
      {/* Actions sit flush with the right edge of the panel. There is no close
          button: Escape, or a click on the empty part of the list, ends the
          reading session. */}
      <header class="shrink-0 border-b border-line px-2 py-2 sm:px-4">
        <div class="flex items-center gap-1.5">
          <button
            class="btn btn-ghost btn-icon md:hidden"
            aria-label="Back to list"
            onClick={onClose}
          >
            <Icon name="back" size={18} />
          </button>

          <span class="truncate-flex flex-1 px-1 text-sm font-semibold sm:hidden">
            {detail.summary}
          </span>

          <div class="ml-auto flex items-center gap-1.5">
            {issueUrl ? (
              <a
                class="btn btn-primary"
                href={issueUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="View issue on GitHub"
              >
                <Icon name="github" size={15} />
                <span class="hidden sm:inline">View issue</span>
                <Icon name="external" size={13} />
              </a>
            ) : (
              !restore && (
                <button class="btn btn-primary" aria-label="Promote as issue" onClick={onPromote}>
                  <Icon name="github" size={15} />
                  <span class="hidden sm:inline">Promote as issue</span>
                </button>
              )
            )}

            {/* Wide: buttons. Narrow: the same actions inside the overflow menu. */}
            <div class="hidden items-center gap-1.5 lg:flex">
              {actions.map((a) => (
                <button key={a.label} class="btn" onClick={a.onClick}>
                  <Icon name={a.icon} size={15} />
                  {a.label}
                </button>
              ))}
              <button class="btn btn-danger" onClick={onDelete}>
                <Icon name="trash" size={15} />
                Delete
              </button>
            </div>

            <div class="lg:hidden">
              <Menu
                items={[
                  ...actions,
                  { label: 'Delete', icon: 'trash', danger: true, onClick: onDelete },
                ]}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Reading order: who sent it → what it is → where it came from → what
          they said → the raw extras. Each section carries its own padding, so
          the rules between them run the full width of the panel. */}
      <div class="scroll-pane flex-1 pb-6">
        <div class="[&>*]:px-4 sm:[&>*]:px-6">
          {/* Correspondence header: who on the left, when on the right. */}
          <div class="flex items-start gap-3 border-b border-line py-4">
            <span
              class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-neutral-soft text-xs font-bold text-ink-soft"
              aria-hidden="true"
            >
              {initials(detail.email)}
            </span>
            <div class="min-w-0 flex-1">
              <a
                class="block truncate text-sm font-medium hover:underline"
                href={`mailto:${detail.email}`}
              >
                {detail.email}
              </a>
              <p class="truncate font-mono text-[11px] text-ink-faint" title={detail.id}>
                {detail.id}
              </p>
            </div>
            <div class="shrink-0 text-right">
              <p class="text-xs font-medium text-ink-soft">{timeAgo(detail.created)}</p>
              <p class="text-[11px] text-ink-faint">{when(detail.created)}</p>
            </div>
          </div>

          <div class="py-4">
            <div class="flex flex-wrap items-center gap-2">
              <CategoryBadge v={detail.category} />
              <StatusBadge v={detail.status} />
            </div>
            <h1 class="mt-2 text-lg font-semibold break-words sm:text-xl">{detail.summary}</h1>
          </div>

          <dl class="grid grid-cols-2 gap-4 border-t border-line py-4 sm:grid-cols-3">
            <Field label="App version">{detail.app_version || '—'}</Field>
            <Field label="OS version">{detail.os_version || '—'}</Field>
            <Field label="Installation ID">
              <code class="font-mono text-xs text-ink-soft">{detail.installation_id || '—'}</code>
            </Field>
          </dl>

          <div class="border-t border-line py-4">
            <h2 class="field-label">Description</h2>
            <pre class="rounded-lg border border-line bg-subtle p-3 font-sans text-sm leading-relaxed break-words whitespace-pre-wrap">
              {detail.description || '(no description)'}
            </pre>
          </div>

          <details class="group border-t border-line py-4">
            <summary class="flex cursor-pointer list-none items-center gap-2 text-sm font-medium text-ink-soft hover:text-ink">
              <Icon name="chevron" size={14} class="transition-transform group-open:rotate-90" />
              Metadata
            </summary>
            <pre class="mt-2 overflow-x-auto rounded-lg border border-line bg-subtle p-3 font-mono text-xs">
              {meta}
            </pre>
          </details>

          {attachments.length > 0 && (
            <div class="border-t border-line py-4">
              <h2 class="field-label">
                Attachments <span class="text-ink-faint">({attachments.length})</span>
              </h2>
              <ul class="space-y-2">
                {attachments.map((a) => (
                  <Attachment
                    key={a.id}
                    a={a}
                    onOpen={onOpenAttachment}
                    onDownload={onDownloadAttachment}
                  />
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
