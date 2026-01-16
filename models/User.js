const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
	name: {
		type: String,
		required: true
	},
	email: {
		type: String,
		required: true,
		unique: true,
		lowercase: true,
		trim: true
	},
	password: {
		type: String,
		required: true
	},
	role: {
		type: String,
		enum: ['doctor', 'caregiver'],
		required: true
	},
	createdAt: {
		type: Number,
		default: () => Date.now()
	}
});

// Create indexes for better query performance
userSchema.index({ email: 1, role: 1 });

const Doctor = mongoose.model('Doctor', userSchema);
const Caregiver = mongoose.model('Caregiver', userSchema);

module.exports = { Doctor, Caregiver };
