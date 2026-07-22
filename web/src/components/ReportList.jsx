import { Icon } from './Icon.jsx';
import { Menu } from './Menu.jsx';
import { CategoryBadge, StatusBadge } from './Badge.jsx';
import { SECTION_LABEL } from '../lib/constants.js';
import { cx, whenShort, whenDate, initials } from '../lib/utils.js';

// One inbox row. Untriaged ('new') reports read like unread mail - bold, filled
// avatar; everything else is de-emphasised and carries its status as a pill.
function Row({ r, selected, onOpen }) {
  const unread = r.status === 'new';
  const muted = r.status === 'spam' || r.status === 'archived';
  return (
    <li>
      <button
        class={cx(
          'relative flex w-full gap-3 border-b border-line-soft px-3 py-3 text-left transition-colors',
          selected ? 'bg-brand-soft' : 'hover:bg-hover',
          muted && !selected && 'opacity-60',
        )}
        aria-current={selected ? 'true' : undefined}
        onClick={() => onOpen(r.id)}
      >
        {selected && <span class="absolute inset-y-0 left-0 w-0.5 bg-brand" />}

        <span
          class={cx(
            'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold',
            unread ? 'bg-brand text-on-brand' : 'bg-neutral-soft text-ink-soft',
          )}
          aria-hidden="true"
        >
          {initials(r.email)}
        </span>

        <span class="min-w-0 flex-1">
          <span class="flex items-baseline gap-2">
            <span
              class={cx(
                'truncate-flex flex-1 text-sm',
                unread ? 'font-semibold text-ink' : 'font-medium text-ink-soft',
              )}
            >
              {r.email || 'unknown'}
            </span>
            <span class="shrink-0 text-[11px] text-ink-faint" title={whenDate(r.created)}>
              {whenShort(r.created)}
            </span>
          </span>

          <span class="mt-0.5 flex items-center gap-2">
            <span class={cx('truncate-flex flex-1 text-sm text-ink', unread && 'font-medium')}>
              {r.summary || '(no summary)'}
            </span>
            {r.attachment_count > 0 && (
              <span
                class="flex shrink-0 items-center gap-0.5 text-[11px] text-ink-faint"
                title={`${r.attachment_count} attachment${r.attachment_count === 1 ? '' : 's'}`}
              >
                <Icon name="paperclip" size={12} />
                {r.attachment_count}
              </span>
            )}
          </span>

          <span class="mt-1 flex items-center gap-2">
            <CategoryBadge v={r.category} />
            {r.github_url && (
              <span class="text-ok" title="Has a GitHub issue">
                <Icon name="github" size={13} />
              </span>
            )}
            {!unread && (
              <span class="ml-auto">
                <StatusBadge v={r.status} />
              </span>
            )}
          </span>
        </span>
      </button>
    </li>
  );
}

function Empty({ query, filter }) {
  return (
    <div class="flex flex-col items-center justify-center gap-2 px-6 py-16 text-center">
      <span class="flex h-11 w-11 items-center justify-center rounded-full bg-neutral-soft text-ink-faint">
        <Icon name={query ? 'search' : 'inbox'} size={20} />
      </span>
      <p class="text-sm font-medium">{query ? 'No matches' : 'Nothing here'}</p>
      <p class="max-w-56 text-xs text-ink-soft">
        {query
          ? 'No report in this section matches your search.'
          : `No reports in ${SECTION_LABEL[filter] ?? 'this section'}.`}
      </p>
    </div>
  );
}

export function ReportList({
  rows,
  total,
  filter,
  selectedId,
  onOpen,
  busy,
  query,
  setQuery,
  order,
  toggleOrder,
  onRefresh,
  onPrune,
  onOpenNav,
  onDeselect,
}) {
  const title = SECTION_LABEL[filter] ?? 'Reports';

  // Clicking the empty space under the rows clears the selection, the way a
  // mail client dismisses the reading pane. `currentTarget` guards against
  // clicks that bubbled up from a row.
  const clearOnBackdrop = (e) => {
    if (e.target === e.currentTarget) onDeselect();
  };

  const orderLabel =
    order === 'newest' ? 'Newest first - switch to oldest' : 'Oldest first - switch to newest';

  return (
    <section
      class="flex h-full w-full min-w-0 flex-col border-r border-line bg-surface"
      aria-label={`${title} reports`}
    >
      <header class="shrink-0 border-b border-line px-3 pt-3 pb-2">
        <div class="flex items-center gap-2">
          <button
            class="btn btn-ghost btn-icon md:hidden"
            aria-label="Open navigation"
            onClick={onOpenNav}
          >
            <Icon name="menu" size={18} />
          </button>
          <h2 class="truncate-flex flex-1 text-base font-semibold">
            {title}
            <span class="ml-2 text-xs font-normal text-ink-faint">
              {query && rows.length !== total ? `${rows.length}/${total}` : total}
            </span>
          </h2>
          <button
            class="btn btn-ghost btn-icon"
            title={orderLabel}
            aria-label={orderLabel}
            onClick={toggleOrder}
          >
            <Icon name={order === 'newest' ? 'sort-desc' : 'sort-asc'} size={17} />
          </button>
          {/* aria-disabled rather than disabled: a disabled button loses focus
              to <body>, stranding a keyboard user who just pressed Refresh. */}
          <button
            class={cx('btn btn-ghost btn-icon', busy && 'opacity-50')}
            title="Refresh"
            aria-label="Refresh"
            aria-disabled={busy}
            onClick={() => !busy && onRefresh()}
          >
            <Icon name="refresh" size={17} class={busy ? 'animate-spin' : ''} />
          </button>
          <Menu
            items={[
              { label: 'Refresh', icon: 'refresh', onClick: onRefresh },
              { label: 'Prune reports…', icon: 'trash', danger: true, onClick: onPrune },
            ]}
          />
        </div>

        <div class="relative mt-2">
          <span class="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-ink-faint">
            <Icon name="search" size={15} />
          </span>
          <input
            class="field-input py-1.5 pl-8 text-[13px]"
            type="search"
            value={query}
            placeholder="Search this section…"
            aria-label="Search reports"
            onInput={(e) => setQuery(e.target.value)}
          />
        </div>
      </header>

      <div class="scroll-pane flex-1" onClick={clearOnBackdrop}>
        {rows.length === 0 ? (
          <Empty query={query} filter={filter} />
        ) : (
          <ul>
            {rows.map((r) => (
              <Row key={r.id} r={r} selected={r.id === selectedId} onOpen={onOpen} />
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
