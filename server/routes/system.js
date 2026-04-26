const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const Fee = require('../models/Fee');
const Class = require('../models/Class');
const Event = require('../models/Event');
const EventFee = require('../models/EventFee');
const EventExpense = require('../models/EventExpense');
const auth = require('../middleware/auth');

// @route   DELETE api/system/reset
// @desc    Wipe all system data except admin accounts
router.delete('/reset', auth, async (req, res) => {
  try {
    // Delete in order to avoid potential (though unlikely in Mongo) orphan issues
    await Fee.deleteMany({});
    await Student.deleteMany({});
    await Class.deleteMany({});
    await EventFee.deleteMany({});
    await EventExpense.deleteMany({});
    await Event.deleteMany({});

    res.json({ msg: 'System data has been completely formatted.' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error during system reset.');
  }
});

module.exports = router;
