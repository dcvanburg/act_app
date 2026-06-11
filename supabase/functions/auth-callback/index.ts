/**
 * HTTPS bridge for magic-link emails.
 *
 * Supabase redirects here after the user taps the email link. Mobile browsers
 * cannot reliably open actapp:// directly, so this page shows an explicit
 * "Open de app" button that hands off to the native deep link.
 *
 * Deploy: supabase functions deploy auth-callback --no-verify-jwt
 * Add to Supabase → Auth → Redirect URLs:
 *   https://<project>.supabase.co/functions/v1/auth-callback
 */

const APP_CALLBACK_BASE = Deno.env.get('APP_CALLBACK_BASE') ?? 'actapp://auth/callback';

function buildAppUrl(incoming: URL): string {
  const suffix = `${incoming.search}${incoming.hash}`;
  if (!suffix) return APP_CALLBACK_BASE;
  if (APP_CALLBACK_BASE.includes('?')) {
    const join = incoming.search ? '&' + incoming.search.slice(1) : '';
    return `${APP_CALLBACK_BASE}${join}${incoming.hash}`;
  }
  return `${APP_CALLBACK_BASE}${suffix}`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function renderPage(appUrl: string): string {
  const safeHref = escapeHtml(appUrl);
  const safeJs = JSON.stringify(appUrl);

  return `<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Inloggen</title>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      background: #F5F0E8;
      color: #1a1a18;
    }
    main {
      width: 100%;
      max-width: 400px;
      background: #fff;
      border-radius: 16px;
      padding: 32px 24px;
      text-align: center;
      box-shadow: 0 2px 12px rgba(0,0,0,0.08);
    }
    h1 { font-size: 1.5rem; margin: 0 0 12px; }
    p { color: #555550; line-height: 1.5; margin: 0 0 24px; }
    a {
      display: inline-block;
      width: 100%;
      padding: 14px 20px;
      background: #3B6D11;
      color: #fff;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      font-size: 1rem;
    }
    a:active { background: #2d520d; }
    .hint { margin-top: 20px; font-size: 0.85rem; color: #888780; }
  </style>
</head>
<body>
  <main>
    <h1>Bijna ingelogd</h1>
    <p>Tik op de knop om terug te gaan naar de app en je sessie te voltooien.</p>
    <a id="open-app" href="${safeHref}">Open de app</a>
    <p class="hint">Werkt de knop niet? Open de app handmatig — je bent dan al ingelogd.</p>
  </main>
  <script>
    (function () {
      var appUrl = ${safeJs};
      var link = document.getElementById('open-app');
      link.addEventListener('click', function (e) {
        e.preventDefault();
        window.location.href = appUrl;
      });
    })();
  </script>
</body>
</html>`;
}

Deno.serve((req) => {
  const incoming = new URL(req.url);
  const appUrl = buildAppUrl(incoming);

  return new Response(renderPage(appUrl), {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
});
