import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import LapecoNavbar from './Navbar';
import Footer from './Footer';
import ApplicationModal from './ApplicationModal';
import Chatbot from './Chatbot';
import './Layout.css';
function Layout() {
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [showChatbot, setShowChatbot] = useState(false);
  const handleCloseModal = () => setShowApplicationModal(false);
  const handleShowModal = () => setShowApplicationModal(true);
  const handleCloseChatbot = () => setShowChatbot(false);
  const handleShowChatbot = () => setShowChatbot(true);
  return (
    <div className="layout-container">
      <Toaster position="top-center" reverseOrder={false} />
      <LapecoNavbar
        onApplyNowClick={handleShowModal}
        onAskPecoClick={handleShowChatbot}
      />
      <main className="main-content">
        <Outlet context={{ handleShowModal }} />
      </main>
      <Footer />
      <ApplicationModal show={showApplicationModal} onHide={handleCloseModal} />
      {showChatbot && <Chatbot onClose={handleCloseChatbot} />}
    </div>
  );
}
export default Layout;
