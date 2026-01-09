import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const Press = () => {
  return (
    <div>
      <Navbar />
      <div className="container" style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{ textAlign: 'center', marginBottom: '30px' }}>Press & Media</h1>
        <p>Stay updated with the latest news and announcements from Fintradify.</p>
        <h3>Recent Press Releases</h3>
        <ul>
          <li>Fintradify Reaches 1,250+ Companies Worldwide</li>
          <li>New Features Added to HR Portal</li>
          <li>Partnership Announcements</li>
        </ul>
        <h3>Media Kit</h3>
        <p>Download our media kit for logos, images, and company information.</p>
        <p>For press inquiries, contact press@fintradify.com</p>
      </div>
      <Footer />
    </div>
  );
};

export default Press;
