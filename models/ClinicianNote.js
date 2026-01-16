const mongoose = require('mongoose');

const clinicianNoteSchema = new mongoose.Schema({
	patientId: {
		type: String,
		required: true,
		index: true
	},
	note: {
		type: String,
		default: ''
	},
	createdAt: {
		type: Number,
		default: () => Date.now(),
		index: true
	}
}, {
	timestamps: false
});

clinicianNoteSchema.index({ patientId: 1, createdAt: -1 });

const ClinicianNote = mongoose.model('ClinicianNote', clinicianNoteSchema);

module.exports = ClinicianNote;
