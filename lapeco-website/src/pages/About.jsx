import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import './About.css';
const features = [
  {
    icon: 'bi-gem',
    title: 'Quality & Precision',
    description: 'We uphold the highest standards in manufacturing, using precise equipment suited to your product. Our machines undergo rigorous quality checks.'
  },
  {
    icon: 'bi-people-fill',
    title: 'Strategic Partnership',
    description: 'Good communication is key. We welcome your ideas and provide suggestions to support business growth, partnering with companies of all sizes.'
  },
  {
    icon: 'bi-graph-up-arrow',
    title: 'Efficiency & Cost-Effectiveness',
    description: 'Outsourcing to us is a smart move. We help lower your production costs and save you time, handling high-quality packaging with skilled manpower.'
  }
];
function About() {
  return (
    <Container>
      <Row className="text-center mb-5">
        <Col>
          <h2 className="display-5 fw-bold">Why Partner With LAPECO?</h2>
          <p className="lead text-muted">
            We're more than a manufacturer; we're an extension of your team.
          </p>
        </Col>
      </Row>
      <Row>
        {features.map((feature, index) => (
          <Col lg={4} key={index} className="mb-4">
            <div className="feature-card h-100">
              <div className="card-header">
                <div className="feature-icon">{feature.icon && <i className={`bi ${feature.icon}`}></i>}</div>
                <div className="feature-number">0{index + 1}</div>
              </div>
              <h4 className="fw-bold my-3">{feature.title}</h4>
              <p className="text-muted">{feature.description}</p>
            </div>
          </Col>
        ))}
      </Row>
    </Container>
  );
}
export default About;
