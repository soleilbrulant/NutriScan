const sequelize = require('../config/database');
const { User, Profile, DailyGoal } = require('../models/relations');

async function diagnoseDatabase() {
  try {
    console.log('🔍 Database Diagnostic Tool');
    console.log('============================');

    // Check if tables exist
    const tables = await sequelize.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'",
      { type: sequelize.QueryTypes.SELECT }
    );
    
    console.log('\n📋 Available Tables:');
    tables.forEach(table => console.log(`  - ${table.table_name}`));

    // Check Users table
    const userCount = await User.count();
    console.log(`\n👥 Users: ${userCount} total`);

    if (userCount > 0) {
      const sampleUser = await User.findOne({ 
        limit: 1,
        attributes: ['id', 'firebase_uid', 'name', 'email']
      });
      console.log('   Sample user:', sampleUser?.dataValues);
    }

    // Check Profiles table
    const profileCount = await Profile.count();
    console.log(`\n📊 Profiles: ${profileCount} total`);

    if (profileCount > 0) {
      const sampleProfile = await Profile.findOne({ 
        limit: 1,
        attributes: ['id', 'userId', 'age', 'gender', 'weight', 'height', 'activityLevel']
      });
      console.log('   Sample profile:', sampleProfile?.dataValues);
    }

    // Check DailyGoals table
    const goalCount = await DailyGoal.count();
    console.log(`\n🎯 Daily Goals: ${goalCount} total`);

    if (goalCount > 0) {
      const sampleGoal = await DailyGoal.findOne({ 
        limit: 1,
        attributes: ['id', 'userId', 'targetCalories', 'goalType']
      });
      console.log('   Sample goal:', sampleGoal?.dataValues);
    }

    // Check for orphaned profiles/goals
    if (userCount > 0 && profileCount > 0) {
      const profilesWithUsers = await sequelize.query(`
        SELECT p.id, p."userId", u.id as user_exists 
        FROM "Profiles" p 
        LEFT JOIN "Users" u ON p."userId" = u.id 
        LIMIT 5
      `, { type: sequelize.QueryTypes.SELECT });
      
      console.log('\n🔗 Profile-User Relations:');
      profilesWithUsers.forEach(rel => {
        console.log(`   Profile ${rel.id} -> User ${rel.userId} (exists: ${!!rel.user_exists})`);
      });
    }

    // Test the specific chatbot query pattern
    if (userCount > 0) {
      const testUser = await User.findOne({ limit: 1 });
      console.log(`\n🧪 Testing chatbot query for user: ${testUser.id}`);
      
      const profile = await Profile.findOne({ 
        where: { userId: testUser.id } 
      });
      
      const dailyGoal = await DailyGoal.findOne({ 
        where: { userId: testUser.id } 
      });
      
      console.log('   Profile found:', !!profile);
      console.log('   Daily goal found:', !!dailyGoal);
      
      if (profile) {
        console.log('   Profile data:', {
          age: profile.age,
          gender: profile.gender,
          weight: profile.weight,
          height: profile.height,
          activityLevel: profile.activityLevel
        });
      }
      
      if (dailyGoal) {
        console.log('   Goal data:', {
          targetCalories: dailyGoal.targetCalories,
          goalType: dailyGoal.goalType
        });
      }
    }

    console.log('\n✅ Diagnostic complete!');
    
  } catch (error) {
    console.error('❌ Diagnostic error:', error);
  } finally {
    await sequelize.close();
  }
}

// Run if called directly
if (require.main === module) {
  diagnoseDatabase()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = diagnoseDatabase;