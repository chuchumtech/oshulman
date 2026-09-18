'use strict';

// Vercel Serverless Function backing the contact form.
//
// Netlify used to capture form submissions itself; on Vercel that has to be
// handled by code, so this endpoint validates the submission and emails it on
// via Resend (https://resend.com) using plain fetch — no dependencies, so the
// project still needs no build step.
//
// Environment variables, set in the Vercel project (Settings -> Environment
// Variables), never committed here:
//
//   RESEND_API_KEY  required. API key from the Resend dashboard.
//   CONTACT_TO      optional. Where enquiries are delivered.
//   CONTACT_FROM    optional. Sender address, on a domain verified in Resend.
//
// After changing any of them, redeploy so the new values are picked up.

const DEFAULT_TO = 'osher@oshershulman.com';
const DEFAULT_FROM = 'Osher Shulman Website <noreply@oshershulman.com>';

const LIMITS = { name: 100, email: 254, message: 5000 };
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function readField(body, key) {
  const value = body && body[key];
  return typeof value === 'string' ? value.trim() : '';
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

function parseBody(body) {
  if (!body) return {};
  if (typeof body === 'object') return body;
  try {
    return JSON.parse(body);
  } catch (err) {
    return Object.fromEntries(new URLSearchParams(body));
  }
}

function validate(fields) {
  const problems = [];
  if (!fields.name) problems.push('a name');
  if (!fields.email) problems.push('an email address');
  if (!fields.message) problems.push('a message');
  if (problems.length) {
    return `Please provide ${problems.join(', ')}.`;
  }
  if (!EMAIL_PATTERN.test(fields.email)) {
    return 'That email address does not look right.';
  }
  for (const [key, max] of Object.entries(LIMITS)) {
    if (fields[key].length > max) {
      return `Please keep the ${key} to ${max} characters or fewer.`;
    }
  }
  return null;
}

// Plain form posts (a visitor without JavaScript) get a readable page rather
// than raw JSON; fetch callers get JSON.
function wantsJson(req) {
  return String(req.headers['accept'] || '').includes('application/json');
}

function respond(req, res, status, { error, message }) {
  if (wantsJson(req)) {
    return res.status(status).json(error ? { error } : { ok: true });
  }
  const heading = error ? 'Message not sent' : 'Thank you';
  const body = error || message;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  return res.status(status).send(
    '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width, initial-scale=1">' +
    `<title>${heading} | Osher Shulman</title>` +
    '<style>body{margin:0;min-height:100vh;display:flex;align-items:center;' +
    'justify-content:center;background:#232946;color:#f3f6fa;text-align:center;' +
    "font-family:'Inter','Segoe UI',Arial,sans-serif;line-height:1.7;padding:2rem}" +
    'a{color:#7fc7ff}h1{font-size:1.5rem;margin:0 0 .75rem}</style>' +
    `</head><body><div><h1>${heading}</h1><p>${escapeHtml(body)}</p>` +
    '<p><a href="/">Back to the site</a></p></div></body></html>'
  );
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return respond(req, res, 405, { error: 'This endpoint only accepts form submissions.' });
  }

  const body = parseBody(req.body);

  // The honeypot field is hidden from real visitors, so anything in it came
  // from a bot. Report success so the bot does not learn it was filtered.
  if (readField(body, 'bot-field')) {
    return respond(req, res, 200, { message: 'Your message has been sent.' });
  }

  const fields = {
    name: readField(body, 'name'),
    email: readField(body, 'email'),
    message: readField(body, 'message'),
  };

  const problem = validate(fields);
  if (problem) {
    return respond(req, res, 400, { error: problem });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error('RESEND_API_KEY is not set, so the contact form cannot send mail.');
    return respond(req, res, 500, { error: 'The contact form is not configured yet.' });
  }

  // Newlines in a subject line are a header-injection vector.
  const subjectName = fields.name.replace(/[\r\n]+/g, ' ');

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.CONTACT_FROM || DEFAULT_FROM,
        to: [process.env.CONTACT_TO || DEFAULT_TO],
        // So replying in the mail client goes straight back to the visitor.
        reply_to: fields.email,
        subject: `Website enquiry from ${subjectName}`,
        text: `Name: ${fields.name}\nEmail: ${fields.email}\n\n${fields.message}\n`,
        html:
          `<p><strong>Name:</strong> ${escapeHtml(fields.name)}<br>` +
          `<strong>Email:</strong> ${escapeHtml(fields.email)}</p>` +
          `<p style="white-space:pre-wrap">${escapeHtml(fields.message)}</p>`,
      }),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      console.error('Resend rejected the message:', response.status, detail);
      return respond(req, res, 502, { error: 'The message could not be sent.' });
    }
  } catch (err) {
    console.error('Sending the message failed:', err);
    return respond(req, res, 502, { error: 'The message could not be sent.' });
  }

  return respond(req, res, 200, { message: 'Your message has been sent.' });
};
