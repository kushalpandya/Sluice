import { Modal } from './Modal.jsx';
import { label } from '../lib/format.jsx';

// Renders one attachment inline by kind (set in useTriage.openAttachment).
function Body({ viewer }) {
  switch (viewer.kind) {
    case 'image':
      return (
        <img
          src={viewer.url}
          alt={viewer.att.name}
          style="max-width:100%;max-height:70vh;display:block;margin:0 auto"
        />
      );
    case 'audio':
      return <audio src={viewer.url} controls style="width:100%" />;
    case 'video':
      return (
        <video
          src={viewer.url}
          controls
          style="max-width:100%;max-height:70vh;display:block;margin:0 auto"
        />
      );
    case 'text':
      return <pre class="desc-box" style="height:60vh">{viewer.text}</pre>;
    default:
      return <p>Cannot preview this attachment. Use Download.</p>;
  }
}

export function AttachmentViewer({ viewer, onClose, onDownload }) {
  const att = viewer && viewer.att;
  const footer = att && (
    <>
      <span class="spacer"></span>
      <button class="button" onClick={() => onDownload(att)}>
        {label('download', 'Download')}
      </button>
    </>
  );
  return (
    <Modal
      open={!!viewer}
      onClose={onClose}
      title={att ? att.name : 'Attachment'}
      footer={footer}
    >
      {viewer && <Body viewer={viewer} />}
    </Modal>
  );
}
