const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Get all products
router.get('/', async (req, res) => {
  try {
    const { category, search } = req.query;
    let query = `
      SELECT p.*, c.name as category_name, 
      COALESCE(AVG(r.rating), 0) as average_rating,
      COUNT(r.id) as review_count
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN reviews r ON p.id = r.product_id
    `;
    
    const queryParams = [];
    let whereClause = [];
    
    // Add category filter
    if (category) {
      queryParams.push(category);
      whereClause.push(`c.id = $${queryParams.length}`);
    }
    
    // Add search filter
    if (search) {
      queryParams.push(`%${search}%`);
      whereClause.push(`(p.name ILIKE $${queryParams.length} OR p.description ILIKE $${queryParams.length})`);
    }
    
    // Combine all WHERE conditions
    if (whereClause.length > 0) {
      query += ` WHERE ${whereClause.join(' AND ')}`;
    }
    
    query += ` GROUP BY p.id, c.name ORDER BY p.created_at DESC`;
    
    const result = await pool.query(query, queryParams);
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get product by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const productQuery = `
      SELECT p.*, c.name as category_name, 
      COALESCE(AVG(r.rating), 0) as average_rating,
      COUNT(r.id) as review_count
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN reviews r ON p.id = r.product_id
      WHERE p.id = $1
      GROUP BY p.id, c.name
    `;
    
    const productResult = await pool.query(productQuery, [id]);
    
    if (productResult.rows.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    // Get reviews for the product
    const reviewsQuery = `
      SELECT r.*, u.username 
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      WHERE r.product_id = $1
      ORDER BY r.created_at DESC
    `;
    
    const reviewsResult = await pool.query(reviewsQuery, [id]);
    
    const product = productResult.rows[0];
    product.reviews = reviewsResult.rows;
    
    res.json(product);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin routes for product management
// These would require authentication and admin role checks

module.exports = router;