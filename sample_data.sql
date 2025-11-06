-- Sample Database Schema and Data
-- This is a simple example to help you test the dashboard

-- Create sample tables
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    stock_quantity INTEGER DEFAULT 0,
    category VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    total_amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id),
    product_id INTEGER REFERENCES products(id),
    quantity INTEGER NOT NULL,
    price DECIMAL(10, 2) NOT NULL
);

-- Insert sample users
INSERT INTO users (name, email, status) VALUES
    ('John Doe', 'john.doe@example.com', 'active'),
    ('Jane Smith', 'jane.smith@example.com', 'active'),
    ('Bob Johnson', 'bob.johnson@example.com', 'active'),
    ('Alice Williams', 'alice.williams@example.com', 'inactive'),
    ('Charlie Brown', 'charlie.brown@example.com', 'active'),
    ('Diana Prince', 'diana.prince@example.com', 'active'),
    ('Ethan Hunt', 'ethan.hunt@example.com', 'active'),
    ('Fiona Green', 'fiona.green@example.com', 'inactive'),
    ('George Miller', 'george.miller@example.com', 'active'),
    ('Hannah Davis', 'hannah.davis@example.com', 'active')
ON CONFLICT (email) DO NOTHING;

-- Insert sample products
INSERT INTO products (name, description, price, stock_quantity, category) VALUES
    ('Laptop Pro 15', 'High-performance laptop for professionals', 1299.99, 50, 'Electronics'),
    ('Wireless Mouse', 'Ergonomic wireless mouse', 29.99, 200, 'Electronics'),
    ('USB-C Cable', 'Fast charging USB-C cable', 12.99, 500, 'Accessories'),
    ('Desk Chair', 'Comfortable office chair', 249.99, 30, 'Furniture'),
    ('Standing Desk', 'Adjustable height standing desk', 499.99, 15, 'Furniture'),
    ('Monitor 27"', '4K Ultra HD monitor', 399.99, 75, 'Electronics'),
    ('Keyboard Mechanical', 'RGB mechanical keyboard', 89.99, 120, 'Electronics'),
    ('Webcam HD', '1080p webcam with microphone', 59.99, 80, 'Electronics'),
    ('Desk Lamp', 'LED desk lamp with USB port', 34.99, 150, 'Accessories'),
    ('Headphones Pro', 'Noise-cancelling headphones', 199.99, 60, 'Electronics')
ON CONFLICT DO NOTHING;

-- Insert sample orders
INSERT INTO orders (user_id, total_amount, status, order_date) VALUES
    (1, 1329.98, 'completed', NOW() - INTERVAL '5 days'),
    (2, 529.98, 'completed', NOW() - INTERVAL '4 days'),
    (3, 89.99, 'shipped', NOW() - INTERVAL '3 days'),
    (1, 449.98, 'pending', NOW() - INTERVAL '2 days'),
    (4, 1699.98, 'completed', NOW() - INTERVAL '10 days'),
    (5, 199.99, 'shipped', NOW() - INTERVAL '1 day'),
    (6, 749.97, 'completed', NOW() - INTERVAL '7 days'),
    (7, 42.98, 'pending', NOW()),
    (8, 899.97, 'completed', NOW() - INTERVAL '15 days'),
    (9, 289.98, 'shipped', NOW() - INTERVAL '6 days')
ON CONFLICT DO NOTHING;

-- Insert sample order items
INSERT INTO order_items (order_id, product_id, quantity, price) VALUES
    (1, 1, 1, 1299.99),
    (1, 2, 1, 29.99),
    (2, 5, 1, 499.99),
    (2, 2, 1, 29.99),
    (3, 7, 1, 89.99),
    (4, 6, 1, 399.99),
    (4, 4, 1, 49.99),
    (5, 1, 1, 1299.99),
    (5, 6, 1, 399.99),
    (6, 10, 1, 199.99),
    (7, 5, 1, 499.99),
    (7, 4, 1, 249.99),
    (8, 3, 1, 12.99),
    (8, 2, 1, 29.99),
    (9, 1, 1, 1299.99),
    (9, 7, 1, 89.99),
    (9, 10, 1, 199.99)
ON CONFLICT DO NOTHING;

-- Create some useful views
CREATE OR REPLACE VIEW user_order_summary AS
SELECT 
    u.id,
    u.name,
    u.email,
    COUNT(o.id) as total_orders,
    COALESCE(SUM(o.total_amount), 0) as total_spent
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
GROUP BY u.id, u.name, u.email;

CREATE OR REPLACE VIEW product_sales AS
SELECT 
    p.id,
    p.name,
    p.category,
    p.price,
    COALESCE(SUM(oi.quantity), 0) as units_sold,
    COALESCE(SUM(oi.quantity * oi.price), 0) as total_revenue
FROM products p
LEFT JOIN order_items oi ON p.id = oi.product_id
GROUP BY p.id, p.name, p.category, p.price
ORDER BY total_revenue DESC;

-- Display summary
SELECT 'Sample data loaded successfully!' as message;
SELECT COUNT(*) as user_count FROM users;
SELECT COUNT(*) as product_count FROM products;
SELECT COUNT(*) as order_count FROM orders;

