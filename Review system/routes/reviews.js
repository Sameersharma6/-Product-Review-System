const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Middleware to authenticate user
const auth = async (req, res, next) => {
  try {
    const token = req.header('x-auth-token');
    
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.id, isAdmin: decoded.isAdmin };
    next();
  } catch (err) {
    console.error(err.message);
    res.status(401).json({ message: 'Token is not valid' });
  }
};

// Get reviews for a product
router.get('/product/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    const { sort } = req.query;
    
    let orderClause = 'r.created_at DESC';
    
    if (sort === 'highest') {
      orderClause = 'r.rating DESC, r.created_at DESC';
    } else if (sort === 'lowest') {
      orderClause = 'r.rating ASC, r.created_at DESC';
    }
    
    const query = `
      SELECT r.*, u.username 
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      WHERE r.product_id = $1
      ORDER BY ${orderClause}
    `;
    
    const result = await pool.query(query, [productId]);
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new review
router.post('/', auth, async (req, res) => {
  try {
    const { productId, rating, title, comment } = req.body;
    const userId = req.user.id;
    
    // Check if user has already reviewed this product
    const existingReview = await pool.query(
      'SELECT * FROM reviews WHERE product_id = $1 AND user_id = $2',
      [productId, userId]
    );
    
    if (existingReview.rows.length > 0) {
      return res.status(400).json({ message: 'You have already reviewed this product' });
    }
    
    // Create review
    const newReview = await pool.query(
      'INSERT INTO reviews (product_id, user_id, rating, title, comment) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [productId, userId, rating, title, comment]
    );
    
    // Get username for the response
    const userResult = await pool.query('SELECT username FROM users WHERE id = $1', [userId]);
    
    const review = newReview.rows[0];
    review.username = userResult.rows[0].username;
    
    res.status(201).json(review);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update a review
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, title, comment } = req.body;
    const userId = req.user.id;
    
    // Check if review exists and belongs to user
    const reviewCheck = await pool.query(
      'SELECT * FROM reviews WHERE id = $1',
      [id]
    );
    
    if (reviewCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Review not found' });
    }
    
    if (reviewCheck.rows[0].user_id !== userId && !req.user.isAdmin) {
      return res.status(403).json({ message: 'Not authorized to update this review' });
    }
    
    // Update review
    const updatedReview = await pool.query(
      'UPDATE reviews SET rating = $1, title = $2, comment = $3 WHERE id = $4 RETURNING *',
      [rating, title, comment, id]
    );
    
    // Get username for the response
    const userResult = await pool.query('SELECT username FROM users WHERE id = $1', [userId]);
    
    const review = updatedReview.rows[0];
    review.username = userResult.rows[0].username;
    
    res.json(review);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a review
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Check if review exists and belongs to user
    const reviewCheck = await pool.query(
      'SELECT * FROM reviews WHERE id = $1',
      [id]
    );
    
    if (reviewCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Review not found' });
    }
    
    if (reviewCheck.rows[0].user_id !== userId && !req.user.isAdmin) {
      return res.status(403).json({ message: 'Not authorized to delete this review' });
    }
    
    // Delete review
    await pool.query('DELETE FROM reviews WHERE id = $1', [id]);
    
    res.json({ message: 'Review deleted successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;