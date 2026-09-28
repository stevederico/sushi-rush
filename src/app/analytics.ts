/**
 * Loads the page view tracker when the build was given one.
 * Set VITE_ANALYTICS_SRC and VITE_ANALYTICS_ID at build time to turn it on.
 * Without both, nothing is loaded and the game makes no network requests.
 */
export function installAnalytics(): void {
  const src: unknown = import.meta.env.VITE_ANALYTICS_SRC;
  const id: unknown = import.meta.env.VITE_ANALYTICS_ID;
  if (typeof src !== 'string' || typeof id !== 'string' || src === '' || id === '') return;
  const script = document.createElement('script');
  script.defer = true;
  script.src = src;
  script.dataset.websiteId = id;
  script.addEventListener('error', () => console.error('The analytics script failed to load', src));
  document.head.appendChild(script);
}
