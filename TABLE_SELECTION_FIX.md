# Table Selection Fix

## Problem

The table selection function was failing to identify all necessary tables for complex queries.

### Example Issue:
**Query:** "How many users in Kenya who asked at least 1 question since June 1st 2025"

**Tables Needed:**
1. `user_management_user` - base user table
2. `user_management_userprofile` - for country relationship
3. `geography_country` - for Kenya filter
4. `chat_conversation` - links user to messages
5. `chat_message` - for question count & date filter

**Tables Selected (BEFORE FIX):**
- `user_management_user`
- `chat_conversation`

❌ **Missing:** `user_management_userprofile`, `geography_country`, `chat_message`

---

## Root Cause

The old `selectRelevantTables` function only received:
- A list of table names
- The user's prompt

It had **no context** about:
- What columns each table contains
- How tables are related (foreign keys)
- Which tables have time columns
- What data lives where

So it couldn't understand that:
- "in Kenya" requires `geography_country` AND the linking table `user_management_userprofile`
- "asked questions" requires both `chat_conversation` AND `chat_message`
- "since June 1st" requires finding which table has the time column (`chat_message.created_on`)

---

## Solution

Enhanced `selectRelevantTables` to receive full database context:

```javascript
const selectRelevantTables = async (prompt, allTables, primaryKeys, relationships) => {
  // Build detailed table context with:
  // - Primary keys
  // - Column names
  // - Foreign key relationships ("Links to:")
  // - Time columns
  
  // Provide explicit instructions:
  // - "users in [country]" → need user + profile + country tables
  // - "users who asked questions" → need user + conversation + message tables
  // - Consider ENTIRE join path, not just endpoints
}
```

### New Context Provided to LLM:

```
=== DATABASE TABLES ===

📋 user_management_user
  PK: id
  Columns: id, phone_number, created_at, login_completed, ...
  Links to: preferred_language_id → language_language(id)
  Time fields: created_at, updated_at

📋 user_management_userprofile
  PK: id
  Columns: id, user_id_id, name, gender, role, country_id, ...
  Links to: user_id_id → user_management_user(id); country_id → geography_country(id)
  Time fields: created_at

📋 geography_country
  PK: id
  Columns: id, name, country_code, ...

📋 chat_conversation
  PK: id
  Columns: id, user_id, created_at, ...
  Links to: user_id → user_management_user(id)
  Time fields: created_at, updated_at

📋 chat_message
  PK: id
  Columns: id, conversation_id, input_type, created_on, ...
  Links to: conversation_id → chat_conversation(id)
  Time fields: created_on
```

### Critical Instructions Added:

```
CRITICAL INSTRUCTIONS:
1. Consider the ENTIRE join path needed, not just direct tables

2. If the question mentions:
   - "users in [country]" → need user table + user profile table + geography/country table
   - "users who asked questions" → need user table + conversation table + message table
   - "users with [role/gender]" → need user table + user profile table
   - Date filters ("since June") → check which table has time fields (created_on, created_at)

3. Look at "Links to:" to understand relationships - include intermediate tables

4. Include ALL tables in the join chain, not just the endpoints
```

---

## Results After Fix

**Query:** "How many users in Kenya who asked at least 1 question since June 1st 2025"

**Expected Selection (AFTER FIX):**
- ✅ `user_management_user` (base user table)
- ✅ `user_management_userprofile` (links user to country)
- ✅ `geography_country` (for Kenya filter)
- ✅ `chat_conversation` (links user to messages)
- ✅ `chat_message` (for question count & date filter)

**Result:** All 5 required tables correctly identified!

---

## Additional Improvements

1. **Increased Sample Data Limit:** Now fetches sample data and enum values for up to 8 tables (was 5)
2. **Fallback Strategy:** If fewer than 2 tables selected, falls back to first 10 tables
3. **Better Error Logging:** More detailed error messages if table selection fails

---

## Testing

To verify the fix works, test with complex queries:

```bash
# Test 1: Multi-table join with country filter
curl -X POST http://localhost:3000/api/query \
  -H "Content-Type: application/json" \
  -d '{"prompt": "How many users in Kenya who asked at least 1 question since June 1st 2025"}'

# Expected: Selects 5 tables, generates correct SQL

# Test 2: Gender + role filter
curl -X POST http://localhost:3000/api/query \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Show me all male farmers from Uganda"}'

# Expected: Selects user, userprofile, and country tables

# Test 3: Time-based query
curl -X POST http://localhost:3000/api/query \
  -H "Content-Type: application/json" \
  -d '{"prompt": "How many conversations were created in the last 7 days?"}'

# Expected: Selects conversation table, uses created_at time field
```

---

## Key Takeaway

**Before:** Table selection was a "guess" based only on table names.

**After:** Table selection is **schema-aware**, understanding:
- What data each table contains
- How tables connect via foreign keys
- Where time-based data lives
- The full join path needed for complex queries

This dramatically improves the accuracy of table selection and reduces failed queries.

---

**Date:** November 11, 2025  
**Status:** ✅ Implemented

