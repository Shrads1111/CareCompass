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

// Initialize OpenAI if available
let OpenAI = null;
try {
	OpenAI = require('openai');
} catch (e) {
	console.log('OpenAI package not installed. Install with: npm install openai');
	console.log('AI analysis will use basic analysis fallback.');
}

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
		let patients;
		if (req.user.role === 'caregiver') {
			// Caregivers see all patients
			patients = await Patient.find({});
		} else if (req.user.role === 'doctor') {
			// Doctors see:
			// 1. Patients explicitly assigned to them
			// 2. Patients with no assignment (backward compatibility with old data)
			patients = await Patient.find({
				$or: [
					{ assignedDoctorId: req.user.email },
					{ assignedDoctorIds: req.user.email },
					{ assignedDoctorIds: { $size: 0 } }, // Unassigned patients (old data)
					{ assignedDoctorIds: null },
					{ assignedDoctorIds: { $exists: false } }
				]
			});
		} else {
			patients = [];
		}
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
		
		// Auto-assign to doctor if creating as doctor
		if (req.user.role === 'doctor') {
			p.assignedDoctorIds = [req.user.email];
		}
		
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

// Assign patient to doctor(s)
app.post('/api/patients/:id/assign', requireAuth, async (req, res) => {
	try {
		if (req.user.role !== 'caregiver') {
			return res.status(403).json({ error: 'Only caregivers can assign patients' });
		}
		
		const { patientId } = req.params;
		const { doctorEmails } = req.body;
		
		if (!Array.isArray(doctorEmails) || doctorEmails.length === 0) {
			return res.status(400).json({ error: 'doctorEmails array required' });
		}
		
		const patient = await Patient.findOne({ id: patientId });
		if (!patient) {
			return res.status(404).json({ error: 'Patient not found' });
		}
		
		patient.assignedDoctorIds = doctorEmails;
		await patient.save();
		
		res.json({ ok: true, patient });
	} catch (error) {
		console.error('Assign patient error:', error);
		res.status(500).json({ error: 'Server error' });
	}
});

