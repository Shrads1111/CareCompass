require('dotenv').config();
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const connectDB = require('./config/database');
const { Doctor, Caregiver } = require('./models/User');
const Patient = require('./models/Patient');
const Log = require('./models/Log');
const ClinicianNote = require('./models/ClinicianNote');
const Session = require('./models/Session');
const ShareLink = require('./models/ShareLink');

const app = express();
const port = process.env.PORT || 3000;

// Connect to MongoDB
connectDB();

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
async function requireAuth(req, res, next) {
	try {
		const token = req.headers.authorization?.replace('Bearer ', '') || req.query.token;
		if (!token) {
			return res.status(401).json({ error: 'Authentication required' });
		}
		const session = await Session.findOne({ token });
		if (!session || session.expiresAt < Date.now()) {
			return res.status(401).json({ error: 'Invalid or expired session' });
		}
		req.user = session.user;
		next();
	} catch (error) {
		console.error('Auth middleware error:', error);
		return res.status(500).json({ error: 'Server error' });
	}
}

app.get('/api/ping', (req, res) => res.json({ ok: true }));

// Authentication endpoints
// Register endpoint
app.post('/api/register', async (req, res) => {
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
		const UserModel = role === 'doctor' ? Doctor : Caregiver;
		const existingUser = await UserModel.findOne({ email });
		if (existingUser) {
			return res.status(409).json({ error: 'Email already registered' });
		}

		// Create user
		const hashedPassword = hashPassword(password);
		const user = await UserModel.create({
			name,
			email,
			password: hashedPassword,
			role,
			createdAt: Date.now()
		});

		res.status(201).json({
			message: 'Account created successfully',
			user: {
				id: user._id.toString(),
				name: user.name,
				email: user.email,
				role: user.role
			}
		});
	} catch (error) {
		console.error('Registration error:', error);
		if (error.code === 11000) {
			return res.status(409).json({ error: 'Email already registered' });
		}
		res.status(500).json({ error: 'Server error during registration' });
	}
});

