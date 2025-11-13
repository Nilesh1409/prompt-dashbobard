const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();

const { testConnection, pool } = require('./config/database');
const { generateSQL, explainQuery } = require('./services/openaiService');
const { generateSQLWithCorrection, explainResults } = require('./services/enhancedOpenAIService');
const { getSchemaInfo, executeQuery, getTableStats } = require('./services/mcpService');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Health check endpoint
app.get('/api/health', async (req, res) => {
  const dbConnected = await testConnection();
  res.json({
    status: 'ok',
    database: dbConnected ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

// Get database schema
app.get('/api/schema', async (req, res) => {
  try {
    const schema = await getSchemaInfo();
    res.json({
      success: true,
      schema: schema.tables,
      formatted: schema.formatted
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get table statistics
app.get('/api/stats', async (req, res) => {
  try {
    const stats = await getTableStats();
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Main prompt endpoint - convert natural language to SQL and execute
app.post('/api/query', async (req, res) => {
  try {
    const { prompt, useEnhanced = true, conversationHistory = [] } = req.body;

    if (!prompt) {
      return res.status(400).json({
        success: false,
        error: 'Prompt is required'
      });
    }

    console.log('📝 User prompt:', prompt);
    console.log('🎯 Using enhanced mode:', useEnhanced);
    console.log('💬 Conversation history items:', conversationHistory.length);

    if (useEnhanced) {
      // ✨ Enhanced mode with self-correction and smart table selection
      const result = await generateSQLWithCorrection(pool, prompt, 3, conversationHistory);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: result.error,
          generatedSQL: result.sql,
          attempts: result.attempts,
          totalTime: result.totalTime,
          message: `Failed to generate valid SQL query after ${result.attempts} attempts`
        });
      }

      // Get natural language explanation
      const explanation = await explainResults(prompt, result.sql, result.rows);

      res.json({
        success: true,
        prompt,
        generatedSQL: result.sql,
        explanation,
        results: {
          rows: result.rows,
          rowCount: result.rowCount,
          executionTime: result.executionTime,
          fields: result.fields
        },
        metadata: {
          attempts: result.attempts,
          relevantTables: result.relevantTables,
          totalTime: result.totalTime,
          enhanced: true
        }
      });
    } else {
      // Original mode (fallback)
      const schema = await getSchemaInfo();
      const sqlQuery = await generateSQL(prompt, schema.formatted);

      console.log('info:/api/query SQL Query:', sqlQuery);

      const result = await executeQuery(sqlQuery);

      console.log('info:/api/query Result:', result);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: result.error,
          detail: result.detail,
          generatedSQL: sqlQuery
        });
      }

      const explanation = await explainQuery(sqlQuery, result.rows);

      res.json({
        success: true,
        prompt,
        generatedSQL: sqlQuery,
        explanation,
        results: {
          rows: result.rows,
          rowCount: result.rowCount,
          executionTime: result.executionTime,
          fields: result.fields
        },
        metadata: {
          enhanced: false
        }
      });
    }
  } catch (error) {
    console.error('❌ Error processing query:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Direct SQL execution endpoint (for advanced users)
app.post('/api/execute', async (req, res) => {
  try {
    const { sql } = req.body;

    if (!sql) {
      return res.status(400).json({
        success: false,
        error: 'SQL query is required'
      });
    }

    const result = await executeQuery(sql);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error,
        detail: result.detail
      });
    }

    res.json({
      success: true,
      results: {
        rows: result.rows,
        rowCount: result.rowCount,
        executionTime: result.executionTime,
        fields: result.fields
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Start server
const startServer = async () => {
  // Test database connection
  const dbConnected = await testConnection();
  
  if (!dbConnected) {
    console.error('⚠️  Warning: Database connection failed. Please check your configuration.');
  }

  app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
    console.log(`📊 Dashboard available at http://localhost:${PORT}`);
    console.log(`🔧 API endpoints:`);
    console.log(`   - GET  /api/health`);
    console.log(`   - GET  /api/schema`);
    console.log(`   - GET  /api/stats`);
    console.log(`   - POST /api/query`);
    console.log(`   - POST /api/execute`);
  });
};

startServer();

module.exports = app;

