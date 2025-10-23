const { neon, neonConfig } = require('@neondatabase/serverless');
const { Pool } = require('@neondatabase/serverless');
require('dotenv').config();

// Configure Neon for WebSocket usage (for better performance in serverless)
neonConfig.fetchConnectionCache = true;

const sql = neon(process.env.DATABASE_URL);

// Connection pool for more complex operations
const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  ssl: true
});

// Utility function for executing raw SQL with Neon
async function executeQuery(query, params = []) {
  try {
    const result = await sql(query, params);
    return result;
  } catch (error) {
    console.error('Neon Query Error:', error);
    throw error;
  }
}


// Export both the direct sql function and utilities
module.exports = {
  sql,
  pool,
  executeQuery,
  neonConfig
}; 