import { icon } from '../lib/format.jsx';
import { DEMO_BANNER, REPO_URL } from '../config.js';

export function DemoBanner() {
  return (
    <div class="demo-banner">
      {icon('flask')}
      <span>{DEMO_BANNER}</span>
      {REPO_URL && (
        <a class="demo-banner-repo" href={REPO_URL} target="_blank" rel="noopener noreferrer">
          {icon('github', 'fab')}
          <span>View on GitHub</span>
        </a>
      )}
    </div>
  );
}
