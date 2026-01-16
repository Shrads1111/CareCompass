const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
	token: {
		type: String,
		required: true,
		unique: true,
		index: true
	},
	user: {
		id: String,
		name: String,
		email: String,
		role: String
	},
	expiresAt: {
		type: Number,
		required: true,
		index: { expireAfterSeconds: 0 } // TTL index for automatic cleanup
	}
}, {
	timestamps: false
});

const Session = mongoose.model('Session', sessionSchema);

module.exports = Session;
