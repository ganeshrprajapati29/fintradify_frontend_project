import React, { useState } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const TermsOfService = () => {
  const { settings } = useSettings();
  const [darkMode, setDarkMode] = useState(settings.theme === 'dark');

  return (
    <div>
      <Navbar darkMode={darkMode} onThemeToggle={() => setDarkMode(!darkMode)} />
      <div className="container" style={{ padding: '20px', maxWidth: '900px', margin: '0 auto' }}>
        <h1 style={{ textAlign: 'center', marginBottom: '30px', color: darkMode ? '#ffffff' : '#1a202c' }}>Terms of Service</h1>

        <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: darkMode ? '#2d3748' : '#f7fafc', borderRadius: '8px' }}>
          <p style={{ fontSize: '14px', color: darkMode ? '#a0aec0' : '#718096' }}>
            <strong>Last Updated:</strong> Jan 2026<br/>
            <strong>Effective Date:</strong> jan 1, 2026
          </p>
        </div>

        <p style={{ fontSize: '16px', lineHeight: '1.6', marginBottom: '30px', color: darkMode ? '#e2e8f0' : '#2d3748' }}>
          Welcome to Fintradify! These Terms of Service ("Terms") govern your access to and use of our HR management platform,
          including our website, mobile applications, and related services (collectively, the "Service"). By accessing or using
          our Service, you agree to be bound by these Terms. If you do not agree to these Terms, please do not use our Service.
        </p>

        <h2 style={{ color: darkMode ? '#63b3ed' : '#2b6cb0', marginTop: '40px', marginBottom: '20px' }}>1. Acceptance of Terms</h2>
        <p style={{ lineHeight: '1.6', marginBottom: '20px', color: darkMode ? '#e2e8f0' : '#2d3748' }}>
          By creating an account, accessing, or using the Fintradify Service, you acknowledge that you have read,
          understood, and agree to be bound by these Terms and our Privacy Policy. If you are entering into these
          Terms on behalf of a company or other legal entity, you represent that you have the authority to bind
          such entity to these Terms.
        </p>

        <h2 style={{ color: darkMode ? '#63b3ed' : '#2b6cb0', marginTop: '40px', marginBottom: '20px' }}>2. Description of Service</h2>
        <p style={{ lineHeight: '1.6', marginBottom: '20px', color: darkMode ? '#e2e8f0' : '#2d3748' }}>
          Fintradify provides a comprehensive cloud-based Human Resource Management System that includes:
        </p>
        <ul style={{ marginLeft: '20px', marginBottom: '20px', color: darkMode ? '#e2e8f0' : '#2d3748' }}>
          <li>Employee attendance tracking and management</li>
          <li>Leave and time-off management</li>
          <li>Payroll processing and salary management</li>
          <li>Performance evaluation and analytics</li>
          <li>Task and project management</li>
          <li>Employee self-service portal</li>
          <li>Reporting and analytics dashboard</li>
          <li>Mobile applications for iOS and Android</li>
        </ul>

        <h2 style={{ color: darkMode ? '#63b3ed' : '#2b6cb0', marginTop: '40px', marginBottom: '20px' }}>3. User Accounts and Responsibilities</h2>

        <h3 style={{ color: darkMode ? '#68d391' : '#38a169', marginTop: '25px', marginBottom: '15px' }}>3.1 Account Registration</h3>
        <p style={{ lineHeight: '1.6', marginBottom: '20px', color: darkMode ? '#e2e8f0' : '#2d3748' }}>
          To use our Service, you must create an account by providing accurate, complete, and current information.
          You are responsible for maintaining the confidentiality of your account credentials and for all activities
          that occur under your account.
        </p>

        <h3 style={{ color: darkMode ? '#68d391' : '#38a169', marginTop: '25px', marginBottom: '15px' }}>3.2 User Responsibilities</h3>
        <p style={{ lineHeight: '1.6', marginBottom: '20px', color: darkMode ? '#e2e8f0' : '#2d3748' }}>
          You agree to:
        </p>
        <ul style={{ marginLeft: '20px', marginBottom: '20px', color: darkMode ? '#e2e8f0' : '#2d3748' }}>
          <li>Use the Service only for lawful purposes and in compliance with applicable laws</li>
          <li>Not share your account credentials with unauthorized users</li>
          <li>Not attempt to gain unauthorized access to our systems or other users' accounts</li>
          <li>Not upload or transmit harmful code, viruses, or malicious content</li>
          <li>Not use the Service to harass, abuse, or harm others</li>
          <li>Maintain accurate and up-to-date employee data</li>
        </ul>

        <h2 style={{ color: darkMode ? '#63b3ed' : '#2b6cb0', marginTop: '40px', marginBottom: '20px' }}>4. Payment Terms</h2>

        <h3 style={{ color: darkMode ? '#68d391' : '#38a169', marginTop: '25px', marginBottom: '15px' }}>4.1 Subscription Fees</h3>
        <p style={{ lineHeight: '1.6', marginBottom: '20px', color: darkMode ? '#e2e8f0' : '#2d3748' }}>
          Our Service is offered on a subscription basis. Fees are billed in advance on a monthly or annual basis,
          depending on your selected plan. All fees are non-refundable except as expressly stated in these Terms.
        </p>

        <h3 style={{ color: darkMode ? '#68d391' : '#38a169', marginTop: '25px', marginBottom: '15px' }}>4.2 Payment Methods</h3>
        <p style={{ lineHeight: '1.6', marginBottom: '20px', color: darkMode ? '#e2e8f0' : '#2d3748' }}>
          We accept major credit cards and other payment methods as indicated in our billing interface.
          You authorize us to charge your chosen payment method for all applicable fees.
        </p>

        <h3 style={{ color: darkMode ? '#68d391' : '#38a169', marginTop: '25px', marginBottom: '15px' }}>4.3 Late Payments</h3>
        <p style={{ lineHeight: '1.6', marginBottom: '20px', color: darkMode ? '#e2e8f0' : '#2d3748' }}>
          If payment is not received by the due date, we may suspend or terminate your access to the Service.
          Late fees may apply at 1.5% per month or the maximum allowed by law, whichever is less.
        </p>

        <h2 style={{ color: darkMode ? '#63b3ed' : '#2b6cb0', marginTop: '40px', marginBottom: '20px' }}>5. Intellectual Property</h2>
        <p style={{ lineHeight: '1.6', marginBottom: '20px', color: darkMode ? '#e2e8f0' : '#2d3748' }}>
          The Service and its original content, features, and functionality are owned by Fintradify and are protected
          by international copyright, trademark, patent, trade secret, and other intellectual property laws. You may
          not duplicate, copy, or reuse any portion of the Service without our express written permission.
        </p>

        <h2 style={{ color: darkMode ? '#63b3ed' : '#2b6cb0', marginTop: '40px', marginBottom: '20px' }}>6. Data Privacy and Security</h2>
        <p style={{ lineHeight: '1.6', marginBottom: '20px', color: darkMode ? '#e2e8f0' : '#2d3748' }}>
          Your privacy is important to us. Our collection and use of personal information is governed by our Privacy Policy,
          which is incorporated into these Terms by reference. We implement industry-standard security measures to protect
          your data, including encryption, access controls, and regular security audits.
        </p>

        <h2 style={{ color: darkMode ? '#63b3ed' : '#2b6cb0', marginTop: '40px', marginBottom: '20px' }}>7. Service Availability and Support</h2>

        <h3 style={{ color: darkMode ? '#68d391' : '#38a169', marginTop: '25px', marginBottom: '15px' }}>7.1 Service Level Agreement</h3>
        <p style={{ lineHeight: '1.6', marginBottom: '20px', color: darkMode ? '#e2e8f0' : '#2d3748' }}>
          We strive to maintain 99.9% uptime for our Service. However, we do not guarantee uninterrupted access
          and are not liable for any downtime or service interruptions.
        </p>

        <h3 style={{ color: darkMode ? '#68d391' : '#38a169', marginTop: '25px', marginBottom: '15px' }}>7.2 Support Services</h3>
        <p style={{ lineHeight: '1.6', marginBottom: '20px', color: darkMode ? '#e2e8f0' : '#2d3748' }}>
          Support is provided through email, live chat, and phone during business hours. Premium support plans
          include priority response times and dedicated account managers.
        </p>

        <h2 style={{ color: darkMode ? '#63b3ed' : '#2b6cb0', marginTop: '40px', marginBottom: '20px' }}>8. Termination</h2>

        <h3 style={{ color: darkMode ? '#68d391' : '#38a169', marginTop: '25px', marginBottom: '15px' }}>8.1 Termination by User</h3>
        <p style={{ lineHeight: '1.6', marginBottom: '20px', color: darkMode ? '#e2e8f0' : '#2d3748' }}>
          You may terminate your account at any time through your account settings. Upon termination, your access
          to the Service will cease immediately, but we may retain your data as required by law or for legitimate business purposes.
        </p>

        <h3 style={{ color: darkMode ? '#68d391' : '#38a169', marginTop: '25px', marginBottom: '15px' }}>8.2 Termination by Fintradify</h3>
        <p style={{ lineHeight: '1.6', marginBottom: '20px', color: darkMode ? '#e2e8f0' : '#2d3748' }}>
          We may terminate or suspend your account immediately if you violate these Terms or engage in prohibited activities.
          We will provide notice of termination when possible.
        </p>

        <h2 style={{ color: darkMode ? '#63b3ed' : '#2b6cb0', marginTop: '40px', marginBottom: '20px' }}>9. Limitation of Liability</h2>
        <p style={{ lineHeight: '1.6', marginBottom: '20px', color: darkMode ? '#e2e8f0' : '#2d3748' }}>
          To the maximum extent permitted by law, Fintradify shall not be liable for any indirect, incidental,
          special, consequential, or punitive damages, including but not limited to loss of profits, data,
          or business opportunities. Our total liability shall not exceed the amount paid by you for the
          Service in the 12 months preceding the claim.
        </p>

        <h2 style={{ color: darkMode ? '#63b3ed' : '#2b6cb0', marginTop: '40px', marginBottom: '20px' }}>10. Indemnification</h2>
        <p style={{ lineHeight: '1.6', marginBottom: '20px', color: darkMode ? '#e2e8f0' : '#2d3748' }}>
          You agree to indemnify and hold Fintradify harmless from any claims, damages, losses, or expenses
          arising from your use of the Service, violation of these Terms, or infringement of any third-party rights.
        </p>

        <h2 style={{ color: darkMode ? '#63b3ed' : '#2b6cb0', marginTop: '40px', marginBottom: '20px' }}>11. Governing Law and Dispute Resolution</h2>
        <p style={{ lineHeight: '1.6', marginBottom: '20px', color: darkMode ? '#e2e8f0' : '#2d3748' }}>
          These Terms shall be governed by and construed in accordance with the laws of India, without regard to
          its conflict of law provisions. Any disputes arising from these Terms shall be resolved through binding
          arbitration in accordance with the rules of the Indian Arbitration and Conciliation Act, 1996.
        </p>

        <h2 style={{ color: darkMode ? '#63b3ed' : '#2b6cb0', marginTop: '40px', marginBottom: '20px' }}>12. Changes to Terms</h2>
        <p style={{ lineHeight: '1.6', marginBottom: '20px', color: darkMode ? '#e2e8f0' : '#2d3748' }}>
          We reserve the right to modify these Terms at any time. We will notify users of material changes via email
          or through our Service. Continued use of the Service after such notification constitutes acceptance of the modified Terms.
        </p>

        <h2 style={{ color: darkMode ? '#63b3ed' : '#2b6cb0', marginTop: '40px', marginBottom: '20px' }}>13. Contact Information</h2>
        <p style={{ lineHeight: '1.6', marginBottom: '20px', color: darkMode ? '#e2e8f0' : '#2d3748' }}>
          If you have any questions about these Terms, please contact us at:
        </p>
        <div style={{ marginLeft: '20px', marginBottom: '40px', color: darkMode ? '#e2e8f0' : '#2d3748' }}>
          <p><strong>Email:</strong> legal@fintradify.com</p>
          <p><strong>Phone:</strong> +91-XXXXXXXXXX</p>
          <p><strong>Address:</strong> [Company Address], India</p>
        </div>

        <div style={{ borderTop: `1px solid ${darkMode ? '#4a5568' : '#e2e8f0'}`, paddingTop: '20px', marginTop: '40px' }}>
          <p style={{ fontSize: '14px', color: darkMode ? '#a0aec0' : '#718096', textAlign: 'center' }}>
            By using Fintradify, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
          </p>
        </div>
      </div>
      <Footer darkMode={darkMode} />
    </div>
  );
};

export default TermsOfService;
