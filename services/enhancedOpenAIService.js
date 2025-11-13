const OpenAI = require('openai');
require('dotenv').config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Enhanced schema retrieval with PKs, FKs, time columns, and relationships
 */
const getEnhancedSchemaInfo = async (pool) => {
  try {
    // Get columns
    const columnsQuery = `
      SELECT 
        c.table_name,
        c.column_name,
        c.data_type,
        c.is_nullable,
        c.column_default
      FROM information_schema.columns c
      WHERE c.table_schema = 'public'
      ORDER BY c.table_name, c.ordinal_position;
    `;

    // Get primary keys
    const pkQuery = `
      SELECT tc.table_name, kcu.column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
      WHERE tc.table_schema = 'public' 
        AND tc.constraint_type = 'PRIMARY KEY';
    `;

    // Get foreign keys for relationships
    const fkQuery = `
      SELECT
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public';
    `;

    const [columnsResult, pkResult, fkResult] = await Promise.all([
      pool.query(columnsQuery),
      pool.query(pkQuery),
      pool.query(fkQuery)
    ]);

    // Build enhanced schema with PKs and time columns
    const tables = {};
    const primaryKeys = {};
    const relationships = {};
    const timeColumns = {};

    // Store primary keys
    pkResult.rows.forEach(row => {
      primaryKeys[row.table_name] = row.column_name;
    });

    // Build tables with columns and detect time columns
    columnsResult.rows.forEach(row => {
      if (!tables[row.table_name]) {
        tables[row.table_name] = {
          columns: [],
          primaryKey: primaryKeys[row.table_name] || null,
          timeColumns: []
        };
      }
      
      tables[row.table_name].columns.push({
        name: row.column_name,
        type: row.data_type,
        nullable: row.is_nullable === 'YES',
        default: row.column_default
      });

      // Detect time columns
      if (/(created|updated|inserted|modified|deleted)_(at|on|time)|timestamp/i.test(row.column_name)) {
        tables[row.table_name].timeColumns.push(row.column_name);
      }
    });

    // Build FK relationships
    fkResult.rows.forEach(row => {
      if (!relationships[row.table_name]) {
        relationships[row.table_name] = [];
      }
      relationships[row.table_name].push({
        column: row.column_name,
        references: `${row.foreign_table_name}(${row.foreign_column_name})`
      });
    });

    return { tables, primaryKeys, relationships };
  } catch (error) {
    console.error('Error fetching enhanced schema:', error);
    throw error;
  }
};

/**
 * Get sample data for relevant tables to help LLM understand data patterns
 */
const getSampleData = async (pool, tableName, limit = 5) => {
  try {
    const result = await pool.query(`SELECT * FROM "${tableName}" LIMIT ${limit}`);
    return result.rows;
  } catch (error) {
    console.error(`Error getting sample data for ${tableName}:`, error.message);
    return [];
  }
};

/**
 * Parse JSON array from LLM response, handling code fences and malformed JSON
 */
function parseArrayJson(s) {
  if (!s) return [];
  
  s = s.trim();
  
  // Remove code fences
  s = s.replace(/^```(?:json)?\s*/i, '').replace(/```$/i, '').trim();
  
  // Extract first array match
  const arrayMatch = s.match(/\[[\s\S]*?\]/);
  if (arrayMatch) {
    s = arrayMatch[0];
  }
  
  try {
    return JSON.parse(s);
  } catch (e) {
    // Try to repair common issues
    s = s.replace(/,\s*\]/g, ']').replace(/\[\s*,/g, '[');
    try {
      return JSON.parse(s);
    } catch (e2) {
      console.error('Failed to parse JSON:', s.substring(0, 100));
      return [];
    }
  }
}

/**
 * Smart fallback: keyword-based table selection
 */
