import { useState, useEffect } from 'preact/hooks';
import { useTriage } from './hooks/useTriage.js';
import { useMediaQuery } from './hooks/useMediaQuery.js';
import { useFocusTrap } from './hooks/useFocusTrap.js';
import { DEMO_MODE } from './config.js';
import { Connect } from './components/Connect.jsx';
import { DemoBanner } from './components/DemoBanner.jsx';
import { Sidebar } from './components/Sidebar.jsx';
import { ReportList } from './components/ReportList.jsx';
import { ReportPane } from './components/ReportPane.jsx';
import { PromoteModal } from './components/PromoteModal.jsx';
import { PruneModal } from './components/PruneModal.jsx';
import { AttachmentViewer } from './components/AttachmentViewer.jsx';
import { ConfirmDialog } from './components/ConfirmDialog.jsx';
import { Toast } from './components/Toast.jsx';
import { ThemeSwitch } from './components/ThemeSwitch.jsx';

const NAV_KEY = 'sluiceNavExpanded';

// The nav as an overlay, for screens too narrow to keep it on the side. Split
// out so the focus trap mounts and unmounts with the drawer itself.
function NavDrawer({ nav, onClose, onSelect }) {
  const ref = useFocusTrap();
  return (
    <div
      class="fixed inset-0 z-50 xl:hidden"
      role="dialog"
      aria-modal="true"
      aria-label="Navigation"
    >
      <div class="animate-fade-in absolute inset-0 bg-black/50" onClick={onClose} />
      <div class="animate-slide-in absolute inset-y-0 left-0 shadow-2xl" ref={ref}>
        {nav({
          collapsed: false,
          onToggle: onClose,
          toggleLabel: 'Close navigation',
          onSelect: (k) => {
            onClose();
            onSelect(k);
          },
        })}
      </div>
    </div>
  );
}

// Three-pane mail layout: nav sidebar → report list → report.
//   ≥ xl   inline sidebar, expandable/collapsible and remembered
//   md-xl  inline icon rail; the toggle opens the labelled nav as a drawer
//   < md   no inline sidebar; one pane at a time (list, or the open report)
export function App() {
  const t = useTriage();
  const wide = useMediaQuery('(min-width: 1280px)');
  const mdUp = useMediaQuery('(min-width: 768px)');
  const [expanded, setExpanded] = useState(
    () => localStorage.getItem(NAV_KEY) !== '0',
  );
  const [drawer, setDrawer] = useState(false);

  const collapsed = !wide || !expanded;
  const toggleNav = () => {
    if (!wide) {
      setDrawer(true);
      return;
    }
    setExpanded((v) => {
      localStorage.setItem(NAV_KEY, v ? '0' : '1');
      return !v;
    });
  };

  // The drawer is a narrow-screen affordance only.
  useEffect(() => {
    if (wide) setDrawer(false);
  }, [wide]);

  useEffect(() => {
    if (!drawer) return;
    const onKey = (e) => e.key === 'Escape' && setDrawer(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [drawer]);

  if (!t.authed) {
    return (
      <div class="flex h-full flex-col">
        {DEMO_MODE && <DemoBanner />}
        <div class="absolute top-3 right-4 z-10 w-32">
          <ThemeSwitch mode={t.themeMode} setMode={t.setThemeMode} />
        </div>
        <div class="min-h-0 flex-1 overflow-y-auto">
          <Connect
            base={t.sBase}
            setBase={t.setSBase}
            adminKey={t.sKey}
            setKey={t.setSKey}
            connect={t.connect}
          />
        </div>
        <Toast toast={t.toastState} onPause={t.pauseToast} onResume={t.resumeToast} />
      </div>
    );
  }

  // A plain function, not a component: a component declared inside App would be
  // a new type on every render, remounting the whole sidebar each time. Calling
  // nav() returns the Sidebar vnode directly and keeps its identity.
  const nav = (props) => (
    <Sidebar
      filter={t.filter}
      newCount={t.newCount}
      themeMode={t.themeMode}
      setThemeMode={t.setThemeMode}
      onSignOut={() => t.signOut()}
      {...props}
    />
  );

  // Panes that are covered rather than unmounted still hold focusable content,
  // so they are marked inert while something sits on top of them.
  const readerCoversList = !!t.detail && !mdUp;

  return (
    <div class="flex h-full flex-col">
      {DEMO_MODE && <DemoBanner />}

      <div class="flex min-h-0 flex-1">
        <div class="hidden shrink-0 md:block" inert={drawer || undefined}>
          {nav({
            collapsed,
            onToggle: toggleNav,
            onSelect: t.changeFilter,
          })}
        </div>

        {drawer && <NavDrawer nav={nav} onClose={() => setDrawer(false)} onSelect={t.changeFilter} />}

        <main class="relative flex min-h-0 min-w-0 flex-1">
          {/* Fixed track: the list keeps the same width whatever it holds. */}
          <div class="w-full shrink-0 md:w-80 lg:w-96" inert={readerCoversList || undefined}>
            <ReportList
              rows={t.visibleReports}
              total={t.reports.length}
              filter={t.filter}
              selectedId={t.selectedId}
              onOpen={t.openDetail}
              busy={t.busy}
              query={t.query}
              setQuery={t.setQuery}
              order={t.order}
              toggleOrder={t.toggleOrder}
              onRefresh={() => t.load()}
              onPrune={() => t.setPrune({ window: null, count: null })}
              onOpenNav={() => setDrawer(true)}
              onDeselect={t.closeDetail}
            />
          </div>

          <ReportPane
            detail={t.detail}
            busy={t.detailBusy}
            onClose={t.closeDetail}
            onOpenAttachment={t.openAttachment}
            onDownloadAttachment={t.downloadAttachment}
            onDelete={t.del}
            onStatus={t.changeStatus}
            onPromote={t.openPromote}
          />
        </main>
      </div>

      <PromoteModal
        form={t.promoteForm}
        setForm={t.setPromoteForm}
        onCreate={t.createIssue}
        onClose={() => t.setPromoteForm(null)}
      />

      <PruneModal
        prune={t.prune}
        onClose={() => t.setPrune(null)}
        selectWindow={t.selectWindow}
        doPrune={t.doPrune}
      />

      <AttachmentViewer
        viewer={t.viewer}
        onClose={t.closeViewer}
        onDownload={t.downloadAttachment}
      />

      <ConfirmDialog state={t.confirmation} onCancel={t.cancelConfirmation} />

      <Toast toast={t.toastState} onPause={t.pauseToast} onResume={t.resumeToast} />
    </div>
  );
}
