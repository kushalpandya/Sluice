import { Modal } from './Modal.jsx';
import { Split } from './Split.jsx';
import { Tag } from './Tag.jsx';
import { icon, label } from '../lib/format.jsx';
import { when } from '../lib/utils.js';

function attIcon(ct = '') {
  ct = ct.toLowerCase();
  if (ct.startsWith('image/')) return 'image';
  if (ct.startsWith('audio/')) return 'music';
  if (ct.startsWith('video/')) return 'film';
  if (ct.startsWith('text/') || ct.includes('json') || ct.includes('gzip')) return 'file-lines';
  return 'file';
}

function formatSize(n = 0) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

export function ReportDetail({
  detail,
  onClose,
  onOpenAttachment,
  onDownloadAttachment,
  onDelete,
  onStatus,
  onPromote,
}) {
  let meta = '(none)';
  if (detail && detail.metadata) {
    try {
      meta = JSON.stringify(JSON.parse(detail.metadata), null, 2);
    } catch {
      meta = detail.metadata;
    }
  }

  const attachments = (detail && detail.attachments) || [];

  const body = detail && (
    <>
      <dl class="kv">
        <dt>ID</dt>
        <dd class="has-text-grey">{detail.id}</dd>
        <dt>Installation ID</dt>
        <dd class="has-text-grey">{detail.installation_id}</dd>
        <dt>Report Date</dt>
        <dd>{when(detail.created)}</dd>
        <dt>From</dt>
        <dd><a href={"mailto:" + detail.email }>{detail.email}</a></dd>
        <dt>App</dt>
        <dd>{detail.app_version || '—'}</dd>
        <dt>OS</dt>
        <dd>{detail.os_version || '—'}</dd>
        <dt>Type</dt>
        <dd>
          <Tag v={detail.category} />
          {detail.status !== 'new' ? (
            <>
              {' '}
              <Tag v={detail.status} />
            </>
          ) : (
            ''
          )}
        </dd>
        {detail.github_url ? (
          <>
            <dt>Issue</dt>
            <dd>
              <a href={detail.github_url} target="_blank">
                {detail.github_url}
              </a>
            </dd>
          </>
        ) : (
          ''
        )}
      </dl>
      <div class="field">
        <label class="label is-small">Title</label>
        <p>{detail.summary}</p>
      </div>
      <div class="field">
        <label class="label is-small">Description</label>
        <pre class="desc-box">{detail.description}</pre>
      </div>
      {attachments.length > 0 && (
        <div class="field">
          <label class="label is-small">Attachments</label>
          <div class="attachments">
            {attachments.map((a) => (
              <div class="attachment-row" key={a.id}>
                <span class="icon-text attachment-name">
                  {icon(attIcon(a.content_type))}
                  <span>{a.name}</span>
                </span>
                <span class="attachment-meta has-text-grey">{formatSize(a.size)}</span>
                <div class="attachment-actions">
                  <button
                    class="button is-small"
                    onClick={() => onOpenAttachment(a)}
                  >
                    {label('eye', 'View')}
                  </button>
                  <button
                    class="button is-primary is-outlined is-small"
                    title="Download"
                    aria-label="Download"
                    onClick={() => onDownloadAttachment(a)}
                  >
                    {icon('download')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      <details>
        <summary class="has-text-weight-semibold">Metadata</summary>
        <pre class="mt-2">{meta}</pre>
      </details>
    </>
  );

  const footer = detail && (
    <>
      <button class="button is-danger is-outlined" onClick={onDelete}>
        {label('trash', 'Delete')}
      </button>
      <span class="spacer"></span>
      {detail.status === 'spam' ? (
        <button class="button" onClick={() => onStatus('new')}>
          Not spam
        </button>
      ) : detail.status === 'archived' ? (
        <button class="button" onClick={() => onStatus('new')}>
          Unarchive
        </button>
      ) : (
        <Split
          color="is-primary"
          align="right"
          primary={{
            label: label('github', 'Promote as issue', 'fab'),
            onClick: onPromote,
          }}
          items={[
            {
              label: label('box-archive', 'Archive'),
              onClick: () => onStatus('archived'),
            },
            {
              label: label('ban', 'Mark as spam'),
              onClick: () => onStatus('spam'),
            },
          ]}
        />
      )}
    </>
  );

  return (
    <Modal open={!!detail} onClose={onClose} title="Report" footer={footer}>
      {body}
    </Modal>
  );
}
