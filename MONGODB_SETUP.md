# MongoDB Setup Guide

This guide will help you set up MongoDB for the CareCompass application.

## Why MongoDB?

MongoDB provides:
- ✅ Better security (authentication, encryption)
- ✅ Scalability for growing data
- ✅ Data integrity and consistency
- ✅ Better performance for concurrent operations
- ✅ Production-ready database solution

## Setup Options

### Option 1: Local MongoDB (Development)

#### Windows Installation

1. **Download MongoDB Community Server:**
   - Visit: https://www.mongodb.com/try/download/community
   - Select Windows and download the MSI installer

2. **Install MongoDB:**
   - Run the installer
   - Choose "Complete" installation
   - Install as a Windows Service (recommended)
   - Install MongoDB Compass (GUI tool - optional but helpful)

3. **Verify Installation:**
   ```bash
   mongod --version
   ```

4. **Start MongoDB:**
   - If installed as a service, it should start automatically
   - Or start manually: `mongod`

5. **Connection String:**
   ```
   mongodb://localhost:27017/carecompass
   ```

#### Using Docker (Alternative)

```bash
docker run -d -p 27017:27017 --name mongodb mongo
```

### Option 2: MongoDB Atlas (Cloud - Recommended)

1. **Create Account:**
   - Go to https://www.mongodb.com/cloud/atlas
   - Sign up for a free account

2. **Create a Cluster:**
   - Click "Build a Database"
   - Choose FREE tier (M0)
   - Select a cloud provider and region
   - Click "Create"

3. **Create Database User:**
   - Go to "Database Access"
   - Click "Add New Database User"
   - Choose "Password" authentication
   - Create username and password (save these!)
   - Set user privileges to "Read and write to any database"
   - Click "Add User"

4. **Whitelist IP Address:**
   - Go to "Network Access"
   - Click "Add IP Address"
   - For development: Click "Allow Access from Anywhere" (0.0.0.0/0)
   - For production: Add specific IP addresses only

5. **Get Connection String:**
   - Go to "Database" → "Connect"
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database user password
   - Example: `mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/carecompass`

## Configuration

1. **Create `.env` file** in the project root:

   For local MongoDB:
   ```env
   MONGODB_URI=mongodb://localhost:27017/carecompass
   PORT=3000
   ```

   For MongoDB Atlas:
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/carecompass
   PORT=3000
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Migrate existing data (if you have db.json):**
   ```bash
   node migrate-to-mongodb.js
   ```

## Verifying Connection

1. Start the server:
   ```bash
   npm start
   ```

2. You should see:
   ```
   MongoDB Connected: localhost (or your Atlas cluster)
   Server started on http://localhost:3000
   ```

3. Test the API:
   ```bash
   curl http://localhost:3000/api/ping
   ```
   Should return: `{"ok":true}`

## Troubleshooting

### Connection Refused (Local MongoDB)
- Make sure MongoDB service is running
- Check if port 27017 is available
- Verify MongoDB is installed correctly

### Authentication Failed (Atlas)
- Check username and password in connection string
- Verify IP address is whitelisted
- Ensure database user has correct permissions

### Migration Issues
- Make sure MongoDB is running before migration
- Check that `.env` file has correct `MONGODB_URI`
- Verify `db.json` file exists and is valid JSON

## Security Best Practices

1. **Never commit `.env` file** to version control
2. **Use strong passwords** for database users
3. **Restrict IP access** in production (Atlas)
4. **Enable MongoDB authentication** even for local development
5. **Use environment variables** for all sensitive data

## Next Steps

After setting up MongoDB:
1. Run the migration script if you have existing data
2. Start the server and test the application
3. Verify all features work correctly
4. Consider backing up your MongoDB database regularly
