// Local stand-in for `vercel dev` that needs no Vercel account or login.
// Serves the static files and routes /api/contact through the real
// api/contact.js, emulating the parts of Vercel's Node request/response
// contract that the function relies on. The function is re-required per
// request, so edits are picked up without a restart.
//
//   node dev-server.js [--port 3000] [--mock-email]
//
// --mock-email stubs the outbound Resend call and prints the message that would
// have been sent, so the whole flow can be exercised without an API key.

const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const argv = process.argv.slice(2);
const PORT = Number(argv[argv.indexOf('--port') + 1]) || 3000;
const MOCK_EMAIL = argv.includes('--mock-email');

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.png': 'image/png',
  '.webp': 'image/webp', '.json': 'application/json', '.svg': 'image/svg+xml',
};

if (MOCK_EMAIL) {
  process.env.RESEND_API_KEY = process.env.RESEND_API_KEY || 'mock_key_for_local_dev';
  const realFetch = global.fetch;
  global.fetch = async (url, opts = {}) => {
    if (String(url).includes('api.resend.com')) {
      const body = JSON.parse(opts.body);
      console.log('\n  ---- email that would be sent ----');
      console.log(`  from:     ${body.from}`);
      console.log(`  to:       ${body.to.join(', ')}`);
      console.log(`  reply-to: ${body.reply_to}`);
      console.log(`  subject:  ${body.subject}`);
      console.log(body.text.split('\n').map((l) => '  | ' + l).join('\n'));
      console.log('  ----------------------------------\n');
      return { ok: true, status: 200, text: async () => '{"id":"mock"}' };
    }
    return realFetch(url, opts);
  };
}

function readBody(req) {
  return new Promise((resolve) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8');
      const type = String(req.headers['content-type'] || '');
      if (!raw) return resolve(undefined);
      // Vercel parses JSON and urlencoded bodies into req.body for you.
      if (type.includes('application/json')) {
        try { return resolve(JSON.parse(raw)); } catch { return resolve(raw); }
      }
      if (type.includes('application/x-www-form-urlencoded')) {
        return resolve(Object.fromEntries(new URLSearchParams(raw)));
      }
      resolve(raw);
    });
  });
}

// The subset of the Vercel response helpers api/contact.js uses.
function shimResponse(res) {
  let status = 200;
  const api = {
    status(code) { status = code; return api; },
    setHeader(k, v) { res.setHeader(k, v); return api; },
    json(body) {
      res.writeHead(status, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(body));
      return api;
    },
    send(body) {
      if (!res.hasHeader('Content-Type')) res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.writeHead(status);
      res.end(body);
      return api;
    },
  };
  return api;
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const started = Date.now();
  const log = (code) => console.log(
    `  ${req.method} ${url.pathname} -> ${code} (${Date.now() - started}ms)`);

  if (url.pathname === '/api/contact') {
    // Required fresh each time so edits to the function are picked up.
    delete require.cache[require.resolve(path.join(ROOT, 'api/contact.js'))];
    const handler = require(path.join(ROOT, 'api/contact.js'));
    req.body = await readBody(req);
    const shim = shimResponse(res);
    const origStatus = shim.status;
    shim.status = (c) => { log(c); return origStatus(c); };
    try {
      await handler(req, shim);
    } catch (err) {
      console.error('  function threw:', err);
      if (!res.headersSent) { res.writeHead(500); res.end('function error'); }
    }
    return;
  }

  const rel = url.pathname === '/' ? '/index.html' : url.pathname;
  const file = path.join(ROOT, path.normalize(rel).replace(/^(\.\.[/\\])+/, ''));
  if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    log(404);
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    return res.end('Not found');
  }
  log(200);
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`\n  Dev server: http://localhost:${PORT}`);
  console.log(`  Static root: ${ROOT}`);
  console.log(`  /api/contact -> api/contact.js`);
  console.log(`  Email: ${MOCK_EMAIL ? 'MOCKED (printed below)' :
    process.env.RESEND_API_KEY ? 'live via Resend' : 'not configured (RESEND_API_KEY unset)'}\n`);
});
