import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
import App from './App.jsx';
import { SeoCollectorContext, renderSeoHead } from './lib/seo.js';

/**
 * Рендерит маршрут в статический HTML на этапе сборки (см. scripts/prerender.js).
 *
 * StrictMode здесь намеренно нет: он рендерит дерево дважды, что для одноразового
 * renderToString — только двойная работа. На клиенте (main.jsx) он остаётся.
 *
 * @param {string} url путь маршрута, например '/landing/finance'
 * @returns {{ html: string, head: string }} разметка для <div id="root"> и теги для <head>
 */
export function render(url) {
  const collector = {};

  const html = renderToString(
    <SeoCollectorContext.Provider value={collector}>
      <StaticRouter location={url}>
        <App />
      </StaticRouter>
    </SeoCollectorContext.Provider>,
  );

  return { html, head: renderSeoHead(collector.seo) };
}
