import React, { useState } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const Contact = () => {
  const { settings } = useSettings();
  const [darkMode, setDarkMode] = useState(settings.theme === 'dark');

  return (
    <div>
      <Navbar darkMode={darkMode} onThemeToggle={() => setDarkMode(!darkMode)} />
      <div className="container" style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{ textAlign: 'center', marginBottom: '30px' }}>Contact Us</h1>
        <p>We'd love to hear from you. Get in touch with our team for any questions, support, or partnership opportunities.</p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', marginTop: '30px' }}>
          <div style={{ flex: '1', minWidth: '250px' }}>
            <h3>Get in Touch</h3>
            <p><strong>Email:</strong> support@fintradify.com</p>
            <p><strong>Phone:</strong> +91 78360 09907</p>
            <p><strong>Address:</strong> C6, C Block, Sector 7, Noida, UP 201301</p>
          </div>

          <div style={{ flex: '1', minWidth: '250px' }}>
            <h3>Business Hours</h3>
            <p>Monday - Friday: 9:00 AM - 6:00 PM IST</p>
            <p>Saturday: 9:00 AM - 2:00 PM IST</p>
            <p>Sunday: Closed</p>
          </div>
        </div>

        <h3 style={{ marginTop: '40px' }}>Send us a Message</h3>
        <form style={{ marginTop: '20px' }}>
          <div style={{ marginBottom: '15px' }}>
            <label htmlFor="name" style={{ display: 'block', marginBottom: '5px' }}>Name</label>
            <input type="text" id="name" style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
          </div>
          <div style={{ marginBottom: '15px' }}>
            <label htmlFor="email" style={{ display: 'block', marginBottom: '5px' }}>Email</label>
            <input type="email" id="email" style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
          </div>
          <div style={{ marginBottom: '15px' }}>
            <label htmlFor="message" style={{ display: 'block', marginBottom: '5px' }}>Message</label>
            <textarea id="message" rows="5" style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}></textarea>
          </div>
          <button type="submit" style={{ backgroundColor: '#1e40af', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Send Message</button>
        </form>
      </div>
      <Footer darkMode={darkMode} />
    </div>
  );
};

export default Contact;
