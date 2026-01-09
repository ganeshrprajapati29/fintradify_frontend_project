import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const Cookies = () => {
  return (
    <div>
      <Navbar />
      <div className="container" style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{ textAlign: 'center', marginBottom: '30px' }}>Cookie Policy</h1>
        <p>This Cookie Policy explains how Fintradify uses cookies and similar technologies to enhance your experience on our website.</p>

        <h3>What Are Cookies?</h3>
        <p>Cookies are small text files that are stored on your device when you visit our website. They help us provide you with a better browsing experience and allow certain features to work properly.</p>

        <h3>Types of Cookies We Use</h3>

        <h4>Essential Cookies</h4>
        <p>These cookies are necessary for the website to function and cannot be switched off in our systems. They are usually only set in response to actions made by you which amount to a request for services.</p>

        <h4>Analytics Cookies</h4>
        <p>These cookies allow us to count visits and traffic sources so we can measure and improve the performance of our site. They help us to know which pages are the most and least popular.</p>

        <h4>Functional Cookies</h4>
        <p>These cookies enable the website to provide enhanced functionality and personalization. They may be set by us or by third-party providers whose services we have added to our pages.</p>

        <h4>Marketing Cookies</h4>
        <p>These cookies may be set through our site by our advertising partners. They may be used by those companies to build a profile of your interests and show you relevant adverts.</p>

        <h3>How to Control Cookies</h3>
        <p>You can control and/or delete cookies as you wish. You can delete all cookies that are already on your computer and you can set most browsers to prevent them from being placed.</p>

        <h4>Browser Settings</h4>
        <ul>
          <li><strong>Chrome:</strong> Settings  Privacy and security Cookies and other site data</li>
          <li><strong>Firefox:</strong> Settings  Privacy & Security  Cookies and Site Data</li>
          <li><strong>Safari:</strong> Preferences  Privacy  Manage Website Data</li>
          <li><strong>Edge:</strong> Settings  Cookies and site permissions</li>
        </ul>

        <h3>Third-Party Cookies</h3>
        <p>Some cookies on our website are set by third-party services that appear on our pages. We have no control over these cookies, and they are subject to the respective third party's privacy policy.</p>

        <h3>Updates to This Policy</h3>
        <p>We may update this Cookie Policy from time to time to reflect changes in our practices or for other operational, legal, or regulatory reasons.</p>

        <h3>Contact Us</h3>
        <p>If you have any questions about our use of cookies, please contact us at privacy@fintradify.com.</p>
      </div>
      <Footer />
    </div>
  );
};

export default Cookies;
