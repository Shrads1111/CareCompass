/**
 * Migration script to assign existing patients to all doctors
 * Run with: node migrate-patient-assignments.js
 */

require('dotenv').config();
const connectDB = require('./config/database');
const { Doctor } = require('./models/User');
const Patient = require('./models/Patient');

async function migratePatients() {
	try {
		console.log('🔄 Starting patient assignment migration...\n');

		// Connect to database
		await connectDB();
		console.log('✅ Connected to MongoDB');

		// Get all doctors
		const doctors = await Doctor.find({}, { email: 1 });
		console.log(`✅ Found ${doctors.length} doctor(s)`);
		
		if (doctors.length === 0) {
			console.log('⚠️  No doctors found. Please create doctors first.');
			process.exit(1);
		}

		const doctorEmails = doctors.map(d => d.email);
		console.log(`   Doctors: ${doctorEmails.join(', ')}\n`);

		// Find patients with no assignments (old data)
		const unassignedPatients = await Patient.find({
			$or: [
				{ assignedDoctorIds: { $size: 0 } },
				{ assignedDoctorIds: null },
				{ assignedDoctorIds: { $exists: false } }
			]
		});

		console.log(`📋 Found ${unassignedPatients.length} unassigned patient(s)\n`);

		if (unassignedPatients.length === 0) {
			console.log('✅ All patients are already assigned!');
			process.exit(0);
		}

		// Assign all unassigned patients to all doctors
		const result = await Patient.updateMany(
			{
				$or: [
					{ assignedDoctorIds: { $size: 0 } },
					{ assignedDoctorIds: null },
					{ assignedDoctorIds: { $exists: false } }
				]
			},
			{
				$set: { assignedDoctorIds: doctorEmails }
			}
		);

		console.log(`✅ Migration completed!`);
		console.log(`   Updated: ${result.modifiedCount} patient(s)`);
		console.log(`   Matched: ${result.matchedCount} patient(s)\n`);

		// Show updated patients
		const updatedPatients = await Patient.find({
			_id: { $in: unassignedPatients.map(p => p._id) }
		});

		console.log('📝 Updated patient assignments:');
		updatedPatients.forEach(p => {
			console.log(`   • ${p.id} (${p.name || 'N/A'}): ${p.assignedDoctorIds.join(', ')}`);
		});

		console.log('\n✅ Done! Doctors can now see all patients.');
		process.exit(0);
	} catch (error) {
		console.error('❌ Migration error:', error);
		process.exit(1);
	}
}

migratePatients();
