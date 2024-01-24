import React, { useState, useEffect } from 'react';
import './App.css';
import {
  BrowserRouter as Router,
  Route,
  Link,
  Routes,
  Navigate,
} from 'react-router-dom';
import { FaEdit, FaTrash } from 'react-icons/fa';

const App = () => {
  // State for user authentication
  const [loggedIn, setLoggedIn] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  
  // State for products and admin status
  const [products, setProducts] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);

  // Effect to check user authentication and fetch products
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setLoggedIn(true);
      fetchProducts(token);
      checkAdminStatus();
    }
  }, []);

  // Function to handle user login
  const handleLogin = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          password: password,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setLoggedIn(true);
        localStorage.setItem('token', data.token);
        fetchProducts(data.token);
        checkAdminStatus();
      } else {
        console.error('Login failed');
      }
    } catch (error) {
      console.error('Error during login:', error);
    }
  };

  // Function to check admin status
  const checkAdminStatus = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/checkAdmin', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setIsAdmin(data.isAdmin);
      } else {
        console.error('Failed to check admin status');
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
    }
  };

  // Function to fetch products
  const fetchProducts = async (token) => {
    try {
      const response = await fetch('http://localhost:5000/api/products', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setProducts(data);
      } else {
        console.error('Failed to fetch products');
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  // Function to handle user signup
  const handleSignup = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name,
          email: email,
          password: password,
        }),
      });

      if (response.ok) {
        await handleLogin();
      } else {
        console.error('Signup failed');
      }
    } catch (error) {
      console.error('Error during signup:', error);
    }
  };

  // Function to handle user logout
  const handleLogout = () => {
    setLoggedIn(false);
    setEmail('');
    setPassword('');
    setName('');
    setProducts([]);
    setIsAdmin(false);
    localStorage.removeItem('token');
  };

  // Function to add a new product
  const addProduct = async (newProduct) => {
    try {
      const response = await fetch('http://localhost:5000/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(newProduct),
      });

      if (response.ok) {
        fetchProducts(localStorage.getItem('token'));
      } else {
        console.error('Product addition failed');
      }
    } catch (error) {
      console.error('Error during product addition:', error);
    }
  };

  // Function to delete a product
  const deleteProduct = async (productId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/products/${productId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        fetchProducts(localStorage.getItem('token'));
      } else {
        console.error('Product deletion failed');
      }
    } catch (error) {
      console.error('Error during product deletion:', error);
    }
  };

  // Function to update a product
  const updateProduct = async (productId, updatedProduct) => {
    try {
      const response = await fetch(`http://localhost:5000/api/products/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(updatedProduct),
      });

      if (response.ok) {
        fetchProducts(localStorage.getItem('token'));
      } else {
        console.error('Product update failed');
      }
    } catch (error) {
      console.error('Error during product update:', error);
    }
  };

  return (
    <Router>
      <div>
        {/* Navigation Bar */}
        <nav>
          <ul>
            <li>
              <Link to="/">Home</Link>
            </li>
            {loggedIn && (
              <>
                <li>
                  <Link to="/products">Products</Link>
                </li>
                {isAdmin && (
                  <li>
                    <Link to="/admin/products">Admin Products</Link>
                  </li>
                )}
              </>
            )}
            {!loggedIn && (
              <>
                <li>
                  <Link to="/login">Login</Link>
                </li>
                <li>
                  <Link to="/signup">Signup</Link>
                </li>
              </>
            )}
          </ul>
        </nav>

        {/* Routes */}
        <Routes>
          {/* Home Route */}
          <Route
            path="/"
            element={<Home loggedIn={loggedIn} handleLogout={handleLogout} />}
          />

          {/* Login Route */}
          <Route
            path="/login"
            element={
              loggedIn ? (
                <Navigate to="/" />
              ) : (
                <Login
                  email={email}
                  password={password}
                  setEmail={setEmail}
                  setPassword={setPassword}
                  handleLogin={handleLogin}
                />
              )
            }
          />

          {/* Signup Route */}
          <Route
            path="/signup"
            element={
              loggedIn ? (
                <Navigate to="/" />
              ) : (
                <Signup
                  name={name}
                  email={email}
                  password={password}
                  setName={setName}
                  setEmail={setEmail}
                  setPassword={setPassword}
                  handleSignup={handleSignup}
                />
              )
            }
          />

          {/* Products Route */}
          <Route
            path="/products"
            element={
              <Products
                products={products}
                isAdmin={isAdmin}
                addProduct={addProduct}
                deleteProduct={deleteProduct}
                updateProduct={updateProduct}
              />
            }
          />

          {/* Admin Products Route */}
          <Route
            path="/admin/products"
            element={<AdminProducts products={products} onDelete={deleteProduct} />}
          />
        </Routes>
      </div>
    </Router>
  );
};

// Home Component
const Home = ({ loggedIn, handleLogout }) => {
  return (
    <div>
      <h2>Home</h2>
      {loggedIn ? (
        <div>
          <p>Welcome, user!</p>
          <button onClick={handleLogout}>Logout</button>
        </div>
      ) : (
        <p>Please log in or sign up.</p>
      )}
    </div>
  );
};

// Authentication Form Component
const AuthForm = ({ title, name, email, password, setName, setEmail, setPassword, handleSubmit }) => {
  return (
    <div>
      <h2>{title}</h2>
      <form onSubmit={handleSubmit}>
        {title === 'Signup' && (
          <label>
            Name:
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
          </label>
        )}
        <br />
        <label>
          Email:
          <input type="text" value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <br />
        <label>
          Password:
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        <br />
        <button type="submit">{title}</button>
      </form>
    </div>
  );
};

// Login Component
const Login = ({ email, password, setEmail, setPassword, handleLogin }) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    handleLogin();
  };

  return (
    <AuthForm
      title="Login"
      email={email}
      password={password}
      setEmail={setEmail}
      setPassword={setPassword}
      handleSubmit={handleSubmit}
    />
  );
};

// Signup Component
const Signup = ({ name, email, password, setName, setEmail, setPassword, handleSignup }) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    handleSignup();
  };

  return (
    <AuthForm
      title="Signup"
      name={name}
      email={email}
      password={password}
      setName={setName}
      setEmail={setEmail}
      setPassword={setPassword}
      handleSubmit={handleSubmit}
    />
  );
};

// Products Component
const Products = ({ products, isAdmin, addProduct, deleteProduct, updateProduct }) => {
  return (
    <div>
      <h2>Products</h2>
      <table style={{ width: '80%', margin: 'auto', textAlign: 'center', borderCollapse: 'collapse', border: '1px solid #ddd' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #ddd' }}>
            <th style={{ padding: '10px' }}>Name 🛍️</th>
            <th style={{ padding: '10px' }}>Price 💰</th>
            <th style={{ padding: '10px' }}>Category 🏷️</th>
            <th style={{ padding: '10px' }}>Description 📝</th>
            {isAdmin && <th style={{ padding: '10px' }}>Actions 🔧</th>}
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr key={product.id} style={{ borderBottom: '1px solid #ddd' }}>
              <td style={{ padding: '10px' }}>{product.productName}</td>
              <td style={{ padding: '10px' }}>{product.productPrice}</td>
              <td style={{ padding: '10px' }}>{product.productCategory}</td>
              <td style={{ padding: '10px' }}>{product.productDescription}</td>
              <td style={{ padding: '10px' }}>
                <button onClick={() => updateProduct(product.id)}>Edit</button>
                <button style={{ color: 'white', backgroundColor: 'red', border: 'none', padding: '5px 10px', cursor: 'pointer', marginLeft: '5px' }} onClick={() => deleteProduct(product.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Admin Products Component
const AdminProducts = ({ products, onDelete }) => {
  return (
    <div>
      <h2>Admin Products</h2>
      <table style={{ width: '80%', margin: 'auto', textAlign: 'center', borderCollapse: 'collapse', border: '1px solid #ddd' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #ddd' }}>
            <th style={{ padding: '10px' }}>Name 🛍️</th>
            <th style={{ padding: '10px' }}>Price 💰</th>
            <th style={{ padding: '10px' }}>Category 🏷️</th>
            <th style={{ padding: '10px' }}>Description 📝</th>
            <th style={{ padding: '10px' }}>Actions 🔧</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr key={product.id} style={{ borderBottom: '1px solid #ddd' }}>
              <td style={{ padding: '10px' }}>{product.productName}</td>
              <td style={{ padding: '10px' }}>{product.productPrice}</td>
              <td style={{ padding: '10px' }}>{product.productCategory}</td>
              <td style={{ padding: '10px' }}>{product.productDescription}</td>
              <td style={{ padding: '10px' }}>
                <button style={{ color: 'white', backgroundColor: 'red', border: 'none', padding: '5px 10px', cursor: 'pointer', marginRight: '5px' }} onClick={() => onDelete(product.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};


export default App;
