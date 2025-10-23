const sequelize = require('../config/database');

async function checkTableStructure() {
  try {
    console.log('Checking Profiles table structure...');
    
    const [results, metadata] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'Profiles' 
      ORDER BY ordinal_position;
    `);
    
    console.log('Profiles table columns:');
    results.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'YES' ? '(nullable)' : '(not null)'}`);
    });

    console.log('\nChecking DailyGoals table structure...');
    
    const [goalResults, goalMetadata] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'DailyGoals' 
      ORDER BY ordinal_position;
    `);
    
    console.log('DailyGoals table columns:');
    goalResults.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'YES' ? '(nullable)' : '(not null)'}`);
    });

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await sequelize.close();
  }
}

checkTableStructure();