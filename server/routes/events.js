const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const EventFee = require('../models/EventFee');

// Create a new event/function
router.post('/', async (req, res) => {
  try {
    const newEvent = new Event(req.body);
    const savedEvent = await newEvent.save();
    res.json(savedEvent);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all events
router.get('/', async (req, res) => {
  try {
    const events = await Event.find().sort({ eventDate: -1 });
    res.json(events);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete an event
router.delete('/:id', async (req, res) => {
  try {
    await EventFee.deleteMany({ event: req.params.id });
    await Event.findByIdAndDelete(req.params.id);
    res.json({ message: 'Event deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Record fee payment for an event
router.post('/fees', async (req, res) => {
  try {
    const newFee = new EventFee(req.body);
    const savedFee = await newFee.save();
    res.json(savedFee);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const EventExpense = require('../models/EventExpense');

// ... (keep the top of the file as is, just inserting below)

// Get all fee payments for a specific event
router.get('/:eventId/fees', async (req, res) => {
  try {
    const fees = await EventFee.find({ event: req.params.eventId })
      .populate({
        path: 'student',
        select: 'fullName contactNumber assignedClass',
        populate: { path: 'assignedClass', select: 'className batchName' }
      })
      .sort({ paymentDate: -1 });
    res.json(fees);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Record an expense for an event
router.post('/expenses', async (req, res) => {
  try {
    const newExpense = new EventExpense(req.body);
    const savedExpense = await newExpense.save();
    res.json(savedExpense);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all expenses for a specific event
router.get('/:eventId/expenses', async (req, res) => {
  try {
    const expenses = await EventExpense.find({ event: req.params.eventId })
      .sort({ expenseDate: -1 });
    res.json(expenses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete an expense
router.delete('/expenses/:id', async (req, res) => {
  try {
    await EventExpense.findByIdAndDelete(req.params.id);
    res.json({ message: 'Expense deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
