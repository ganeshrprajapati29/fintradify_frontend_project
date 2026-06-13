
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Route, Switch, useLocation } from 'react-router-dom';
import { SettingsProvider } from './contexts/SettingsContext';
import { PublicDataProvider } from './contexts/PublicDataContext';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import ForgotPassword from './pages/ForgotPassword';
import AdminPage from './pages/AdminPage';
import EmployeePage from './pages/EmployeePage';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import Cookies from './pages/Cookies';
import GDPR from './pages/GDPR';
import Features from './pages/Features';
import Contact from './pages/Contact';
import AboutUs from './pages/AboutUs';
import Press from './pages/Press';
import HelpCenter from './pages/HelpCenter';
import Community from './pages/Community';
import Pricing from './pages/Pricing';
import Integrations from './pages/Integrations';
import API from './pages/API';
import Careers from './pages/Careers';
import Documentation from './pages/Documentation';
import Status from './pages/Status';
import Compliance from './pages/Compliance';
import CertificateVerification from './pages/CertificateVerification';

import './styles.css';

const ScrollToTop = () => {
  const { pathname, search } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  }, [pathname, search]);

  return null;
};

function App() {
  return (
    <SettingsProvider>
      <PublicDataProvider>
        <Router>
          <ScrollToTop />
          <Switch>
            <Route exact path="/" component={LandingPage} />
            <Route path="/login" component={LoginPage} />
            <Route path="/forgot-password" component={ForgotPassword} />
            <Route path="/admin" component={AdminPage} />
            <Route path="/employee" component={EmployeePage} />
            <Route path="/verify-certificate" component={CertificateVerification} />
            <Route path="/privacy-policy" component={PrivacyPolicy} />
            <Route path="/terms" component={TermsOfService} />
            <Route path="/cookies" component={Cookies} />
            <Route path="/gdpr" component={GDPR} />
            <Route path="/features" component={Features} />
            <Route path="/pricing" component={Pricing} />
            <Route path="/integrations" component={Integrations} />
            <Route path="/api" component={API} />
            <Route path="/contact" component={Contact} />
            <Route path="/about" component={AboutUs} />
            <Route path="/careers" component={Careers} />
            <Route path="/press" component={Press} />
            <Route path="/help" component={HelpCenter} />
            <Route path="/docs" component={Documentation} />
            <Route path="/community" component={Community} />
            <Route path="/status" component={Status} />
            <Route path="/compliance" component={Compliance} />
          </Switch>
        </Router>
      </PublicDataProvider>
    </SettingsProvider>
  );
}

export default App;
