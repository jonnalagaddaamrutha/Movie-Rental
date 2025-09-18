import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const CustomersPage = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('name');
  const [showAddModal, setShowAddModal] = useState(false);
  const [cities, setCities] = useState([]);
  const [editingCustomer, setEditingCustomer] = useState(null);
  
  const [newCustomer, setNewCustomer] = useState({
    first_name: '',
    last_name: '',
    email: '',
    address: '',
    city_id: '',
    phone: ''
  });

  useEffect(() => {
    fetchCustomers();
    fetchCities();
  }, [currentPage, searchQuery, searchType]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/customers`, {
        params: {
          page: currentPage,
          per_page: 10,
          search: searchQuery,
          search_type: searchType
        }
      });
      
      setCustomers(response.data.customers);
      setTotalPages(response.data.total_pages);
      setError(null);
    } catch (err) {
      setError('Failed to fetch customers');
      console.error('Error fetching customers:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCities = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/cities`);
      setCities(response.data);
    } catch (err) {
      console.error('Error fetching cities:', err);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchCustomers();
  };

  const handleAddCustomer = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE_URL}/customers`, newCustomer);
      setShowAddModal(false);
      setNewCustomer({
        first_name: '',
        last_name: '',
        email: '',
        address: '',
        city_id: '',
        phone: ''
      });
      fetchCustomers();
      alert('Customer added successfully!');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to add customer');
    }
  };

  const handleEditCustomer = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${API_BASE_URL}/customers/${editingCustomer.customer_id}`, editingCustomer);
      setEditingCustomer(null);
      fetchCustomers();
      alert('Customer updated successfully!');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update customer');
    }
  };

  const handleDeleteCustomer = async (customerId) => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      try {
        await axios.delete(`${API_BASE_URL}/customers/${customerId}`);
        fetchCustomers();
        alert('Customer deleted successfully!');
      } catch (err) {
        alert(err.response?.data?.error || 'Failed to delete customer');
      }
    }
  };

  const openEditModal = (customer) => {
    setEditingCustomer({ ...customer });
  };

  if (loading && customers.length === 0) return <div className="loading">Loading...</div>;

  return (
    <div className="customers-page">
      <div className="container">
        <div className="page-header">
          <h1>Customers</h1>
          <button 
            onClick={() => setShowAddModal(true)} 
            className="btn btn-primary"
          >
            Add Customer
          </button>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="search-form">
          <div className="search-group">
            <select 
              value={searchType} 
              onChange={(e) => setSearchType(e.target.value)}
              className="search-type"
            >
              <option value="name">Name</option>
              <option value="customer_id">Customer ID</option>
            </select>
            
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search by ${searchType}...`}
              className="search-input"
            />
            
            <button type="submit" className="search-btn">
              Search
            </button>
            
            {searchQuery && (
              <button 
                type="button" 
                onClick={() => {
                  setSearchQuery('');
                  setCurrentPage(1);
                }}
                className="btn btn-secondary"
              >
                Clear
              </button>
            )}
          </div>
        </form>

        {error && <div className="error">{error}</div>}

        {/* Customers Table */}
        <div className="table-container">
          <table className="customers-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Address</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.map(customer => (
                <tr key={customer.customer_id}>
                  <td>{customer.customer_id}</td>
                  <td>{customer.first_name} {customer.last_name}</td>
                  <td>{customer.email}</td>
                  <td>{customer.address}, {customer.city}, {customer.country}</td>
                  <td>
                    <span className={`status ${customer.active ? 'active' : 'inactive'}`}>
                      {customer.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <Link 
                        to={`/customer/${customer.customer_id}`}
                        className="btn btn-sm btn-primary"
                      >
                        View
                      </Link>
                      <button 
                        onClick={() => openEditModal(customer)}
                        className="btn btn-sm btn-secondary"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDeleteCustomer(customer.customer_id)}
                        className="btn btn-sm btn-danger"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination">
            <button 
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="btn btn-secondary"
            >
              Previous
            </button>
            
            <span className="page-info">
              Page {currentPage} of {totalPages}
            </span>
            
            <button 
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="btn btn-secondary"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Add Customer Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add New Customer</h3>
              <button onClick={() => setShowAddModal(false)} className="close-btn">&times;</button>
            </div>
            <form onSubmit={handleAddCustomer} className="modal-body">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="first_name">First Name:</label>
                  <input
                    type="text"
                    id="first_name"
                    value={newCustomer.first_name}
                    onChange={(e) => setNewCustomer({...newCustomer, first_name: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="last_name">Last Name:</label>
                  <input
                    type="text"
                    id="last_name"
                    value={newCustomer.last_name}
                    onChange={(e) => setNewCustomer({...newCustomer, last_name: e.target.value})}
                    required
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="email">Email:</label>
                <input
                  type="email"
                  id="email"
                  value={newCustomer.email}
                  onChange={(e) => setNewCustomer({...newCustomer, email: e.target.value})}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="address">Address:</label>
                <input
                  type="text"
                  id="address"
                  value={newCustomer.address}
                  onChange={(e) => setNewCustomer({...newCustomer, address: e.target.value})}
                  required
                />
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="city_id">City:</label>
                  <select
                    id="city_id"
                    value={newCustomer.city_id}
                    onChange={(e) => setNewCustomer({...newCustomer, city_id: e.target.value})}
                    required
                  >
                    <option value="">Select City</option>
                    {cities.map(city => (
                      <option key={city.city_id} value={city.city_id}>
                        {city.city}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="phone">Phone:</label>
                  <input
                    type="text"
                    id="phone"
                    value={newCustomer.phone}
                    onChange={(e) => setNewCustomer({...newCustomer, phone: e.target.value})}
                    required
                  />
                </div>
              </div>
              
              <div className="modal-actions">
                <button type="button" onClick={() => setShowAddModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Add Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Customer Modal */}
      {editingCustomer && (
        <div className="modal-overlay" onClick={() => setEditingCustomer(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit Customer</h3>
              <button onClick={() => setEditingCustomer(null)} className="close-btn">&times;</button>
            </div>
            <form onSubmit={handleEditCustomer} className="modal-body">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="edit_first_name">First Name:</label>
                  <input
                    type="text"
                    id="edit_first_name"
                    value={editingCustomer.first_name}
                    onChange={(e) => setEditingCustomer({...editingCustomer, first_name: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="edit_last_name">Last Name:</label>
                  <input
                    type="text"
                    id="edit_last_name"
                    value={editingCustomer.last_name}
                    onChange={(e) => setEditingCustomer({...editingCustomer, last_name: e.target.value})}
                    required
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="edit_email">Email:</label>
                <input
                  type="email"
                  id="edit_email"
                  value={editingCustomer.email}
                  onChange={(e) => setEditingCustomer({...editingCustomer, email: e.target.value})}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="edit_active">Status:</label>
                <select
                  id="edit_active"
                  value={editingCustomer.active}
                  onChange={(e) => setEditingCustomer({...editingCustomer, active: e.target.value === 'true'})}
                >
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>
              
              <div className="modal-actions">
                <button type="button" onClick={() => setEditingCustomer(null)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Update Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomersPage;