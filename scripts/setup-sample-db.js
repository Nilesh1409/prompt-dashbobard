const fs = require('fs');
const path = require('path');
const { pool } = require('../config/database');
require('dotenv').config();

async function setupSampleDatabase() {
  console.log('🚀 Setting up sample database...\n');

  try {
    // Read the SQL file
    const sqlFilePath = path.join(__dirname, '..', 'sample_data.sql');
    const sql = fs.readFileSync(sqlFilePath, 'utf8');

    // Execute the SQL
    console.log('📝 Executing SQL script...');
    await pool.query(sql);

    console.log('✅ Sample database setup completed successfully!\n');
    
    // Get summary
    const userCount = await pool.query('SELECT COUNT(*) FROM users');
    const productCount = await pool.query('SELECT COUNT(*) FROM products');
    const orderCount = await pool.query('SELECT COUNT(*) FROM orders');

    console.log('📊 Database Summary:');
    console.log(`   - Users: ${userCount.rows[0].count}`);
    console.log(`   - Products: ${productCount.rows[0].count}`);
    console.log(`   - Orders: ${orderCount.rows[0].count}`);
    console.log('\n✨ You can now start querying your database!\n');

    console.log('💡 Try these example queries:');
    console.log('   - "Show me all users"');
    console.log('   - "What are the top 5 products by revenue?"');
    console.log('   - "List all orders from the last 7 days"');
    console.log('   - "Show me user order summary"');
    console.log('   - "Which users have spent the most?"');

  } catch (error) {
    console.error('❌ Error setting up database:', error.message);
    console.error('\nPlease check:');
    console.error('   1. Your database is running');
    console.error('   2. Your .env file has correct credentials');
    console.error('   3. The database exists');
    process.exit(1);
  } finally {
    await pool.end();
  }
}

setupSampleDatabase();

