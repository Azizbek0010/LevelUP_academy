/**
 * GA4 helpers for a prerendered SPA.
 *
 * The site is a React Router SPA: after the first load, navigation swaps the view
 * without a full page reload, so GA4's automatic page_view fires only once. We set
 * `send_page_view: false` in index.html and emit every page_view manually here
 * (including the first), which keeps counts correct and paths accurate.
 *
 * All calls are guarded: during prerender (Node, no window) and before gtag has
 * loaded they no-op instead of throwing.
 */
function gtagReady() {
  return typeof window !== 'undefined' && typeof window.gtag === 'function';
}

/** One SPA page view. Call on every route change (and on first mount). */
export function trackPageView(path) {
  if (!gtagReady()) return;
  window.gtag('event', 'page_view', {
    page_path: path,
    page_location: window.location.href,
    page_title: document.title,
  });
}

/** Arbitrary GA4 event — used for conversions (e.g. generate_lead). */
export function trackEvent(name, params = {}) {
  if (!gtagReady()) return;
  window.gtag('event', name, params);
}
