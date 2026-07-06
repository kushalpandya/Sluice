import { icon } from '../lib/format.jsx';
import { DEMO_BANNER } from '../config.js';

export function DemoBanner() {
  return (
    <div class="demo-banner">
      {icon('flask')}
      <span>{DEMO_BANNER}</span>
    </div>
  );
}
