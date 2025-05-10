const express = require('express');
const router = express.Router();
const User = require('../models/user');
const Exercise = require('../models/exercise');

// Log requests for debugging
router.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`, req.body, req.query);
  next();
});

// Create new user
router.post('/users', async (req, res) => {
  try {
    const { username } = req.body;
    if (!username || typeof username !== 'string') {
      return res.status(400).json({ error: 'Username is required and must be a string' });
    }
    const user = await User.create({ username });
    res.json({ username: user.username, _id: user._id });
  } catch (error) {
    console.error('Error in POST /users:', error);
    res.status(400).json({ error: error.message });
  }
});

// Get all users
router.get('/users', async (req, res) => {
  try {
    const users = await User.find().select('username _id').lean();
    res.json(users);
  } catch (error) {
    console.error('Error in GET /users:', error);
    res.status(400).json({ error: error.message });
  }
});

// Add exercise
router.post('/users/:_id/exercises', async (req, res) => {
  try {
    const { _id } = req.params;
    let { description, duration, date } = req.body;

    // Convert empty strings to undefined
    description = description || undefined;
    duration = duration || undefined;
    date = date || undefined;

    // Validate inputs
    if (!description || typeof description !== 'string') {
      return res.status(400).json({ error: 'Description is required and must be a string' });
    }
    if (!duration || isNaN(duration)) {
      return res.status(400).json({ error: 'Duration is required and must be a number' });
    }

    const user = await User.findById(_id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const exerciseData = {
      userId: _id,
      description: String(description),
      duration: Number(duration),
      date: date ? new Date(date) : new Date()
    };

    if (date && isNaN(exerciseData.date.getTime())) {
      return res.status(400).json({ error: 'Invalid date format' });
    }

    const exercise = await Exercise.create(exerciseData);

    res.json({
      username: user.username,
      description: exercise.description,
      duration: exercise.duration,
      date: exercise.date.toDateString(),
      _id: user._id
    });
  } catch (error) {
    console.error('Error in POST /users/:_id/exercises:', error);
    res.status(400).json({ error: error.message });
  }
});

// Get exercise log
router.get('/users/:_id/logs', async (req, res) => {
  try {
    const { _id } = req.params;
    let { from, to, limit } = req.query;

    // Convert empty query params to undefined
    from = from || undefined;
    to = to || undefined;
    limit = limit || undefined;

    const user = await User.findById(_id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    let query = { userId: _id };

    // Handle date range only if valid dates are provided
    if (from || to) {
      query.date = {};
      if (from && from !== '') {
        const fromDate = new Date(from);
        if (isNaN(fromDate.getTime())) {
          return res.status(400).json({ error: 'Invalid from date' });
        }
        query.date.$gte = fromDate;
      }
      if (to && to !== '') {
        const toDate = new Date(to);
        if (isNaN(toDate.getTime())) {
          return res.status(400).json({ error: 'Invalid to date' });
        }
        query.date.$lte = toDate;
      }
    }

    let exercisesQuery = Exercise.find(query).select('description duration date');
    if (limit && limit !== '') {
      const limitNum = Number(limit);
      if (isNaN(limitNum) || limitNum < 0) {
        return res.status(400).json({ error: 'Limit must be a non-negative number' });
      }
      exercisesQuery = exercisesQuery.limit(limitNum);
    }

    const exercises = await exercisesQuery.lean();

    const log = exercises.map(ex => ({
      description: String(ex.description),
      duration: Number(ex.duration),
      date: new Date(ex.date).toDateString()
    }));

    res.json({
      username: user.username,
      count: exercises.length,
      _id: user._id,
      log
    });
  } catch (error) {
    console.error('Error in GET /users/:_id/logs:', error);
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;