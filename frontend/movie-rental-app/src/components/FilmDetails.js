import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const FilmDetails = () => {
  const { id } = useParams();
  const [film, setFilm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchFilmDetails();
  }, [id]);

  const fetchFilmDetails = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/film/${id}`);
      setFilm(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch film details');
      console.error('Error fetching film details:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!film) return <div className="error">Film not found</div>;

  return (
    <div className="film-details">
      <div className="container">
        <div className="back-link">
          <Link to="/films" className="btn btn-secondary">&larr; Back to Films</Link>
        </div>
        
        <div className="film-header">
          <h1>{film.title}</h1>
          <div className="film-meta">
            <span className="rating">{film.rating}</span>
            <span className="year">{film.release_year}</span>
            <span className="length">{film.length} minutes</span>
          </div>
        </div>

        <div className="film-content">
          <div className="film-info">
            <div className="info-section">
              <h3>Description</h3>
              <p>{film.description}</p>
            </div>

            <div className="info-section">
              <h3>Details</h3>
              <div className="details-grid">
                <div className="detail-item">
                  <strong>Language:</strong> {film.language_name}
                </div>
                <div className="detail-item">
                  <strong>Category:</strong> {film.category_name}
                </div>
                <div className="detail-item">
                  <strong>Rental Rate:</strong> ${film.rental_rate}
                </div>
                <div className="detail-item">
                  <strong>Rental Duration:</strong> {film.rental_duration} days
                </div>
                <div className="detail-item">
                  <strong>Replacement Cost:</strong> ${film.replacement_cost}
                </div>
                {film.special_features && (
                  <div className="detail-item">
                    <strong>Special Features:</strong> {film.special_features}
                  </div>
                )}
              </div>
            </div>

            {film.actors && film.actors.length > 0 && (
              <div className="info-section">
                <h3>Cast</h3>
                <div className="actors-list">
                  {film.actors.map(actor => (
                    <Link 
                      key={actor.actor_id}
                      to={`/actor/${actor.actor_id}`}
                      className="actor-link"
                    >
                      {actor.first_name} {actor.last_name}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilmDetails;