const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const crypto = require('crypto');

const app = express();
const port = process.env.PORT || 3000;

const dbFile = path.join(__dirname, 'db.json');
const adapter = new FileSync(dbFile);
const db = low(adapter);

db.defaults({ users: [], history: [], admins: [], patients: [], logs: [], clinicianNotes: [], shareLinks: {}, doctors: [], caregivers: [], sessions: {} }).write();

app.use(bodyParser.json());

// Serve frontend static files from project root
app.use(express.static(path.join(__dirname, 'public')));

// Password hashing utilities
function hashPassword(password) {
	return crypto.createHash('sha256').update(password).digest('hex');
}

function verifyPassword(password, hashedPassword) {
	return hashPassword(password) === hashedPassword;
}

// Token generation for sessions
function generateToken() {
	return crypto.randomBytes(32).toString('hex');
}

// Authentication middleware
function requireAuth(req, res, next) {
	const token = req.headers.authorization?.replace('Bearer ', '') || req.query.token;
	if (!token) {
		return res.status(401).json({ error: 'Authentication required' });
	}
	const session = db.get(`sessions.${token}`).value();
	if (!session || session.expiresAt < Date.now()) {
		return res.status(401).json({ error: 'Invalid or expired session' });
	}
	req.user = session.user;
	next();
}

app.get('/api/ping', (req, res) => res.json({ ok: true }));

// Authentication endpoints
// Register endpoint
app.post('/api/register', (req, res) => {
	try {
		const { name, email, password, confirmPassword, role } = req.body;

		// Validation
		if (!name || !email || !password || !confirmPassword || !role) {
			return res.status(400).json({ error: 'All fields are required' });
		}

		if (role !== 'doctor' && role !== 'caregiver') {
			return res.status(400).json({ error: 'Invalid role. Must be doctor or caregiver' });
		}

		if (password.length < 6) {
			return res.status(400).json({ error: 'Password must be at least 6 characters' });
		}

		if (password !== confirmPassword) {
			return res.status(400).json({ error: 'Passwords do not match' });
		}

		// Email validation
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			return res.status(400).json({ error: 'Invalid email format' });
		}

		// Check if user already exists
		const collection = role === 'doctor' ? 'doctors' : 'caregivers';
		const existingUser = db.get(collection).find({ email }).value();
		if (existingUser) {
			return res.status(409).json({ error: 'Email already registered' });
		}

		// Create user
		const hashedPassword = hashPassword(password);
		const user = {
			id: Date.now().toString(),
			name,
			email,
			password: hashedPassword,
			role,
			createdAt: Date.now()
		};

		db.get(collection).push(user).write();

		res.status(201).json({
			message: 'Account created successfully',
			user: {
				id: user.id,
				name: user.name,
				email: user.email,
				role: user.role
			}
		});
	} catch (error) {
		console.error('Registration error:', error);
		res.status(500).json({ error: 'Server error during registration' });
	}
});

// Login endpoint
app.post('/api/login', (req, res) => {
	try {
		const { email, password, role } = req.body;

		if (!email || !password || !role) {
			return res.status(400).json({ error: 'Email, password, and role are required' });
		}

		if (role !== 'doctor' && role !== 'caregiver') {
			return res.status(400).json({ error: 'Invalid role' });
		}

		const collection = role === 'doctor' ? 'doctors' : 'caregivers';
		const user = db.get(collection).find({ email }).value();

		if (!user) {
			return res.status(401).json({ error: 'Invalid credentials' });
		}

		if (!verifyPassword(password, user.password)) {
			return res.status(401).json({ error: 'Invalid credentials' });
		}

		// Create session
		const token = generateToken();
		const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

		db.set(`sessions.${token}`, {
			user: {
				id: user.id,
				name: user.name,
				email: user.email,
				role: user.role
			},
			expiresAt
		}).write();

		res.json({
			token,
			user: {
				id: user.id,
				name: user.name,
				email: user.email,
				role: user.role
			}
		});
	} catch (error) {
		console.error('Login error:', error);
		res.status(500).json({ error: 'Server error during login' });
	}
});

// Logout endpoint
app.post('/api/logout', (req, res) => {
	try {
		const token = req.headers.authorization?.replace('Bearer ', '') || req.body.token;
		if (token) {
			db.unset(`sessions.${token}`).write();
		}
		res.json({ message: 'Logged out successfully' });
	} catch (error) {
		res.status(500).json({ error: 'Server error' });
	}
});

// Get current user endpoint
app.get('/api/me', requireAuth, (req, res) => {
	res.json({ user: req.user });
});

// Patients
app.get('/api/patients', (req, res) => {
	const patients = db.get('patients').value();
	res.json(patients);
});

app.post('/api/patients', (req, res) => {
	const p = req.body;
	if (!p || !p.id) return res.status(400).json({ error: 'id required' });
	const exists = db.get('patients').find({ id: p.id }).value();
	if (exists) return res.status(409).json({ error: 'patient exists' });
	db.get('patients').push(p).write();
	res.status(201).json(p);
});

app.delete('/api/patients/:id', (req, res) => {
	const id = req.params.id;
	db.get('patients').remove({ id }).write();
	db.get('logs').remove({ patientId: id }).write();
	db.get('clinicianNotes').remove({ patientId: id }).write();
	db.unset(`shareLinks.${id}`).write();
	res.json({ ok: true });
});

// Logs
app.get('/api/logs/:patientId', (req, res) => {
	const logs = db.get('logs').filter({ patientId: req.params.patientId }).sortBy('createdAt').reverse().value();
	res.json(logs);
});

app.post('/api/logs/:patientId', (req, res) => {
	const payload = req.body || {};
	const log = Object.assign({ patientId: req.params.patientId, createdAt: Date.now() }, payload);
	db.get('logs').push(log).write();
	res.status(201).json(log);
});

// Share links (24h)
app.post('/api/share/:patientId', (req, res) => {
	const id = req.params.patientId;
	const code = (Math.random().toString(36).slice(2, 8)).toUpperCase();
	const url = `http://localhost:${port}/share/${code}`;
	const expiresAt = Date.now() + 24 * 60 * 60 * 1000;
	db.set(`shareLinks.${id}`, { code, url, expiresAt }).write();
	res.json(db.get(`shareLinks.${id}`).value());
});

app.get('/api/share/:patientId', (req, res) => {
	const link = db.get(`shareLinks.${req.params.patientId}`).value();
	if (!link) return res.status(404).json({});
	if (link.expiresAt < Date.now()) {
		db.unset(`shareLinks.${req.params.patientId}`).write();
		return res.status(404).json({});
	}
	res.json(link);
});

// Clinician notes
app.get('/api/notes/:patientId', (req, res) => {
	const notes = db.get('clinicianNotes').filter({ patientId: req.params.patientId }).sortBy('createdAt').reverse().value();
	res.json(notes);
});

app.post('/api/notes/:patientId', (req, res) => {
	const note = { patientId: req.params.patientId, note: req.body.note || '', createdAt: Date.now() };
	db.get('clinicianNotes').push(note).write();
	res.status(201).json(note);
});

// Fallback for share links (simple redirect page)
app.get('/share/:code', (req, res) => {
	res.send(`<h2>Shared CareCompass Link</h2><p>Code: ${req.params.code}</p><p>This demo link would show shared patient data.</p>`);
});

app.listen(port, () => {
	console.log(`Server started on http://localhost:${port}`);
});
