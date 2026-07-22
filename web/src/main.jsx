import { render } from 'preact';
import { App } from './App.jsx';

// Styles are bundled from npm (no CDN - the page is fully self-contained so it
// works behind Cloudflare Access with no external-host allowances). Tailwind and
// the theme tokens are pulled in from styles.css; icons are inline SVG.
import './styles.css';

render(<App />, document.getElementById('root'));
