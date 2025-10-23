# NutriScan Backend

A Node.js backend for a nutrition tracking application using Express.js, Sequelize ORM, and PostgreSQL (Neon).

## Database Schema

### Tables Overview

The application uses 5 main tables with the following relationships:

1. **Users** - Stores Google OAuth user information
2. **Profiles** - One-to-one with Users, stores body metrics
3. **DailyGoals** - One-to-one with Users, stores nutritional targets
4. **FoodItems** - Stores food data fetched via barcodes
5. **ConsumptionLogs** - Many-to-one with Users and FoodItems, tracks daily consumption

### Detailed Schema

#### Users Table
```sql
- id (PRIMARY KEY, AUTO_INCREMENT)
- googleId (STRING, UNIQUE, NOT NULL) - Google OAuth ID
- email (STRING, UNIQUE, NOT NULL) - User email
- name (STRING, NOT NULL) - User display name
- pictureUrl (STRING) - Google profile picture URL
- createdAt, updatedAt (TIMESTAMPS)
```

#### Profiles Table
```sql
- id (PRIMARY KEY, AUTO_INCREMENT)
- userId (INTEGER, UNIQUE, NOT NULL, FOREIGN KEY -> Users.id)
- age (INTEGER, 1-120)
- gender (ENUM: 'male', 'female', 'other')
- height (FLOAT, 30-300 cm)
- weight (FLOAT, 20-500 kg)
- bmi (FLOAT, calculated value)
- activityLevel (ENUM: 'sedentary', 'light', 'moderate', 'active', 'very_active')
- goalType (ENUM: 'loss', 'gain', 'maintain')
- createdAt, updatedAt (TIMESTAMPS)
```

#### DailyGoals Table
```sql
- id (PRIMARY KEY, AUTO_INCREMENT)
- userId (INTEGER, UNIQUE, NOT NULL, FOREIGN KEY -> Users.id)
- calories (INTEGER, >= 0) - Daily calorie target
- carbs (FLOAT, >= 0) - Daily carbs target (grams)
- proteins (FLOAT, >= 0) - Daily protein target (grams)
- fats (FLOAT, >= 0) - Daily fats target (grams)
- sugars (FLOAT, >= 0) - Daily sugar target (grams)
- createdAt, updatedAt (TIMESTAMPS)
```

#### FoodItems Table
```sql
- barcode (STRING, PRIMARY KEY) - Product barcode
- name (STRING, NOT NULL) - Food item name
- servingSize (FLOAT, >= 0) - Serving size in grams
- caloriesPer100g (FLOAT, >= 0) - Calories per 100g
- carbsPer100g (FLOAT, >= 0) - Carbs per 100g
- proteinsPer100g (FLOAT, >= 0) - Proteins per 100g
- fatsPer100g (FLOAT, >= 0) - Fats per 100g
- sugarsPer100g (FLOAT, >= 0) - Sugars per 100g
- createdAt, updatedAt (TIMESTAMPS)
```

#### ConsumptionLogs Table
```sql
- id (PRIMARY KEY, AUTO_INCREMENT)
- userId (INTEGER, NOT NULL, FOREIGN KEY -> Users.id)
- barcode (STRING, NOT NULL, FOREIGN KEY -> FoodItems.barcode)
- date (DATE, NOT NULL) - Consumption date
- amountConsumed (FLOAT, >= 0) - Amount consumed in grams
- caloriesConsumed (FLOAT, >= 0) - Calculated calories consumed
- carbsConsumed (FLOAT, >= 0) - Calculated carbs consumed
- proteinsConsumed (FLOAT, >= 0) - Calculated proteins consumed
- fatsConsumed (FLOAT, >= 0) - Calculated fats consumed
- sugarsConsumed (FLOAT, >= 0) - Calculated sugars consumed
- createdAt, updatedAt (TIMESTAMPS)
```

## Relationships

- **User ↔ Profile**: One-to-One
- **User ↔ DailyGoal**: One-to-One
- **User ↔ ConsumptionLog**: One-to-Many
- **FoodItem ↔ ConsumptionLog**: One-to-Many

## Setup Instructions

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Configuration**
   Copy `env.example` to `.env` and update the values:
   ```bash
   cp env.example .env
   ```

3. **Database Configuration**
   Update your `.env` file with your Neon PostgreSQL connection string:
   ```
   DATABASE_URL=postgresql://username:password@hostname/database?sslmode=require
   ```

4. **Run the Application**
   ```bash
   # Development
   npm run dev
   
   # Production
   npm start
   ```

5. **Database Sync**
   The models will automatically sync with the database when the server starts.

## API Endpoints

- `GET /` - Welcome message
- `GET /health` - Health check with database status

## Technology Stack

- **Framework**: Express.js
- **ORM**: Sequelize
- **Database**: PostgreSQL (Neon)
- **Authentication**: Google OAuth (to be implemented)
- **Security**: Helmet, CORS
- **Logging**: Morgan

## Notes

- All nutritional values in FoodItems are stored per 100g for consistency
- ConsumptionLogs store calculated values based on amount consumed
- BMI is stored in Profile but should be calculated from height/weight
- The schema supports Google OAuth only (no manual registration)
- Activity levels and goal types use ENUMs for data consistency 