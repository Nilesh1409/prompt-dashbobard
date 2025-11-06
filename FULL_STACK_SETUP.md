# 🚀 Complete Full-Stack Setup Guide

Run both backend and frontend together for the complete AI Prompt Dashboard experience.

## 📋 Overview

- **Backend**: Node.js + Express (Port 8080)
- **Frontend**: Next.js + React (Port 3001)
- **Database**: PostgreSQL (Your existing database)
- **AI**: OpenAI GPT-4 Turbo

---

## 🏃 Quick Start (Both Services)

### Step 1: Install All Dependencies

```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..
```

### Step 2: Configure Environment

Make sure your `.env` file in the root has:

```env
# OpenAI Configuration
OPENAI_API_KEY=your_actual_openai_key

# PostgreSQL Database
DB_HOST=13.210.155.239
DB_PORT=5542
DB_USER=read_only
DB_PASSWORD=your_password
DB_NAME=farmer_chat_mobile_app_dev

# Server Configuration
PORT=8080
NODE_ENV=development
```

### Step 3: Start Both Services

**Option A: Use Two Terminals (Recommended)**

Terminal 1 - Backend:
```bash
npm run dev
```

Terminal 2 - Frontend:
```bash
cd frontend
npm run dev
```

**Option B: Production Mode**

Terminal 1:
```bash
npm start
```

Terminal 2:
```bash
cd frontend
npm run build
npm start
```

### Step 4: Access the Dashboard

Open your browser: **http://localhost:3001**

You should see:
- ✅ Beautiful gradient UI
- ✅ "Connected" badge in top right
- ✅ Query input ready to use

---

## 🎯 Testing the Complete Stack

### 1. Test Backend API (Optional)

```bash
curl http://localhost:8080/api/health
```

Should return:
```json
{
  "status": "ok",
  "database": "connected",
  "timestamp": "2025-11-03T..."
}
```

### 2. Use the Frontend Dashboard

Visit **http://localhost:3001** and try:

**Example Query 1:**
```
Show me all tables in the database
```

**Example Query 2:**
```
Count the total number of records in each table
```

**Example Query 3:**
```
What is the database schema?
```

---

## 📁 Project Structure

```
Prompt Dashboard/
├── backend (Node.js API)
│   ├── config/           # Database configuration
│   ├── services/         # Business logic
│   │   ├── openaiService.js    # AI integration
│   │   └── mcpService.js       # Database queries
│   ├── middleware/       # Validation
│   ├── utils/           # Helpers
│   ├── public/          # Old HTML dashboard
│   ├── server.js        # Express server
│   ├── package.json
│   └── .env
│
├── frontend (Next.js App)
│   ├── src/
│   │   ├── app/         # Pages
│   │   ├── components/  # UI components
│   │   └── lib/         # API service
│   ├── package.json
│   └── README.md
│
├── API_TESTING.md      # Postman collection
└── README.md           # Main documentation
```

---

## 🎨 What's Included

### Backend Features
- ✅ Natural language to SQL conversion (OpenAI)
- ✅ Database schema exploration
- ✅ Query execution with PostgreSQL
- ✅ Statistics and metadata
- ✅ Error handling
- ✅ RESTful API

### Frontend Features
- ✅ Modern, professional UI
- ✅ Glass-morphism effects
- ✅ Gradient accents
- ✅ Responsive design
- ✅ Real-time connection status
- ✅ Query input with examples
- ✅ Beautiful results tables
- ✅ SQL syntax display
- ✅ Copy to clipboard
- ✅ Loading states
- ✅ Error handling
- ✅ Keyboard shortcuts

---

## 🔧 Configuration

### Backend Port

Edit `PORT` in `.env`:
```env
PORT=8080
```

### Frontend Port

Edit in `package.json`:
```json
{
  "scripts": {
    "dev": "next dev -p 3001"
  }
}
```

### API URL (if backend port changes)

Create `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:YOUR_PORT
```

---

## 🚀 Production Deployment

### Backend (Node.js)

```bash
# Build and start
npm install --production
NODE_ENV=production node server.js
```

### Frontend (Next.js)

```bash
cd frontend
npm run build
npm start
```

### Using PM2 (Process Manager)

```bash
# Install PM2
npm install -g pm2

# Start backend
pm2 start server.js --name "prompt-dashboard-api"

# Start frontend
cd frontend
pm2 start npm --name "prompt-dashboard-ui" -- start

# Save configuration
pm2 save
pm2 startup
```

### Using Docker

Create `docker-compose.yml`:

```yaml
version: '3.8'
services:
  backend:
    build: .
    ports:
      - "8080:8080"
    environment:
      - NODE_ENV=production
    env_file:
      - .env

  frontend:
    build: ./frontend
    ports:
      - "3001:3001"
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:8080
    depends_on:
      - backend
```

Run:
```bash
docker-compose up -d
```

---

## 📊 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check |
| `/api/schema` | GET | Database schema |
| `/api/stats` | GET | Database statistics |
| `/api/query` | POST | Natural language query |
| `/api/execute` | POST | Execute raw SQL |

---

## 🐛 Troubleshooting

### Backend won't start

1. Check database credentials in `.env`
2. Verify OpenAI API key is valid
3. Check port 8080 is available

### Frontend won't connect

1. Verify backend is running: `curl http://localhost:8080/api/health`
2. Check `NEXT_PUBLIC_API_URL` in frontend
3. Clear browser cache

### Database connection fails

1. Test connection: `node test-connection.js`
2. Verify credentials
3. Check network/firewall

### OpenAI errors

1. Verify API key is correct
2. Check you have credits
3. Review rate limits

---

## 💡 Tips

1. **Keep both services running** for the full experience
2. **Use the frontend** - it's much nicer than the API alone
3. **Check connection status** in the top-right badge
4. **Use example queries** to get started
5. **Press Ctrl/⌘ + Enter** to submit queries quickly

---

## 📝 Available Documentation

- `README.md` - Main project documentation
- `frontend/README.md` - Frontend documentation
- `frontend/SETUP_GUIDE.md` - Frontend quick start
- `API_TESTING.md` - API testing with cURL
- `SETUP.md` - Detailed backend setup
- `QUICKSTART.md` - Backend quick start

---

## 🎉 You're All Set!

Access your dashboard at: **http://localhost:3001**

**Enjoy querying your database with AI! 🚀**