function smartFallback(prompt, allTables, relationships) {
  const promptLower = prompt.toLowerCase();
  const selected = new Set();
  
  // User-related queries
  if (promptLower.match(/\b(user|users)\b/)) {
    if (allTables['user_management_user']) selected.add('user_management_user');
    if (allTables['user_management_userprofile']) selected.add('user_management_userprofile');
  }
  
  // Country/location queries
  if (promptLower.match(/\b(country|countries|kenya|uganda|location|from\s+\w+)\b/)) {
    if (allTables['user_management_userprofile']) selected.add('user_management_userprofile');
    if (allTables['geography_country']) selected.add('geography_country');
    if (allTables['geography_geolocation']) selected.add('geography_geolocation');
  }
  
  // Question/message/conversation queries
  if (promptLower.match(/\b(question|questions|asked|message|messages|conversation|conversations)\b/)) {
    if (allTables['chat_conversation']) selected.add('chat_conversation');
    if (allTables['chat_message']) selected.add('chat_message');
  }
  
  // Expand join paths using FK relationships
  const expanded = new Set(selected);
  let changed = true;
  while (changed) {
    changed = false;
    for (const table of Array.from(expanded)) {
      if (relationships[table]) {
        relationships[table].forEach(fk => {
          const refTable = fk.references.split('(')[0];
          if (allTables[refTable] && !expanded.has(refTable)) {
            expanded.add(refTable);
            changed = true;
          }
        });
      }
      // Also check reverse: tables that reference this one
      Object.entries(relationships).forEach(([otherTable, fks]) => {
        if (fks.some(fk => fk.references.startsWith(table + '('))) {
          if (allTables[otherTable] && !expanded.has(otherTable)) {
            expanded.add(otherTable);
            changed = true;
          }
        }
      });
    }
  }
  
  return Array.from(expanded).filter(t => allTables[t]);
}

/**
 * Intelligent table selection based on user prompt with full schema context
 */
const selectRelevantTables = async (prompt, allTables, primaryKeys, relationships) => {
  try {
    // Build a detailed table summary with columns and relationships
    let tableContext = '=== DATABASE TABLES ===\n\n';
    
    Object.keys(allTables).forEach(tableName => {
      const table = allTables[tableName];
      tableContext += `📋 ${tableName}\n`;
      
      // Show primary key
      if (table.primaryKey) {
        tableContext += `  PK: ${table.primaryKey}\n`;
      }
      
      // Show key columns (first 10 most important ones)
      const keyColumns = table.columns.slice(0, 10).map(c => c.name).join(', ');
      tableContext += `  Columns: ${keyColumns}${table.columns.length > 10 ? '...' : ''}\n`;
      
      // Show foreign keys (relationships)
      if (relationships[tableName] && relationships[tableName].length > 0) {
        const fks = relationships[tableName].map(r => `${r.column} → ${r.references}`).join('; ');
        tableContext += `  Links to: ${fks}\n`;
      }
      
      // Show time columns if any
      if (table.timeColumns && table.timeColumns.length > 0) {
        tableContext += `  Time fields: ${table.timeColumns.join(', ')}\n`;
      }
      
      tableContext += '\n';
    });
    
    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: `You are a database expert. Analyze the user's question and identify ALL tables needed to answer it.

${tableContext}

CRITICAL INSTRUCTIONS:
1. Consider the ENTIRE join path needed, not just direct tables
2. If the question mentions:
   - "users in [country]" → need user table + user profile table + geography/country table
   - "users who asked questions" → need user table + conversation table + message table
   - "users with [role/gender]" → need user table + user profile table
   - Date filters ("since June") → check which table has time fields (created_on, created_at)

3. Look at "Links to:" to understand relationships - include intermediate tables
4. Include ALL tables in the join chain, not just the endpoints

Return ONLY a raw JSON array of table names, no markdown, no code fences, no explanations.
Example: ["user_management_user", "user_management_userprofile", "geography_country", "chat_conversation", "chat_message"]`
        },
        {
          role: 'user',
          content: `Question: ${prompt}\n\nWhich tables do I need? Return ONLY a JSON array, no other text.`
        }
      ],
      temperature: 0,
      max_tokens: 300
    });

    const content = response.choices[0].message.content.trim();
    const relevantTables = parseArrayJson(content);
    
    console.log('🎯 Selected tables:', relevantTables);
    
    // Validate and return
    const validTables = relevantTables.filter(t => allTables[t]);
    
    // Smart fallback instead of dumb "first 10"
    if (validTables.length < 2) {
      console.warn('⚠️  Too few tables selected, using smart keyword-based fallback');
      const fallbackTables = smartFallback(prompt, allTables, relationships);
      if (fallbackTables.length > 0) {
        console.log('✅ Smart fallback selected:', fallbackTables);
        return fallbackTables;
      }
      // Last resort: return first 10
      return Object.keys(allTables).slice(0, 10);
    }
    
    return validTables;
  } catch (error) {
    console.error('❌ Error selecting relevant tables:', error.message);
    // Smart fallback instead of dumb "first 10"
    const fallbackTables = smartFallback(prompt, allTables, relationships);
    if (fallbackTables.length > 0) {
      console.log('✅ Smart fallback selected:', fallbackTables);
      return fallbackTables;
    }
    // Last resort: return first 10
    return Object.keys(allTables).slice(0, 10);
  }
};

