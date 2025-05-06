import React, { useState } from 'react'
import emailjs from 'emailjs-com'

const SERVICE_ID = 'YOUR_EMAILJS_SERVICE_ID'
const TEMPLATE_ID = 'YOUR_EMAILJS_TEMPLATE_ID'
const USER_ID = 'YOUR_EMAILJS_USER_ID'

export default function ContactForm() {
  const [form, setForm] = useState({ name: '', email: '', message: '' })
  const [status, setStatus] = useState('')

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setStatus('Sending...')
    emailjs
      .send(SERVICE_ID, TEMPLATE_ID, form, USER_ID)
      .then(
        () => {
          setStatus('Message sent! Thank you for reaching out.')
          setForm({ name: '', email: '', message: '' })
        },
        () => {
          setStatus('Failed to send. Please try again later.')
        }
      )
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        name="name"
        type="text"
        placeholder="Your Name"
        value={form.name}
        onChange={handleChange}
        required
      />
      <input
        name="email"
        type="email"
        placeholder="Your Email"
        value={form.email}
        onChange={handleChange}
        required
      />
      <textarea
        name="message"
        placeholder="Your Message"
        rows={5}
        value={form.message}
        onChange={handleChange}
        required
      />
      <button type="submit">Send Message</button>
      {status && <div style={{ marginTop: 8 }}>{status}</div>}
    </form>
  )
}
