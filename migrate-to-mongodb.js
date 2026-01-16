/**
 * Migration script to move data from db.json to MongoDB
 * Run this once after setting up MongoDB to migrate existing data
 * 
 * Usage: node migrate-to-mongodb.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const connectDB = require('./config/database');
const { Doctor, Caregiver } = require('./models/User');
const Patient = require('./models/Patient');
const Log = require('./models/Log');
const ClinicianNote = require('./models/ClinicianNote');
const Session = require('./models/Session');
const ShareLink = require('./models/ShareLink');

async function migrate() {
	try {
		console.log('Connecting to MongoDB...');
		await connectDB();

		// Read db.json
		const dbPath = path.join(__dirname, 'db.json');
		if (!fs.existsSync(dbPath)) {
			console.log('db.json not found. Nothing to migrate.');
			process.exit(0);
		}

		const dbData = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
		console.log('Reading db.json...');

		// Migrate doctors
		if (dbData.doctors && dbData.doctors.length > 0) {
			console.log(`Migrating ${dbData.doctors.length} doctors...`);
			for (const doctor of dbData.doctors) {
				try {
					await Doctor.findOneAndUpdate(
						{ email: doctor.email },
						doctor,
						{ upsert: true, new: true }
					);
				} catch (error) {
					console.error(`Error migrating doctor ${doctor.email}:`, error.message);
				}
			}
			console.log('Doctors migrated successfully.');
		}

		// Migrate caregivers
		if (dbData.caregivers && dbData.caregivers.length > 0) {
			console.log(`Migrating ${dbData.caregivers.length} caregivers...`);
			for (const caregiver of dbData.caregivers) {
				try {
					await Caregiver.findOneAndUpdate(
						{ email: caregiver.email },
						caregiver,
						{ upsert: true, new: true }
					);
				} catch (error) {
					console.error(`Error migrating caregiver ${caregiver.email}:`, error.message);
				}
			}
			console.log('Caregivers migrated successfully.');
		}

		// Migrate patients
		if (dbData.patients && dbData.patients.length > 0) {
			console.log(`Migrating ${dbData.patients.length} patients...`);
			for (const patient of dbData.patients) {
				try {
					await Patient.findOneAndUpdate(
						{ id: patient.id },
						patient,
						{ upsert: true, new: true }
					);
				} catch (error) {
					console.error(`Error migrating patient ${patient.id}:`, error.message);
				}
			}
			console.log('Patients migrated successfully.');
		}

		// Migrate logs
		if (dbData.logs && dbData.logs.length > 0) {
			console.log(`Migrating ${dbData.logs.length} logs...`);
			await Log.insertMany(dbData.logs, { ordered: false }).catch(error => {
				console.error('Some logs may have failed to migrate:', error.message);
			});
			console.log('Logs migrated successfully.');
		}

		// Migrate clinician notes
		if (dbData.clinicianNotes && dbData.clinicianNotes.length > 0) {
			console.log(`Migrating ${dbData.clinicianNotes.length} clinician notes...`);
			await ClinicianNote.insertMany(dbData.clinicianNotes, { ordered: false }).catch(error => {
				console.error('Some notes may have failed to migrate:', error.message);
			});
			console.log('Clinician notes migrated successfully.');
		}

		// Migrate share links
		if (dbData.shareLinks && Object.keys(dbData.shareLinks).length > 0) {
			console.log(`Migrating ${Object.keys(dbData.shareLinks).length} share links...`);
			for (const [patientId, link] of Object.entries(dbData.shareLinks)) {
				try {
					await ShareLink.findOneAndUpdate(
						{ patientId },
						{ patientId, ...link },
						{ upsert: true, new: true }
					);
				} catch (error) {
					console.error(`Error migrating share link for patient ${patientId}:`, error.message);
				}
			}
			console.log('Share links migrated successfully.');
		}

		// Migrate sessions (optional - usually you don't want to migrate active sessions)
		if (dbData.sessions && Object.keys(dbData.sessions).length > 0) {
			console.log(`Migrating ${Object.keys(dbData.sessions).length} sessions...`);
			for (const [token, session] of Object.entries(dbData.sessions)) {
				try {
					// Only migrate non-expired sessions
					if (session.expiresAt >= Date.now()) {
						await Session.findOneAndUpdate(
							{ token },
							{ token, ...session },
							{ upsert: true, new: true }
						);
					}
				} catch (error) {
					console.error(`Error migrating session ${token}:`, error.message);
				}
			}
			console.log('Sessions migrated successfully.');
		}

		console.log('\n✅ Migration completed successfully!');
		console.log('Note: db.json has been kept as backup. You can delete it after verifying the migration.');

	} catch (error) {
		console.error('Migration error:', error);
		process.exit(1);
	} finally {
		await mongoose.connection.close();
		process.exit(0);
	}
}

migrate();
