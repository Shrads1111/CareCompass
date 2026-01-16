const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
	patientId: {
		type: String,
		required: true,
		index: true
	},
	mood: String,
	antecedent: String,
	behavior: String,
	consequence: String,
	note: String,
	sleepStart: String,
	sleepEnd: String,
	hydration: String,
	food: String,
	meds: String,
	createdAt: {
		type: Number,
		default: () => Date.now(),
		index: true
	}
}, {
	timestamps: false,
	strict: false // Allow additional fields
});

logSchema.index({ patientId: 1, createdAt: -1 });

const Log = mongoose.model('Log', logSchema);

module.exports = Log;
