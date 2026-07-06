import { useState, useEffect } from 'preact/hooks';
import { normalizeStatus } from '../lib/utils.js';
import { createApiClient, jsonBody } from '../lib/api.js';
import { createDemoApiClient } from '../demo/demoApi.js';
import { triggerDownload } from '../lib/download.js';
import { buildAttachmentView } from '../lib/attachmentView.js';
import { useTheme } from './useTheme.js';
import { useToast } from './useToast.js';
import { DEMO_MODE } from '../config.js';

// Orchestrates the triage session: auth/config, the reports list, the open
// report + its per-report actions (status, delete, attachments, promote), and
// prune. Self-contained concerns (theme, toast, the API client, downloads,
// attachment rendering) live in their own modules.
export function useTriage() {
  const [cfg, setCfg] = useState(() => ({
    base: localStorage.getItem('sluiceBase') || '',
    key: localStorage.getItem('sluiceKey') || '',
  }));
  const [reports, setReports] = useState([]);
  const [filter, setFilter] = useState('new');
  const [detail, setDetail] = useState(null);
  const [viewer, setViewer] = useState(null); // { att, kind, url? | text? }
  const [promoteForm, setPromoteForm] = useState(null);
  const [prune, setPrune] = useState(null);
  const [busy, setBusy] = useState(false);
  const [sort, setSort] = useState({ col: 'created', dir: 'desc' });
  const [sBase, setSBase] = useState(localStorage.getItem('sluiceBase') || '');
  const [sKey, setSKey] = useState('');

  const { themeMode, setThemeMode } = useTheme();
  const { toastMsg, toast } = useToast();

  const authed = DEMO_MODE || !!(cfg.base && cfg.key);

  const syncUrl = (status, id) => {
    const p = new URLSearchParams();
    if (status) p.set('status', status);
    if (id) p.set('id', id);
    const qs = p.toString();
    history.replaceState(null, '', qs ? '?' + qs : location.pathname);
  };

  const signOut = (msg) => {
    if (DEMO_MODE) {
      location.reload(); // demo state lives in memory only — reload resets it
      return;
    }
    localStorage.removeItem('sluiceKey');
    setCfg((c) => ({ base: c.base, key: '' }));
    setDetail(null);
    if (typeof msg === 'string' && msg) toast(msg);
  };

  const { api, apiJson } = DEMO_MODE ? createDemoApiClient() : createApiClient(cfg, signOut);

  // apiJson + ok-check + failure toast, for mutating admin calls.
  const send = async (path, opts, onOk) => {
    let d;
    try {
      d = await apiJson(path, opts);
    } catch {
      return;
    }
    if (d && d.ok) onOk(d);
    else toast('Failed: ' + ((d && d.error) || 'error'));
  };

  const load = async (f = filter) => {
    setBusy(true);
    try {
      const d = await apiJson(
        '/admin/reports?limit=200' + (f ? '&status=' + f : ''),
      );
      setReports(d.reports || []);
    } catch {
      /* 401 handled in api() */
    } finally {
      setBusy(false);
    }
  };
  const openDetail = async (id, status = filter) => {
    let d;
    try {
      d = await apiJson('/admin/reports/' + id);
    } catch {
      return;
    }
    if (!d.report) {
      toast('Report not found');
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

  // Central Escape handling for stacked modals (topmost first).
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'Escape') return;
      if (promoteForm) setPromoteForm(null);
      else if (viewer) closeViewer();
      else if (prune !== null) setPrune(null);
      else if (detail) closeDetail();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [promoteForm, viewer, prune, detail]);

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
    load(v);
    syncUrl(v, null);
  };
  const closeDetail = () => {
    setDetail(null);
    syncUrl(filter, null);
  };
  const toggleSort = (col) =>
    setSort((s) =>
      s.col === col
        ? { col, dir: s.dir === 'asc' ? 'desc' : 'asc' }
        : { col, dir: col === 'created' ? 'desc' : 'asc' },
    );

  const changeStatus = (status) => {
    if (!detail) return;
    const verb =
      status === 'archived'
        ? 'Archived'
        : status === 'spam'
          ? 'Marked spam'
          : detail.status === 'spam'
            ? 'Restored'
            : 'Unarchived';
    send('/admin/reports/' + detail.id + '/status', jsonBody({ status }), () => {
      toast(verb);
      closeDetail();
      load();
    });
  };
  const del = () => {
    if (!detail) return;
    if (
      !confirm(
        'Permanently delete this report and its log? This cannot be undone.',
      )
    )
      return;
    send('/admin/reports/' + detail.id, { method: 'DELETE' }, () => {
      toast('Report deleted');
      closeDetail();
      load();
    });
  };

  // --- Attachments ---
  const fetchAttachment = async (att) => {
    if (!detail) return null;
    let res;
    try {
      res = await api('/admin/reports/' + detail.id + '/attachments/' + att.id);
    } catch {
      return null;
    }
    if (!res.ok) {
      toast('Attachment not found');
      return null;
    }
    return res;
  };
  const closeViewer = () => {
    setViewer((v) => {
      if (v && v.url) URL.revokeObjectURL(v.url);
      return null;
    });
  };
  const downloadAttachment = async (att) => {
    const res = await fetchAttachment(att);
    if (res) triggerDownload(await res.blob(), att.name);
  };
  // Open an attachment inline, rendering by content type; falls back to download.
  const openAttachment = async (att) => {
    const res = await fetchAttachment(att);
    if (!res) return;
    const view = await buildAttachmentView(res, att);
    if (!view) return; // a download was triggered
    if (view.error) {
      toast(view.error);
      return;
    }
    setViewer(view);
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
    if (!confirm('This is irreversible. Continue?')) return;
    send('/admin/reports/prune', jsonBody({ window: prune.window }), (d) => {
      toast('Deleted ' + d.deleted);
      setPrune(null);
      load();
    });
  };

  const sortedReports = [...reports].sort((a, b) => {
    const av = a[sort.col];
    const bv = b[sort.col];
    const cmp =
      typeof av === 'number' || typeof bv === 'number'
        ? (av || 0) - (bv || 0)
        : String(av ?? '').localeCompare(String(bv ?? ''));
    return sort.dir === 'asc' ? cmp : -cmp;
  });

  return {
    authed,
    themeMode,
    setThemeMode,
    reports,
    sortedReports,
    filter,
    changeFilter,
    sort,
    toggleSort,
    busy,
    load,
    detail,
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
    toastMsg,
    // connect gate
    sBase,
    setSBase,
    sKey,
    setSKey,
    connect,
    signOut,
  };
}
