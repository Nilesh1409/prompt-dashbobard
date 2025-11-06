# Prompt Dashboard Setup Guide

This guide will help you set up and run the AI-powered database dashboard.

## Prerequisites

- Node.js (v14 or higher)
- PostgreSQL database
- OpenAI API key

## Installation Steps

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the root directory with your configuration:

```bash
# Copy the template
cp config/env.template .env
```

Then edit `.env` with your actual values:

```env
OPENAI_API_KEY=sk-your-actual-openai-key
DB_HOST=localhost
DB_PORT=5432
DB_NAME=your_database
DB_USER=your_username
DB_PASSWORD=your_password
PORT=3000
```

### 3. Set Up PostgreSQL Database

Make sure you have a PostgreSQL database running and accessible. You can use an existing database or create a new one:

```sql
CREATE DATABASE your_database;
```

### 4. Test Database Connection

You can test your database connection by running:

```bash
node -e "require('./config/database').testConnection()"
```

### 5. Start the Server

Development mode (with auto-restart):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

## Accessing the Dashboard

Once the server is running, open your browser and navigate to:

```
http://localhost:3000
```

You should see the dashboard interface.

## Using the Dashboard

### Natural Language Queries

Simply type your question in plain English, for example:

- "Show me all users who signed up in the last 30 days"
- "What are the top 10 products by sales?"
- "Count the number of orders by status"
- "List all tables in the database"

### Features

1. **Results Tab**: View query results in a formatted table
2. **SQL Tab**: See the generated SQL query and explanation
3. **Schema Tab**: Browse your database schema
4. **Statistics Tab**: View database statistics and table sizes
5. **Query History**: Access your previous queries

### API Endpoints

The application provides several API endpoints:

- `GET /api/health` - Check server and database status
- `GET /api/schema` - Get database schema information
- `GET /api/stats` - Get database statistics
- `POST /api/query` - Execute natural language query
  ```json
  {
    "prompt": "Show me all users"
  }
  ```
- `POST /api/execute` - Execute raw SQL query
  ```json
  {
    "sql": "SELECT * FROM users LIMIT 10"
  }
  ```

## Troubleshooting

### Database Connection Issues

If you see "Database Disconnected" in the status bar:

1. Verify your `.env` file has correct database credentials
2. Ensure PostgreSQL is running
3. Check that the database exists and is accessible
4. Verify network connectivity to the database

### OpenAI API Issues

If queries fail to generate SQL:

1. Verify your OpenAI API key is valid
2. Check that you have sufficient API credits
3. Review the server logs for specific error messages

### Port Already in Use

If port 3000 is already in use, change the PORT in your `.env` file:

```env
PORT=3001
```

## Security Considerations

1. **Never commit your `.env` file** - It contains sensitive credentials
2. **Destructive queries** - The app warns about DELETE, DROP, etc., but consider adding authentication for production
3. **SQL Injection** - The app uses parameterized queries where possible
4. **Rate Limiting** - Consider adding rate limiting for production deployments

## Advanced Configuration

### Using with MCP PostgreSQL Server

If you're using a separate MCP PostgreSQL server, configure the URL:

```env
MCP_SERVER_URL=http://your-mcp-server:3001
```

### Custom OpenAI Model

Edit `services/openaiService.js` to change the model:

```javascript
model: 'gpt-3.5-turbo', // or 'gpt-4-turbo-preview'
```

## Sample Database Setup

If you want to test with sample data, you can create a simple users table:

```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    email VARCHAR(100) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO users (name, email) VALUES
    ('John Doe', 'john@example.com'),
    ('Jane Smith', 'jane@example.com'),
    ('Bob Johnson', 'bob@example.com');
```

## Support

For issues or questions:
1. Check the console logs in the browser (F12)
2. Check the server logs in the terminal
3. Verify all environment variables are set correctly

