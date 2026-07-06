import { COLUMNS } from '../lib/constants.js';
import { whenDate } from '../lib/utils.js';
import { icon } from '../lib/format.jsx';
import { Tag } from './Tag.jsx';
import { StatusIndicator } from './StatusIndicator.jsx';

// On desktop this is a sortable table; below the mobile breakpoint `styles.css`
// restyles each row into a stacked card using the `data-label` attributes.
export function ReportsTable({ rows, sort, toggleSort, openDetail, count }) {
  return (
    <section class="section pt-4">
      <div class="container">
        <table class="table is-striped is-hoverable is-fullwidth reports-table">
          <thead>
            <tr>
              {COLUMNS.map(([col, lbl]) => (
                <th
                  key={col}
                  style="cursor:pointer;user-select:none"
                  onClick={() => toggleSort(col)}
                >
                  {lbl}
                  {sort.col === col
                    ? icon(sort.dir === 'asc' ? 'caret-up' : 'caret-down')
                    : ''}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr
                key={r.id}
                onClick={() => openDetail(r.id)}
                class={r.status === 'spam' || r.status === 'archived' ? 'is-dimmed' : ''}
              >
                <td data-label="Received" class="has-text-grey">
                  {whenDate(r.created)}
                </td>
                <td data-label="Type">
                  <Tag v={r.category} rounded />
                </td>
                <td data-label="Summary">{r.summary}</td>
                <td data-label="From" class="has-text-grey">{r.email}</td>
                <td data-label="Files">
                  {r.attachment_count > 0 ? (
                    <span class="icon-text">
                      {icon('paperclip')}
                      <span>{r.attachment_count}</span>
                    </span>
                  ) : null}
                </td>
                <td data-label="Status">
                  <StatusIndicator v={r.status} />
                  {r.github_url ? (
                    <>
                      {' '}
                      <a
                        href={r.github_url}
                        target="_blank"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {icon('arrow-up-right-from-square')}
                      </a>
                    </>
                  ) : (
                    ''
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {count === 0 ? (
          <p class="has-text-centered has-text-grey py-6">No reports.</p>
        ) : (
          ''
        )}
      </div>
    </section>
  );
}
