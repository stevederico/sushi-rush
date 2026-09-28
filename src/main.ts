import './styles/base.css';
import './styles/hud.css';
import './styles/panels.css';
import './styles/screens.css';
import './styles/small.css';
import { installAnalytics } from './app/analytics.ts';
import { createApp } from './app/app.ts';

const app = createApp();
installAnalytics();

if (import.meta.env.DEV) {
  import('./app/debug.ts')
    .then((debug) => debug.installDebugTools(app))
    .catch((error: unknown) => console.error('Debug tools failed to load', error));
}
