# Quick Start Guide

Get your Prompt Dashboard up and running in 5 minutes!

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Configure Your Database

Create a `.env` file in the root directory:

```bash
cp .env.sample .env
```

Edit the `.env` file with your database credentials and OpenAI API key:

```env
OPENAI_API_KEY=sk-your-actual-key
DB_HOST=localhost
DB_PORT=5432
DB_NAME=mydatabase
DB_USER=myuser
DB_PASSWORD=mypassword
PORT=3000
```

## Step 3: Start the Server

```bash
npm start
```

Or use development mode with auto-reload:

```bash
npm run dev
```

## Step 4: Open the Dashboard

Visit: **http://localhost:3000**

## Try These Example Queries

1. "Show me all tables in the database"
2. "List the first 10 rows from the users table"
3. "Count how many records are in each table"
4. "What is the database schema?"

## Need Help?

- Check `SETUP.md` for detailed instructions
- Verify your database is running: `psql -U youruser -d yourdatabase`
- Check server logs in the terminal for errors
- Ensure your OpenAI API key is valid

## Testing the API Directly

You can also test the API using cURL:

```bash
# Health check
curl http://localhost:3000/api/health

# Get schema
curl http://localhost:3000/api/schema

# Query with natural language
curl -X POST http://localhost:3000/api/query \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Show me all tables"}'

# Execute raw SQL
curl -X POST http://localhost:3000/api/execute \
  -H "Content-Type: application/json" \
  -d '{"sql": "SELECT * FROM users LIMIT 5"}'
```

## Common Issues

**"Database Disconnected"**: Check your database credentials in `.env`

**"OpenAI API Error"**: Verify your API key is correct and has credits

**Port already in use**: Change PORT in `.env` to a different number

Enjoy your AI-powered database dashboard! 🚀

