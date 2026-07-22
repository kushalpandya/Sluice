import { Modal } from './Modal.jsx';
import { Icon } from './Icon.jsx';
import { formatSize } from '../lib/utils.js';

// Renders one attachment inline by kind (set in useTriage.openAttachment).
function Body({ viewer }) {
  switch (viewer.kind) {
    case 'image':
      return (
        <img
          src={viewer.url}
          alt={viewer.att.name}
          class="mx-auto block max-h-[70vh] max-w-full rounded-lg"
        />
      );
    case 'audio':
      return <audio src={viewer.url} controls class="w-full" />;
    case 'video':
      return (
        <video src={viewer.url} controls class="mx-auto block max-h-[70vh] max-w-full rounded-lg" />
      );
    case 'text':
      return (
        <pre class="max-h-[60vh] overflow-auto rounded-lg border border-line bg-subtle p-3 font-mono text-xs whitespace-pre">
          {viewer.text}
        </pre>
      );
    default:
      return <p class="text-sm text-ink-soft">Cannot preview this attachment. Use Download.</p>;
  }
}

export function AttachmentViewer({ viewer, onClose, onDownload }) {
  const att = viewer && viewer.att;
  const footer = att && (
    <>
      <button class="btn" onClick={() => onDownload(att)}>
        <Icon name="download" size={15} />
        Download
      </button>
    </>
  );
  return (
    <Modal
      open={!!viewer}
      onClose={onClose}
      title={att ? att.name : 'Attachment'}
      subtitle={att ? `${att.content_type || 'unknown type'} · ${formatSize(att.size)}` : ''}
      footer={footer}
      wide
    >
      {viewer && <Body viewer={viewer} />}
    </Modal>
  );
}
