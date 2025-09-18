import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import './App.css';

// Import components
import LandingPage from './components/LandingPage';
import FilmsPage from './components/FilmsPage';
import CustomersPage from './components/CustomersPage';
import FilmDetails from './components/FilmDetails';
import ActorDetails from './components/ActorDetails';
import CustomerDetails from './components/CustomerDetails';

function App() {
  return (
    <Router>
      <div className="App">
        {/* Navigation */}
        <nav className="navbar">
          <div className="nav-container">
            <Link to="/" className="nav-logo">
              Movie Rental Store
            </Link>
            <ul className="nav-menu">
              <li className="nav-item">
                <Link to="/" className="nav-link">Home</Link>
              </li>
              <li className="nav-item">
                <Link to="/films" className="nav-link">Films</Link>
              </li>
              <li className="nav-item">
                <Link to="/customers" className="nav-link">Customers</Link>
              </li>
            </ul>
          </div>
        </nav>

        {/* Routes */}
        <div className="main-content">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/films" element={<FilmsPage />} />
            <Route path="/customers" element={<CustomersPage />} />
            <Route path="/film/:id" element={<FilmDetails />} />
            <Route path="/actor/:id" element={<ActorDetails />} />
            <Route path="/customer/:id" element={<CustomerDetails />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;