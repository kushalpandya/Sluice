import { triggerDownload } from './download.js';

// Given a fetched attachment Response + its metadata, decide how to present it:
//   - returns a viewer descriptor ({ att, kind, url }  or  { att, kind:'text', text })
//     for inline rendering,
//   - returns null after triggering a download (when the type isn't previewable),
//   - returns { error } if decoding fails.
// The Response body is consumed exactly once.
export async function buildAttachmentView(res, att) {
  const ct = (att.content_type || '').toLowerCase();
  const name = (att.name || '').toLowerCase();

  if (ct.startsWith('image/'))
    return { att, kind: 'image', url: URL.createObjectURL(await res.blob()) };
  if (ct.startsWith('audio/'))
    return { att, kind: 'audio', url: URL.createObjectURL(await res.blob()) };
  if (ct.startsWith('video/'))
    return { att, kind: 'video', url: URL.createObjectURL(await res.blob()) };

  if (ct === 'application/gzip' || ct === 'application/x-gzip' || name.endsWith('.gz')) {
    // Gzipped text (e.g. a log) — decompress in-browser, else fall back to download.
    if (typeof DecompressionStream === 'undefined' || !res.body) {
      triggerDownload(await res.blob(), att.name);
      return null;
    }
    try {
      const text = await new Response(
        res.body.pipeThrough(new DecompressionStream('gzip')),
      ).text();
      return { att, kind: 'text', text: text || '(empty)' };
    } catch {
      return { error: 'Could not read attachment' };
    }
  }

  if (ct.startsWith('text/') || ct === 'application/json')
    return { att, kind: 'text', text: (await res.text()) || '(empty)' };

  // Anything else: download.
  triggerDownload(await res.blob(), att.name);
  return null;
}
