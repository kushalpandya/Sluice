import { Icon } from './Icon.jsx';
import { Logo } from './Logo.jsx';
import { ThemeSwitch } from './ThemeSwitch.jsx';
import { SECTIONS } from '../lib/constants.js';
import { cx } from '../lib/utils.js';
import { PRODUCT_NAME, DEMO_MODE } from '../config.js';

// Shape shared by the section buttons and sign out: a full-width row when the
// sidebar is labelled, a centred square when it is a rail.
const row = (collapsed) =>
  cx(
    'flex w-full items-center rounded-lg text-sm font-medium transition-colors',
    collapsed ? 'h-10 justify-center' : 'gap-3 px-3 py-2',
  );

// Fixed left navigation. Two shapes from one component:
//   collapsed=false → labelled column (desktop, and inside the mobile drawer)
//   collapsed=true  → icon rail
// App renders it inline on wide screens and inside an overlay drawer on narrow
// ones, so the section list and its behaviour are defined exactly once.
export function Sidebar({
  filter,
  onSelect,
  newCount,
  collapsed,
  onToggle,
  toggleLabel,
  themeMode,
  setThemeMode,
  onSignOut,
}) {
  const signOutLabel = DEMO_MODE ? 'Reset demo data' : 'Sign out';
  // In the drawer the same control closes the overlay, so App names it there.
  const toggle = toggleLabel || (collapsed ? 'Expand sidebar' : 'Collapse sidebar');

  return (
    <nav
      class={cx(
        'flex h-full flex-col border-r border-line bg-surface transition-[width] duration-200',
        collapsed ? 'w-16' : 'w-60',
      )}
      aria-label="Sections"
    >
      {/* Brand + collapse toggle */}
      <div
        class={cx(
          'flex h-14 shrink-0 items-center border-b border-line',
          collapsed ? 'justify-center px-2' : 'gap-2 pr-2 pl-3',
        )}
      >
        {!collapsed && (
          <>
            <Logo size={26} />
            <span class="truncate-flex flex-1 text-sm font-semibold">{PRODUCT_NAME}</span>
          </>
        )}
        <button
          class="btn btn-ghost btn-icon"
          title={toggle}
          aria-label={toggle}
          aria-expanded={toggleLabel ? undefined : !collapsed}
          onClick={onToggle}
        >
          <Icon name="panel-left" size={18} />
        </button>
      </div>

      {/* Sections */}
      <ul class="scroll-pane flex-1 space-y-0.5 p-2">
        {SECTIONS.map((s) => {
          const active = filter === s.key;
          const badge = s.key === 'new' && newCount ? newCount : null;
          return (
            <li key={s.key || 'all'}>
              <button
                class={cx(
                  row(collapsed),
                  active
                    ? 'bg-brand-soft text-brand'
                    : 'text-ink-soft hover:bg-hover hover:text-ink',
                )}
                title={collapsed ? `${s.label} - ${s.hint}` : s.hint}
                aria-current={active ? 'page' : undefined}
                onClick={() => onSelect(s.key)}
              >
                <span class="relative flex items-center">
                  <Icon name={s.icon} size={18} />
                  {collapsed && badge && (
                    <span class="absolute -top-1 -right-1.5 h-2 w-2 rounded-full bg-brand ring-2 ring-surface" />
                  )}
                </span>
                {!collapsed && (
                  <>
                    <span class="truncate-flex flex-1 text-left">{s.label}</span>
                    {badge && (
                      <span
                        class={cx(
                          'rounded-full px-1.5 py-0.5 text-[11px] font-semibold',
                          active ? 'bg-brand text-on-brand' : 'bg-neutral-soft text-ink-soft',
                        )}
                      >
                        {badge}
                      </span>
                    )}
                  </>
                )}
              </button>
            </li>
          );
        })}
      </ul>

      {/* Theme + sign out */}
      <div
        class={cx(
          'shrink-0 space-y-2 border-t border-line p-2',
          collapsed && 'flex flex-col items-center',
        )}
      >
        <ThemeSwitch mode={themeMode} setMode={setThemeMode} compact={collapsed} />
        <button
          class={cx(row(collapsed), 'text-ink-soft hover:bg-hover hover:text-bad')}
          title={signOutLabel}
          aria-label={signOutLabel}
          onClick={onSignOut}
        >
          <Icon name={DEMO_MODE ? 'refresh' : 'logout'} size={18} />
          {!collapsed && <span>{signOutLabel}</span>}
        </button>
      </div>
    </nav>
  );
}
