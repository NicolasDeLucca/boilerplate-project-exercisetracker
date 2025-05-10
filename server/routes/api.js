const express = require('express');
const router = express.Router();
const User = require('../models/user');
const Exercise = require('../models/exercise');

// Create new user
router.post('/users', async (req, res) => {
  try {
    const { username } = req.body;
    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }
    const user = await User.create({ username });
    res.json({ username: user.username, _id: user._id });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get all users
router.get('/users', async (req, res) => {
  try {
    const users = await User.find().select('username _id').lean();
    res.json(users);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Add exercise
router.post('/users/:_id/exercises', async (req, res) => {
  try {
    const { _id } = req.params;
    const { description, duration, date } = req.body;

    if (!description || !duration) {
      return res.status(400).json({ error: 'Description and duration are required' });
    }

    const user = await User.findById(_id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const exerciseData = {
      userId: _id,
      description,
      duration: Number(duration),
      date: date ? new Date(date) : new Date()
    };

    if (isNaN(exerciseData.duration)) {
      return res.status(400).json({ error: 'Duration must be a number' });
    }

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
    res.status(400).json({ error: error.message });
  }
});

// Get exercise log
router.get('/users/:_id/logs', async (req, res) => {
  try {
    const { _id } = req.params;
    const { from, to, limit } = req.query;

    const user = await User.findById(_id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    let query = { userId: _id };

    if (from || to) {
      query.date = {};
      if (from) {
        const fromDate = new Date(from);
        if (isNaN(fromDate.getTime())) {
          return res.status(400).json({ error: 'Invalid from date' });
        }
        query.date.$gte = fromDate;
      }
      if (to) {
        const toDate = new Date(to);
        if (isNaN(toDate.getTime())) {
          return res.status(400).json({ error: 'Invalid to date' });
        }
        query.date.$lte = toDate;
      }
    }

    let exercisesQuery = Exercise.find(query).select('description duration date');
    if (limit) {
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
      date: ex.date.toDateString()
    }));

    res.json({
      username: user.username,
      count: exercises.length,
      _id: user._id,
      log
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;