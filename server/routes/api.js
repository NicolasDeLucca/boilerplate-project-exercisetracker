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

    // Log request body for debugging
    console.log('POST /users/:_id/exercises body:', { description, duration, date });

    // Convert empty strings to undefined
    description = description && description !== '' ? description : undefined;
    duration = duration && duration !== '' ? duration : undefined;
    date = date && date !== '' ? date : undefined;

    // Validate inputs
    if (!description || typeof description !== 'string') {
      console.log('Validation failed: Invalid description');
      return res.status(400).json({ error: 'Description is required and must be a string' });
    }
    const durationNum = Number(duration);
    if (isNaN(durationNum) || durationNum <= 0) {
      console.log('Validation failed: Invalid duration');
      return res.status(400).json({ error: 'Duration is required and must be a positive number' });
    }

    const user = await User.findById(_id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const exerciseData = {
      userId: _id,
      description: String(description),
      duration: durationNum,
      date: date ? new Date(date) : new Date()
    };

    // Allow invalid dates to default to current date
    if (date && isNaN(exerciseData.date.getTime())) {
      console.log('Invalid date provided, using current date:', date);
      exerciseData.date = new Date();
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

    // Log query params for debugging
    console.log('Query params:', { from, to, limit });

    // Convert empty query params to undefined
    from = from && from !== '' ? from : undefined;
    to = to && to !== '' ? to : undefined;
    limit = limit && limit !== '' ? limit : undefined;

    const user = await User.findById(_id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    let query = { userId: _id };

    // Handle date range only if valid dates are provided
    if (from || to) {
      query.date = {};
      if (from) {
        const fromDate = new Date(from);
        if (isNaN(fromDate.getTime())) {
          console.log(`Invalid from date, using fallback: ${from}`);
          query.date.$gte = new Date('1970-01-01');
        } else {
          query.date.$gte = fromDate;
        }
      }
      if (to) {
        const toDate = new Date(to);
        if (isNaN(toDate.getTime())) {
          console.log(`Invalid to date, using fallback: ${to}`);
          query.date.$lte = new Date();
        } else {
          query.date.$lte = toDate;
        }
      }
    }

    let exercisesQuery = Exercise.find(query).select('description duration date');
    if (limit) {
      const limitNum = Number(limit);
      if (isNaN(limitNum) || limitNum < 0) {
        console.log(`Invalid limit, skipping: ${limit}`);
      } else {
        exercisesQuery = exercisesQuery.limit(limitNum);
      }
    }

    const exercises = await exercisesQuery.lean();

    const log = exercises.map(ex => {
      const duration = Number(ex.duration);
      if (isNaN(duration)) {
        console.log(`Invalid duration in exercise: ${ex.duration}`);
      }
      return {
        description: String(ex.description || ''),
        duration: isNaN(duration) ? 0 : duration,
        date: new Date(ex.date || new Date()).toDateString()
      };
    });

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