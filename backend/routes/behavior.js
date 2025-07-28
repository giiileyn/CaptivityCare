// routes/behavior.js
const express = require('express');
const router = express.Router();
const AnimalBehavior = require('../models/AnimalBehavior');
const Animal = require('../models/Animals');

//add behavior log
// router.post('/add', async (req, res) => {
//   try {
//     const newLog = new AnimalBehavior(req.body);
//     await newLog.save();
//     res.status(201).json({ message: 'Behavior log saved successfully.' });
//   } catch (err) {
//     res.status(500).json({ error: 'Error saving behavior log.' });
//   }
// });


router.post('/add', async (req, res) => {
  try {
    const newLog = new AnimalBehavior(req.body);
    await newLog.save();

    const { animalId, eating, movement, mood } = req.body;

    // Check for critical behavior
    const needsAttention = (
      eating === 'None' ||
      movement === 'Limping' ||
      mood === 'Aggressive'
    );

    if (needsAttention) {
      await Animal.findByIdAndUpdate(animalId, { status: 'needs_attention' });

      // Optional: log an alert or send email to admin
      console.log(`⚠️ Animal ${animalId} flagged for attention.`);

      // You can insert a notification to DB or trigger admin action here
    }

    res.status(201).json({ message: 'Behavior log saved successfully.' });
  } catch (err) {
    console.error('Error saving behavior log:', err);
    res.status(500).json({ error: 'Error saving behavior log.' });
  }
});
////get behavior of sinle  animal
// exports.getBehaviorsByAnimalId = async (req, res) => {
//   const { animalId } = req.params;

//   try {
//     const behaviors = await AnimalBehavior.find({ animalId })
//       .populate('recordedBy', 'name email') // optional: show who recorded
//       .sort({ createdAt: -1 }); // latest first

//     res.status(200).json({
//       success: true,
//       count: behaviors.length,
//       behaviors,
//     });
//   } catch (error) {
//     console.error('Error fetching behaviors:', error);
//     res.status(500).json({ success: false, message: 'Server error' });
//   }
// };


router.get('/singlebehavior/:animalId', async (req, res) => {
  const { animalId } = req.params;

  try {
    const behaviors = await AnimalBehavior.find({ animalId })
      .populate('recordedBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: behaviors.length,
      behaviors,
    });
  } catch (error) {
    console.error('Error fetching behaviors:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.get('/recent/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    const recentLogs = await AnimalBehavior.find({ recordedBy: userId })
      .populate('animalId', 'name species photo status')
      .sort({ createdAt: -1 })
      .limit(10); // Last 10 entries by this user

    res.status(200).json({ success: true, logs: recentLogs });
  } catch (error) {
    console.error('Error fetching recent behavior logs:', error);
    res.status(500).json({ success: false });
  }
});



router.get('/summary', async (req, res) => {
  const days = parseInt(req.query.range) || 7; // default last 7 days

  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - days);

  try {
    const summary = await AnimalBehavior.aggregate([
      {
        $match: {
          createdAt: { $gte: fromDate }
         
        }
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            eating: "$eating",
            movement: "$movement",
            mood: "$mood"
          },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: "$_id.date",
          eating: {
            $push: { k: "$_id.eating", v: "$count" }
          },
          movement: {
            $push: { k: "$_id.movement", v: "$count" }
          },
          mood: {
            $push: { k: "$_id.mood", v: "$count" }
          }
        }
      },
      {
        $project: {
          _id: 0,
          date: "$_id",
          eating: { $arrayToObject: "$eating" },
          movement: { $arrayToObject: "$movement" },
          mood: { $arrayToObject: "$mood" }
        }
      },
      { $sort: { date: 1 } }
    ]);

    res.status(200).json({ success: true, data: summary });
  } catch (error) {
    console.error('Error fetching behavior summary:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch behavior summary' });
  }
});


module.exports = router;