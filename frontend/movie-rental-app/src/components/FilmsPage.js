import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const FilmsPage = () => {
  const [films, setFilms] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('title');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [rentModal, setRentModal] = useState({ show: false, film: null });
  const [customerId, setCustomerId] = useState('');
  const [rentLoading, setRentLoading] = useState(false);

  const searchFilms = async () => {
    if (!searchQuery.trim()) {
      setFilms([]);
      return;
    }

    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/films/search`, {
        params: { q: searchQuery, type: searchType }
      });
      setFilms(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to search films');
      console.error('Error searching films:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    searchFilms();
  };

  const openRentModal = (film) => {
    setRentModal({ show: true, film });
    setCustomerId('');
  };

  const closeRentModal = () => {
    setRentModal({ show: false, film: null });
    setCustomerId('');
  };

  const handleRentFilm = async (e) => {
    e.preventDefault();
    if (!customerId || !rentModal.film) return;

    try {
      setRentLoading(true);
      await axios.post(`${API_BASE_URL}/films/rent`, {
        customer_id: parseInt(customerId),
        film_id: rentModal.film.film_id
      });
      alert('Film rented successfully!');
      closeRentModal();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to rent film');
    } finally {
      setRentLoading(false);
    }
  };

  return (
    <div className="films-page">
      <div className="container">
        <h1>Films</h1>
        
        {/* Search Form */}
        <form onSubmit={handleSearch} className="search-form">
          <div className="search-group">
            <select 
              value={searchType} 
              onChange={(e) => setSearchType(e.target.value)}
              className="search-type"
            >
              <option value="title">Film Title</option>
              <option value="actor">Actor Name</option>
              <option value="genre">Genre</option>
            </select>
            
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search by ${searchType}...`}
              className="search-input"
              required
            />
            
            <button type="submit" className="search-btn" disabled={loading}>
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>
        </form>

        {error && <div className="error">{error}</div>}

        {/* Films Results */}
        {films.length > 0 && (
          <div className="films-results">
            <h2>Search Results ({films.length} films found)</h2>
            <div className="cards-grid">
              {films.map(film => (
                <div key={film.film_id} className="card">
                  <div className="card-header">
                    <h3>
                      <Link to={`/film/${film.film_id}`} className="card-link">
                        {film.title}
                      </Link>
                    </h3>
                  </div>
                  <div className="card-body">
                    <p className="description">{film.description}</p>
                    <div className="film-details">
                      <span className="detail">Rate: ${film.rental_rate}</span>
                      <span className="detail">Length: {film.length}min</span>
                      <span className="detail">Rating: {film.rating}</span>
                    </div>
                    <div className="card-actions">
                      <Link to={`/film/${film.film_id}`} className="btn btn-primary">
                        View Details
                      </Link>
                      <button 
                        onClick={() => openRentModal(film)}
                        className="btn btn-success"
                      >
                        Rent Film
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {searchQuery && films.length === 0 && !loading && (
          <div className="no-results">
            No films found for "{searchQuery}"
          </div>
        )}
      </div>

      {/* Rent Modal */}
      {rentModal.show && (
        <div className="modal-overlay" onClick={closeRentModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Rent Film: {rentModal.film.title}</h3>
              <button onClick={closeRentModal} className="close-btn">&times;</button>
            </div>
            <form onSubmit={handleRentFilm} className="modal-body">
              <div className="form-group">
                <label htmlFor="customerId">Customer ID:</label>
                <input
                  type="number"
                  id="customerId"
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  placeholder="Enter customer ID"
                  required
                  min="1"
                />
              </div>
              <div className="film-info">
                <p><strong>Rental Rate:</strong> ${rentModal.film.rental_rate}</p>
                <p><strong>Length:</strong> {rentModal.film.length} minutes</p>
              </div>
              <div className="modal-actions">
                <button type="button" onClick={closeRentModal} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={rentLoading}>
                  {rentLoading ? 'Processing...' : 'Rent Film'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FilmsPage;