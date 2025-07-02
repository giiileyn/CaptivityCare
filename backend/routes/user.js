const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const User = require('../models/User');
const Task = require('../models/Task');


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

// GET all users with their assigned tasks ************

// router.get('/tasks/all', async (req, res) => {
//   try {
//     const usersWithTasks = await User.find()
//       .select('name email userType') // select only useful fields
//       .lean(); // use lean for performance

//     // For each user, fetch tasks assigned to them
//     const results = await Promise.all(
//       usersWithTasks.map(async (user) => {
//         const tasks = await Task.find({ assignedTo: user._id })
//           .populate('animalId', 'name species')
//           .lean();

//         return {
//           ...user,
//           tasks,
//         };
//       })
//     );

//     res.json(results);
//   } catch (error) {
//     console.error('Error fetching tasks per user:', error);
//     res.status(500).json({ error: 'Internal server error' });
//   }
// });


module.exports = router;