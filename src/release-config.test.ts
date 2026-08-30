import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const staticWebAppConfig = JSON.parse(readFileSync(new URL('../public/staticwebapp.config.json', import.meta.url), 'utf8')) as {
  globalHeaders: Record<string, string>;
  responseOverrides: Record<string, { rewrite: string; statusCode: number }>;
  routes: Array<{ route: string; headers?: Record<string, string>; rewrite?: string }>;
};

describe('static release response policy', () => {
  it('revalidates the unversioned service worker before immutable JavaScript rules apply', () => {
    const workerRoute = staticWebAppConfig.routes.find((route) => route.route === '/sw.js');
    const broadJavaScriptRoute = staticWebAppConfig.routes.find((route) => route.route === '/*.js');

    expect(workerRoute?.headers?.['Cache-Control']).toBe('no-cache');
    expect(staticWebAppConfig.routes.indexOf(workerRoute!)).toBeLessThan(staticWebAppConfig.routes.indexOf(broadJavaScriptRoute!));
    expect(broadJavaScriptRoute?.headers?.['Cache-Control']).toContain('immutable');
  });

  it('rewrites only known application routes and returns a real 404 for unknown paths', () => {
    expect(staticWebAppConfig.routes.find((route) => route.route === '/privacy')?.rewrite).toBe('/index.html');
    expect(staticWebAppConfig.routes.find((route) => route.route === '/terms')?.rewrite).toBe('/index.html');
    expect(staticWebAppConfig.responseOverrides['404']).toEqual({ rewrite: '/404.html', statusCode: 404 });
  });

  it('permits only the production billing origin in the deployed CSP', () => {
    const csp = staticWebAppConfig.globalHeaders['Content-Security-Policy'];
    expect(csp).toContain('https://api.sociobot.in');
    expect(csp).not.toContain('pilot-api.sociobot.in');
  });
});