// Login endpoint
app.post('/api/login', async (req, res) => {
	try {
		const { email, password, role } = req.body;

		if (!email || !password || !role) {
			return res.status(400).json({ error: 'Email, password, and role are required' });
		}

		if (role !== 'doctor' && role !== 'caregiver') {
			return res.status(400).json({ error: 'Invalid role' });
		}

		const UserModel = role === 'doctor' ? Doctor : Caregiver;
		const user = await UserModel.findOne({ email });

		if (!user) {
			return res.status(401).json({ error: 'Invalid credentials' });
		}

		if (!verifyPassword(password, user.password)) {
			return res.status(401).json({ error: 'Invalid credentials' });
		}

		// Create session
		const token = generateToken();
		const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

		await Session.create({
			token,
			user: {
				id: user._id.toString(),
				name: user.name,
				email: user.email,
				role: user.role
			},
			expiresAt
		});

		res.json({
			token,
			user: {
				id: user._id.toString(),
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
app.post('/api/logout', async (req, res) => {
	try {
		const token = req.headers.authorization?.replace('Bearer ', '') || req.body.token;
		if (token) {
			await Session.deleteOne({ token });
		}
		res.json({ message: 'Logged out successfully' });
	} catch (error) {
		console.error('Logout error:', error);
		res.status(500).json({ error: 'Server error' });
	}
});

// Get current user endpoint
app.get('/api/me', requireAuth, (req, res) => {
	res.json({ user: req.user });
});

// Patients
app.get('/api/patients', requireAuth, async (req, res) => {
	try {
		const patients = await Patient.find({});
		res.json(patients);
	} catch (error) {
		console.error('Get patients error:', error);
		res.status(500).json({ error: 'Server error' });
	}
});

app.post('/api/patients', requireAuth, async (req, res) => {
	try {
		const p = req.body;
		if (!p || !p.id) return res.status(400).json({ error: 'id required' });
		const exists = await Patient.findOne({ id: p.id });
		if (exists) return res.status(409).json({ error: 'patient exists' });
		const patient = await Patient.create(p);
		res.status(201).json(patient);
	} catch (error) {
		console.error('Create patient error:', error);
		if (error.code === 11000) {
			return res.status(409).json({ error: 'patient exists' });
		}
		res.status(500).json({ error: 'Server error' });
	}
});

app.delete('/api/patients/:id', requireAuth, async (req, res) => {
	try {
		const id = req.params.id;
		await Patient.deleteOne({ id });
		await Log.deleteMany({ patientId: id });
		await ClinicianNote.deleteMany({ patientId: id });
		await ShareLink.deleteOne({ patientId: id });
		res.json({ ok: true });
	} catch (error) {
		console.error('Delete patient error:', error);
		res.status(500).json({ error: 'Server error' });
	}
});

// Logs
app.get('/api/logs/:patientId', requireAuth, async (req, res) => {
	try {
		const logs = await Log.find({ patientId: req.params.patientId })
			.sort({ createdAt: -1 });
		res.json(logs);
	} catch (error) {
		console.error('Get logs error:', error);
		res.status(500).json({ error: 'Server error' });
	}
});

app.post('/api/logs/:patientId', requireAuth, async (req, res) => {
	try {
		const payload = req.body || {};
		const log = await Log.create({
			patientId: req.params.patientId,
			createdAt: Date.now(),
			...payload
		});
		res.status(201).json(log);
	} catch (error) {
		console.error('Create log error:', error);
		res.status(500).json({ error: 'Server error' });
	}
});

// Share links (24h)
app.post('/api/share/:patientId', requireAuth, async (req, res) => {
	try {
		const id = req.params.patientId;
		const code = (Math.random().toString(36).slice(2, 8)).toUpperCase();
		const url = `http://localhost:${port}/share/${code}`;
		const expiresAt = Date.now() + 24 * 60 * 60 * 1000;
		
		// Delete existing link if any
		await ShareLink.deleteOne({ patientId: id });
		
		const shareLink = await ShareLink.create({
			patientId: id,
			code,
			url,
			expiresAt
		});
		
		res.json(shareLink);
	} catch (error) {
		console.error('Create share link error:', error);
		res.status(500).json({ error: 'Server error' });
	}
});

app.get('/api/share/:patientId', requireAuth, async (req, res) => {
	try {
		const link = await ShareLink.findOne({ patientId: req.params.patientId });
		if (!link) return res.status(404).json({});
		if (link.expiresAt < Date.now()) {
			await ShareLink.deleteOne({ patientId: req.params.patientId });
			return res.status(404).json({});
		}
		res.json(link);
	} catch (error) {
		console.error('Get share link error:', error);
		res.status(500).json({ error: 'Server error' });
	}
});

// Clinician notes
app.get('/api/notes/:patientId', requireAuth, async (req, res) => {
	try {
		const notes = await ClinicianNote.find({ patientId: req.params.patientId })
			.sort({ createdAt: -1 });
		res.json(notes);
	} catch (error) {
		console.error('Get notes error:', error);
		res.status(500).json({ error: 'Server error' });
	}
});

app.post('/api/notes/:patientId', requireAuth, async (req, res) => {
	try {
		const note = await ClinicianNote.create({
			patientId: req.params.patientId,
			note: req.body.note || '',
			createdAt: Date.now()
		});
		res.status(201).json(note);
	} catch (error) {
		console.error('Create note error:', error);
		res.status(500).json({ error: 'Server error' });
	}
});

// Fallback for share links (simple redirect page)
app.get('/share/:code', (req, res) => {
	res.send(`<h2>Shared CareCompass Link</h2><p>Code: ${req.params.code}</p><p>This demo link would show shared patient data.</p>`);
});

app.listen(port, () => {
	console.log(`Server started on http://localhost:${port}`);
});
