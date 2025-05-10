import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './styles.css';

const App = () => {
  const [users, setUsers] = useState([]);
  const [newUsername, setNewUsername] = useState('');
  const [exerciseData, setExerciseData] = useState({
    userId: '',
    description: '',
    duration: '',
    date: ''
  });
  const [logData, setLogData] = useState({
    userId: '',
    from: '',
    to: '',
    limit: ''
  });
  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);

  // Fetch all users on mount
  useEffect(() => {
    axios.get('http://localhost:5000/api/users')
      .then(res => setUsers(res.data))
      .catch(err => setError(err.message));
  }, []);

  // Handle create user form submission
  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:5000/api/users', { username: newUsername });
      setUsers([...users, res.data]);
      setResponse(res.data);
      setNewUsername('');
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    }
  };

  // Handle add exercise form submission
  const handleAddExercise = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(
        `http://localhost:5000/api/users/${exerciseData.userId}/exercises`,
        {
          description: exerciseData.description,
          duration: exerciseData.duration,
          date: exerciseData.date
        }
      );
      setResponse(res.data);
      setExerciseData({ userId: '', description: '', duration: '', date: '' });
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    }
  };

  // Handle get log form submission
  const handleGetLog = async (e) => {
    e.preventDefault();
    try {
      const query = [];
      if (logData.from) query.push(`from=${logData.from}`);
      if (logData.to) query.push(`to=${logData.to}`);
      if (logData.limit) query.push(`limit=${logData.limit}`);
      const url = `http://localhost:5000/api/users/${logData.userId}/logs${query.length ? '?' + query.join('&') : ''}`;
      const res = await axios.get(url);
      setResponse(res.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    }
  };

  return (
    <div className="container">
      <h1>Exercise Tracker</h1>

      {/* Create User Form */}
      <form onSubmit={handleCreateUser}>
        <h2>Create a New User</h2>
        <p><code>POST /api/users</code></p>
        <input
          id="uname"
          type="text"
          name="username"
          placeholder="username"
          value={newUsername}
          onChange={(e) => setNewUsername(e.target.value)}
        />
        <input type="submit" value="Submit" />
      </form>

      {/* Add Exercise Form */}
      <form onSubmit={handleAddExercise}>
        <h2>Add Exercises</h2>
        <p><code>POST /api/users/:_id/exercises</code></p>
        <input
          id="uid"
          type="text"
          name=":_id"
          placeholder=":_id"
          value={exerciseData.userId}
          onChange={(e) => setExerciseData({ ...exerciseData, userId: e.target.value })}
        />
        <input
          id="desc"
          type="text"
          name="description"
          placeholder="description*"
          value={exerciseData.description}
          onChange={(e) => setExerciseData({ ...exerciseData, description: e.target.value })}
        />
        <input
          id="dur"
          type="text"
          name="duration"
          placeholder="duration* (mins.)"
          value={exerciseData.duration}
          onChange={(e) => setExerciseData({ ...exerciseData, duration: e.target.value })}
        />
        <input
          id="date"
          type="text"
          name="date"
          placeholder="date (yyyy-mm-dd)"
          value={exerciseData.date}
          onChange={(e) => setExerciseData({ ...exerciseData, date: e.target.value })}
        />
        <input type="submit" value="Submit" />
      </form>

      {/* Get Log Form */}
      <form onSubmit={handleGetLog}>
        <h2>Get User's Exercise Log</h2>
        <p><strong>GET user's exercise log: </strong><code>GET /api/users/:_id/logs?[from][&to][&limit]</code></p>
        <input
          type="text"
          placeholder=":_id"
          value={logData.userId}
          onChange={(e) => setLogData({ ...logData, userId: e.target.value })}
        />
        <input
          type="text"
          placeholder="from (yyyy-mm-dd)"
          value={logData.from}
          onChange={(e) => setLogData({ ...logData, from: e.target.value })}
        />
        <input
          type="text"
          placeholder="to (yyyy-mm-dd)"
          value={logData.to}
          onChange={(e) => setLogData({ ...logData, to: e.target.value })}
        />
        <input
          type="text"
          placeholder="limit"
          value={logData.limit}
          onChange={(e) => setLogData({ ...logData, limit: e.target.value })}
        />
        <input type="submit" value="Submit" />
      </form>

      <p><strong>[ ]</strong> = optional</p>
      <p><strong>from, to</strong> = dates (yyyy-mm-dd); <strong>limit</strong> = number</p>

      {/* Display Users */}
      {users.length > 0 && (
        <div>
          <h2>Users</h2>
          <ul>
            {users.map(user => (
              <li key={user._id}>{user.username} (ID: {user._id})</li>
            ))}
          </ul>
        </div>
      )}

      {/* Display Response */}
      {response && (
        <div>
          <h2>Response</h2>
          <pre>{JSON.stringify(response, null, 2)}</pre>
        </div>
      )}

      {/* Display Error */}
      {error && (
        <div>
          <h2>Error</h2>
          <p>{error}</p>
        </div>
      )}
    </div>
  );
};

export default App;