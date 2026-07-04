import { PRODUCT_NAME, DEFAULT_BASE } from '../config.js';

export function Connect({ base, setBase, adminKey, setKey, connect }) {
  return (
    <section class="section">
      <div class="container" style="max-width:480px">
        <div class="box">
          <h1 class="title is-4">{PRODUCT_NAME}</h1>
          <p class="subtitle is-6">Connect to your triage Worker.</p>
          <div class="field">
            <label class="label">Worker base URL</label>
            <div class="control">
              <input
                class="input"
                value={base}
                onInput={(e) => setBase(e.target.value)}
                placeholder={DEFAULT_BASE || 'https://your-worker.workers.dev'}
              />
            </div>
          </div>
          <div class="field">
            <label class="label">Admin key</label>
            <div class="control">
              <input
                class="input"
                type="password"
                value={adminKey}
                onInput={(e) => setKey(e.target.value)}
                placeholder="ADMIN_KEY"
              />
            </div>
          </div>
          <button class="button is-primary" onClick={connect}>Connect</button>
          <p class="help">Stored in this browser's localStorage only.</p>
        </div>
      </div>
    </section>
  );
}
