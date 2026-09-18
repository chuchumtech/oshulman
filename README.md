# Osher Shulman — Therapist Website

A single-page site for Osher Shulman's therapy practice. Plain HTML and CSS with
a small amount of vanilla JavaScript — no build step, no dependencies.

## Files

| File | Purpose |
| --- | --- |
| `index.html` | All markup, plus the inline scroll-reveal and contact-form scripts. |
| `styles.css` | All styling. Colours, fonts, shadows and easing are defined as custom properties in the `:root` block at the top. |
| `portrait.webp` | Hero portrait, 330x440 (3x the 110px display size). 20 KB. |
| `portrait.png` | Same image as a fallback for browsers without WebP support. |
| `favicon.png` | 96x96 browser icon, pre-cropped to match the hero circle. |

The portrait keeps the original photo's 3:4 aspect ratio so the
`object-fit: cover; object-position: center 40%` crop in the stylesheet frames it
the same way. Both files have a transparent background — don't convert them to
JPEG, which would flatten it to black.

## Viewing locally

Open `index.html` in a browser, or serve the directory to exercise the contact
form against a local server:

```sh
python3 -m http.server 8000
```

Then visit <http://localhost:8000>.

## Contact form

The form posts to [Netlify Forms](https://docs.netlify.com/manage/forms/setup/).
Submissions are sent over `fetch` so the visitor stays on the page, and the
result is reported in the `#formStatus` element rather than by a browser alert.

- Netlify registers the form at deploy time from the `data-netlify="true"`
  attribute; the hidden `form-name` input identifies it on submit.
- `netlify-honeypot="bot-field"` enables the spam trap. The `bot-field` input is
  hidden by `.honeypot` in the stylesheet — any submission that fills it in is
  discarded as spam.
- Submissions appear under **Forms** in the Netlify site dashboard. Email
  notifications are configured there, not in this repository.

Outside of Netlify the form will POST to `/` and report a failure, since nothing
is listening. The site otherwise works as static files anywhere.

## Editing

- **Text and links** live in `index.html`.
- **The portrait** is served from this repository. To replace it, export the new
  photo at 330x440 (or another 3:4 size) as both `.webp` and `.png`, and a 96x96
  square crop as `favicon.png`.
- **The footer mark** is the Chuchum Web Design logo, still loaded from Firebase
  Storage. That bucket currently returns HTTP 402 because its billing account is
  closed, so the image is broken on the live site — re-host the file (adding it
  to this repository alongside the portrait is simplest) and update the `src`.
- **Colours and spacing** come from the custom properties at the top of
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
- On screens narrower than 600px the footer stacks the logo below the copyright
  instead of floating it alongside, which is why the logo can be a readable size
  there rather than the 38px it was shrunk to in order to dodge a collision.
- The form status message is a live region, so screen readers announce the
  result of a submission.
