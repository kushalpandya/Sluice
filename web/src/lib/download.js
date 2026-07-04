// Trigger a browser download of a Blob under a given filename.
export function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || 'attachment';
  a.click();
  URL.revokeObjectURL(url);
}