/**
 * Get distinct enum values for common categorical columns
 */
const getDistinctValues = async (pool, tableName, columnName, limit = 20) => {
  try {
    const result = await pool.query(
      `SELECT DISTINCT "${columnName}" FROM "${tableName}" 
       WHERE "${columnName}" IS NOT NULL 
       LIMIT ${limit}`
    );
    return result.rows.map(r => r[columnName]);
  } catch (error) {
    console.error(`Error getting distinct values for ${tableName}.${columnName}:`, error.message);
    return [];
  }
};

/**
 * Build focused schema context with PKs, FKs, time columns, and sample data
 */
const buildFocusedSchema = (allTables, primaryKeys, relationships, relevantTableNames, sampleData = {}, distinctValues = {}, resolvedDates = {}) => {
  let schema = '=== SCHEMA SNAPSHOT (Use ONLY names from here!) ===\n\n';
  
  // Add resolved dates if any
  if (Object.keys(resolvedDates).length > 0) {
    schema += '📅 RESOLVED_DATES (Use these exact values):\n';
    Object.entries(resolvedDates).forEach(([key, value]) => {
      schema += `  ${key}: ${value}\n`;
    });
    schema += '\n';
  }
  
  // Build JOIN MAP first for reference
  schema += '🔗 JOIN MAP (Use these exact paths):\n';
  relevantTableNames.forEach(tableName => {
    if (relationships[tableName] && relationships[tableName].length > 0) {
      relationships[tableName].forEach(rel => {
        const refTable = rel.references.split('(')[0];
        const refCol = rel.references.split('(')[1]?.replace(')', '') || 'id';
        schema += `  ${tableName}.${rel.column} → ${refTable}.${refCol}\n`;
      });
    }
  });
  schema += '\n';
  
  // Individual table details
  relevantTableNames.forEach(tableName => {
    const table = allTables[tableName];
    if (!table) return;
    
    schema += `📋 TABLE: ${tableName}\n`;
    
    // Primary Key
    if (table.primaryKey) {
      schema += `  PRIMARY KEY: ${table.primaryKey}\n`;
    }
    
    // Time Columns (for recency filters)
    if (table.timeColumns && table.timeColumns.length > 0) {
      schema += `  TIME COLUMNS (use for date filters): ${table.timeColumns.join(', ')}\n`;
    }
    
    // Foreign Keys
    if (relationships[tableName] && relationships[tableName].length > 0) {
      schema += `  FOREIGN KEYS:\n`;
      relationships[tableName].forEach(rel => {
        schema += `    - ${rel.column} → ${rel.references}\n`;
      });
    }
    
    // All Columns
    schema += `  COLUMNS:\n`;
    table.columns.forEach(col => {
      schema += `    - ${col.name}: ${col.type}${col.nullable ? ' (nullable)' : ''}\n`;
    });
    
    // Distinct values for enum-like columns
    if (distinctValues[tableName]) {
      schema += `  \n  📊 KNOWN VALUES (use these exact strings):\n`;
      Object.entries(distinctValues[tableName]).forEach(([colName, values]) => {
        if (values && values.length > 0) {
          schema += `    ${colName}: ${values.map(v => `"${v}"`).join(', ')}\n`;
        }
      });
    }
    
    // Sample data
    if (sampleData[tableName] && sampleData[tableName].length > 0) {
      schema += `\n  💾 SAMPLE DATA (${sampleData[tableName].length} rows):\n`;
      
      sampleData[tableName].slice(0, 3).forEach((row, idx) => {
        schema += `    Row ${idx + 1}:\n`;
        Object.entries(row).forEach(([key, value]) => {
          const displayValue = value === null ? 'NULL' : 
                              value === undefined ? 'undefined' :
                              typeof value === 'string' ? `"${value.substring(0, 50)}${value.length > 50 ? '...' : ''}"` :
                              typeof value === 'object' ? JSON.stringify(value).substring(0, 50) + '...' :
                              JSON.stringify(value);
          schema += `      ${key}: ${displayValue}\n`;
        });
      });
    }
    
    schema += '\n';
  });
  
  return schema;
};

