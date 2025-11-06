# API Testing Guide with cURL

Complete cURL commands to test all API endpoints with expected success and error responses.

---

## 1. Health Check API

### ✅ Success Request
```bash
curl -X GET http://localhost:3000/api/health
```

**Success Response (200):**
```json
{
  "status": "ok",
  "database": "connected",
  "timestamp": "2025-11-03T10:30:00.000Z"
}
```

**Error Response (200 but disconnected):**
```json
{
  "status": "ok",
  "database": "disconnected",
  "timestamp": "2025-11-03T10:30:00.000Z"
}
```

---

## 2. Get Database Schema API

### ✅ Success Request
```bash
curl -X GET http://localhost:3000/api/schema
```

**Success Response (200):**
```json
{
  "success": true,
  "schema": {
    "users": [
      {
        "column": "id",
        "type": "integer",
        "nullable": false
      },
      {
        "column": "name",
        "type": "character varying",
        "nullable": false
      }
    ],
    "products": [
      {
        "column": "id",
        "type": "integer",
        "nullable": false
      }
    ]
  },
  "formatted": "Available Tables:\n\nTable: users\n  - id (integer)\n  - name (character varying)\n\nTable: products\n  - id (integer)\n"
}
```

**Error Response (500):**
```json
{
  "success": false,
  "error": "Error fetching schema: connection timeout"
}
```

---

## 3. Get Database Statistics API

### ✅ Success Request
```bash
curl -X GET http://localhost:3000/api/stats
```

**Success Response (200):**
```json
{
  "success": true,
  "stats": [
    {
      "schemaname": "public",
      "tablename": "users",
      "size": "32 kB",
      "row_count": 150
    },
    {
      "schemaname": "public",
      "tablename": "products",
      "size": "16 kB",
      "row_count": 50
    }
  ]
}
```

**Error Response (500):**
```json
{
  "success": false,
  "error": "Error fetching table stats: permission denied"
}
```

---

## 4. Natural Language Query API

### ✅ Success Request
```bash
curl -X POST http://localhost:3000/api/query \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Show me all tables in the database"
  }'
```

**Success Response (200):**
```json
{
  "success": true,
  "prompt": "Show me all tables in the database",
  "generatedSQL": "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name LIMIT 100;",
  "explanation": "This query retrieves a list of all tables in the public schema of your database. It queries the information_schema.tables system catalog and filters for tables in the 'public' schema, returning the table names in alphabetical order, limited to 100 results.",
  "results": {
    "rows": [
      { "table_name": "users" },
      { "table_name": "products" },
      { "table_name": "orders" }
    ],
    "rowCount": 3,
    "executionTime": 45,
    "fields": ["table_name"]
  }
}
```

### ✅ More Example Queries

**Example 1: Count records**
```bash
curl -X POST http://localhost:3000/api/query \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Count total number of users"
  }'
```

**Example 2: Get recent data**
```bash
curl -X POST http://localhost:3000/api/query \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Show me users created in the last 7 days"
  }'
```

**Example 3: Aggregation**
```bash
curl -X POST http://localhost:3000/api/query \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "What is the average price of products by category?"
  }'
```

**Example 4: Join query**
```bash
curl -X POST http://localhost:3000/api/query \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Show me all orders with customer names"
  }'
```

### ❌ Error Response: Missing Prompt (400)
```bash
curl -X POST http://localhost:3000/api/query \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Error Response (400):**
```json
{
  "success": false,
  "error": "Prompt is required"
}
```

### ❌ Error Response: SQL Generation Failed (500)
```bash
curl -X POST http://localhost:3000/api/query \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Show me data from a table that does not exist xyz123"
  }'
```

**Error Response (400):**
```json
{
  "success": false,
  "error": "relation \"xyz123\" does not exist",
  "detail": "No additional details available",
  "generatedSQL": "SELECT * FROM xyz123 LIMIT 100;"
}
```

### ❌ Error Response: Invalid OpenAI API Key (500)
```json
{
  "success": false,
  "error": "Failed to generate SQL query"
}
```

---

## 5. Direct SQL Execution API

### ✅ Success Request: SELECT Query
```bash
curl -X POST http://localhost:3000/api/execute \
  -H "Content-Type: application/json" \
  -d '{
    "sql": "SELECT * FROM users LIMIT 5"
  }'
```

**Success Response (200):**
```json
{
  "success": true,
  "results": {
    "rows": [
      {
        "id": 1,
        "name": "John Doe",
        "email": "john@example.com",
        "created_at": "2025-10-15T08:30:00.000Z"
      },
      {
        "id": 2,
        "name": "Jane Smith",
        "email": "jane@example.com",
        "created_at": "2025-10-16T09:45:00.000Z"
      }
    ],
    "rowCount": 2,
    "executionTime": 12,
    "fields": ["id", "name", "email", "created_at"]
  }
}
```

### ✅ Success Request: COUNT Query
```bash
curl -X POST http://localhost:3000/api/execute \
  -H "Content-Type: application/json" \
  -d '{
    "sql": "SELECT COUNT(*) as total_users FROM users"
  }'
