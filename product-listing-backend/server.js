// server.js

const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const PORT = 5000;

// Connect to MySQL (Assuming MySQL is running locally)
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '', // Replace with your MySQL password
  database: 'product_listing',
});

db.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
  } else {
    console.log('Connected to MySQL');
  }
});

// Define User Table
const createUserTable = `
  CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL
  )
`;
db.query(createUserTable, (err) => {
  if (err) {
    console.error('Error creating user table:', err);
  } else {
    console.log('User table created');
  }
});

// Define Product Table
const createProductTable = `
  CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    productName VARCHAR(255) NOT NULL,
    productPrice INT NOT NULL,
    productCategory VARCHAR(255) NOT NULL,
    productDescription VARCHAR(255) NOT NULL,
    userId INT,
    isAdmin BOOLEAN,
    FOREIGN KEY (userId) REFERENCES users(id)
  )
`;
db.query(createProductTable, (err) => {
  if (err) {
    console.error('Error creating product table:', err);
  } else {
    console.log('Product table created');
  }
});

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Authentication Middleware
function authenticateToken(req, res, next) {
  // Extract the token from the Authorization header
  const token = req.header('Authorization');

  // Check if the token exists
  if (!token) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  // Verify the token
  jwt.verify(token, 'secret_key', (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    // Attach the user object to the request for further use
    req.user = user;
    next();
  });
}


// User Signup
app.post('/api/signup', async (req, res) => {
  const { name, email, password } = req.body;

  // Validate input
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Please provide all required fields' });
  }

  // Check if the email is already registered
  const checkEmailQuery = 'SELECT * FROM users WHERE email = ?';
  db.query(checkEmailQuery, [email], (err, results) => {
    if (err) {
      console.error('Error checking email:', err);
      return res.status(500).json({ message: 'Internal server error' });
    }

    if (results.length > 0) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Hash the password
    bcrypt.hash(password, 10, (hashErr, hashedPassword) => {
      if (hashErr) {
        console.error('Error hashing password:', hashErr);
        return res.status(500).json({ message: 'Internal server error' });
      }

      // Create a new user
      const insertUserQuery = 'INSERT INTO users (name, email, password) VALUES (?, ?, ?)';
      db.query(insertUserQuery, [name, email, hashedPassword], (insertErr) => {
        if (insertErr) {
          console.error('Error inserting user:', insertErr);
          return res.status(500).json({ message: 'Internal server error' });
        }

        return res.status(201).json({ message: 'User registered successfully' });
      });
    });
  });
});

// User Login
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  // Validate input
  if (!email || !password) {
    return res.status(400).json({ message: 'Please provide all required fields' });
  }

  // Check if the email exists
  const getUserQuery = 'SELECT * FROM users WHERE email = ?';
  db.query(getUserQuery, [email], (err, results) => {
    if (err) {
      console.error('Error getting user:', err);
      return res.status(500).json({ message: 'Internal server error' });
    }

    if (results.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = results[0];

    // Check password
    bcrypt.compare(password, user.password, (compareErr, isPasswordValid) => {
      if (compareErr) {
        console.error('Error comparing passwords:', compareErr);
        return res.status(500).json({ message: 'Internal server error' });
      }

      if (!isPasswordValid) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Generate and send JWT token
      const token = jwt.sign({ userId: user.id }, 'secret_key');
      res.json({ token });
    });
  });
});

// Product CRUD APIs

// Product Create
app.post('/api/products', (req, res) => {
  const { productName, productPrice, productCategory, productDescription } = req.body;

  // Validate input
  if (!productName || !productPrice || !productCategory || !productDescription) {
    return res.status(400).json({ message: 'Please provide all required fields' });
  }

  // Insert new product
  const insertProductQuery = `
    INSERT INTO products (productName, productPrice, productCategory, productDescription)
    VALUES (?, ?, ?, ?)
  `;

  db.query(
    insertProductQuery,
    [productName, productPrice, productCategory, productDescription],
    (err) => {
      if (err) {
        console.error('Error inserting product:', err);
        return res.status(500).json({ message: 'Internal server error' });
      }

      return res.status(201).json({ message: 'Product created successfully' });
    }
  );
});

// Get All Products
app.get('/api/products', (req, res) => {
  // Fetch all products
  const getProductsQuery = 'SELECT * FROM products';

  db.query(getProductsQuery, (err, results) => {
    if (err) {
      console.error('Error getting products:', err);
      return res.status(500).json({ message: 'Internal server error' });
    }

    return res.json(results);
  });
});

// Get Single Product
app.get('/api/products/:productId', (req, res) => {
  const productId = req.params.productId;

  // Fetch a single product based on productId
  const getProductQuery = 'SELECT * FROM products WHERE id = ?';

  db.query(getProductQuery, [productId], (err, results) => {
    if (err) {
      console.error('Error getting product:', err);
      return res.status(500).json({ message: 'Internal server error' });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    return res.json(results[0]);
  });
});

// Update Product
app.put('/api/products/:productId', (req, res) => {
  const productId = req.params.productId;
  const { productName, productPrice, productCategory, productDescription } = req.body;

  // Validate input
  if (!productName || !productPrice || !productCategory || !productDescription) {
    return res.status(400).json({ message: 'Please provide all required fields' });
  }

  // Update product
  const updateProductQuery = `
    UPDATE products
    SET productName = ?, productPrice = ?, productCategory = ?, productDescription = ?
    WHERE id = ?
  `;
  db.query(
    updateProductQuery,
    [productName, productPrice, productCategory, productDescription, productId],
    (err) => {
      if (err) {
        console.error('Error updating product:', err);
        return res.status(500).json({ message: 'Internal server error' });
      }

      return res.json({ message: 'Product updated successfully' });
    }
  );
});

// Delete Product
app.delete('/api/products/:productId', (req, res) => {
  const productId = req.params.productId;

  // Delete product
  const deleteProductQuery = 'DELETE FROM products WHERE id = ?';

  db.query(deleteProductQuery, [productId], (err) => {
    if (err) {
      console.error('Error deleting product:', err);
      return res.status(500).json({ message: 'Internal server error' });
    }

    return res.json({ message: 'Product deleted successfully' });
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
