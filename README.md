# Osher Shulman Therapy Site

A clean, professional website for Osher Shulman, therapist in training.

## Features

- Welcoming homepage with Osher's background and values
- Prominent email and phone number for contact
- Contact form (forwards to email using EmailJS)
- Responsive, modern design
- Easy to customize

## Running Locally

1. Install dependencies:
   ```
   npm install
   ```

2. Start the development server:
   ```
   npm run dev
   ```

3. Open [http://localhost:5173](http://localhost:5173) in your browser.

## Contact Form Setup (EmailJS)

1. Sign up at [EmailJS](https://www.emailjs.com/).
2. Create an email service and template.
3. In `src/components/ContactForm.jsx`, replace:
   - `YOUR_EMAILJS_SERVICE_ID`
   - `YOUR_EMAILJS_TEMPLATE_ID`
   - `YOUR_EMAILJS_USER_ID`
   with your actual EmailJS credentials.

## Adding Osher's Portrait

- Replace `public/portrait-placeholder.jpg` with Osher's real portrait (use the same filename).

## Customizing Contact Info

- In `src/App.jsx`, update the email and phone number as needed.

---

If you have any questions or need help customizing, feel free to ask!
