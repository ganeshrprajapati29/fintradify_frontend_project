import React, { useState } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const GDPR = () => {
  const { settings } = useSettings();
  const [darkMode, setDarkMode] = useState(settings.theme === 'dark');

  return (
    <div>
      <Navbar darkMode={darkMode} onThemeToggle={() => setDarkMode(!darkMode)} />
      <div className="container" style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{ textAlign: 'center', marginBottom: '30px' }}>GDPR Compliance</h1>
        <p>Fintradify is fully committed to complying with the General Data Protection Regulation (GDPR) and protecting your personal data.</p>

        <h3>What is GDPR?</h3>
        <p>The GDPR is a regulation in EU law on data protection and privacy for all individuals within the European Union and the European Economic Area.</p>

        <h3>Our GDPR Commitments</h3>
        <ul>
          <li>Data minimization - We only collect data necessary for our services</li>
          <li>Purpose limitation - Data is used only for specified purposes</li>
          <li>Storage limitation - Data is retained only as long as necessary</li>
          <li>Integrity and confidentiality - Data is protected against unauthorized access</li>
          <li>Accountability - We maintain records of our data processing activities</li>
        </ul>

        <h3>Your Rights Under GDPR</h3>
        <ul>
          <li><strong>Right to Access:</strong> Request access to your personal data</li>
          <li><strong>Right to Rectification:</strong> Request correction of inaccurate data</li>
          <li><strong>Right to Erasure:</strong> Request deletion of your data</li>
          <li><strong>Right to Restrict Processing:</strong> Request limitation of data processing</li>
          <li><strong>Right to Data Portability:</strong> Request transfer of your data</li>
          <li><strong>Right to Object:</strong> Object to data processing in certain circumstances</li>
        </ul>

        <h3>How to Exercise Your Rights</h3>
        <p>To exercise any of these rights, please contact our Data Protection Officer at dpo@fintradify.com or use the contact form on our website.</p>

        <h3>Data Protection Officer</h3>
        <p>Email: dpo@fintradify.com</p>
        <p>Phone: +91 78360 09907</p>

        <h3>Complaints</h3>
        <p>If you believe we have not complied with GDPR, you have the right to lodge a complaint with a supervisory authority in your country.</p>
      </div>
      <Footer darkMode={darkMode} />
    </div>
  );
};

export default GDPR;
