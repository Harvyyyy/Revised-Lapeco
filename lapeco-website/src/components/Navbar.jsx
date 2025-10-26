﻿import React, { useState } from 'react';
import { Link } from 'react-scroll';
import { NavLink as RouterNavLink } from 'react-router-dom';
import { Navbar, Nav, Container, Offcanvas, Button } from 'react-bootstrap';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './Navbar.css';
import lapecoLogo from '../assets/images/logo.png';

function LapecoNavbar({ onApplyNowClick, onAskPecoClick }) {
  const [show, setShow] = useState(false);

  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);
  
  const scrollOffset = -80;

  return (
    <Navbar expand="lg" className="navbar-custom shadow-sm" sticky="top">
      <Container>
        <Navbar.Brand as={RouterNavLink} to="/">
          <img src={lapecoLogo} alt="LAPECO Logo" className="navbar-logo" />
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="offcanvasNavbar" onClick={handleShow} />
        <Navbar.Offcanvas
          id="offcanvasNavbar"
          aria-labelledby="offcanvasNavbarLabel"
          placement="end"
          show={show}
          onHide={handleClose}
          responsive="lg"
        >
          <Offcanvas.Header closeButton>
            <Offcanvas.Title id="offcanvasNavbarLabel">
               <img src={lapecoLogo} alt="LAPECO Logo" className="navbar-logo" />
            </Offcanvas.Title>
          </Offcanvas.Header>
          <Offcanvas.Body>
            <Nav className="justify-content-end flex-grow-1 pe-3 align-items-center">
              
              {/* --- UPDATE THE 'duration' PROP ON THESE LINKS --- */}
              <Nav.Link as={Link} to="home" spy={true} smooth={true} offset={scrollOffset} duration={0} onClick={handleClose} activeClass="active">
                Home
              </Nav.Link>
              <Nav.Link as={Link} to="about" spy={true} smooth={true} offset={scrollOffset} duration={0} onClick={handleClose} activeClass="active">
                About Us
              </Nav.Link>
              <Nav.Link as={Link} to="contact" spy={true} smooth={true} offset={scrollOffset} duration={0} onClick={handleClose} activeClass="active">
                Contact
              </Nav.Link>

              <div className="d-flex flex-column flex-lg-row align-items-stretch align-items-lg-center gap-2 mt-3 mt-lg-0 ms-lg-2">
                <Button 
                  variant="outline-success" 
                  onClick={() => { onAskPecoClick(); handleClose(); }}
                  className="ask-peco-btn d-flex align-items-center justify-content-center justify-content-lg-start"
                >
                  <i className="bi bi-robot"></i>
                  <span>Ask Peco</span>
                </Button>
                
                <Button 
                  variant="success" 
                  onClick={() => { onApplyNowClick(); handleClose(); }}
                >
                  Apply Now
                </Button>
              </div>
            </Nav>
          </Offcanvas.Body>
        </Navbar.Offcanvas>
      </Container>
    </Navbar>
  );
}

export default LapecoNavbar;