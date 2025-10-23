# NutriScan - Intelligent Nutrition Management Platform

<div align="center">
  
  **Enterprise-Grade Nutrition Tracking • RAG-Based AI Assistant • Real-time Analytics**
  
  ![Neon](https://img.shields.io/badge/Database-Neon-00E699?style=for-the-badge&logo=postgresql&logoColor=white)
  ![Next.js](https://img.shields.io/badge/Frontend-Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white)
  ![Node.js](https://img.shields.io/badge/Backend-Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white)
  ![Firebase](https://img.shields.io/badge/Auth-Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)
  ![Gemini](https://img.shields.io/badge/AI-Gemini-4285F4?style=for-the-badge&logo=google&logoColor=white)
  ![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)

</div>

---

## Overview

NutriScan is a comprehensive nutrition management platform that leverages cutting-edge AI technology to provide personalized dietary insights and recommendations. Built with modern web technologies and powered by Neon's serverless PostgreSQL database, the platform offers scalable, real-time nutrition tracking capabilities for health-conscious individuals and organizations.

## Key Features

### 🔍 **Intelligent Food Recognition**
- **Barcode Scanning**: Advanced barcode detection using ZXing library
- **Product Database Integration**: Real-time data from OpenFoodFacts API
- **Nutritional Analysis**: Comprehensive macro and micronutrient breakdown

### 🤖 **RAG-Based AI Chatbot**
- **Conversational Interface**: Natural language conversations about nutrition and health goals
- **Retrieval-Augmented Generation**: Personalized responses based on user history, consumption logs, and preferences
- **Context-Aware Responses**: AI maintains conversation context and provides relevant nutritional guidance
- **Personal Health Insights**: AI analyzes user data to provide tailored dietary advice and goal tracking support

### � **Intelligent Product Analysis**
- **AI-Powered Health Scoring**: Comprehensive health assessment of food products (1-100 scale)
- **Nutritional Insights**: Detailed analysis of positive aspects and health concerns for each product
- **Alternative Suggestions**: AI-recommended healthier alternatives with availability information
- **Personalized Recommendations**: Product-specific consumption advice based on user preferences and health goals

### � **Nutrition Tracking & Goals**
- **Daily Goal Management**: Customizable targets for calories, macros, and micronutrients
- **Consumption Logging**: Historical tracking of food intake with detailed nutritional breakdown
- **Progress Monitoring**: Real-time updates on daily nutritional goals and achievements
- **User Profiles**: Personalized settings and dietary preferences management

## Architecture & Technology Stack

### Frontend Architecture
- **Framework**: Next.js 14 with App Router for optimal performance and SEO
- **Language**: TypeScript for type safety and enhanced developer experience
- **Styling**: Tailwind CSS with custom component library using Radix UI primitives
- **State Management**: React Context API with optimized re-rendering patterns
- **PWA Features**: Next-PWA integration for offline functionality and app-like experience
- **Performance**: Code splitting, dynamic imports, and image optimization

### Backend Infrastructure
- **Runtime**: Node.js with Express.js framework for scalable API development
- **Database ORM**: Sequelize with advanced query optimization and relationship management
- **Authentication**: Firebase Admin SDK for secure token validation and user management
- **Rate Limiting**: Express-based throttling for API protection and performance
- **Middleware Stack**: Helmet for security, Morgan for logging, Compression for optimization

### Database & Storage Solutions
- **Primary Database**: Neon PostgreSQL - Serverless, auto-scaling, and branch-based development
- **Authentication Store**: Firebase Auth for user credentials and session management
- **Performance Optimization**: Database indexing and query optimization scripts
- **Data Integrity**: Sequelize migrations and model relationships for consistent data structure

### AI & Machine Learning Integration
- **Language Model**: Google Gemini Pro for natural language processing and generation
- **RAG Implementation**: Custom retrieval system combining user data with nutritional knowledge base
- **External APIs**: OpenFoodFacts integration for comprehensive product information
- **Data Processing**: Advanced nutrition calculation algorithms and recommendation engines

## Getting Started

### Prerequisites
- Node.js 18+ and npm/yarn package manager
- Neon PostgreSQL database instance
- Firebase project with Authentication enabled
- Google Gemini AI API access

### Installation & Setup

#### 1. Clone the Repository
```bash
git clone https://github.com/aamrindersingh/NutriScan-backend.git
cd NutriScan-backend
```

#### 2. Backend Configuration
```bash
cd backend
npm install

# Configure environment variables
cp .env.example .env
# Edit .env with your configuration values

# Initialize database
npm run init-db

# Start development server
npm run dev
```

#### 3. Frontend Configuration
```bash
cd frontend
npm install

# Configure environment variables
cp .env.local.example .env.local
# Edit .env.local with your configuration values

# Start development server
npm run dev
```

### Environment Configuration

#### Backend Environment Variables (.env)
```env
# Database Configuration
DATABASE_URL=postgresql://user:password@your-neon-db.neon.tech/nutriscan

# Firebase Configuration
FIREBASE_SERVICE_ACCOUNT_KEY=path/to/your/firebase-service-account.json

# AI Configuration
GEMINI_API_KEY=your_google_gemini_api_key

# Server Configuration
PORT=3001
NODE_ENV=development

# Security
JWT_SECRET=your_jwt_secret_key
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

#### Frontend Environment Variables (.env.local)
```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3001

# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id

# PWA Configuration
NEXT_PUBLIC_APP_NAME=NutriScan
NEXT_PUBLIC_APP_DESCRIPTION=Intelligent Nutrition Management Platform
```

## Database Schema & Migrations

The application uses Sequelize ORM with the following core entities:
- **Users**: Authentication and basic user information
- **Profiles**: Extended user profiles with preferences and settings
- **DailyGoals**: Customizable nutritional targets and objectives
- **FoodItems**: Comprehensive food database with nutritional information
- **ConsumptionLogs**: Historical tracking of user food consumption

### Running Migrations
```bash
cd backend
npm run migrate
npm run seed # Optional: populate with sample data
```

## Development Workflow

### Code Structure
```
backend/
├── config/          # Database and service configurations
├── controllers/     # Business logic and request handlers
├── middlewares/     # Authentication and validation middleware
├── models/          # Sequelize database models
├── routes/          # API route definitions
├── services/        # External service integrations
└── utils/           # Helper functions and utilities

frontend/
├── src/app/         # Next.js app router pages
├── src/components/  # Reusable React components
├── src/contexts/    # React context providers
├── src/hooks/       # Custom React hooks
├── src/lib/         # Utility libraries and configurations
└── src/types/       # TypeScript type definitions
```

### Development Scripts
```bash
# Backend
npm run dev          # Start development server with hot reload
npm run build        # Build for production
npm run start        # Start production server
npm run migrate      # Run database migrations
npm run test         # Run test suite

# Frontend
npm run dev          # Start development server
npm run build        # Build optimized production bundle
npm run start        # Start production server
npm run lint         # Run ESLint code quality checks
npm run type-check   # Run TypeScript type checking
```

## Performance & Scalability

### Database Optimization
- **Neon Database Features**: Serverless PostgreSQL with automatic scaling and branching
- **Connection Pooling**: Optimized database connections for high-concurrency scenarios
- **Query Optimization**: Indexed searches and optimized JOIN operations
- **Data Archiving**: Automated cleanup and archival of historical consumption data

### Frontend Performance
- **Bundle Optimization**: Code splitting and tree shaking for minimal bundle sizes
- **Image Optimization**: Next.js automatic image optimization and lazy loading
- **Caching Strategy**: Intelligent caching of API responses and static assets
- **Progressive Loading**: Skeleton screens and progressive enhancement

---

<div align="center">
  
**Powered by Neon Database**

*Serverless PostgreSQL • Auto-scaling • Developer-first*

**Built for the Modern Web**

</div>
