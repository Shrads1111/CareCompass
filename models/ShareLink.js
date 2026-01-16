const mongoose = require('mongoose');

const shareLinkSchema = new mongoose.Schema({
	patientId: {
		type: String,
		required: true,
		unique: true,
		index: true
	},
	code: {
		type: String,
		required: true
	},
	url: {
		type: String,
		required: true
	},
	expiresAt: {
		type: Number,
		required: true,
		index: { expireAfterSeconds: 0 } // TTL index for automatic cleanup
	}
}, {
	timestamps: false
});

const ShareLink = mongoose.model('ShareLink', shareLinkSchema);

module.exports = ShareLink;
