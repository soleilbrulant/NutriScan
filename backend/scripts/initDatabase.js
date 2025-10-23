const { initializeDatabase } = require('../models');

const init = async () => {
  try {

    await initializeDatabase();
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  }
};

init(); 