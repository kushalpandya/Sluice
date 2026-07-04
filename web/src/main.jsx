import { render } from 'preact';
import { App } from './App.jsx';

// Third-party styles, bundled from npm (no CDN — the page is fully self-contained
// so it works behind Cloudflare Access with no external-host allowances).
// Bulma is pulled in (and themed) from source inside styles.scss.
import '@fortawesome/fontawesome-free/css/all.min.css';
import './styles.scss';

render(<App />, document.getElementById('root'));
