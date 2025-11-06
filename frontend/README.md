# AI Prompt Dashboard - Frontend

A beautiful, modern Next.js frontend for the AI-Powered Prompt Dashboard. Ask questions in natural language and get insights from your PostgreSQL database.

## 🎨 Features

- ✨ **Modern UI** - Built with Next.js 14, TypeScript, and Tailwind CSS
- 🎯 **Professional Design** - Glass-morphism effects, smooth animations, and gradients
- 📱 **Fully Responsive** - Works perfectly on desktop, tablet, and mobile
- ⚡ **Real-time Updates** - Instant feedback with loading states
- 🎭 **Beautiful Components** - Reusable, customizable UI components
- 🌈 **Gradient Accents** - Eye-catching color schemes
- 🔍 **Smart Query Input** - With example queries and keyboard shortcuts
- 📊 **Interactive Tables** - Beautiful data presentation
- 💻 **SQL Syntax Display** - Clean code presentation with copy functionality

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ installed
- Backend API running on http://localhost:8080

### Installation

1. **Install dependencies:**

```bash
cd frontend
npm install
```

2. **Configure environment (optional):**

If your backend runs on a different port, create `.env.local`:

```bash
NEXT_PUBLIC_API_URL=http://localhost:YOUR_PORT
```

3. **Start development server:**

```bash
npm run dev
```

4. **Open in browser:**

Visit [http://localhost:3001](http://localhost:3001)

## 📁 Project Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── layout.tsx       # Root layout
│   │   ├── page.tsx         # Main dashboard page
│   │   └── globals.css      # Global styles
│   ├── components/
│   │   ├── Alert.tsx        # Alert messages
│   │   ├── Badge.tsx        # Status badges
│   │   ├── Button.tsx       # Reusable button
│   │   ├── Card.tsx         # Card container
│   │   ├── LoadingSpinner.tsx
│   │   ├── QueryInput.tsx   # Query input interface
│   │   ├── ResultsTable.tsx # Results display
│   │   └── SQLDisplay.tsx   # SQL code display
│   └── lib/
│       └── api.ts           # API service layer
├── public/                  # Static assets
├── tailwind.config.ts       # Tailwind configuration
├── tsconfig.json           # TypeScript config
└── package.json            # Dependencies
```

## 🎨 UI Components

### Button
```tsx
<Button variant="primary" size="md" isLoading={false}>
  Click me
</Button>
```

Variants: `primary`, `secondary`, `ghost`, `danger`
Sizes: `sm`, `md`, `lg`

### Card
```tsx
<Card padding="md" hover={true}>
  Content
</Card>
```

### Alert
```tsx
<Alert 
  type="success" 
  title="Success" 
  message="Query executed successfully" 
/>
```

### Badge
```tsx
<Badge variant="success">Connected</Badge>
```

## ⚙️ Configuration

### API URL

The frontend connects to the backend API. Configure in `.env.local`:

```bash
NEXT_PUBLIC_API_URL=http://localhost:8080
```

### Port

By default, the frontend runs on port **3001**. To change:

```bash
# Development
npm run dev -- -p 3002

# Production
npm run start -- -p 3002
```

## 🎯 Usage

### Basic Query Flow

1. **Type your question** in natural language
2. **Click Send** or press `Ctrl/⌘ + Enter`
3. **View results** in a beautiful table
4. **Switch to SQL tab** to see the generated query
5. **Copy SQL** with one click

### Example Queries

- "Show me all tables in the database"
- "Count total records in each table"
- "What is the database schema?"
- "Show me data created in the last 30 days"

## 🎨 Customization

### Colors

Edit `tailwind.config.ts` to customize the color scheme:

```typescript
theme: {
  extend: {
    colors: {
      primary: {
        // Your custom colors
      },
    },
  },
},
```

### Styling

Global styles in `src/app/globals.css`:

- Glass effects
- Gradient borders
- Custom scrollbars
- Animations

## 📦 Build for Production

```bash
# Create optimized build
npm run build

# Start production server
npm start
```

## 🚢 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in Vercel
3. Set environment variable: `NEXT_PUBLIC_API_URL`
4. Deploy!

### Docker

```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

ENV NEXT_PUBLIC_API_URL=http://your-api-url:8080
EXPOSE 3001

CMD ["npm", "start"]
```

## 🔧 Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

### Adding New Components

1. Create component in `src/components/`
2. Export from component file
3. Import in pages/components as needed

## 🎭 Design System

### Typography

- **Headings**: Inter font, bold weights
- **Body**: Inter font, regular weight
- **Code**: Monospace font

### Spacing

- Consistent 4px base unit
- Card padding: 24px default
- Component gaps: 16px

### Animations

- Fade in: 300ms
- Slide up: 300ms
- Hover transitions: 200ms

## 📊 Performance

- **Optimized Bundle**: Code splitting with Next.js
- **Fast Loading**: Server-side rendering
- **Smooth Animations**: CSS-based transitions
- **Responsive Images**: Next.js Image optimization

## 🐛 Troubleshooting

### API Connection Issues

**Error**: Cannot connect to backend

**Solution**: Check that:
1. Backend is running on http://localhost:8080
2. `NEXT_PUBLIC_API_URL` is set correctly
3. CORS is enabled on backend

### Build Errors

**Error**: TypeScript errors

**Solution**:
```bash
rm -rf .next node_modules
npm install
npm run build
```

## 📝 License

ISC License - Free to use for personal and commercial projects.

## 🤝 Contributing

Contributions welcome! Feel free to:
- Report bugs
- Suggest features
- Submit pull requests

---

**Enjoy your beautiful AI dashboard! 🎉**

