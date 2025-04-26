-- Create users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create categories table
CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT
);

-- Create products table
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  image_url VARCHAR(255),
  category_id INTEGER REFERENCES categories(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create reviews table
CREATE TABLE reviews (
  id SERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
  title VARCHAR(255),
  comment TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_verified BOOLEAN DEFAULT FALSE
);

-- Insert sample categories
INSERT INTO categories (name, description) 
VALUES 
  ('Electronics', 'Electronic devices and gadgets'),
  ('Clothing', 'Apparel and fashion items'),
  ('Home & Kitchen', 'Home decor and kitchen appliances'),
  ('Books', 'Books and literature');

-- Insert sample products
INSERT INTO products (name, description, price, image_url, category_id) 
VALUES 
  ('Smartphone X', 'Latest smartphone with advanced features', 999.99, 'https://images.pexels.com/photos/1092644/pexels-photo-1092644.jpeg', 1),
  ('Laptop Pro', 'Professional laptop for work and entertainment', 1299.99, 'https://images.pexels.com/photos/7974/pexels-photo.jpg', 1),
  ('Wireless Headphones', 'Premium wireless headphones with noise cancellation', 249.99, 'https://images.pexels.com/photos/3394665/pexels-photo-3394665.jpeg', 1),
  ('Summer Dress', 'Comfortable summer dress for casual wear', 59.99, 'https://images.pexels.com/photos/291762/pexels-photo-291762.jpeg', 2),
  ('Coffee Maker', 'Automatic coffee maker for your morning brew', 89.99, 'https://images.pexels.com/photos/585753/pexels-photo-585753.jpeg', 3),
  ('Fiction Novel', 'Bestselling fiction novel of the year', 19.99, 'https://images.pexels.com/photos/256450/pexels-photo-256450.jpeg', 4);