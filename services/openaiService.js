const OpenAI = require('openai');
require('dotenv').config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Helper function to optimize schema info for large databases
const optimizeSchemaInfo = (schemaInfo) => {
  // Split by table
  const lines = schemaInfo.split('\n');
  const tables = [];
  let currentTable = null;
  let columnCount = 0;
  
  for (const line of lines) {
    if (line.startsWith('Table: ')) {
      if (currentTable) {
        tables.push({ ...currentTable, columnCount });
      }
      currentTable = {
        name: line.replace('Table: ', '').trim(),
        columns: []
      };
      columnCount = 0;
    } else if (line.trim().startsWith('- ') && currentTable) {
      // Extract column info more concisely
      const match = line.match(/- (\w+) \(([^)]+)\)/);
      if (match) {
        currentTable.columns.push(`${match[1]}:${match[2]}`);
        columnCount++;
      }
    }
  }
  
  if (currentTable) {
    tables.push({ ...currentTable, columnCount });
  }
  
  // Create optimized schema string
  let optimized = 'Database Tables:\n';
  for (const table of tables) {
    optimized += `\n${table.name} (${table.columnCount} columns): ${table.columns.slice(0, 10).join(', ')}`;
    if (table.columns.length > 10) {
      optimized += `, ...${table.columns.length - 10} more`;
    }
  }
  
  return optimized;
};

const generateSQL = async (prompt, schemaInfo) => {
  try {
    // Use GPT-4 Turbo with larger context window
    const model = process.env.OPENAI_MODEL || 'gpt-4-turbo-preview';
    
    // Optimize schema if it's too large
    let optimizedSchema = schemaInfo;
    if (schemaInfo.length > 10000) {
      console.log('⚠️  Large schema detected, optimizing for OpenAI...');
      optimizedSchema = optimizeSchemaInfo(schemaInfo);
    }
    
    const systemPrompt = `You are a SQL expert. Convert natural language questions into PostgreSQL queries.

Database Schema:
${optimizedSchema}

Rules:
1. Generate ONLY the SQL query without any explanations
2. Use proper PostgreSQL syntax
3. Ensure queries are safe and use parameterized queries when needed
4. For SELECT queries, limit results to 100 rows by default unless specified
5. Do not generate destructive queries (DROP, DELETE, TRUNCATE) unless explicitly requested
6. Return only the SQL query text`;

    const response = await openai.chat.completions.create({
      model: model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      temperature: 0.1,
      max_tokens: 500,
    });

    const sqlQuery = response.choices[0].message.content.trim();
    
    // Remove markdown code blocks if present
    const cleanedSQL = sqlQuery
      .replace(/```sql\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    return cleanedSQL;
  } catch (error) {
    console.error('OpenAI API Error:', error.message);
    
    // Provide more specific error messages
    if (error.message && error.message.includes('maximum context length')) {
      throw new Error('Database schema too large. Try asking about specific tables.');
    }
    
    throw new Error('Failed to generate SQL query');
  }
};

const explainQuery = async (query, results) => {
  try {
    const model = process.env.OPENAI_MODEL || 'gpt-4-turbo-preview';
    
    const prompt = `Given this SQL query:
${query}

And these results (first few rows):
${JSON.stringify(results.slice(0, 5), null, 2)}

Provide a brief, user-friendly explanation of what this query does and what the results show.`;

    const response = await openai.chat.completions.create({
      model: model,
      messages: [
        { role: 'system', content: 'You are a helpful assistant that explains database queries and results in simple terms.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.5,
      max_tokens: 300,
    });

    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error('OpenAI API Error:', error.message);
    return 'Explanation not available';
  }
};

module.exports = {
  generateSQL,
  explainQuery,
};

