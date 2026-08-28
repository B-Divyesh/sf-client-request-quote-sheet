import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const staticWebAppConfig = JSON.parse(readFileSync(new URL('../public/staticwebapp.config.json', import.meta.url), 'utf8')) as {
  globalHeaders: Record<string, string>;
  routes: Array<{ route: string; headers: Record<string, string> }>;
};

describe('static release response policy', () => {
  it('revalidates the unversioned service worker before immutable JavaScript rules apply', () => {
    const workerRoute = staticWebAppConfig.routes.find((route) => route.route === '/sw.js');
    const broadJavaScriptRoute = staticWebAppConfig.routes.find((route) => route.route === '/*.js');

    expect(workerRoute?.headers['Cache-Control']).toBe('no-cache');
    expect(staticWebAppConfig.routes.indexOf(workerRoute!)).toBeLessThan(staticWebAppConfig.routes.indexOf(broadJavaScriptRoute!));
    expect(broadJavaScriptRoute?.headers['Cache-Control']).toContain('immutable');
  });

  it('permits only the production billing origin in the deployed CSP', () => {
    const csp = staticWebAppConfig.globalHeaders['Content-Security-Policy'];
    expect(csp).toContain('https://api.sociobot.in');
    expect(csp).not.toContain('pilot-api.sociobot.in');
  });
});
