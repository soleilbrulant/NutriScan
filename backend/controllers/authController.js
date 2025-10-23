const { auth } = require('../config/firebase');
const { User, Profile } = require('../models/relations');

const authController = {
    // POST /auth/login
    login: async (req, res) => {
        try {
            const { token } = req.body;

            if (!token) {
                return res.status(400).json({ 
                    error: 'Firebase token is required' 
                });
            }

            // Verify the Firebase token
            const decodedToken = await auth.verifyIdToken(token);
            
            const { uid, email, name, picture } = decodedToken;
            
            // Step 1: Find the user
            let user = await User.findOne({ 
                where: { firebase_uid: uid }
            });

            let isNewUser = false;

            // Step 2: If user doesn't exist, create new user
            if (!user) {
                user = await User.create({
                    firebase_uid: uid,
                    email: email,
                    name: name || email.split('@')[0],
                    pictureUrl: picture || null
                });
                isNewUser = true; // New user needs onboarding
                
            } else {
                
                // Step 3: Check if user has a profile
                const existingProfile = await Profile.findOne({
                    where: { userId: user.id }
                });


                if (existingProfile) {
                    
                    isNewUser = false; // User has profile = go to home
                } else {
                    isNewUser = true; // User exists but no profile = needs onboarding
                }
                
                // Update user info if it has changed
                const updates = {};
                if (user.email !== email) updates.email = email;
                if (user.name !== name && name) updates.name = name;
                if (user.pictureUrl !== picture && picture) updates.pictureUrl = picture;

                if (Object.keys(updates).length > 0) {
                    await user.update(updates);
                    console.log('🔄 User info updated:', updates);
                }
            }

            // Return user data (without sensitive info)
            res.status(200).json({
                message: 'Login successful',
                isNewUser: isNewUser,
                user: {
                    id: user.id,
                    firebase_uid: user.firebase_uid,
                    email: user.email,
                    name: user.name,
                    pictureUrl: user.pictureUrl,
                    createdAt: user.createdAt,
                    updatedAt: user.updatedAt
                }
            });

        } catch (error) {
            
            
            if (error.code === 'auth/id-token-expired') {
                return res.status(401).json({ 
                    error: 'Token expired. Please login again.' 
                });
            }
            
            if (error.code === 'auth/invalid-id-token') {
                return res.status(401).json({ 
                    error: 'Invalid token. Please provide a valid Firebase token.' 
                });
            }

            res.status(500).json({ 
                error: 'Login failed. Please try again.' 
            });
        }
    },

    // GET /auth/me (get current user)
    getMe: async (req, res) => {
        try {
            const user = await User.findOne({ 
                where: { firebase_uid: req.user.uid },
                attributes: { exclude: ['firebase_uid'] } // Don't expose firebase_uid
            });

            if (!user) {
                return res.status(404).json({ 
                    error: 'User not found' 
                });
            }

            res.status(200).json({ user });
        } catch (error) {
            console.error('Get user error:', error);
            res.status(500).json({ 
                error: 'Failed to fetch user data' 
            });
        }
    },

    
};

module.exports = authController; 