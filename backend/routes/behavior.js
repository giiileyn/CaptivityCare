// routes/behavior.js
const express = require('express');
const router = express.Router();
const AnimalBehavior = require('../models/AnimalBehavior');

//add behavior log
router.post('/add', async (req, res) => {
  try {
    const newLog = new AnimalBehavior(req.body);
    await newLog.save();
    res.status(201).json({ message: 'Behavior log saved successfully.' });
  } catch (err) {
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
module.exports = router;