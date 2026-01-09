import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const Community = () => {
  return (
    <div>
      <Navbar />
      <div className="container" style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{ textAlign: 'center', marginBottom: '30px' }}>Community</h1>
        <p>Join the Fintradify community to connect with other users and share knowledge.</p>
        <h3>Forums</h3>
        <p>Discuss features, share tips, and get help from the community.</p>
        <h3>Events</h3>
        <p>Upcoming webinars, meetups, and conferences.</p>
        <h3>Contribute</h3>
        <p>Help improve Fintradify by reporting bugs or suggesting features.</p>
      </div>
      <Footer />
    </div>
  );
};

export default Community;
