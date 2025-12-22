
import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import AdminPage from './pages/AdminPage';
import EmployeePage from './pages/EmployeePage';
import PrivacyPolicy from './pages/PrivacyPolicy';

import './styles.css';

function App() {
  return (
    <Router>
      <Switch>
        <Route exact path="/" component={LandingPage} />
        <Route path="/login" component={LoginPage} />
        <Route path="/admin" component={AdminPage} />
        <Route path="/employee" component={EmployeePage} />
        <Route path="/privacy-policy" component={PrivacyPolicy} />
      </Switch>
    </Router>
  );
}

export default App;