// Get all doctors (for assignment UI)
app.get('/api/doctors', requireAuth, async (req, res) => {
	try {
		if (req.user.role !== 'caregiver') {
			return res.status(403).json({ error: 'Only caregivers can list doctors' });
		}
		
		const doctors = await Doctor.find({}, { email: 1, name: 1, _id: 0 });
		res.json(doctors);
	} catch (error) {
		console.error('Get doctors error:', error);
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

// AI Analysis endpoint
app.get('/api/analysis/:patientId', requireAuth, async (req, res) => {
	try {
		console.log(`[AI Analysis] Request received for patient: ${req.params.patientId}`);
		const patientId = req.params.patientId;
		
		// Get patient info
		const patient = await Patient.findOne({ id: patientId });
		if (!patient) {
			console.error(`Patient not found: ${patientId}`);
			return res.status(404).json({ error: `Patient with ID "${patientId}" not found in database` });
		}

		// Get last 7 days of logs
		const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
		const logs = await Log.find({
			patientId: patientId,
			createdAt: { $gte: sevenDaysAgo }
		}).sort({ createdAt: 1 });

		if (logs.length === 0) {
			return res.json({
				analysis: 'No data available for the last 7 days. Please ensure patient logs are being recorded regularly.',
				hasData: false
			});
		}

		// Format data for AI analysis
		const patientData = {
			patientId: patient.id,
			patientName: patient.name || `Patient ${patient.id}`,
			diagnosis: patient.diagnosis || 'Not specified',
			daysAnalyzed: logs.length,
			logs: logs.map(log => ({
				date: new Date(log.createdAt).toLocaleDateString(),
				time: new Date(log.createdAt).toLocaleTimeString(),
				mood: log.mood || 'Not recorded',
				sleep: log.sleepStart && log.sleepEnd ? `${log.sleepStart} - ${log.sleepEnd}` : 'Not recorded',
				hydration: log.hydration || 'Not recorded',
				food: log.food || 'Not recorded',
				medication: log.meds || 'Not recorded',
				antecedent: log.antecedent || '',
				behavior: log.behavior || '',
				consequence: log.consequence || '',
				note: log.note || ''
			}))
		};

		// Generate AI analysis if OpenAI is configured
		if (OpenAI && process.env.OPENAI_API_KEY) {
			try {
				const openai = new OpenAI({
					apiKey: process.env.OPENAI_API_KEY
				});

				const prompt = `You are a healthcare AI assistant analyzing patient care data. Analyze the following 7-day patient data and provide a comprehensive text analysis focusing on:

1. Overall condition trends (improving, stable, or concerning)
2. Sleep patterns and quality
3. Nutrition and hydration compliance
4. Medication adherence
5. Mood patterns and behavioral observations
6. Any concerning patterns or red flags
7. Recommendations for care adjustments

Patient Information:
- Name: ${patientData.patientName}
- Diagnosis: ${patientData.diagnosis}
- Days with data: ${patientData.daysAnalyzed}

Daily Logs:
${patientData.logs.map((log, idx) => `
Day ${idx + 1} (${log.date}):
- Time: ${log.time}
- Mood: ${log.mood}
- Sleep: ${log.sleep}
- Hydration: ${log.hydration}
- Food: ${log.food}
- Medication: ${log.medication}
${log.antecedent ? `- Antecedent: ${log.antecedent}` : ''}
${log.behavior ? `- Behavior: ${log.behavior}` : ''}
${log.consequence ? `- Consequence: ${log.consequence}` : ''}
${log.note ? `- Note: ${log.note}` : ''}
`).join('\n')}

Provide a detailed, professional analysis in 3-4 paragraphs. Be specific about patterns, concerns, and recommendations.`;

				const completion = await openai.chat.completions.create({
					model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
					messages: [
						{
							role: 'system',
							content: 'You are a professional healthcare AI assistant that provides detailed, accurate, and helpful analysis of patient care data. Always be professional, empathetic, and focus on actionable insights.'
						},
						{
							role: 'user',
							content: prompt
						}
					],
					max_tokens: 1000,
					temperature: 0.7
				});

				const analysis = completion.choices[0].message.content;
				res.json({
					analysis,
					hasData: true,
					generatedAt: Date.now()
				});
			} catch (aiError) {
				console.error('AI analysis error:', aiError);
				// Fallback to basic analysis if AI fails
				res.json({
					analysis: generateBasicAnalysis(patientData),
					hasData: true,
					error: 'AI analysis unavailable, showing basic analysis'
				});
			}
		} else {
			// Fallback to basic analysis if OpenAI not configured
			res.json({
				analysis: generateBasicAnalysis(patientData),
				hasData: true,
				note: 'AI analysis not configured. Set OPENAI_API_KEY in .env file for AI-powered analysis.'
			});
		}
	} catch (error) {
		console.error('Analysis error:', error);
		console.error('Error stack:', error.stack);
		res.status(500).json({ 
			error: 'Server error generating analysis',
			message: error.message,
			details: process.env.NODE_ENV === 'development' ? error.stack : undefined
		});
	}
});

// Helper function for basic analysis when AI is not available
function generateBasicAnalysis(patientData) {
	const logs = patientData.logs;
	
	// Calculate averages and patterns
	const moods = logs.filter(l => l.mood && l.mood !== 'Not recorded' && l.mood !== '—').map(l => l.mood);
	const foodCompliance = logs.filter(l => l.food === 'full').length;
	const medCompliance = logs.filter(l => l.medication === 'given').length;
	const hydrationCompliance = logs.filter(l => l.hydration && (l.hydration.includes('drank') || l.hydration === 'full')).length;
	
	const avgMood = moods.length > 0 ? moods.join(', ') : 'Insufficient data';
	const foodPercent = ((foodCompliance / logs.length) * 100).toFixed(0);
	const medPercent = ((medCompliance / logs.length) * 100).toFixed(0);
	const hydrationPercent = ((hydrationCompliance / logs.length) * 100).toFixed(0);
	
	let analysis = `**7-Day Analysis for ${patientData.patientName}**\n\n`;
	analysis += `**Overview:** This analysis covers ${logs.length} days of recorded data for ${patientData.patientName} (${patientData.diagnosis}).\n\n`;
	
	analysis += `**Mood Patterns:** ${moods.length > 0 ? `Observed moods: ${avgMood}` : 'Limited mood data available'}.\n\n`;
	
	analysis += `**Compliance Metrics:**\n`;
	analysis += `- Food intake: ${foodPercent}% full meals\n`;
	analysis += `- Medication: ${medPercent}% given on time\n`;
	analysis += `- Hydration: ${hydrationPercent}% compliance\n\n`;
	
	analysis += `**Recommendations:** `;
	if (foodPercent < 70) analysis += 'Monitor food intake closely. ';
	if (medPercent < 90) analysis += 'Review medication schedule adherence. ';
	if (hydrationPercent < 60) analysis += 'Encourage increased hydration. ';
	if (foodPercent >= 70 && medPercent >= 90 && hydrationPercent >= 60) {
		analysis += 'Overall compliance is good. Continue current care plan.';
	}
	
	analysis += `\n\n*Note: For detailed AI-powered analysis, configure OPENAI_API_KEY in your environment variables.*`;
	
	return analysis;
}

// Fallback for share links (simple redirect page)
app.get('/share/:code', (req, res) => {
	res.send(`<h2>Shared CareCompass Link</h2><p>Code: ${req.params.code}</p><p>This demo link would show shared patient data.</p>`);
});

app.listen(port, () => {
	console.log(`Server started on http://localhost:${port}`);
});
