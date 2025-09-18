import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const ActorDetails = () => {
  const { id } = useParams();
  const [actor, setActor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchActorDetails();
  }, [id]);

  const fetchActorDetails = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/actor/${id}`);
      setActor(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch actor details');
      console.error('Error fetching actor details:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!actor) return <div className="error">Actor not found</div>;

  return (
    <div className="actor-details">
      <div className="container">
        <div className="back-link">
          <Link to="/" className="btn btn-secondary">&larr; Back to Home</Link>
        </div>
        
        <div className="actor-header">
          <h1>{actor.first_name} {actor.last_name}</h1>
        </div>

        <div className="actor-content">
          {actor.films && actor.films.length > 0 && (
            <div className="films-section">
              <h3>Top 5 Most Rented Films</h3>
              <div className="films-grid">
                {actor.films.map(film => (
                  <div key={film.film_id} className="film-card">
                    <h4>
                      <Link to={`/film/${film.film_id}`} className="film-link">
                        {film.title}
                      </Link>
                    </h4>
                    <p className="film-description">{film.description}</p>
                    <div className="film-stats">
                      <span className="rental-rate">Rate: ${film.rental_rate}</span>
                      <span className="rental-count">{film.rental_count} rentals</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ActorDetails;