// Decap CMS GitHub OAuth gateway — Cloudflare Worker.
// Flow: /auth redirects to GitHub; GitHub redirects back to /callback with a
// code; we exchange it for an access token and post it back to the CMS window.

const GITHUB_AUTHORIZE = 'https://github.com/login/oauth/authorize';
const GITHUB_TOKEN = 'https://github.com/login/oauth/access_token';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/auth') {
      const params = new URLSearchParams({
        client_id: env.GITHUB_CLIENT_ID,
        redirect_uri: `${url.origin}/callback`,
        scope: 'repo,user'
      });
      return Response.redirect(`${GITHUB_AUTHORIZE}?${params}`, 302);
    }

    if (url.pathname === '/callback') {
      const code = url.searchParams.get('code');
      if (!code) {
        return new Response('Missing code', { status: 400 });
      }

      const tokenResponse = await fetch(GITHUB_TOKEN, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify({
          client_id: env.GITHUB_CLIENT_ID,
          client_secret: env.GITHUB_CLIENT_SECRET,
          code
        })
      });

      const data = await tokenResponse.json();
      if (!data.access_token) {
        return new Response(`OAuth error: ${data.error_description ?? 'unknown'}`, { status: 401 });
      }

      // Hand the token back to Decap CMS via postMessage.
      const message = JSON.stringify({ token: data.access_token, provider: 'github' });
      const html = `<!doctype html><html><body><script>
        (function () {
          function receiveMessage(e) {
            window.opener.postMessage(
              'authorization:github:success:${message}',
              e.origin
            );
            window.removeEventListener('message', receiveMessage, false);
          }
          window.addEventListener('message', receiveMessage, false);
          window.opener.postMessage('authorizing:github', '*');
        })();
      </script></body></html>`;

      return new Response(html, {
        headers: { 'Content-Type': 'text/html;charset=UTF-8' }
      });
    }

    return new Response('Not found', { status: 404 });
  }
};
