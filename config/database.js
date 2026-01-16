const mongoose = require('mongoose');

const connectDB = async () => {
	try {
		const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/carecompass', {
			// These options are no longer needed in newer mongoose versions but kept for compatibility
		});

		console.log(`MongoDB Connected: ${conn.connection.host}`);
		return conn;
	} catch (error) {
		console.error('MongoDB connection error:', error);
		process.exit(1);
	}
};

module.exports = connectDB;
