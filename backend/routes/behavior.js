// routes/behavior.js
const express = require('express');
const router = express.Router();
const AnimalBehavior = require('../models/AnimalBehavior');
const Animal = require('../models/Animals');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');


// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Multer memory storage for direct stream to Cloudinary
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 1 * 1024 ** 3 }, // 1GB 
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'video/mp4') cb(null, true);
    else cb(new Error('Only MP4 video files are allowed'));
  }
});

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


router.post('/add', upload.single('proofVideo'), async (req, res) => {
  try {
    console.log('req.body:', req.body);
    const { animalId, eating, movement, mood, notes, recordedBy } = req.body;
    let proofVideoUrl = null; // ⚠️ Removed default image

    // If a video is uploaded, stream it to Cloudinary in folder
    if (req.file) {
      const uploadResult = await new Promise((resolve, reject) => {
        const cld_upload_stream = cloudinary.uploader.upload_stream(
          {
            resource_type: 'video',
            folder: 'animal_behavior_proofs' // ✅ Organized folder
          },
          (error, result) => {
            if (result) resolve(result);
            else reject(error);
          }
        );
        streamifier.createReadStream(req.file.buffer).pipe(cld_upload_stream);
      });

      proofVideoUrl = uploadResult.secure_url;
    }

    // Create behavior log entry
    const newLog = new AnimalBehavior({
      animalId,
      eating,
      movement,
      mood,
      notes,
      recordedBy,
      proofVideo: proofVideoUrl // ✅ Will be null if no video
    });

    await newLog.save();

    // Optional: Flag animal status if behavior is concerning
    if (eating === 'None' || movement === 'Limping' || mood === 'Aggressive') {
      await Animal.findByIdAndUpdate(animalId, { status: 'needs_attention' });
      console.log(`⚠️ Animal ${animalId} flagged for attention.`);
    }

    res.status(201).json({ message: 'Behavior log saved successfully.' });
  } catch (err) {
  console.error('Error saving behavior log:', err);  // log full error object, not just message
  res.status(500).json({ error: err.message || 'Error saving behavior log.' });
}
});

//old add behavior log without video upload
// router.post('/add', async (req, res) => {
//   try {
//     const newLog = new AnimalBehavior(req.body);
//     await newLog.save();

//     const { animalId, eating, movement, mood } = req.body;

//     // Check for critical behavior
//     const needsAttention = (
//       eating === 'None' ||
//       movement === 'Limping' ||
//       mood === 'Aggressive'
//     );

//     if (needsAttention) {
//       await Animal.findByIdAndUpdate(animalId, { status: 'needs_attention' });

//       // Optional: log an alert or send email to admin
//       console.log(`⚠️ Animal ${animalId} flagged for attention.`);

//       // You can insert a notification to DB or trigger admin action here
//     }

//     res.status(201).json({ message: 'Behavior log saved successfully.' });
//   } catch (err) {
//     console.error('Error saving behavior log:', err);
//     res.status(500).json({ error: 'Error saving behavior log.' });
//   }
// });



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