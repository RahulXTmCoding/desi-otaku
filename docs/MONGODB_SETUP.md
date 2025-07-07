# MongoDB Setup Guide

You have two options to get MongoDB running for testing:

## Option 1: Install MongoDB Locally (Windows)

### Steps:
1. Download MongoDB Community Server from: https://www.mongodb.com/try/download/community
2. Choose "Windows" and download the MSI installer
3. Run the installer and follow the setup wizard
4. Install as a Windows Service (recommended)
5. Default installation path: `C:\Program Files\MongoDB\Server\X.X\bin`

### After Installation:
```bash
# Start MongoDB (if not running as service)
mongod

# Or if installed as service, it should auto-start
# Check if running:
net start MongoDB
```

## Option 2: Use MongoDB Atlas (Cloud - Easier!)

### Steps:
1. Go to https://www.mongodb.com/atlas
2. Sign up for a free account
3. Create a free cluster (M0 Sandbox)
4. Whitelist your IP address
5. Create a database user
6. Get your connection string

### Update your .env file:
```env
DATABASE=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/tshirtstore?retryWrites=true&w=majority
```

## Option 3: Use Docker (If you have Docker installed)

```bash
# Run MongoDB in Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

## Quick Test Connection

Once MongoDB is running, update your server/.env file:

For local MongoDB:
```env
DATABASE=mongodb://localhost:27017/tshirtstore
```

For MongoDB Atlas:
```env
DATABASE=mongodb+srv://your-connection-string-here
```

Then restart your server:
```bash
cd server
npm start
