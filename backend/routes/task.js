const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const mongoose = require('mongoose');

// ================================

// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Storage config for proof image uploads
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'task-proof-images',
    allowed_formats: ['jpg', 'jpeg', 'png'],
    transformation: [{ width: 800, height: 800, crop: 'limit' }]
  }
});

const upload = multer({ storage });


// ✅ PUT - Update task status with required imageProof when marking as Completed
router.put('/status/:id', upload.single('imageProof'), async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Require imageProof only
    if (!req.file) {
      return res.status(400).json({ error: 'Proof image is required.' });
    }

    const update = {
      imageProof: req.file.path,     // ✅ cloudinary image URL
      completionVerified: false,     // Admin will verify this manually
      status: 'Pending',             // Status remains pending by default
      completedAt: new Date()        // Optional: you can log the time when user submitted proof
    };

    const updatedTask = await Task.findByIdAndUpdate(req.params.id, update, { new: true });

    return res.status(200).json({
      success: true,
      message: 'Proof submitted successfully. Waiting for admin verification.',
      task: updatedTask
    });

  } catch (error) {
    console.error('Error uploading proof:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});



// CREATE task
// ===============================
// router.post('/add', async (req, res) => {
//   try {
//     const {
//       type,
//       assignedTo,
//       animalId,
//       scheduleDate,
//       scheduleTimes,
//       isRecurring,
//       recurrencePattern,
//       endDate,
//       status
//     } = req.body;

//     // Validate required fields for recurring tasks
//     if (isRecurring) {
//       if (!scheduleDate) {
//         return res.status(400).json({ error: 'Recurring tasks require a start date (scheduleDate).' });
//       }
//       if (!recurrencePattern || !endDate) {
//         return res.status(400).json({ error: 'Recurring tasks require recurrencePattern and endDate.' });
//       }
//       if (new Date(endDate) <= new Date(scheduleDate)) {
//         return res.status(400).json({ error: 'End date must be after the start date.' });
//       }
//     }

//     const task = new Task({
//       type,
//       assignedTo,
//       animalId,
//       scheduleDate: scheduleDate || null,
//       scheduleTimes,
//       isRecurring,
//       recurrencePattern,
//       endDate,
//       status: status || 'Pending'
//     });

//     await task.save();
//     res.status(201).json(task);
//   } catch (error) {
//     res.status(400).json({ error: error.message });
//   }
// });

// ================================
// GET all tasks (detailed view)
// ================================
router.get('/getAll', async (req, res) => {
  try {
    const tasks = await Task.find()
      .populate('assignedTo')
      .populate('animalId');
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// ================================
// GET all tasks (detailed view)
// ================================
router.get('/getAll', async (req, res) => {
  try {
    const tasks = await Task.find()
      .populate('assignedTo')
      .populate('animalId');
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ================================
// GET calendar-friendly tasks
// ===============================
router.get('/getTask', async (req, res) => {
  try {
    const tasks = await Task.find()
      .populate('animalId', 'name species photo')
      .populate('assignedTo', 'name');

    const calendarEvents = [];

    tasks.forEach(task => {
      //  Skip completed tasks
      if (task.status === 'Completed') return;

      const animal = task.animalId || {};
      const assignedUser = task.assignedTo || {};

      if (!task.scheduleDate) return;

      const startDate = new Date(task.scheduleDate);
      const endDate = task.endDate ? new Date(task.endDate) : null;

      const recurrence = task.isRecurring ? task.recurrencePattern : null;
      const scheduleTimes = Array.isArray(task.scheduleTimes) ? task.scheduleTimes : [];

      const currentDate = new Date(startDate);

      const addEventsForDate = (date) => {
        const dateStr = date.toISOString().split('T')[0];

        if (scheduleTimes.length > 0) {
          scheduleTimes.forEach(time => {
            const startDateTime = new Date(`${dateStr}T${time}`);
            calendarEvents.push({
              title: `${task.type} - ${animal.name || 'Unknown'}`,
              start: startDateTime,
              status: task.status,
              assignedTo: assignedUser.name || 'Unassigned',
              animal,
              allDay: false,
              taskId: task._id
            });
          });
        } else {
          calendarEvents.push({
            title: `${task.type} - ${animal.name || 'Unknown'}`,
            start: new Date(date),
            status: task.status,
            assignedTo: assignedUser.name || 'Unassigned',
            animal,
            allDay: true,
            taskId: task._id
          });
        }
      };

      if (recurrence && endDate) {
        while (currentDate <= endDate) {
          addEventsForDate(currentDate);
          if (recurrence === 'Daily') currentDate.setDate(currentDate.getDate() + 1);
          else if (recurrence === 'Weekly') currentDate.setDate(currentDate.getDate() + 7);
          else if (recurrence === 'Monthly') currentDate.setMonth(currentDate.getMonth() + 1);
          else break;
        }
      } else {
        addEventsForDate(currentDate);
      }
    });

    res.json(calendarEvents);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});



// ================================
// GET tasks assigned to a user
// ================================
router.get('/user/:userId', async (req, res) => {
  try {
    const tasks = await Task.find({ assignedTo: req.params.userId })
      .populate('animalId');
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});



// ================================
// UPDATE a task
// ================================
router.put('/edit/:id', async (req, res) => {
  try {
    const {
      type,
      assignedTo,
      animalId,
      scheduleDate,
      scheduleTimes,
      isRecurring,
      recurrencePattern,
      endDate,
      status
    } = req.body;

    if (isRecurring) {
      if (!scheduleDate) {
        return res.status(400).json({ error: 'Recurring tasks require a start date (scheduleDate).' });
      }
      if (!recurrencePattern || !endDate) {
        return res.status(400).json({ error: 'Recurring tasks require recurrencePattern and endDate.' });
      }
      if (new Date(endDate) <= new Date(scheduleDate)) {
        return res.status(400).json({ error: 'End date must be after the start date.' });
      }
    }

    const updatedData = {
      type,
      assignedTo,
      animalId,
      scheduleDate: scheduleDate || null,
      scheduleTimes,
      isRecurring,
      recurrencePattern,
      endDate,
      status,
      completedAt: status === 'Completed' ? new Date() : null
    };

    const updatedTask = await Task.findByIdAndUpdate(req.params.id, updatedData, { new: true });

    if (!updatedTask) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.status(200).json(updatedTask);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});







// Update only the status of a task etu sa farmer
router.put('/status/:id', async (req, res) => {
  try {
    const { status } = req.body;

    // Validate input
    if (!['Pending', 'Completed'].includes(status)) {
    }

    const update = {
      status,
      completedAt: status === 'Completed' ? new Date() : null
    };

    const updatedTask = await Task.findByIdAndUpdate(
      req.params.id,
      update,
      { new: true }
    );

    if (!updatedTask) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Task status updated successfully',
      task: updatedTask
    });

  } catch (error) {
    console.error('Error updating task status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});



// ================================
// DELETE a task
// ================================
// router.delete('/delete/:id', async (req, res) => {
//   try {
//     await Task.findByIdAndDelete(req.params.id);
//     res.json({ message: 'Task deleted successfully' });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });



// Count pending tasks
router.get('/count/pending', async (req, res) => {
  try {
    const count = await Task.countDocuments({ status: 'Pending' });
    res.json({ success: true, count });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});



// Count completed tasks
router.get('/count/completed', async (req, res) => {
  try {
    const count = await Task.countDocuments({ status: 'Completed' });
    res.json({ success: true, count });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});


// Count pending and completed tasks assigned to a specific user
router.get('/count/pending/:userId', async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.params.userId);

    const count = await Task.countDocuments({
      assignedTo: userId,
      status: 'Pending'
    });

    res.json({ success: true, count });
  } catch (err) {
    console.error('❌ Error counting pending tasks:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});




// Count completed tasks for a specific user
router.get('/count/completed/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const count = await Task.countDocuments({
      assignedTo: new mongoose.Types.ObjectId(userId),
      status: 'Completed',
    });

    res.json({ success: true, count });
  } catch (err) {
    console.error('❌ Error counting completed tasks:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});


module.exports = router;