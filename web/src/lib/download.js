// Trigger a browser download of a Blob under a given filename. The anchor is
// attached before clicking and the URL is revoked on the next tick: revoking in
// the same tick races the browser's read of the blob and aborts the download in
// some engines.
export function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || 'attachment';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
