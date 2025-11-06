# 🤖 AI-Powered Prompt Dashboard

A full-fledged Node.js application that allows you to query your PostgreSQL database using natural language. Built with OpenAI GPT-4, Express.js, and a modern web interface.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-ISC-green.svg)

## ✨ Features

- 🗣️ **Natural Language Queries**: Ask questions in plain English and get SQL results
- 🤖 **AI-Powered**: Uses OpenAI GPT-4 to convert prompts to SQL
- 📊 **Interactive Dashboard**: Modern, responsive web interface
- 🔍 **Database Explorer**: Browse your database schema and statistics
- 💾 **Query History**: Keep track of your previous queries
- ⚡ **Real-time Results**: Fast query execution with detailed metrics
- 🎨 **Beautiful UI**: Modern design with intuitive user experience
- 🔒 **Safe Operations**: Built-in protection against destructive queries

## 🏗️ Architecture

```
├── config/              # Configuration files
│   ├── database.js      # PostgreSQL connection setup
│   └── env.template     # Environment variables template
├── services/            # Business logic
│   ├── openaiService.js # OpenAI integration for SQL generation
│   └── mcpService.js    # Database query execution and schema management
├── middleware/          # Express middleware
│   └── validation.js    # Request validation
├── utils/              # Utility functions
│   ├── logger.js       # Logging utility
│   └── errorHandler.js # Error handling
├── public/             # Frontend assets
│   ├── index.html      # Main dashboard UI
│   ├── styles.css      # Styling
│   └── app.js          # Frontend JavaScript
├── scripts/            # Helper scripts
│   └── setup-sample-db.js # Sample database setup
├── server.js           # Express server and API endpoints
└── sample_data.sql     # Sample database schema and data
```

## 🚀 Quick Start

### Prerequisites

