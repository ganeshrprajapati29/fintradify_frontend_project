import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const PrivacyPolicy = () => {
  const [darkMode, setDarkMode] = useState(false);
  return (
    <div>
      <Navbar darkMode={darkMode} onThemeToggle={() => setDarkMode(!darkMode)} />
      <div className="container" style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{ textAlign: 'center', marginBottom: '30px' }}>Privacy Policy</h1>
        <p>At Fintradify, we are committed to protecting your privacy. This Privacy Policy outlines how we collect, use, and safeguard your information.</p>

        <h3>Information We Collect</h3>
        <p>We collect information you provide directly to us, such as when you create an account or contact us for support.</p>

        <h3>How We Use Your Information</h3>
        <p>We use the information to provide, maintain, and improve our services, communicate with you, and comply with legal obligations.</p>

        <h3>Data Security</h3>
        <p>We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.</p>

        <h3>Your Rights</h3>
        <p>You have the right to access, update, or delete your personal information. Contact us if you have any questions.</p>

        <h3>Changes to This Policy</h3>
        <p>We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page.</p>

        <p>Last updated: October 2023</p>
      </div>
      <Footer darkMode={darkMode} />
    </div>
  );
};

export default PrivacyPolicy;
