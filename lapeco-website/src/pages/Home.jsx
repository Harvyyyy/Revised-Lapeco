import React from 'react';
import { useOutletContext } from 'react-router-dom';
import Hero from '../components/Hero';
import About from './About';
import Contact from './Contact';
import './Home.css';
function Home() {
  const { handleShowModal } = useOutletContext();
  return (
    <>
      <div id="home">
        <Hero onApplyNowClick={handleShowModal} />
      </div>
      <div id="about" className="section-wrapper about-section-bg">
        <About />
      </div>
      <div id="contact" className="section-wrapper contact-section-bg">
        <Contact />
      </div>
    </>
  );
}
export default Home;