- Node.js 14+ installed
- PostgreSQL database running
- OpenAI API key ([Get one here](https://platform.openai.com/api-keys))

### Installation

1. **Clone or navigate to the project directory**

```bash
cd "Prompt Dashboard"
```

2. **Install dependencies**

```bash
npm install
```

3. **Configure environment variables**

Create a `.env` file in the root directory:

```env
OPENAI_API_KEY=sk-your-actual-openai-key-here
DB_HOST=localhost
DB_PORT=5432
DB_NAME=your_database_name
DB_USER=your_database_user
DB_PASSWORD=your_database_password
PORT=3000
NODE_ENV=development
```

4. **(Optional) Set up sample database**

If you want to test with sample data:

```bash
npm run setup-sample-db
```

5. **Start the server**

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

6. **Open the dashboard**

Visit [http://localhost:3000](http://localhost:3000) in your browser.

## 📖 Usage

### Natural Language Queries

Simply type your question in natural language:

- "Show me all users who signed up in the last 30 days"
- "What are the top 10 products by sales?"
- "Count the number of orders by status"
- "List all tables in the database"
- "Show me the database schema"

### Dashboard Features

1. **Results Tab**: View query results in a formatted table with execution metrics
2. **SQL Tab**: See the generated SQL query and AI explanation
3. **Schema Tab**: Browse your complete database schema
4. **Statistics Tab**: View table sizes and row counts
5. **Query History**: Access and reuse previous queries

### API Endpoints

The application provides a REST API:

#### Health Check
```bash
GET /api/health
```

#### Get Database Schema
```bash
GET /api/schema
```

#### Get Database Statistics
```bash
GET /api/stats
```

#### Natural Language Query
```bash
POST /api/query
Content-Type: application/json

{
  "prompt": "Show me all users"
}
```

#### Execute Raw SQL
```bash
POST /api/execute
Content-Type: application/json

{
  "sql": "SELECT * FROM users LIMIT 10"
}
```

## 🧪 Example Queries

Once you have the sample database set up, try these queries:

1. **Basic queries:**
   - "Show me all users"
   - "List all products"
   - "What tables exist in the database?"

2. **Aggregations:**
   - "Count total number of orders"
   - "What's the total revenue from all orders?"
   - "Show me the average product price by category"

3. **Filtering:**
   - "Show orders from the last 7 days"
   - "List products with stock less than 100"
   - "Find users with inactive status"

4. **Joins:**
   - "Show me all orders with customer names"
   - "Which users have never placed an order?"
   - "List the top 5 customers by total spending"

5. **Complex queries:**
   - "What's the most popular product category?"
   - "Show monthly order trends"
   - "Which products need restocking?"

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `OPENAI_API_KEY` | Your OpenAI API key | Required |
| `DB_HOST` | PostgreSQL host | localhost |
| `DB_PORT` | PostgreSQL port | 5432 |
| `DB_NAME` | Database name | Required |
| `DB_USER` | Database user | Required |
| `DB_PASSWORD` | Database password | Required |
| `PORT` | Server port | 3000 |
| `NODE_ENV` | Environment | development |

### Customizing OpenAI Model

Edit `services/openaiService.js` to change the model:

```javascript
model: 'gpt-4', // or 'gpt-3.5-turbo' for faster/cheaper queries
```

## 🛡️ Security Features

- **SQL Injection Protection**: Parameterized queries and input validation
- **Destructive Query Detection**: Warnings for DROP, DELETE, TRUNCATE operations
- **Input Sanitization**: All inputs are validated and sanitized
- **Error Handling**: Comprehensive error handling with helpful messages

## 📚 Documentation

- [Quick Start Guide](QUICKSTART.md) - Get started in 5 minutes
- [Setup Guide](SETUP.md) - Detailed setup instructions
- [Sample Data](sample_data.sql) - Sample database schema and data

## 🐛 Troubleshooting

### Database Connection Issues

**Symptom**: "Database Disconnected" in the dashboard

**Solutions**:
1. Verify database credentials in `.env`
2. Check PostgreSQL is running: `pg_isready`
3. Test connection: `psql -U youruser -d yourdatabase`
4. Check firewall settings

### OpenAI API Issues

**Symptom**: "Failed to generate SQL query"

**Solutions**:
1. Verify API key is valid
2. Check API usage limits at [OpenAI Platform](https://platform.openai.com/usage)
3. Ensure sufficient credits
4. Check network connectivity

### Port Already in Use

**Symptom**: `Error: listen EADDRINUSE: address already in use`

**Solution**: Change PORT in `.env` or kill the process using port 3000:
```bash
# Find process
lsof -ti:3000

# Kill process
kill -9 $(lsof -ti:3000)
```

## 🎨 Frontend Features

- **Responsive Design**: Works on desktop, tablet, and mobile
- **Dark Theme Code Display**: Beautiful SQL syntax highlighting
- **Real-time Updates**: Instant feedback and loading states
- **Query Suggestions**: Click-to-use example queries
- **Keyboard Shortcuts**: Ctrl+Enter to execute queries
- **Copy to Clipboard**: Easy SQL query copying

## 🔄 Integration with MCP

This application is designed to work with the Model Context Protocol (MCP) for PostgreSQL. The `mcpService.js` handles all database operations and can be extended to work with remote MCP servers.

### Using with Remote MCP Server

If you're using a separate MCP server, configure it in `.env`:

```env
MCP_SERVER_URL=http://your-mcp-server:3001
```

## 🚧 Future Enhancements

- [ ] User authentication and authorization
- [ ] Query result export (CSV, JSON, Excel)
- [ ] Saved queries and favorites
- [ ] Query visualization and charts
- [ ] Multi-database support
- [ ] Query scheduling
- [ ] Real-time collaboration
- [ ] Advanced SQL editor with autocomplete

## 📝 License

ISC License - Feel free to use this project for personal or commercial purposes.

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Report bugs
- Suggest features
- Submit pull requests

## 📧 Support

For issues and questions:
1. Check the documentation
2. Review server logs
3. Verify environment variables
4. Test database connection independently

## 🙏 Acknowledgments

- Built with [Express.js](https://expressjs.com/)
- Powered by [OpenAI](https://openai.com/)
- Database: [PostgreSQL](https://www.postgresql.org/)
- UI inspired by modern dashboard designs

---

Made with ❤️ for developers who love talking to their databases

**Happy Querying! 🚀**

# prompt-dashbobard
