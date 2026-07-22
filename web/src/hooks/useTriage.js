import { useState, useEffect } from 'preact/hooks';
import { normalizeStatus, reportCount, searchAndSort } from '../lib/utils.js';
import { WINDOW_LABELS, TRIAGE_VERB, RESTORE } from '../lib/constants.js';
import { createApiClient, jsonBody } from '../lib/api.js';
import { createDemoApiClient } from '../demo/demoApi.js';
import { useTheme } from './useTheme.js';
import { useToast } from './useToast.js';
import { useAttachments } from './useAttachments.js';
import { DEMO_MODE } from '../config.js';

// How long a status change stays undoable before it is written.
const UNDO_MS = 6000;

// Orchestrates the triage session: auth/config, the reports list (plus its
// search/order controls), the open report + its per-report actions (status,
// delete, attachments, promote), and prune. Self-contained concerns (theme,
// toast, the API client, downloads, attachment rendering) live in their own
// modules.
export function useTriage() {
  const [cfg, setCfg] = useState(() => ({
    base: localStorage.getItem('sluiceBase') || '',
    key: localStorage.getItem('sluiceKey') || '',
  }));
  const [reports, setReports] = useState([]);
  const [filter, setFilter] = useState('new');
  const [detail, setDetail] = useState(null);
  const [selectedId, setSelectedId] = useState(null); // set on click, before the fetch lands
  const [detailBusy, setDetailBusy] = useState(false);
  const [promoteForm, setPromoteForm] = useState(null);
  const [prune, setPrune] = useState(null);
  // { title, message, confirmLabel, icon, danger, onConfirm, onCancel? } - see
  // ConfirmDialog. Replaces window.confirm for the destructive actions.
  const [confirmation, setConfirmation] = useState(null);
  const [busy, setBusy] = useState(false);
  const [order, setOrder] = useState('newest'); // 'newest' | 'oldest'
  const [query, setQuery] = useState('');
  const [newCount, setNewCount] = useState(null);
  const [sBase, setSBase] = useState(localStorage.getItem('sluiceBase') || '');
  const [sKey, setSKey] = useState('');

  const { themeMode, setThemeMode } = useTheme();
  const { toastState, toast, flushToast, cancelToast, pauseToast, resumeToast } = useToast();

  const authed = DEMO_MODE || !!(cfg.base && cfg.key);

  const syncUrl = (status, id) => {
    const p = new URLSearchParams();
    if (status) p.set('status', status);
    if (id) p.set('id', id);
    const qs = p.toString();
    history.replaceState(null, '', qs ? '?' + qs : location.pathname);
  };

  const signOut = (msg) => {
    flushToast(); // write out any undoable change while the key is still valid
    if (DEMO_MODE) {
      location.reload(); // demo state lives in memory only - reload resets it
      return;
    }
    localStorage.removeItem('sluiceKey');
    setCfg((c) => ({ base: c.base, key: '' }));
    setDetail(null);
    setSelectedId(null);
    if (typeof msg === 'string' && msg) toast(msg);
  };

  const { api, apiJson } = DEMO_MODE ? createDemoApiClient() : createApiClient(cfg, signOut);

  const { viewer, openAttachment, downloadAttachment, closeViewer } = useAttachments({
    api,
    toast,
    reportId: detail && detail.id,
  });

  // apiJson + ok-check + failure toast, for mutating admin calls. Any undoable
  // change still in its window is written first, so writes stay ordered.
  const send = async (path, opts, onOk) => {
    await flushToast();
    let d;
    try {
      d = await apiJson(path, opts);
    } catch {
      return;
    }
    if (d && d.ok) onOk(d);
    else toast('Failed: ' + ((d && d.error) || 'error'));
  };

  // Unread-style badge on the New section - one extra read, refreshed with the list.
  const loadNewCount = async () => {
    try {
      const d = await apiJson('/admin/reports?limit=200&status=new');
      setNewCount((d.reports || []).length);
    } catch {
      /* 401 handled in api() */
    }
  };

  const load = async (f = filter) => {
    await flushToast(); // never refetch over an unwritten optimistic change
    setBusy(true);
    let rows = null;
    try {
      const d = await apiJson('/admin/reports?limit=200' + (f ? '&status=' + f : ''));
      rows = d.reports || [];
      setReports(rows);
    } catch {
      /* 401 handled in api() */
    } finally {
      setBusy(false);
    }
    // The New section is already the answer - only pay for a second read elsewhere.
    if (f === 'new') {
      if (rows) setNewCount(rows.length);
    } else {
      loadNewCount();
    }
  };

  const openDetail = async (id, status = filter) => {
    setSelectedId(id);
    setDetailBusy(true);
    await flushToast(); // so the report we fetch reflects any pending change
    let d;
    try {
      d = await apiJson('/admin/reports/' + id);
    } catch {
      setDetailBusy(false);
      return;
    }
    setDetailBusy(false);
    if (!d.report) {
      toast('Report not found');
      setSelectedId(null);
      return;
    }
    setDetail({ ...d.report, attachments: d.attachments || [] });
    syncUrl(status, id);
  };

  useEffect(() => {
    if (!authed) return;
    (async () => {
      const params = new URLSearchParams(location.search);
      const st = normalizeStatus(params.get('status'));
      setFilter(st);
      await load(st);
      const id = params.get('id');
      if (id) openDetail(id, st);
      else syncUrl(st, null);
    })();
  }, [cfg]);

  // Last chance to write an undoable change: the tab is going away. iOS can
  // suspend a tab without firing pagehide, so watch both signals.
  useEffect(() => {
    const onHide = () => flushToast();
    const onVisibility = () => document.visibilityState === 'hidden' && flushToast();
    addEventListener('pagehide', onHide);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      removeEventListener('pagehide', onHide);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [flushToast]);

  // The undo button lives in a toast that appears after focus has moved on, so
  // it needs a keyboard route that doesn't depend on tabbing to it in time.
  useEffect(() => {
    const action = toastState && toastState.action;
    if (!action) return;
    const onKey = (e) => {
      const tag = e.target && e.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return; // leave native undo alone
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        action.onClick();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [toastState]);

  // Dismiss a confirmation the way its own Cancel would (some restore state).
  const cancelConfirmation = () => {
    if (confirmation && confirmation.onCancel) confirmation.onCancel();
    else setConfirmation(null);
  };

  // Central Escape handling for the stacked layers (topmost first).
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'Escape') return;
      if (confirmation) cancelConfirmation();
      else if (promoteForm) setPromoteForm(null);
      else if (viewer) closeViewer();
      else if (prune !== null) setPrune(null);
      else if (detail) closeDetail();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [confirmation, promoteForm, viewer, prune, detail]);

  const connect = () => {
    const base = sBase.trim().replace(/\/+$/, '');
    if (!base || !sKey) {
      toast('Enter both fields');
      return;
    }
    localStorage.setItem('sluiceBase', base);
    localStorage.setItem('sluiceKey', sKey);
    setCfg({ base, key: sKey });
  };

  const changeFilter = (v) => {
    setFilter(v);
    setDetail(null);
    setSelectedId(null);
    setQuery('');
    load(v);
    syncUrl(v, null);
  };
  const closeDetail = () => {
    setDetail(null);
    setSelectedId(null);
    syncUrl(filter, null);
  };
  const toggleOrder = () => setOrder((o) => (o === 'newest' ? 'oldest' : 'newest'));

  // Status changes are applied to the list immediately and only written once
  // the undo window closes (the toast's progress bar is that window). Undo just
  // restores the snapshot - no request was ever made. Anything that would read
  // or write around a pending change calls flushToast() first, so the deferred
  // write always lands before whatever follows it.
  const changeStatus = (status) => {
    if (!detail) return;
    const target = detail;
    // Setting a status has its own verb; sending one back to 'new' borrows the
    // verb from the status being left.
    const verb = TRIAGE_VERB[status] || (RESTORE[target.status] || {}).done || 'Updated';

    const rowsBefore = reports;
    const countBefore = newCount;

    // A row that no longer belongs in the section on screen leaves it; in Home
    // (no filter) it stays and just changes badge.
    setReports((rows) =>
      filter && filter !== status
        ? rows.filter((r) => r.id !== target.id)
        : rows.map((r) => (r.id === target.id ? { ...r, status } : r)),
    );
    if (countBefore !== null && (target.status === 'new') !== (status === 'new')) {
      setNewCount(Math.max(0, countBefore + (status === 'new' ? 1 : -1)));
    }
    closeDetail();

    toast(verb, {
      duration: UNDO_MS,
      action: {
        label: 'Undo',
        onClick: () => {
          cancelToast();
          setReports(rowsBefore);
          setNewCount(countBefore);
        },
      },
      // Written straight through rather than via send(), which would recurse
      // into flushToast(). keepalive keeps the request alive if the page is
      // closing; the list already shows the result, so success only needs to
      // refresh the badge - a failure resyncs everything.
      onExpire: async () => {
        let d;
        try {
          d = await apiJson('/admin/reports/' + target.id + '/status', {
            ...jsonBody({ status }),
            keepalive: true,
          });
        } catch {
          return; // 401 handled in api()
        }
        if (d && d.ok) {
          loadNewCount();
          return;
        }
        toast('Failed: ' + ((d && d.error) || 'error'));
        load();
      },
    });
  };
  const del = () => {
    if (!detail) return;
    const id = detail.id; // captured now - the dialog runs a render or two later
    setConfirmation({
      title: 'Delete report',
      message:
        'This permanently deletes the report, its attachments and its log. It cannot be undone.',
      confirmLabel: 'Delete report',
      icon: 'trash',
      danger: true,
      onConfirm: () => {
        setConfirmation(null);
        send('/admin/reports/' + id, { method: 'DELETE' }, () => {
          toast('Report deleted');
          closeDetail();
          load();
        });
      },
    });
  };

  // --- Promote ---
  const openPromote = () => {
    if (!detail) return;
    setPromoteForm({
      title: detail.summary || '',
      body: detail.description || '',
      labels: detail.category === 'feature' ? 'feature proposal' : 'bug',
    });
  };
  const createIssue = () => {
    if (!detail || !promoteForm) return;
    const labels = promoteForm.labels
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    send(
      '/admin/reports/' + detail.id + '/promote',
      jsonBody({ title: promoteForm.title.trim(), body: promoteForm.body, labels }),
      () => {
        toast('Issue created');
        setPromoteForm(null);
        closeDetail();
        load();
      },
    );
  };

  // --- Prune ---
  const selectWindow = async (w) => {
    setPrune({ window: w, count: null });
    let d;
    try {
      d = await apiJson('/admin/reports/prune?window=' + w);
    } catch {
      return;
    }
    setPrune({ window: w, count: d.count || 0 });
  };
  const doPrune = () => {
    if (!prune || !prune.window) return;
    const selection = prune;
    const { window: w, count } = selection;
    const n = count ?? 0;
    // Hand over to the confirmation rather than stacking on top of it; cancelling
    // puts the picker back exactly as it was.
    setPrune(null);
    setConfirmation({
      title: `Delete ${reportCount(n)}?`,
      message: `Every report from ${WINDOW_LABELS[w]} goes, whatever its status, along with its attachments and logs. This cannot be undone.`,
      confirmLabel: `Delete ${reportCount(n)}`,
      icon: 'trash',
      danger: true,
      onCancel: () => {
        setConfirmation(null);
        setPrune(selection);
      },
      onConfirm: () => {
        setConfirmation(null);
        send('/admin/reports/prune', jsonBody({ window: w }), (d) => {
          toast('Deleted ' + d.deleted);
          closeDetail();
          load();
        });
      },
    });
  };

  return {
    authed,
    themeMode,
    setThemeMode,
    reports,
    visibleReports: searchAndSort(reports, query, order),
    newCount,
    filter,
    changeFilter,
    order,
    toggleOrder,
    query,
    setQuery,
    busy,
    load,
    detail,
    detailBusy,
    selectedId,
    openDetail,
    closeDetail,
    changeStatus,
    del,
    openAttachment,
    downloadAttachment,
    openPromote,
    createIssue,
    viewer,
    closeViewer,
    promoteForm,
    setPromoteForm,
    prune,
    setPrune,
    selectWindow,
    doPrune,
    confirmation,
    cancelConfirmation,
    toastState,
    pauseToast,
    resumeToast,
    // connect gate
    sBase,
    setSBase,
    sKey,
    setSKey,
    connect,
    signOut,
  };
}
