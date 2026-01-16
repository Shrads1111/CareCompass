# CareCompass 🧭

CareCompass is a healthcare application backend and frontend designed to assist doctors and caregivers in tracking patient data, logs, and clinician notes.

## 📂 Project Structure

- `public/`: Contains all client-side code (HTML, CSS, JS).
- `docs/`: Contains project documentation.
- `server.js`: The Node.js Express server backend.
- `config/`: MongoDB database configuration.
- `models/`: Mongoose models for database schemas.
- `migrate-to-mongodb.js`: Script to migrate data from db.json to MongoDB.

## 🚀 Getting Started

### Prerequisites

- Node.js installed on your machine.
- MongoDB installed locally OR a MongoDB Atlas account (cloud database)

### MongoDB Setup

#### Option 1: Local MongoDB Installation

1. **Install MongoDB Community Edition:**
   - Windows: Download from [MongoDB Download Center](https://www.mongodb.com/try/download/community)
   - Or use MongoDB via Docker: `docker run -d -p 27017:27017 --name mongodb mongo`

2. **Start MongoDB:**
   - Windows: MongoDB should start as a service automatically
   - Or manually: `mongod` (if installed locally)

#### Option 2: MongoDB Atlas (Cloud - Recommended for Production)

1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster
3. Create a database user
4. Whitelist your IP address (or use 0.0.0.0/0 for development)
5. Get your connection string

### Installation

1. Clone the repository or download the source code.

2. Install dependencies:
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   
   Create a `.env` file in the project root:
   ```env
   # For local MongoDB
   MONGODB_URI=mongodb://localhost:27017/carecompass
   
   # For MongoDB Atlas (replace with your connection string)
   # MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/carecompass
   
   # Server Port (optional, defaults to 3000)
   PORT=3000
   ```

4. **Migrate Existing Data (if you have db.json):**
   
   If you have existing data in `db.json`, run the migration script:
   ```bash
   node migrate-to-mongodb.js
   ```
   
   This will migrate all your existing data (doctors, caregivers, patients, logs, notes, etc.) to MongoDB.

### Running the Application

1. **Make sure MongoDB is running** (local or Atlas connection is active)

2. Start the server:
   ```bash
   npm start
   ```
   Or manually:
   ```bash
   node server.js
   ```

3. Open your browser and navigate to:
   `http://localhost:3000`

## 🔐 Credentials

- **Doctor Role**: Select "Doctor" on the login screen.
- **Caregiver Role**: Select "Caregiver" on the login screen.
- You can register a new account or use existing ones migrated from `db.json`.

## 🛠️ Tech Stack

- **Backend**: Node.js, Express
- **Database**: MongoDB with Mongoose ODM
- **Frontend**: HTML5, CSS3, Vanilla JavaScript

## 📝 Migration Notes

- The application now uses MongoDB instead of the file-based `db.json`
- All existing data can be migrated using `migrate-to-mongodb.js`
- The `db.json` file is kept as a backup after migration
- MongoDB provides better security, scalability, and data integrity
