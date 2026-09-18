# Osher Shulman — Therapist Website

A single-page site for Osher Shulman's therapy practice. Plain HTML and CSS with
a small amount of vanilla JavaScript, plus one serverless function for the
contact form. No build step and no dependencies.

Hosted on Vercel.

## Files

| File | Purpose |
| --- | --- |
| `index.html` | All markup, plus the inline scroll-reveal and contact-form scripts. |
| `styles.css` | All styling. Colors, fonts, shadows and easing are defined as custom properties in the `:root` block at the top. |
| `api/contact.js` | Serverless function that validates a contact-form submission and emails it on. |
| `dev-server.js` | Local dev server, so the contact form can be exercised without the Vercel CLI. Not deployed. |
| `portrait.webp` | Hero portrait, 330x440 (3x the 110px display size). 20 KB. |
| `portrait.png` | Same image as a fallback for browsers without WebP support. |
| `favicon.png` | 96x96 browser icon, pre-cropped to match the hero circle. |
| `chuchum-tech.png` | Chuchum Tech logo for the footer credit, 360x134, displayed at 118px wide. |

The portrait keeps the original photo's 3:4 aspect ratio so the
`object-fit: cover; object-position: center 40%` crop in the stylesheet frames it
the same way. The portrait and the logo both have transparent backgrounds —
don't convert them to JPEG, which would flatten those to black.

## Viewing locally

Open `index.html` in a browser for everything except the contact form. The form
posts to a serverless function, so it needs a server. Two ways:

**`dev-server.js`** — no Vercel account or login needed, just Node:

```sh
node dev-server.js --mock-email
```

Then visit <http://localhost:3000>. It serves the static files and routes
`/api/contact` through the real `api/contact.js`, re-requiring it per request so
edits are picked up without a restart. `--mock-email` skips the Resend call and
prints the message that would have been sent, which is useful before an API key
exists. Drop the flag (and set `RESEND_API_KEY`) to send for real. `--port N`
changes the port.

**`npx vercel dev`** — the production-accurate option, and worth using before a
deploy since it runs the same routing and function runtime Vercel does. Requires
the Vercel CLI and a logged-in account linked to the project.

For either, put `RESEND_API_KEY` in a local `.env` file (git-ignored) so
submissions actually send while developing.

## Contact form

The form posts JSON to `/api/contact`. That function validates the submission
and sends it on via [Resend](https://resend.com) using `fetch`, so there is no
dependency to install and no build step.

This replaced Netlify Forms when the site moved to Vercel. Netlify captured
submissions itself; Vercel has no equivalent built in, so the endpoint and the
email provider are ours to supply.

### Setup

1. Create a Resend account and verify the sending domain (`oshershulman.com`).
   Until a domain is verified, Resend only delivers to the account's own address.
2. In the Vercel project, under **Settings → Environment Variables**, add:

   | Variable | Required | Default |
   | --- | --- | --- |
   | `RESEND_API_KEY` | yes | — |
   | `CONTACT_TO` | no | `osher@oshershulman.com` |
   | `CONTACT_FROM` | no | `Osher Shulman Website <noreply@oshershulman.com>` |

3. Redeploy so the new values are picked up.

`CONTACT_FROM` must be on a domain verified in Resend. The visitor's address
goes in `reply_to`, not `from`, so replying in a mail client reaches them while
SPF and DKIM still pass.

Until `RESEND_API_KEY` is set the endpoint returns a 500 and the page tells the
visitor the form is not configured, rather than silently dropping the message.

### Behaviour

- Failed submissions are reported. The function returns a non-2xx status and the
  page shows the reason and offers the email address instead — it never thanks a
  visitor for a message that did not send.
- `bot-field` is a honeypot, hidden by CSS. Submissions that fill it get a
  success response and are discarded, so bots don't learn they were filtered.
- Length limits are enforced in the browser (`maxlength`) and again in the
  function, which is the one that counts.
- Newlines are stripped from the subject line, and all values are HTML-escaped
  in the email body.
- Without JavaScript the form does a normal POST and the function replies with a
  small confirmation page instead of raw JSON.

### Swapping email providers

Provider-specific code is one `fetch` call in `api/contact.js`. To move to
SendGrid, Postmark or SMTP, replace that call and the environment variable it
reads; the validation, honeypot and response handling stay as they are.

## Editing

- **Text and links** live in `index.html`.
- **The portrait** is served from this repository. To replace it, export the new
  photo at 330x440 (or another 3:4 size) as both `.webp` and `.png`, and a 96x96
  square crop as `favicon.png`.
- **Colors and spacing** come from the custom properties at the top of
  `styles.css` — change `--accent` or `--bg-navy` there and the whole palette
  follows.
- **The phone number** is not currently on the page. To add it back, put it
  alongside the email in the `.contact-info` block.

## Accessibility notes

Worth preserving if you edit the page:

- Sections are visible by default and only hidden for the scroll-reveal once
  JavaScript has confirmed it can run (the `.js` class on `<html>`). Don't move
  `opacity: 0` onto the bare `section` rule — that blanks the page for anyone
  whose JavaScript fails.
- All animation is disabled under `prefers-reduced-motion: reduce`, and sections
  are shown immediately rather than waiting to be scrolled into view.
- The footer has a dark scrim. The page backdrop reaches its brightest blue in
  that corner, where the muted text measured 2.4:1 to 3:1 against it; the scrim
  brings that to roughly 9:1. Removing it puts the copyright, the credit line
  and the logo back below the WCAG AA threshold.
- The form status message is a live region, so screen readers announce the
  result of a submission.
