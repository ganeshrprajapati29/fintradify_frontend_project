import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const HelpCenter = () => {
  return (
    <div>
      <Navbar />
      <div className="container" style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{ textAlign: 'center', marginBottom: '30px' }}>Help Center</h1>
        <p>Find answers to common questions and get support for Fintradify.</p>
        <h3>Frequently Asked Questions</h3>
        <ul>
          <li>How to get started with Fintradify?</li>
          <li>Troubleshooting common issues</li>
          <li>Account management</li>
          <li>Feature guides</li>
        </ul>
        <h3>Contact Support</h3>
        <p>If you can't find what you're looking for, reach out to our support team.</p>
      </div>
      <Footer />
    </div>
  );
};

export default HelpCenter;
