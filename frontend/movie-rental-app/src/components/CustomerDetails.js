import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const CustomerDetails = () => {
  const { id } = useParams();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCustomerDetails();
  }, [id]);

  const fetchCustomerDetails = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/customers/${id}/details`);
      setCustomer(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch customer details');
      console.error('Error fetching customer details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReturnRental = async (rentalId) => {
    try {
      await axios.put(`${API_BASE_URL}/rentals/${rentalId}/return`);
      fetchCustomerDetails(); // Refresh the data
      alert('Rental returned successfully!');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to return rental');
    }
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!customer) return <div className="error">Customer not found</div>;

  const activeRentals = customer.rental_history?.filter(rental => rental.status === 'Active') || [];
  const pastRentals = customer.rental_history?.filter(rental => rental.status === 'Returned') || [];

  return (
    <div className="customer-details">
      <div className="container">
        <div className="back-link">
          <Link to="/customers" className="btn btn-secondary">&larr; Back to Customers</Link>
        </div>
        
        <div className="customer-header">
          <h1>{customer.first_name} {customer.last_name}</h1>
          <span className={`status ${customer.active ? 'active' : 'inactive'}`}>
            {customer.active ? 'Active' : 'Inactive'}
          </span>
        </div>

        <div className="customer-content">
          {/* Customer Info */}
          <div className="customer-info">
            <div className="info-section">
              <h3>Contact Information</h3>
              <div className="info-grid">
                <div className="info-item"><strong>Email:</strong> {customer.email}</div>
                <div className="info-item"><strong>Phone:</strong> {customer.phone}</div>
                <div className="info-item"><strong>Address:</strong> {customer.address}</div>
                <div className="info-item"><strong>City:</strong> {customer.city}</div>
                <div className="info-item"><strong>Country:</strong> {customer.country}</div>
                <div className="info-item"><strong>Customer Since:</strong> {new Date(customer.create_date).toLocaleDateString()}</div>
              </div>
            </div>
          </div>

          {/* Active Rentals */}
          {activeRentals.length > 0 && (
            <div className="rentals-section">
              <h3>Current Rentals ({activeRentals.length})</h3>
              <div className="table-container">
                <table className="rentals-table">
                  <thead>
                    <tr>
                      <th>Film</th>
                      <th>Rental Date</th>
                      <th>Rate</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeRentals.map(rental => (
                      <tr key={rental.rental_id}>
                        <td>{rental.title}</td>
                        <td>{new Date(rental.rental_date).toLocaleDateString()}</td>
                        <td>${rental.rental_rate}</td>
                        <td><span className="status active">{rental.status}</span></td>
                        <td>
                          <button 
                            onClick={() => handleReturnRental(rental.rental_id)}
                            className="btn btn-sm btn-success"
                          >
                            Mark Returned
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Rental History */}
          {pastRentals.length > 0 && (
            <div className="rentals-section">
              <h3>Rental History ({pastRentals.length})</h3>
              <div className="table-container">
                <table className="rentals-table">
                  <thead>
                    <tr>
                      <th>Film</th>
                      <th>Rental Date</th>
                      <th>Return Date</th>
                      <th>Rate</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pastRentals.map(rental => (
                      <tr key={rental.rental_id}>
                        <td>{rental.title}</td>
                        <td>{new Date(rental.rental_date).toLocaleDateString()}</td>
                        <td>{rental.return_date ? new Date(rental.return_date).toLocaleDateString() : 'N/A'}</td>
                        <td>${rental.rental_rate}</td>
                        <td><span className="status returned">{rental.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* No Rentals */}
          {customer.rental_history && customer.rental_history.length === 0 && (
            <div className="no-rentals">
              <p>This customer has no rental history.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerDetails;
