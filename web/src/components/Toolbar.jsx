import { icon } from '../lib/format.jsx';
import { PRODUCT_NAME } from '../config.js';

export function Toolbar({ filter, changeFilter, busy, onRefresh, onPrune, onSignOut }) {
  return (
    <section class="section pb-0">
      <div class="container">
        <div class="toolbar">
          <span class="title is-5 toolbar-title">{PRODUCT_NAME}</span>
          <div class="toolbar-actions">
            <div class="select">
              <select value={filter} onChange={(e) => changeFilter(e.target.value)}>
                <option value="new">New</option>
                <option value="promoted">Promoted</option>
                <option value="spam">Spam</option>
                <option value="archived">Archived</option>
                <option value="">All</option>
              </select>
            </div>
            <button
              class={'button' + (busy ? ' is-loading' : '')}
              title="Refresh"
              aria-label="Refresh"
              onClick={onRefresh}
            >
              {icon('arrows-rotate')}
            </button>
            <button
              class="button is-danger is-outlined"
              title="Prune"
              aria-label="Prune"
              onClick={onPrune}
            >
              {icon('trash-can')}
            </button>
            <button
              class="button"
              title="Sign out"
              aria-label="Sign out"
              onClick={onSignOut}
            >
              {icon('right-from-bracket')}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
