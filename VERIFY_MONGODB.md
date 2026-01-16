# How to Verify Data in MongoDB

This guide shows you multiple ways to verify your data in MongoDB after migration.

## Method 1: Using the Verification Script (Easiest) ⭐

I've created a script that will show you all your data:

```bash
node verify-mongodb.js
```

This will display:
- Count of documents in each collection
- Sample data from each collection
- Database connection information
- Collection names

## Method 2: Using MongoDB Compass (GUI - Recommended)

MongoDB Compass is a visual tool that makes it easy to browse your data.

### Installation:
1. Download from: https://www.mongodb.com/try/download/compass
2. Install and open MongoDB Compass

### Connect:
1. Open MongoDB Compass
2. Paste your connection string:
   ```
   mongodb+srv://bhagyashreeshirapure_db_user:Aarya%402704@cluster0.qehto7m.mongodb.net/carecompass
   ```
   (Note: Use the actual password, not the encoded one in Compass)
3. Click "Connect"

### Browse Data:
- You'll see all your collections on the left sidebar
- Click on any collection to view its documents
- Use the filter/search bar to find specific data
- Click on documents to view/edit them

## Method 3: Using MongoDB Shell (mongosh)

### For MongoDB Atlas (Cloud):
1. Go to your Atlas cluster
2. Click "Connect" → "Connect with MongoDB Shell"
3. Copy the connection command
4. Run it in your terminal

### For Local MongoDB:
```bash
mongosh
# or
mongosh "mongodb://localhost:27017/carecompass"
```

### Useful Commands:

```javascript
// Show all databases
show dbs

// Use your database
use carecompass

// Show all collections
show collections

// Count documents in each collection
db.doctors.countDocuments()
db.caregivers.countDocuments()
db.patients.countDocuments()
db.logs.countDocuments()
db.cliniciannotes.countDocuments()
db.sessions.countDocuments()
db.sharelinks.countDocuments()

// View all doctors
db.doctors.find().pretty()

// View all caregivers
db.caregivers.find().pretty()

// View all patients
db.patients.find().pretty()

// View logs for a specific patient
db.logs.find({ patientId: "alex" }).pretty()

// View all logs (limited to 10)
db.logs.find().limit(10).pretty()

// Count logs by patient
db.logs.aggregate([
  { $group: { _id: "$patientId", count: { $sum: 1 } } }
])

// Find a specific user by email
db.doctors.findOne({ email: "testuser_9876@example.com" })
db.caregivers.findOne({ email: "kimurasa151@gmail.com" })
```

## Method 4: Using the Application

1. Start your server:
   ```bash
   npm start
   ```

2. Test the API endpoints:
   - Open: http://localhost:5000/api/ping (should return `{"ok":true}`)
   - Try logging in with existing credentials
   - Create a new patient
   - Add a log entry
   - Verify data appears correctly

3. Check browser console for any errors

## Method 5: Quick Verification Checklist

Run these checks to ensure everything is working:

### ✅ Connection Check
```bash
node -e "require('dotenv').config(); const mongoose = require('mongoose'); mongoose.connect(process.env.MONGODB_URI).then(() => { console.log('✅ Connected!'); process.exit(0); }).catch(e => { console.log('❌ Error:', e.message); process.exit(1); });"
```

### ✅ Data Count Check
Compare counts from `db.json` with MongoDB:
- Count doctors in db.json vs MongoDB
- Count caregivers in db.json vs MongoDB
- Count patients in db.json vs MongoDB
- Count logs in db.json vs MongoDB

### ✅ Sample Data Check
- Verify at least one doctor exists
- Verify at least one caregiver exists
- Verify patient data structure matches
- Verify logs are associated with correct patients

## Common Verification Queries

### Check if specific user exists:
```javascript
// In mongosh or Compass
db.doctors.findOne({ email: "your-email@example.com" })
db.caregivers.findOne({ email: "your-email@example.com" })
```

### Check patient logs:
```javascript
db.logs.find({ patientId: "alex" }).sort({ createdAt: -1 })
```

### Check active sessions:
```javascript
db.sessions.find({ expiresAt: { $gt: Date.now() } })
```

### Check share links:
```javascript
db.sharelinks.find()
```

## Troubleshooting

### If you see 0 documents:
- Make sure you ran the migration script: `node migrate-to-mongodb.js`
- Check that you're connected to the correct database
- Verify the connection string in `.env` file

### If connection fails:
- Check your MongoDB Atlas IP whitelist
- Verify username and password are correct
- Ensure the database name is correct

### If data looks incomplete:
- Check the migration script output for errors
- Verify `db.json` file has data
- Re-run migration if needed (it won't duplicate data)

## Quick Test Script

Run this to quickly test your connection and see data counts:

```bash
node verify-mongodb.js
```

This will give you a complete report of all your data!
