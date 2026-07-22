import { useState } from 'preact/hooks';
import { triggerDownload } from '../lib/download.js';
import { buildAttachmentView } from '../lib/attachmentView.js';

// Viewing and downloading one report's attachments. Self-contained: its only
// ties to the session are the API client, the toast, and which report is open.
// The viewer descriptor is { att, kind, url? | text? } - see attachmentView.js.
export function useAttachments({ api, toast, reportId }) {
  const [viewer, setViewer] = useState(null);

  const fetchAttachment = async (att) => {
    if (!reportId) return null;
    let res;
    try {
      res = await api('/admin/reports/' + reportId + '/attachments/' + att.id);
    } catch {
      return null; // 401 handled in api()
    }
    if (!res.ok) {
      toast('Attachment not found');
      return null;
    }
    return res;
  };

  // Object URLs are minted in buildAttachmentView and revoked here, so every
  // viewer that opens releases its blob when it closes.
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
    if (!view) return; // a download was triggered instead
    if (view.error) {
      toast(view.error);
      return;
    }
    closeViewer(); // release a previously open viewer's URL before replacing it
    setViewer(view);
  };

  return { viewer, openAttachment, downloadAttachment, closeViewer };
}
