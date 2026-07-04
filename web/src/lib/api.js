// Admin API client bound to a config ({ base, key }) + a 401 handler. Recreated
// per render in useTriage (cheap — two closures), so it always sees the current
// config and sign-out callback.
export function createApiClient(cfg, onUnauthorized) {
  const api = async (path, opts = {}) => {
    const res = await fetch(cfg.base + path, {
      ...opts,
      headers: { ...(opts.headers || {}), Authorization: 'Bearer ' + cfg.key },
    });
    if (res.status === 401) {
      onUnauthorized('Unauthorized — check your admin key.');
      throw new Error('401');
    }
    return res;
  };
  const apiJson = async (path, opts) => (await api(path, opts)).json();
  return { api, apiJson };
}

// Build a JSON POST init object.
export function jsonBody(b) {
  return {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(b),
  };
}
