import { PRODUCT_NAME, DEFAULT_BASE } from '../config.js';
import { Icon } from './Icon.jsx';
import { Logo } from './Logo.jsx';

// Sign-in gate: the Worker base URL + admin key, held in this browser only.
export function Connect({ base, setBase, adminKey, setKey, connect }) {
  const onKeyDown = (e) => {
    if (e.key === 'Enter') connect();
  };

  return (
    <div class="flex min-h-full items-center justify-center px-4 py-10">
      <div class="w-full max-w-sm">
        <div class="mb-6 flex flex-col items-center text-center">
          <Logo size={48} />
          <h1 class="mt-3 text-xl font-semibold">{PRODUCT_NAME}</h1>
          <p class="mt-1 text-sm text-ink-soft">Sign in to your triage Worker.</p>
        </div>

        <div class="rounded-2xl border border-line bg-surface p-5 shadow-sm">
          <div class="mb-4">
            <label class="field-label" for="connect-base">
              Worker base URL
            </label>
            <input
              id="connect-base"
              class="field-input"
              value={base}
              onInput={(e) => setBase(e.target.value)}
              onKeyDown={onKeyDown}
              autocomplete="url"
              spellcheck={false}
              placeholder={DEFAULT_BASE || 'https://your-worker.workers.dev'}
            />
          </div>
          <div class="mb-5">
            <label class="field-label" for="connect-key">
              Admin key
            </label>
            <input
              id="connect-key"
              class="field-input"
              type="password"
              value={adminKey}
              onInput={(e) => setKey(e.target.value)}
              onKeyDown={onKeyDown}
              autocomplete="current-password"
              placeholder="ADMIN_KEY"
            />
          </div>
          <button class="btn btn-primary w-full py-2" onClick={connect}>
            Connect
          </button>
          <p class="mt-3 flex items-center justify-center gap-1.5 text-xs text-ink-soft">
            <Icon name="lock" size={12} />
            Stored in this browser's localStorage only.
          </p>
        </div>
      </div>
    </div>
  );
}
