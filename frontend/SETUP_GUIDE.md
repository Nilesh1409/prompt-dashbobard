# 🚀 Quick Setup Guide - Next.js Frontend

Get your beautiful AI dashboard up and running in 5 minutes!

## Step 1: Install Dependencies

```bash
cd frontend
npm install
```

This will install:
- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- Axios (for API calls)
- Lucide React (icons)

## Step 2: Verify Backend is Running

Make sure your backend API is running on **http://localhost:8080**

```bash
# In a separate terminal, from project root
cd ..
npm run dev
```

You should see:
```
✅ Database connected successfully
🚀 Server is running on http://localhost:8080
```

## Step 3: Start Frontend

```bash
npm run dev
```

You should see:
```
▲ Next.js 14.2.0
- Local: http://localhost:3001
✓ Ready in 2.5s
```

## Step 4: Open in Browser

Visit: **http://localhost:3001**

You should see a beautiful dashboard with:
- 🎨 Modern gradient design
- ✨ Glass-morphism effects
- 🔵 Connection status badge (should show "Connected")

## Step 5: Try a Query!

Type any of these in the query box:

- "Show me all tables in the database"
- "Count total records in each table"
- "What is the database schema?"

Click **Send** or press **Ctrl/⌘ + Enter**

## 🎉 You're Done!

Your dashboard is now ready to use!

---

## Troubleshooting

### ❌ "Cannot connect to backend"

**Solution:**
1. Check backend is running on port 8080
2. Visit http://localhost:8080/api/health in your browser
3. If it doesn't work, check backend logs

### ❌ Port 3001 already in use

**Solution:**
```bash
npm run dev -- -p 3002
```

### ❌ npm install fails

**Solution:**
```bash
rm -rf node_modules package-lock.json
npm install
```

---

## Configuration

### Change API URL

Create `.env.local`:
```bash
NEXT_PUBLIC_API_URL=http://your-backend-url:port
```

### Change Port

```bash
# Development
npm run dev -- -p YOUR_PORT

# Production
npm start -- -p YOUR_PORT
```

---

## What's Included?

✅ **Modern UI Components**
- Buttons with loading states
- Cards with glass effects
- Alerts and badges
- Loading spinners
- Professional tables

✅ **Smart Features**
- Example query suggestions
- Keyboard shortcuts (Ctrl/⌘ + Enter)
- Copy SQL with one click
- Tab navigation (Results/SQL)
- Real-time connection status

✅ **Responsive Design**
- Works on all screen sizes
- Mobile-optimized
- Touch-friendly

✅ **Beautiful Animations**
- Smooth transitions
- Fade-in effects
- Hover states

---

## Next Steps

1. **Customize Colors**: Edit `tailwind.config.ts`
2. **Add More Features**: Check `README.md` for component docs
3. **Deploy**: See deployment section in README

**Enjoy your beautiful dashboard! 🎨**

