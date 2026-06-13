import React from 'react';
import Login from '../components/Login';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const LoginPage = () => {
  return (
    <div className="public-page">
      <Navbar />
      <Login />
      <Footer />
    </div>
  );
};

export default LoginPage;
