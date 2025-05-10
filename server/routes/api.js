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
    const users = await User.find({}, 'username _id');
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
      if (from) query.date.$gte = new Date(from);
      if (to) query.date.$lte = new Date(to);
    }

    let exercisesQuery = Exercise.find(query).select('description duration date');
    
    if (limit) {
      exercisesQuery = exercisesQuery.limit(Number(limit));
    }

    const exercises = await exercisesQuery.exec();
    
    const log = exercises.map(ex => ({
      description: ex.description,
      duration: ex.duration,
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