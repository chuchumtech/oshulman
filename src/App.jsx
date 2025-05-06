import React from 'react'
import ContactForm from './components/ContactForm'

function App() {
  return (
    <div className="app-container">
      <div className="header">
        <img
          src="/portrait-placeholder.jpg"
          alt="Osher Shulman Portrait"
          className="portrait"
        />
        <div>
          <h1>Osher Shulman</h1>
          <div>
            <strong>Therapist in Training &amp; Empathetic Listener</strong>
          </div>
          <p>
            Osher is currently in school to become a therapist. He is an empathetic listener with brilliant insight into the human experience, and has many years of experience counseling young adults.
          </p>
        </div>
      </div>
      <h2>Contact Information</h2>
      <div className="contact-info">
        <div>
          <strong>Email:</strong> <a href="mailto:osher@example.com">osher@example.com</a>
        </div>
        <div>
          <strong>Phone:</strong> <a href="tel:+1234567890">(123) 456-7890</a>
        </div>
      </div>
      <h2>Contact Me</h2>
      <ContactForm />
    </div>
  )
}

export default App
