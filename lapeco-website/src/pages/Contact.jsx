import React, { useState } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import './Contact.css';
const contactMethods = [
  {
    icon: 'bi-envelope-fill',
    title: 'Email Us',
    lines: [
      { label: 'For Inquiries:', text: 'Albert@lapeco.com.co', href: 'mailto:Albert@lapeco.com.co' },
      { label: 'For Careers:', text: 'hrd.lapeco@gmail.com', href: 'mailto:hrd.lapeco@gmail.com' }
    ]
  },
  {
    icon: 'bi-telephone-fill',
    title: 'Call Us',
    lines: [
      { label: 'Inquiries Landline:', text: '(049) 576 0367', href: 'tel:+63495760367' },
      { label: 'Careers Phone:', text: '0917 550 0968', href: 'tel:+639175500968' }
    ]
  },
  {
    icon: 'bi-geo-alt-fill',
    title: 'Main Office',
    lines: [
      { label: 'Address:', text: 'L9 B3 Cabuyao Central Subd. Commercial lot, Pulo, Cabuyao, Laguna' }
    ]
  }
];
function Contact() {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitMessage('');
    console.log('Form Submitted:', formData);
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitMessage('Thank you! Your message has been sent.');
      setFormData({ name: '', email: '', message: '' });
      setTimeout(() => setSubmitMessage(''), 4000);
    }, 1500);
  };
  return (
    <Container className="contact-section">
      <div className="contact-header">
        <h2 className="section-title">Get In Touch</h2>
        <p className="section-subtitle">
          Weâ€™re here to help and answer any question you might have. We look forward to hearing from you.
        </p>
      </div>
      <Row className="mb-5">
        {contactMethods.map(method => (
          <Col md={4} key={method.title} className="mb-4">
            <div className="contact-method-card text-center">
              <div className="contact-icon-compact">
                <i className={`bi ${method.icon}`}></i>
              </div>
              <h4 className="fw-bold mt-3">{method.title}</h4>
              <div className="contact-details-compact">
                {method.lines.map(line => (
                  <div key={line.label}>
                    {line.href ? <a href={line.href}>{line.text}</a> : <span>{line.text}</span>}
                  </div>
                ))}
              </div>
            </div>
          </Col>
        ))}
      </Row>
      <Row>
        <Col lg={6} className="mb-4 mb-lg-0">
          <div className="form-wrapper">
            <h4 className="mb-4">Send Us a Message</h4>
            <form className="contact-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="name">Full Name</label>
                <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label htmlFor="message">Message</label>
                <textarea id="message" name="message" rows="5" value={formData.message} onChange={handleChange} required></textarea>
              </div>
              <button type="submit" className="submit-btn" disabled={isSubmitting}>
                {isSubmitting ? 'Sending...' : 'Send Message'}
              </button>
              {submitMessage && <p className="submit-feedback">{submitMessage}</p>}
            </form>
          </div>
        </Col>
        <Col lg={6}>
          <div className="map-container">
            <iframe
              title="LAPECO Location"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3867.726282147873!2d121.128149!3d14.242875!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x33bd631647bd55eb%3A0xcba38b8be27a0af2!2sLaguna%20Packaging%20Equipment%20Corp.%20-%20LAPECO!5e0!3m2!1sen!2sph!4v1752981234567!5m2!1sen!2sph"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            ></iframe>
          </div>
        </Col>
      </Row>
    </Container>
  );
}
export default Contact;
