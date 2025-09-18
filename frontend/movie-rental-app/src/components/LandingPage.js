import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const LandingPage = () => {
  const [topFilms, setTopFilms] = useState([]);
  const [topActors, setTopActors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [filmsResponse, actorsResponse] = await Promise.all([
        axios.get(`${API_BASE_URL}/top-films`),
        axios.get(`${API_BASE_URL}/top-actors`)
      ]);
      
      setTopFilms(filmsResponse.data);
      setTopActors(actorsResponse.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch data');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="landing-page">
      <div className="container">
        <h1>Welcome to Movie Rental Store</h1>
        
        {/* Top 5 Films Section */}
        <section className="top-section">
          <h2>Top 5 Most Rented Films</h2>
          <div className="cards-grid">
            {topFilms.map(film => (
              <div key={film.film_id} className="card">
                <div className="card-header">
                  <h3>
                    <Link to={`/film/${film.film_id}`} className="card-link">
                      {film.title}
                    </Link>
                  </h3>
                  <span className="rental-count">{film.rental_count} rentals</span>
                </div>
                <div className="card-body">
                  <p className="description">{film.description}</p>
                  <div className="film-details">
                    <span className="detail">Rate: ${film.rental_rate}</span>
                    <span className="detail">Length: {film.length}min</span>
                    <span className="detail">Rating: {film.rating}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Top 5 Actors Section */}
        <section className="top-section">
          <h2>Top 5 Most Popular Actors</h2>
          <div className="cards-grid">
            {topActors.map(actor => (
              <div key={actor.actor_id} className="card">
                <div className="card-header">
                  <h3>
                    <Link to={`/actor/${actor.actor_id}`} className="card-link">
                      {actor.first_name} {actor.last_name}
                    </Link>
                  </h3>
                  <span className="rental-count">{actor.rental_count} total rentals</span>
                </div>
                <div className="card-body">
                  <p>Featured in many popular films available in our store</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default LandingPage;