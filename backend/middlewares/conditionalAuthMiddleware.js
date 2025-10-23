const { auth } = require('../config/firebase');

const conditionalAuthMiddleware = async (req, res, next) => {
  // Skip authentication for specific routes
  const publicRoutes = [
    '/api/food/barcode/',
    '/api/food/search-external'
  ];
  
  // Check if the current route should skip authentication
  const isPublicRoute = publicRoutes.some(route => req.path.startsWith(route));
  
  if (isPublicRoute) {
    return next();
  }
  
  // Apply normal authentication for other routes
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Access denied. No token provided or invalid format.' 
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify the Firebase token
    const decodedToken = await auth.verifyIdToken(token);
    
    // Attach user info to request
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      name: decodedToken.name,
      picture: decodedToken.picture
    };

    next();
  } catch (error) {
    console.error('Token verification failed:', error);
    
    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({ 
        error: 'Token expired. Please login again.' 
      });
    }
    
    if (error.code === 'auth/invalid-id-token') {
      return res.status(401).json({ 
        error: 'Invalid token. Please login again.' 
      });
    }

    return res.status(401).json({ 
      error: 'Invalid token. Access denied.' 
    });
  }
};

module.exports = conditionalAuthMiddleware; 