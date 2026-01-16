const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
	id: {
		type: String,
		required: true,
		unique: true
	},
	assignedDoctorId: {
		type: String,
		default: null // null = no doctor assigned
	},
	assignedDoctorIds: {
		type: [String],
		default: [] // Array of doctor emails who have access to this patient
	}
	// Add other patient fields as needed
	// You can expand this schema based on your patient data structure
}, {
	timestamps: false,
	strict: false // Allow additional fields not defined in schema
});

const Patient = mongoose.model('Patient', patientSchema);

module.exports = Patient;
