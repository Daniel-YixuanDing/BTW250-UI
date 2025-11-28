const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');


const app = express();
app.use(cors());
app.use(bodyParser.json());


// Simple in-memory data store
const LANES = Array.from({ length: 14 }, (_, i) => ({ id: i + 1, name: `Lane ${i + 1}` }));
let reservations = []; // { id, laneId, user, startTimeISO, endTimeISO }
let users = [{ id: 'u1', username: 'student', password: 'password', displayName: 'UI Student' }];
let sessions = {}; // token -> userId


// Helpers
function overlaps(aStart, aEnd, bStart, bEnd) {
    return new Date(aStart) < new Date(bEnd) && new Date(bStart) < new Date(aEnd);
}


// Auth
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const user = users.find(u => u.username === username && u.password === password);
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const token = uuidv4();
    sessions[token] = user.id;
    res.json({ token, user: { id: user.id, displayName: user.displayName } });
});


app.post('/api/logout', (req, res) => {
    const { token } = req.body;
    delete sessions[token];
    res.json({ ok: true });
});

app.post('/api/register', (req, res) => {
    const { username, password, displayName } = req.body;

    if (!username || !password || !displayName) {
        return res.status(400).json({ error: 'Missing fields' });
    }

    if (users.find(u => u.username === username)) {
        return res.status(409).json({ error: 'Username already taken' });
    }

    const id = uuidv4();
    const newUser = { id, username, password, displayName };
    users.push(newUser);

    const token = uuidv4();
    sessions[token] = id;

    res.json({
        token,
        user: { id, displayName }
    });
});


function requireAuth(req, res, next) {
    const token = req.headers['x-auth-token'];
    if (!token || !sessions[token]) return res.status(401).json({ error: 'Unauthorized' });
    req.user = users.find(u => u.id === sessions[token]);
    next();
}


// Public: lanes
app.get('/api/lanes', (req, res) => {
    res.json({ lanes: LANES });
});


// View reservations (optionally filtered by date)
app.get('/api/reservations', (req, res) => {
    const { date } = req.query; // YYYY-MM-DD
    let results = reservations;
    if (date) {
        results = reservations.filter(r => r.startTimeISO.startsWith(date));
    }
    res.json({ reservations: results });
});


// Check availability for a timeslot
app.get('/api/availability', (req, res) => {
    const { date, startISO, endISO } = req.query; // startISO and endISO optional
    const start = startISO || `${date}T18:00:00.000Z`;
    const end = endISO || `${date}T19:00:00.000Z`;
    const occupiedLaneIds = reservations.filter(r => overlaps(r.startTimeISO, r.endTimeISO, start, end)).map(r => r.laneId);
    const available = LANES.filter(l => !occupiedLaneIds.includes(l.id));
    res.json({ available, occupiedLaneIds });
});


// Make a reservation
app.post('/api/reserve', requireAuth, (req, res) => {
    const { laneId, startISO, endISO } = req.body;
    // validate lane
    const lane = LANES.find(l => l.id === laneId);
    if (!lane) return res.status(400).json({ error: 'Invalid lane' });
    // check overlap
    const conflicting = reservations.find(r => r.laneId === laneId && overlaps(r.startTimeISO, r.endTimeISO, startISO, endISO));
    if (conflicting) return res.status(409).json({ error: 'Lane already reserved for that time' });
    const id = uuidv4();
    const reservation = { id, laneId, user: { id: req.user.id, displayName: req.user.displayName }, startTimeISO: startISO, endTimeISO: endISO };
    reservations.push(reservation);
    res.json({ reservation });
});


// User reservations
app.get('/api/my-reservations', requireAuth, (req, res) => {
    const my = reservations.filter(r => r.user.id === req.user.id);
    res.json({ reservations: my });
});


// Cancel
app.delete('/api/reserve/:id', requireAuth, (req, res) => {
    const { id } = req.params;
    const idx = reservations.findIndex(r => r.id === id && r.user.id === req.user.id);
    if (idx === -1) return res.status(404).json({ error: 'Reservation not found' });
    reservations.splice(idx, 1);
    res.json({ ok: true });
});


// Quick seed example reservation for demonstration (tomorrow 18:00-19:00 on Lane 1)
const tomorrow = new Date();
const t = new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000);
const YYYY = t.getFullYear();
const MM = String(t.getMonth() + 1).padStart(2, '0');
const DD = String(t.getDate()).padStart(2, '0');
const start = `${YYYY}-${MM}-${DD}T18:00:00.000Z`;
const end = `${YYYY}-${MM}-${DD}T19:00:00.000Z`;
reservations.push({ id: uuidv4(), laneId: 1, user: users[0], startTimeISO: start, endTimeISO: end });


const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server listening on ${PORT}`));