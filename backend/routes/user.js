const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');

// GET /user/profile - Get authenticated user's profile
router.get('/profile', authenticate, async (req, res) => {
    try {
        res.status(200).json({
            success: true,
            user: {
                id: req.user._id,
                name: req.user.name,
                email: req.user.email,
                profilePhoto: req.user.profilePhoto,
            }
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: 'Error fetching profile'
        });
    }
});

module.exports = router;