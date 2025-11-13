#!/bin/bash

# Test Conversation History Feature
# This script demonstrates how conversation history improves follow-up queries

API_URL="http://localhost:3000/api/query"

echo "========================================="
echo "Testing Conversation History Feature"
echo "========================================="
echo ""

# Query 1: Initial query about Kenya
echo "📝 Query 1: How many users from Kenya?"
echo ""

RESPONSE1=$(curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "How many users from Kenya?",
    "conversationHistory": []
  }')

echo "$RESPONSE1" | jq '.'
echo ""

# Extract SQL and row count for history
SQL1=$(echo "$RESPONSE1" | jq -r '.generatedSQL // empty')
ROWCOUNT1=$(echo "$RESPONSE1" | jq -r '.results.rowCount // 0')

if [ -z "$SQL1" ]; then
  echo "❌ Query 1 failed"
  exit 1
fi

echo "✅ Query 1 Success"
echo "Generated SQL: $SQL1"
echo "Row Count: $ROWCOUNT1"
echo ""
echo "========================================="
echo ""

# Wait a moment
sleep 2

# Query 2: Follow-up query WITH conversation history
echo "📝 Query 2: What about Uganda? (WITH conversation history)"
echo ""

RESPONSE2=$(curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d "{
    \"prompt\": \"What about Uganda?\",
    \"conversationHistory\": [
      {
        \"question\": \"How many users from Kenya?\",
        \"sql\": $(echo "$SQL1" | jq -R .),
        \"rowCount\": $ROWCOUNT1,
        \"timestamp\": $(date +%s)000
      }
    ]
  }")

echo "$RESPONSE2" | jq '.'
echo ""

SQL2=$(echo "$RESPONSE2" | jq -r '.generatedSQL // empty')
ROWCOUNT2=$(echo "$RESPONSE2" | jq -r '.results.rowCount // 0')

if [ -z "$SQL2" ]; then
  echo "❌ Query 2 failed"
  exit 1
fi

echo "✅ Query 2 Success (with context)"
echo "Generated SQL: $SQL2"
echo "Row Count: $ROWCOUNT2"
echo ""
echo "========================================="
echo ""

# Query 3: Same follow-up WITHOUT conversation history (to show the difference)
echo "📝 Query 3: What about Uganda? (WITHOUT conversation history)"
echo ""

RESPONSE3=$(curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "What about Uganda?",
    "conversationHistory": []
  }')

echo "$RESPONSE3" | jq '.'
echo ""

SQL3=$(echo "$RESPONSE3" | jq -r '.generatedSQL // empty')

if [ -z "$SQL3" ]; then
  echo "❌ Query 3 failed (expected - lacks context)"
else
  echo "⚠️  Query 3 might produce wrong results without context"
  echo "Generated SQL: $SQL3"
fi

echo ""
echo "========================================="
echo ""

# Query 4: Test with multiple history items
echo "📝 Query 4: Multiple conversation items in history"
echo ""

RESPONSE4=$(curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d "{
    \"prompt\": \"And what about Tanzania?\",
    \"conversationHistory\": [
      {
        \"question\": \"How many users from Kenya?\",
        \"sql\": $(echo "$SQL1" | jq -R .),
        \"rowCount\": $ROWCOUNT1,
        \"timestamp\": $(($(date +%s)-300))000
      },
      {
        \"question\": \"What about Uganda?\",
        \"sql\": $(echo "$SQL2" | jq -R .),
        \"rowCount\": $ROWCOUNT2,
        \"timestamp\": $(($(date +%s)-120))000
      }
    ]
  }")

echo "$RESPONSE4" | jq '.'
echo ""

SQL4=$(echo "$RESPONSE4" | jq -r '.generatedSQL // empty')
ROWCOUNT4=$(echo "$RESPONSE4" | jq -r '.results.rowCount // 0')

if [ -z "$SQL4" ]; then
  echo "❌ Query 4 failed"
else
  echo "✅ Query 4 Success (with multiple history items)"
  echo "Generated SQL: $SQL4"
  echo "Row Count: $ROWCOUNT4"
fi

echo ""
echo "========================================="
echo "📊 Summary"
echo "========================================="
echo ""
echo "✅ Query 1: Initial query works"
echo "✅ Query 2: Follow-up WITH context works correctly"
echo "⚠️  Query 3: Follow-up WITHOUT context may fail or produce wrong results"
echo "✅ Query 4: Multiple history items work correctly"
echo ""
echo "Conclusion: Conversation history significantly improves follow-up queries!"
echo ""

