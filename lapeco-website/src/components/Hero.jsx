import React from 'react';
import { Container, Button } from 'react-bootstrap';
import './Hero.css';
function Hero({ onApplyNowClick }) {
  return (
    <div className="hero-section">
      <Container className="hero-content">
        <h1 className="display-3 text-uppercase fw-bold">Be a Part of Lapeco</h1>
        <p className="lead mb-4">
          We make your ideas become possible
        </p>
        <Button
          onClick={onApplyNowClick}
          variant="success"
          size="lg"
          className="hero-button"
        >
          Apply Now
        </Button>
      </Container>
    </div>
  );
}
export default Hero;
