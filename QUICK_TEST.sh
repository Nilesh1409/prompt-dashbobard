#!/bin/bash

# Quick API Testing Script
# Make executable with: chmod +x QUICK_TEST.sh
# Run with: ./QUICK_TEST.sh

BASE_URL="http://localhost:3000"

echo "🚀 Starting API Tests..."
echo "================================"
echo ""

# Test 1: Health Check
echo "1️⃣  Testing Health Check..."
curl -s -X GET $BASE_URL/api/health | jq '.' 2>/dev/null || curl -s -X GET $BASE_URL/api/health
echo ""
echo ""

# Test 2: Get Schema
echo "2️⃣  Testing Schema (first 50 lines)..."
curl -s -X GET $BASE_URL/api/schema | jq '.' 2>/dev/null | head -50 || curl -s -X GET $BASE_URL/api/schema | head -50
echo ""
echo ""

# Test 3: Get Stats
echo "3️⃣  Testing Statistics..."
curl -s -X GET $BASE_URL/api/stats | jq '.' 2>/dev/null || curl -s -X GET $BASE_URL/api/stats
echo ""
echo ""

# Test 4: Natural Language Query
echo "4️⃣  Testing Natural Language Query (List Tables)..."
curl -s -X POST $BASE_URL/api/query \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Show me all tables in the database"
  }' | jq '.' 2>/dev/null || curl -s -X POST $BASE_URL/api/query -H "Content-Type: application/json" -d '{"prompt": "Show me all tables in the database"}'
echo ""
echo ""

# Test 5: Direct SQL Execution
echo "5️⃣  Testing Direct SQL (List Tables)..."
curl -s -X POST $BASE_URL/api/execute \
  -H "Content-Type: application/json" \
  -d '{
    "sql": "SELECT table_name FROM information_schema.tables WHERE table_schema = '\''public'\'' ORDER BY table_name LIMIT 10"
  }' | jq '.' 2>/dev/null || curl -s -X POST $BASE_URL/api/execute -H "Content-Type: application/json" -d '{"sql": "SELECT table_name FROM information_schema.tables WHERE table_schema = '\''public'\'' LIMIT 10"}'
echo ""
echo ""

# Test 6: Error Handling (Missing Prompt)
echo "6️⃣  Testing Error Handling (Should return 400)..."
curl -s -X POST $BASE_URL/api/query \
  -H "Content-Type: application/json" \
  -d '{}' | jq '.' 2>/dev/null || curl -s -X POST $BASE_URL/api/query -H "Content-Type: application/json" -d '{}'
echo ""
echo ""

echo "================================"
echo "✅ All Tests Complete!"
echo ""
echo "💡 Tip: Install 'jq' for better JSON formatting:"
echo "   brew install jq  (macOS)"
echo "   sudo apt install jq  (Ubuntu/Debian)"
echo ""

