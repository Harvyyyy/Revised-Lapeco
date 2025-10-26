import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { Link } from 'react-scroll';
import { FaFacebook, FaTwitter, FaLinkedin } from 'react-icons/fa';
import './Footer.css';
import lapecoLogo from '../assets/images/logo.png';
function Footer() {
  const scrollOffset = -80;
  return (
    <footer className="footer-enhanced bg-dark text-white pt-5 pb-4">
      <Container>
        <Row>
          <Col lg={3} md={6} className="mb-4">
            <img src={lapecoLogo} alt="LAPECO Logo" className="footer-logo mb-3" />
            <p className="text-white-50">
              Striving for excellence and innovation in every project we undertake. Your partner in quality and precision.
            </p>
          </Col>
          <Col lg={3} md={6} className="mb-4">
            <h5 className="text-uppercase fw-bold mb-4">Quick Links</h5>
            <ul className="list-unstyled footer-links">
              <li><Link to="home" smooth={true} duration={500} offset={scrollOffset} className="footer-link">Home</Link></li>
              <li><Link to="about" smooth={true} duration={500} offset={scrollOffset} className="footer-link">About Us</Link></li>
              <li><Link to="contact" smooth={true} duration={500} offset={scrollOffset} className="footer-link">Contact</Link></li>
            </ul>
          </Col>
          <Col lg={3} md={6} className="mb-4">
            <h5 className="text-uppercase fw-bold mb-4">Contact Us</h5>
            <ul className="list-unstyled contact-info">
              <li><i className="bi bi-geo-alt-fill me-3"></i>Pulo, Cabuyao, Laguna</li>
              <li><i className="bi bi-envelope-fill me-3"></i>hrd.lapeco@gmail.com</li>
              <li><i className="bi bi-telephone-fill me-3"></i>(049) 576 0367</li>
            </ul>
          </Col>
          <Col lg={3} md={6} className="mb-4">
            <h5 className="text-uppercase fw-bold mb-4">Follow Us</h5>
            <div className="social-icons">
              <a href="https://www.facebook.com/share/1M13BGp69k/" className="social-icon me-2"><FaFacebook /></a>
            </div>
          </Col>
        </Row>
        <div className="footer-bottom-bar text-center pt-4 mt-4">
          <p className="text-white-50">&copy; {new Date().getFullYear()} LAPECO. All Rights Reserved.</p>
        </div>
      </Container>
    </footer>
  );
}
export default Footer;