/**
 * Resolve ambiguous dates from user prompt
 */
function resolveDates(prompt) {
  const resolved = {};
  const promptLower = prompt.toLowerCase();
  const currentYear = new Date().getFullYear();
  
  // Match patterns like "since June 1st", "since June 1", "since June 1, 2025"
  const datePatterns = [
    /since\s+(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2})(?:st|nd|rd|th)?(?:\s*,?\s*(\d{4}))?/i,
    /since\s+(\d{4})-(\d{1,2})-(\d{1,2})/i,
    /since\s+(\d{1,2})\/(\d{1,2})\/(\d{4})/i,
  ];
  
  for (let i = 0; i < datePatterns.length; i++) {
    const pattern = datePatterns[i];
    const match = prompt.match(pattern);
    if (match) {
      let year, month, day;
      
      if (i === 0) {
        // Text format: "since June 1st" or "since June 1, 2025"
        if (match[3]) {
          // Has year: "June 1, 2025"
          year = parseInt(match[3]);
        } else {
          // No year - default to current year: "June 1st"
          year = currentYear;
        }
        month = ['january', 'february', 'march', 'april', 'may', 'june', 
                 'july', 'august', 'september', 'october', 'november', 'december']
                 .indexOf(match[1].toLowerCase()) + 1;
        day = parseInt(match[2]);
      } else if (i === 1) {
        // ISO format: "since 2025-06-01"
        year = parseInt(match[1]);
        month = parseInt(match[2]);
        day = parseInt(match[3]);
      } else if (i === 2) {
        // US format: "since 06/01/2025"
        month = parseInt(match[1]);
        day = parseInt(match[2]);
        year = parseInt(match[3]);
      }
      
      if (year && month && day && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
        const date = new Date(year, month - 1, day);
        resolved.since_date = date.toISOString().slice(0, 10); // YYYY-MM-DD
        break;
      }
    }
  }
  
  // Default: if "since" mentioned but no date found, assume June 1st of current year
  if (promptLower.includes('since') && !resolved.since_date) {
    resolved.since_date = `${currentYear}-06-01`;
  }
  
  return resolved;
}

/**
 * Validate SQL against semantic intent
 */
