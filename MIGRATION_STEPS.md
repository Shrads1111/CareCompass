# MongoDB Migration Steps - Quick Guide

This document provides a quick step-by-step guide to migrate from `db.json` to MongoDB.

## ✅ Step-by-Step Migration

### Step 1: Install MongoDB

**Option A: Local MongoDB**
- Download and install from: https://www.mongodb.com/try/download/community
- Or use Docker: `docker run -d -p 27017:27017 --name mongodb mongo`

**Option B: MongoDB Atlas (Cloud)**
- Sign up at: https://www.mongodb.com/cloud/atlas
- Create a free cluster
- Get your connection string

### Step 2: Install Dependencies

```bash
cd ctc-login
npm install
```

This will install:
- `mongoose` - MongoDB ODM
- `dotenv` - Environment variable management

### Step 3: Create Environment File

Create a `.env` file in the `ctc-login` directory:

**For local MongoDB:**
```env
MONGODB_URI=mongodb://localhost:27017/carecompass
PORT=3000
```

**For MongoDB Atlas:**
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/carecompass
PORT=3000
```

### Step 4: Migrate Existing Data

If you have existing data in `db.json`, run:

```bash
node migrate-to-mongodb.js
```

This will migrate:
- ✅ Doctors
- ✅ Caregivers
- ✅ Patients
- ✅ Logs
- ✅ Clinician Notes
- ✅ Share Links
- ✅ Active Sessions

### Step 5: Start the Server

```bash
npm start
```

You should see:
```
MongoDB Connected: localhost (or your Atlas cluster)
Server started on http://localhost:3000
```

### Step 6: Verify Everything Works

1. Open http://localhost:3000
2. Try logging in with existing credentials
3. Test creating new patients, logs, and notes
4. Verify all features work correctly

## 🔄 What Changed?

### Before (db.json):
- File-based storage using `lowdb`
- Data stored in `db.json` file
- No authentication/security
- Limited scalability

### After (MongoDB):
- Database-based storage using MongoDB
- Secure connection with authentication
- Better performance and scalability
- Production-ready solution

## 📁 New Files Created

- `config/database.js` - MongoDB connection configuration
- `models/User.js` - Doctor and Caregiver models
- `models/Patient.js` - Patient model
- `models/Log.js` - Log model
- `models/ClinicianNote.js` - Clinician note model
- `models/Session.js` - Session model
- `models/ShareLink.js` - Share link model
- `migrate-to-mongodb.js` - Data migration script
- `MONGODB_SETUP.md` - Detailed setup guide

## ⚠️ Important Notes

1. **Keep `db.json` as backup** - Don't delete it until you've verified everything works
2. **Environment variables** - Never commit `.env` file to git
3. **MongoDB must be running** - Make sure MongoDB is running before starting the server
4. **Connection string** - Keep your MongoDB connection string secure

## 🆘 Troubleshooting

**Connection Error:**
- Verify MongoDB is running
- Check `MONGODB_URI` in `.env` file
- For Atlas: Check IP whitelist and credentials

**Migration Fails:**
- Ensure MongoDB is running
- Check `db.json` file is valid JSON
- Verify `.env` file has correct `MONGODB_URI`

**Server Won't Start:**
- Check MongoDB connection
- Verify all dependencies installed: `npm install`
- Check for port conflicts (default: 3000)

## ✨ Benefits of MongoDB

- ✅ **Security**: Authentication and encryption support
- ✅ **Scalability**: Handles large amounts of data
- ✅ **Performance**: Better for concurrent operations
- ✅ **Reliability**: ACID transactions support
- ✅ **Production Ready**: Used by major applications worldwide

## 📞 Need Help?

See the detailed guide in [MONGODB_SETUP.md](./MONGODB_SETUP.md) for more information.
