const sequelize = require('../config/database');

/**
 * Database Performance Optimization Script
 * Adds critical indexes for faster query performance
 */
async function addPerformanceIndexes() {
  try {
    // Add indexes for better query performance
    const indexes = [
      // Users table indexes
      `CREATE INDEX IF NOT EXISTS idx_users_firebase_uid ON "Users"("firebase_uid");`,
      `CREATE INDEX IF NOT EXISTS idx_users_email ON "Users"("email");`,

      // Profiles table indexes
      `CREATE INDEX IF NOT EXISTS idx_profiles_userid ON "Profiles"("userId");`,
      `CREATE INDEX IF NOT EXISTS idx_profiles_activitylevel ON "Profiles"("activityLevel");`,

      // DailyGoals table indexes  
      `CREATE INDEX IF NOT EXISTS idx_dailygoals_userid ON "DailyGoals"("userId");`,
      `CREATE INDEX IF NOT EXISTS idx_dailygoals_goaltype ON "DailyGoals"("goalType");`,

      // FoodItems table indexes
      `CREATE INDEX IF NOT EXISTS idx_fooditems_barcode ON "FoodItems"("barcode");`,
      `CREATE INDEX IF NOT EXISTS idx_fooditems_name ON "FoodItems"("productName");`,
      `CREATE INDEX IF NOT EXISTS idx_fooditems_source ON "FoodItems"("source");`,

      // ConsumptionLogs table indexes (most important for performance)
      `CREATE INDEX IF NOT EXISTS idx_consumptionlogs_userid ON "ConsumptionLogs"("userId");`,
      `CREATE INDEX IF NOT EXISTS idx_consumptionlogs_date ON "ConsumptionLogs"("consumedAt");`,
      `CREATE INDEX IF NOT EXISTS idx_consumptionlogs_userid_date ON "ConsumptionLogs"("userId", "consumedAt");`,
      `CREATE INDEX IF NOT EXISTS idx_consumptionlogs_barcode ON "ConsumptionLogs"("barcode");`,

      // Composite indexes for common query patterns
      `CREATE INDEX IF NOT EXISTS idx_profiles_userid_activity ON "Profiles"("userId", "activityLevel");`,
      `CREATE INDEX IF NOT EXISTS idx_consumptionlogs_userid_date_desc ON "ConsumptionLogs"("userId", "consumedAt" DESC);`,
    ];

    // Execute each index creation
    for (const indexSQL of indexes) {
      try {
        await sequelize.query(indexSQL);
        console.log('✅ Created index:', indexSQL.match(/idx_\w+/)[0]);
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log('ℹ️  Index already exists:', indexSQL.match(/idx_\w+/)[0]);
        } else {
          console.error('❌ Error creating index:', error.message);
        }
      }
    }

    // Add EXPLAIN ANALYZE helper function
    await sequelize.query(`
      CREATE OR REPLACE FUNCTION explain_query(query_text TEXT)
      RETURNS TABLE(plan TEXT)
      LANGUAGE SQL
      AS $$
        SELECT EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT) || query_text;
      $$;
    `).catch(() => {
      console.log('ℹ️  Could not create explain helper function (PostgreSQL only)');
    });

   

  } catch (error) {
    console.error('❌ Error adding indexes:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// Run if called directly
if (require.main === module) {
  addPerformanceIndexes()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = addPerformanceIndexes;