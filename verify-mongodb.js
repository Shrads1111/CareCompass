/**
 * Verification script to check MongoDB data
 * Run this to verify all your data was migrated correctly
 * 
 * Usage: node verify-mongodb.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/database');
const { Doctor, Caregiver } = require('./models/User');
const Patient = require('./models/Patient');
const Log = require('./models/Log');
const ClinicianNote = require('./models/ClinicianNote');
const Session = require('./models/Session');
const ShareLink = require('./models/ShareLink');

async function verify() {
	try {
		console.log('Connecting to MongoDB...');
		await connectDB();

		console.log('\n📊 MongoDB Data Verification Report\n');
		console.log('=' .repeat(50));

		// Count documents in each collection
		const doctorCount = await Doctor.countDocuments();
		const caregiverCount = await Caregiver.countDocuments();
		const patientCount = await Patient.countDocuments();
		const logCount = await Log.countDocuments();
		const noteCount = await ClinicianNote.countDocuments();
		const sessionCount = await Session.countDocuments();
		const shareLinkCount = await ShareLink.countDocuments();

		console.log('\n📈 Collection Counts:');
		console.log(`  Doctors:        ${doctorCount}`);
		console.log(`  Caregivers:     ${caregiverCount}`);
		console.log(`  Patients:       ${patientCount}`);
		console.log(`  Logs:           ${logCount}`);
		console.log(`  Clinician Notes: ${noteCount}`);
		console.log(`  Sessions:        ${sessionCount}`);
		console.log(`  Share Links:     ${shareLinkCount}`);

		// Show sample data
		console.log('\n📋 Sample Data:');
		console.log('-'.repeat(50));

		if (doctorCount > 0) {
			console.log('\n👨‍⚕️  Sample Doctors:');
			const doctors = await Doctor.find({}).limit(3).select('name email role createdAt');
			doctors.forEach((doc, i) => {
				console.log(`  ${i + 1}. ${doc.name} (${doc.email}) - ${doc.role}`);
			});
		}

		if (caregiverCount > 0) {
			console.log('\n👨‍⚕️  Sample Caregivers:');
			const caregivers = await Caregiver.find({}).limit(3).select('name email role createdAt');
			caregivers.forEach((doc, i) => {
				console.log(`  ${i + 1}. ${doc.name} (${doc.email}) - ${doc.role}`);
			});
		}

		if (patientCount > 0) {
			console.log('\n🏥 Sample Patients:');
			const patients = await Patient.find({}).limit(3);
			patients.forEach((doc, i) => {
				console.log(`  ${i + 1}. Patient ID: ${doc.id}`);
			});
		}

		if (logCount > 0) {
			console.log('\n📝 Sample Logs:');
			const logs = await Log.find({}).limit(3).sort({ createdAt: -1 });
			logs.forEach((log, i) => {
				console.log(`  ${i + 1}. Patient: ${log.patientId}, Mood: ${log.mood || 'N/A'}, Date: ${new Date(log.createdAt).toLocaleString()}`);
			});
		}

		if (noteCount > 0) {
			console.log('\n📄 Sample Clinician Notes:');
			const notes = await ClinicianNote.find({}).limit(3).sort({ createdAt: -1 });
			notes.forEach((note, i) => {
				const preview = note.note.substring(0, 50) + (note.note.length > 50 ? '...' : '');
				console.log(`  ${i + 1}. Patient: ${note.patientId}, Note: ${preview}`);
			});
		}

		// Database info
		console.log('\n💾 Database Information:');
		console.log('-'.repeat(50));
		const db = mongoose.connection.db;
		const collections = await db.listCollections().toArray();
		console.log(`  Database Name: ${db.databaseName}`);
		console.log(`  Collections: ${collections.map(c => c.name).join(', ')}`);

		// Connection info
		console.log('\n🔌 Connection Info:');
		console.log('-'.repeat(50));
		const uri = process.env.MONGODB_URI || 'Not set';
		const maskedUri = uri.replace(/:[^:@]+@/, ':****@'); // Mask password
		console.log(`  Connection: ${maskedUri}`);
		console.log(`  Host: ${mongoose.connection.host}`);
		console.log(`  Port: ${mongoose.connection.port || 'N/A (Atlas)'}`);
		console.log(`  State: ${mongoose.connection.readyState === 1 ? 'Connected ✅' : 'Disconnected ❌'}`);

		console.log('\n' + '='.repeat(50));
		console.log('✅ Verification Complete!\n');

	} catch (error) {
		console.error('❌ Verification error:', error);
		process.exit(1);
	} finally {
		await mongoose.connection.close();
		process.exit(0);
	}
}

verify();
