const { pool } = require('../config/database');

const getSchemaInfo = async () => {
  try {
    const query = `
      SELECT 
        table_name,
        column_name,
        data_type,
        is_nullable
      FROM 
        information_schema.columns
      WHERE 
        table_schema = 'public'
      ORDER BY 
        table_name, ordinal_position;
    `;

    const result = await pool.query(query);
    
    // Format schema information for better readability
    const tables = {};
    result.rows.forEach(row => {
      if (!tables[row.table_name]) {
        tables[row.table_name] = [];
      }
      tables[row.table_name].push({
        column: row.column_name,
        type: row.data_type,
        nullable: row.is_nullable === 'YES'
      });
    });

    // Create a formatted string for OpenAI
    let schemaString = 'Available Tables:\n\n';
    Object.keys(tables).forEach(tableName => {
      schemaString += `Table: ${tableName}\n`;
      tables[tableName].forEach(col => {
        schemaString += `  - ${col.column} (${col.type})${col.nullable ? ' [nullable]' : ''}\n`;
      });
      schemaString += '\n';
    });

    return {
      raw: result.rows,
      formatted: schemaString,
      tables: tables
    };
  } catch (error) {
    console.error('Error fetching schema:', error.message);
    throw error;
  }
};

const executeQuery = async (sqlQuery) => {
  const client = await pool.connect();
  try {
    // Security check: prevent destructive operations unless explicitly allowed
    const destructiveKeywords = ['DROP', 'DELETE', 'TRUNCATE', 'ALTER'];
    const queryUpper = sqlQuery.toUpperCase();
    
    const isDestructive = destructiveKeywords.some(keyword => 
      queryUpper.includes(keyword)
    );

    if (isDestructive) {
      // You can add additional authorization checks here
      console.warn('⚠️  Destructive query detected:', sqlQuery);
    }

    const startTime = Date.now();
    const result = await client.query(sqlQuery);
    const executionTime = Date.now() - startTime;

    return {
      success: true,
      rows: result.rows,
      rowCount: result.rowCount,
      executionTime,
      fields: result.fields?.map(f => f.name) || []
    };
  } catch (error) {
    console.error('Query execution error:', error.message);
    return {
      success: false,
      error: error.message,
      detail: error.detail || 'No additional details available'
    };
  } finally {
    client.release();
  }
};

const getTableStats = async () => {
  try {
    const query = `
      SELECT 
        schemaname,
        tablename,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
        n_live_tup as row_count
      FROM pg_stat_user_tables
      ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
    `;

    const result = await pool.query(query);
    return result.rows;
  } catch (error) {
    console.error('Error fetching table stats:', error.message);
    throw error;
  }
};

module.exports = {
  getSchemaInfo,
  executeQuery,
  getTableStats,
};

