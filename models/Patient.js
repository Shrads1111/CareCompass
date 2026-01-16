const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
	id: {
		type: String,
		required: true,
		unique: true
	},
	// Add other patient fields as needed
	// You can expand this schema based on your patient data structure
}, {
	timestamps: false,
	strict: false // Allow additional fields not defined in schema
});

const Patient = mongoose.model('Patient', patientSchema);

module.exports = Patient;