function validateSQLSemantics(sql, prompt, relevantTables) {
  const sqlLower = sql.toLowerCase();
  const promptLower = prompt.toLowerCase();
  const issues = [];
  
  // Helper: strip quotes from identifiers for matching
  const stripQuotes = (s) => s.replace(/["'`]/g, '');
  const sqlNoQuotes = stripQuotes(sqlLower);
  
  // Check 1: "how many users" must count user_management_user.id
  if (promptLower.match(/\b(how many|count of|number of)\s+users?\b/)) {
    if (!sqlNoQuotes.includes('user_management_user')) {
      issues.push('Must SELECT from user_management_user when counting users');
    }
    // Match: COUNT(DISTINCT "user_management_user"."id") or COUNT(DISTINCT user_management_user.id)
    if (!sqlNoQuotes.match(/count\s*\(\s*distinct\s+[^)]*user_management_user[^)]*\.id/i)) {
      issues.push('Must COUNT(DISTINCT user_management_user.id) when counting users');
    }
  }
  
  // Check 2: "from [country]" must use geography_country
  if (promptLower.match(/\b(from|in)\s+(kenya|uganda|country|countries)\b/i)) {
    if (!sqlNoQuotes.includes('geography_country') && !sqlNoQuotes.includes('user_management_userprofile')) {
      issues.push('Must JOIN user_management_userprofile → geography_country for country filters');
    }
    if (sqlNoQuotes.includes('chat_contentprovider') && sqlNoQuotes.includes('location')) {
      issues.push('Do NOT use chat_contentprovider.location JSON field. Use user_management_userprofile → geography_country.name instead');
    }
  }
  
  // Check 3: "asked questions" must join chat_message
  if (promptLower.match(/\b(asked|question|questions|message|messages)\b/)) {
    if (!sqlNoQuotes.includes('chat_message')) {
      issues.push('Must JOIN chat_message when filtering by questions/messages');
    }
    if (sqlNoQuotes.includes('chat_conversation') && !sqlNoQuotes.includes('chat_message')) {
      issues.push('Must JOIN chat_message (not just chat_conversation) to filter by questions');
    }
  }
  
  // Check 4: Date filters must use correct time column
  if (promptLower.includes('since') || promptLower.match(/\b(june|july|august|september|october|november|december|january|february|march|april|may)\s+\d/)) {
    if (sqlNoQuotes.includes('chat_message')) {
      // Must use created_on, not created_at
      const hasCreatedOn = sqlNoQuotes.match(/chat_message\s*\.\s*created_on/i);
      const hasCreatedAt = sqlNoQuotes.match(/chat_message\s*\.\s*created_at/i);
      
      if (hasCreatedAt && !hasCreatedOn) {
        issues.push('Must use chat_message.created_on (not created_at) for message date filters');
      }
    }
  }
  
  // Check 5: Don't use created_by (always NULL)
  if (sqlNoQuotes.includes('created_by') && !sqlNoQuotes.includes('is null')) {
      issues.push('created_by is always NULL - do not filter on it');
  }
  
  return issues;
}

/**
 * Generate SQL with self-correction mechanism
 */
const generateSQLWithCorrection = async (pool, prompt, maxAttempts = 3, conversationHistory = []) => {
  const startTime = Date.now();
  
  try {
    // Step 1: Get full schema with PKs, FKs, time columns
    console.log('📚 Fetching enhanced schema...');
    const { tables, primaryKeys, relationships } = await getEnhancedSchemaInfo(pool);
    
    // Step 2: Select relevant tables (with full context)
    console.log('🔍 Selecting relevant tables...');
    const relevantTables = await selectRelevantTables(prompt, tables, primaryKeys, relationships);
    console.log('✅ Selected:', relevantTables.length, 'tables', relevantTables);
    
    // Step 3: Get sample data for relevant tables (3 rows each)
    console.log('📊 Fetching sample data...');
    const sampleData = {};
    for (const tableName of relevantTables.slice(0, 8)) {  // Increased from 5 to 8
      sampleData[tableName] = await getSampleData(pool, tableName, 3);
    }
    
    // Step 4: Fetch distinct values for common enum columns
    console.log('🎯 Fetching distinct values for enum columns...');
    const distinctValues = {};
    const enumColumns = ['gender', 'role', 'land_holding', 'status', 'type', 'input_type'];
    
    for (const tableName of relevantTables.slice(0, 8)) {  // Increased from 5 to 8
      const table = tables[tableName];
      if (!table) continue;
      
      distinctValues[tableName] = {};
      
      for (const col of table.columns) {
        // Check if column name suggests enum values
        if (enumColumns.some(ec => col.name.toLowerCase().includes(ec))) {
          const values = await getDistinctValues(pool, tableName, col.name, 15);
          if (values.length > 0 && values.length < 50) { // Only store if reasonable enum size
            distinctValues[tableName][col.name] = values;
          }
        }
      }
    }
    
    // Also fetch country names if geography_country is relevant
    if (relevantTables.includes('geography_country')) {
      distinctValues['geography_country'] = distinctValues['geography_country'] || {};
      distinctValues['geography_country']['name'] = await getDistinctValues(pool, 'geography_country', 'name', 50);
    }
    
    console.log('✅ Sample data and enum values fetched');
    
    // Step 5: Resolve dates from prompt
    const resolvedDates = resolveDates(prompt);
    if (Object.keys(resolvedDates).length > 0) {
      console.log('📅 Resolved dates:', resolvedDates);
    }
    
    // Step 6: Build focused schema with all metadata including resolved dates
    const focusedSchema = buildFocusedSchema(tables, primaryKeys, relationships, relevantTables, sampleData, distinctValues, resolvedDates);
    console.log('📝 Schema context size:', focusedSchema.length, 'characters');
    
    // Step 6.5: Build conversation context from history (last 5 Q&A pairs)
    let conversationContext = '';
    if (conversationHistory && conversationHistory.length > 0) {
      const recent = conversationHistory.slice(-5); // Last 5 conversations
      conversationContext = '\n📜 RECENT CONVERSATION HISTORY (for context):\n\n';
      recent.forEach((item, idx) => {
        conversationContext += `Q${idx + 1}: "${item.question}"\n`;
        conversationContext += `SQL${idx + 1}: ${item.sql}\n`;
        if (item.rowCount !== undefined) {
          conversationContext += `Result: ${item.rowCount} rows returned\n`;
        }
        conversationContext += '\n';
      });
      conversationContext += '💡 Use this context to understand follow-up questions or related queries.\n\n';
    }
    
    let lastError = null;
    let retryMessages = [];
    
    // Step 7: Iterative SQL generation with error correction
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      console.log(`🔄 Attempt ${attempt}/${maxAttempts}`);
      
      const systemPrompt = `You are an expert PostgreSQL database developer. Generate SQL queries based on the SCHEMA SNAPSHOT below.

${focusedSchema}${conversationContext}
⚠️ STRICT RULES - Read Carefully:

1. Use ONLY identifiers from SCHEMA SNAPSHOT. NO assumptions!

2. Django Database Conventions:
   • Primary keys are "id" (not table_name_id)
   • Foreign keys: <name>_id or <name>_id_id (check FOREIGN KEYS section)
   • Example: user_id_id (Django reverse relation), conversation_id, country_id

3. When user asks "how many users":
   • SELECT from user_management_user
   • COUNT(DISTINCT user_management_user.id)
   • Even if other tables have user_id, count from user_management_user

4. When user asks "from [country]" or "in [country]":
   • JOIN user_management_userprofile → geography_country
   • Filter geography_country.name (NOT chat_contentprovider.location JSON)
   • Do NOT use chat_contentprovider unless question explicitly asks for it

5. When user asks "asked questions" or "asked at least 1 question":
   • JOIN chat_conversation → chat_message
   • Filter on chat_message.created_on (NOT just chat_conversation)
   • Must include chat_message table

6. Time/Date Filters:
   • Use TIME COLUMNS from SCHEMA SNAPSHOT (e.g., created_on, created_at)
   • If RESOLVED_DATES section exists, use those exact dates
   • Format: WHERE created_on >= DATE '${resolvedDates.since_date || '2025-06-01'}'
   • DO NOT guess years - use RESOLVED_DATES

7. JOINs:
   • Follow JOIN MAP exactly
   • Use PRIMARY KEY shown at top of each table
   • Match FK to referenced table's PK

8. Enum Values:
   • Use EXACT strings from "KNOWN VALUES" section
   • gender_all_male (NOT "male"), Kenya (check spelling)

9. Query Format:
   • Return ONLY SQL query
   • NO markdown, NO explanations, NO apologies
   • Use double quotes for identifiers if needed

10. NULL Fields:
    • created_by is ALWAYS NULL - do NOT filter on it
    • Observe SAMPLE DATA patterns

${lastError ? `\n⚠️ PREVIOUS ATTEMPT ${attempt - 1} FAILED:\n${lastError}\n\nFIX THIS ERROR:\n• Check column/table names exist in SCHEMA SNAPSHOT\n• Verify FK column names match FOREIGN KEYS section\n• Confirm PRIMARY KEY name (usually "id")\n• Check TIME COLUMNS for correct date field\n• Verify enum values match KNOWN VALUES\n` : ''}`;

      if (attempt === 1) {
        retryMessages = [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ];
      } else {
        retryMessages.push({
          role: 'user',
          content: `The previous query failed with error: "${lastError}". Please fix it. Original question: ${prompt}`
        });
      }
      
      const response = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
        messages: retryMessages,
        temperature: 0.1,
        max_tokens: 800
      });
      
      let sqlQuery = response.choices[0].message.content.trim();
      
      // Clean the SQL
      sqlQuery = sqlQuery
        .replace(/```sql\n?/g, '')
        .replace(/```\n?/g, '')
        .replace(/^sql\n/gi, '')
        .trim();
      
      console.log('💾 Generated SQL:', sqlQuery);
      
      // Step 8: Semantic validation before execution
      const semanticIssues = validateSQLSemantics(sqlQuery, prompt, relevantTables);
      if (semanticIssues.length > 0) {
        console.warn('⚠️  Semantic validation failed:', semanticIssues);
        lastError = `SEMANTIC VALIDATION FAILED:\n${semanticIssues.join('\n')}\n\nYour SQL does not match the user's intent. Please review the STRICT RULES above and fix the query.`;
        
        retryMessages.push({
          role: 'assistant',
          content: sqlQuery
        });
        
        if (attempt === maxAttempts) {
          return {
            success: false,
            error: lastError,
            sql: sqlQuery,
            attempts: attempt,
            totalTime: Date.now() - startTime
          };
        }
        continue; // Retry with semantic error feedback
      }
      
      // Step 9: Validate SQL by executing it
      try {
        const queryStartTime = Date.now();
        const result = await pool.query(sqlQuery);
        const executionTime = Date.now() - queryStartTime;
        
        console.log(`✅ Query executed successfully in ${executionTime}ms`);
        
        const totalTime = Date.now() - startTime;
        
        return {
          success: true,
          sql: sqlQuery,
          rows: result.rows,
          rowCount: result.rowCount,
          fields: result.fields?.map(f => f.name) || [],
          attempts: attempt,
          relevantTables,
          executionTime,
          totalTime
        };
      } catch (execError) {
        console.error(`❌ Execution error on attempt ${attempt}:`, execError.message);
        lastError = execError.message;
        
        retryMessages.push({
          role: 'assistant',
          content: sqlQuery
        });
        
        // If last attempt, return the error
        if (attempt === maxAttempts) {
          return {
            success: false,
            error: execError.message,
            sql: sqlQuery,
            attempts: attempt,
            totalTime: Date.now() - startTime
          };
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Error in generateSQLWithCorrection:', error);
    return {
      success: false,
      error: error.message,
      totalTime: Date.now() - startTime
    };
  }
};

/**
 * Explain results in natural language
 */
const explainResults = async (prompt, sql, results) => {
  try {
    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant. Explain database query results in simple, user-friendly language.'
        },
        {
          role: 'user',
          content: `User asked: "${prompt}"

SQL Query executed:
${sql}

Results (showing first 5 rows):
${JSON.stringify(results.slice(0, 5), null, 2)}

Total rows: ${results.length}

Provide a clear, concise explanation of what these results show.`
        }
      ],
      temperature: 0.5,
      max_tokens: 400
    });
    
    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error('Error explaining results:', error);
    return 'Results retrieved successfully.';
  }
};

module.exports = {
  generateSQLWithCorrection,
  explainResults,
  getEnhancedSchemaInfo
};