```

**Success Response (200):**
```json
{
  "success": true,
  "results": {
    "rows": [
      { "total_users": "150" }
    ],
    "rowCount": 1,
    "executionTime": 8,
    "fields": ["total_users"]
  }
}
```

### ✅ Success Request: JOIN Query
```bash
curl -X POST http://localhost:3000/api/execute \
  -H "Content-Type: application/json" \
  -d '{
    "sql": "SELECT u.name, COUNT(o.id) as order_count FROM users u LEFT JOIN orders o ON u.id = o.user_id GROUP BY u.name ORDER BY order_count DESC LIMIT 10"
  }'
```

### ❌ Error Response: Missing SQL (400)
```bash
curl -X POST http://localhost:3000/api/execute \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Error Response (400):**
```json
{
  "success": false,
  "error": "SQL query is required"
}
```

### ❌ Error Response: SQL Syntax Error (400)
```bash
curl -X POST http://localhost:3000/api/execute \
  -H "Content-Type: application/json" \
  -d '{
    "sql": "SELECT * FORM users"
  }'
```

**Error Response (400):**
```json
{
  "success": false,
  "error": "syntax error at or near \"FORM\"",
  "detail": "No additional details available"
}
```

### ❌ Error Response: Table Not Found (400)
```bash
curl -X POST http://localhost:3000/api/execute \
  -H "Content-Type: application/json" \
  -d '{
    "sql": "SELECT * FROM nonexistent_table"
  }'
```

**Error Response (400):**
```json
{
  "success": false,
  "error": "relation \"nonexistent_table\" does not exist",
  "detail": "No additional details available"
}
```

### ⚠️ Warning: Destructive Query (READ-ONLY will fail)
```bash
curl -X POST http://localhost:3000/api/execute \
  -H "Content-Type: application/json" \
  -d '{
    "sql": "DELETE FROM users WHERE id = 1"
  }'
```

**Error Response (400) - Since you have read-only credentials:**
```json
{
  "success": false,
  "error": "permission denied for table users",
  "detail": "No additional details available"
}
```

---

## 6. Testing Multiple Endpoints in Sequence

### Complete Test Script
```bash
#!/bin/bash

echo "======================================"
echo "API Testing Script"
echo "======================================"
echo ""

echo "1. Testing Health Check..."
curl -s -X GET http://localhost:3000/api/health | jq .
echo ""
echo ""

echo "2. Testing Schema Endpoint..."
curl -s -X GET http://localhost:3000/api/schema | jq .
echo ""
echo ""

echo "3. Testing Stats Endpoint..."
curl -s -X GET http://localhost:3000/api/stats | jq .
echo ""
echo ""

echo "4. Testing Natural Language Query..."
curl -s -X POST http://localhost:3000/api/query \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Show me all tables in the database"}' | jq .
echo ""
echo ""

echo "5. Testing Direct SQL Execution..."
curl -s -X POST http://localhost:3000/api/execute \
  -H "Content-Type: application/json" \
  -d '{"sql": "SELECT table_name FROM information_schema.tables WHERE table_schema = '\''public'\'' LIMIT 5"}' | jq .
echo ""
echo ""

echo "======================================"
echo "Testing Complete!"
echo "======================================"
```

**Save as `test-api.sh` and run:**
```bash
chmod +x test-api.sh
./test-api.sh
```

---

## Common Error Status Codes

| Status Code | Meaning | Common Causes |
|-------------|---------|---------------|
| 200 | Success | Request completed successfully |
| 400 | Bad Request | Missing required fields, invalid SQL syntax |
| 401 | Unauthorized | Invalid OpenAI API key |
| 404 | Not Found | Table or column doesn't exist |
| 429 | Too Many Requests | OpenAI rate limit exceeded |
| 500 | Internal Server Error | Database connection failed, server error |
| 502 | Bad Gateway | OpenAI service error |

---

## Tips for Testing

1. **Install jq for pretty JSON output:**
   ```bash
   brew install jq  # macOS
   # Then pipe curl output through jq: curl ... | jq .
   ```

2. **Save responses to files:**
   ```bash
   curl http://localhost:3000/api/schema > schema.json
   ```

3. **Check response headers:**
   ```bash
   curl -i http://localhost:3000/api/health
   ```

4. **Time the requests:**
   ```bash
   time curl http://localhost:3000/api/query -X POST -H "Content-Type: application/json" -d '{"prompt": "Show tables"}'
   ```

5. **Test with verbose output:**
   ```bash
   curl -v http://localhost:3000/api/health
   ```

---

## Specific Queries for Your Database (farmer_chat_mobile_app_dev)

Once connected, try these:

```bash
# Get all tables
curl -X POST http://localhost:3000/api/query \
  -H "Content-Type: application/json" \
  -d '{"prompt": "What tables exist in the farmer_chat_mobile_app_dev database?"}'

# Count records in each table
curl -X POST http://localhost:3000/api/query \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Count the total records in each table"}'

# Get schema information
curl -X POST http://localhost:3000/api/query \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Show me the complete database schema with all columns"}'

# Recent data
curl -X POST http://localhost:3000/api/query \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Show me data created in the last 30 days from any table with timestamps"}'
```

---

**Happy Testing! 🚀**

