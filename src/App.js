import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import AdminPage from './pages/AdminPage';
import EmployeePage from './pages/EmployeePage';

import './styles.css';

function App() {
  return (
    <Router>
      <Switch>
        <Route exact path="/" component={LoginPage} />
        <Route path="/admin" component={AdminPage} />
        <Route path="/employee" component={EmployeePage} />
      </Switch>
    </Router>
  );
}

export default App;