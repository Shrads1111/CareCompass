/**
 * Script to create Patient documents for existing logs
 * This is needed because logs reference patient IDs but Patient documents might not exist
 * 
 * Usage: node create-missing-patients.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/database');
const Patient = require('./models/Patient');
const Log = require('./models/Log');

async function createMissingPatients() {
	try {
		console.log('Connecting to MongoDB...');
		await connectDB();

		// Get all unique patient IDs from logs
		const logs = await Log.find({});
		const patientIds = [...new Set(logs.map(log => log.patientId))];
		
		console.log(`\nFound ${patientIds.length} unique patient IDs in logs:`, patientIds);

		// Create patient documents for each ID that doesn't exist
		let created = 0;
		for (const patientId of patientIds) {
			const exists = await Patient.findOne({ id: patientId });
			if (!exists) {
				await Patient.create({ id: patientId });
				console.log(`✅ Created patient document for: ${patientId}`);
				created++;
			} else {
				console.log(`⏭️  Patient already exists: ${patientId}`);
			}
		}

		console.log(`\n✅ Created ${created} new patient documents`);
		console.log(`📊 Total patients in database: ${await Patient.countDocuments()}`);

	} catch (error) {
		console.error('❌ Error:', error);
		process.exit(1);
	} finally {
		await mongoose.connection.close();
		process.exit(0);
	}
}

createMissingPatients();
