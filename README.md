# Frioo - Fresh Fruit E-Commerce Platform

Modern e-commerce web application for fresh juices, smoothies, salads, and fruits. Built with React + Vite frontend and Express + Supabase backend.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Supabase account ([supabase.com](https://supabase.com))
- Git

### 1. Clone & Install

```bash
git clone <repository-url>
cd frioo

# Install dependencies for both client and server
cd client && npm install
cd ../server && npm install
```

### 2. Environment Setup

#### Server Configuration
```bash
cd server
cp .env.example .env
# Edit .env with your Supabase credentials
```

Required variables:
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (keep secret!)
- `PORT` - Server port (default: 4000)

#### Client Configuration
```bash
cd client
cp .env.example .env
# Edit .env with your Supabase credentials
```

Required variables:
- `VITE_SUPABASE_URL` - Same as server SUPABASE_URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous/public key

### 3. Database Setup

1. Create a new Supabase project
2. Run the SQL schema (see Database Schema below)
3. Enable Google OAuth in Supabase:
   - Dashboard > Authentication > Providers > Google
   - Add your Google OAuth credentials
   - Set redirect URL: `http://localhost:5173/onboarding`

### 4. Run Development Servers

```bash
# Terminal 1 - Backend (port 4000)
cd server
npm run dev

# Terminal 2 - Frontend (port 5173)
cd client
npm run dev
```

Visit: http://localhost:5173

## 📦 Project Structure

```
frioo/
├── client/          # React + Vite frontend
│   ├── src/
│   │   ├── pages/       # Route components
│   │   ├── components/  # Reusable UI components
│   │   ├── context/     # React Context (Auth, Cart)
│   │   ├── utils/       # Helper functions
│   │   ├── config/      # Constants, configuration
│   │   └── lib/         # Third-party integrations
│   └── package.json
│
└── server/          # Express + Supabase backend
    ├── src/
    │   ├── routes/      # API endpoints
    │   ├── middleware/  # Auth, validation
    │   ├── utils/       # Response helpers
    │   └── db.js        # Supabase client
    └── package.json
```

## 🗄️ Database Schema

### Required Tables

```sql
-- Users profiles
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  full_name TEXT,
  email TEXT,
  phone_number TEXT,
  role TEXT DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  price_cents INTEGER NOT NULL,
  category TEXT NOT NULL,
  images TEXT[] DEFAULT '{}',
  nutrition JSONB DEFAULT '{}',
  featured BOOLEAN DEFAULT false,
  unit TEXT DEFAULT 'kg',
  video_url TEXT,
  perfect_for TEXT,
  discount INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Orders
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  profile_id UUID REFERENCES profiles(id),
  guest_id TEXT,
  items JSONB NOT NULL,
  subtotal NUMERIC,
  discount NUMERIC,
  total_amount NUMERIC NOT NULL,
  order_type TEXT CHECK (order_type IN ('delivery', 'takeaway')),
  delivery_address TEXT,
  phone_number TEXT NOT NULL,
  distance_km NUMERIC,
  coupon_code TEXT,
  discount_amount NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Coupons
CREATE TABLE coupons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  discount_type TEXT CHECK (discount_type IN ('percentage', 'fixed')),
  value NUMERIC NOT NULL,
  min_order_value NUMERIC DEFAULT 0,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## 🔧 Environment Variables Reference

### Server (.env)
| Variable | Required | Description |
|----------|----------|-------------|
| `SUPABASE_URL` | ✅ | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Service role key (secret!) |
| `PORT` | ❌ | Server port (default: 4000) |
| `PRODUCTION_URL` | ❌ | Frontend URL for CORS in production |

### Client (.env)
| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_SUPABASE_URL` | ✅ | Supabase project URL (same as server) |
| `VITE_SUPABASE_ANON_KEY` | ✅ | Supabase anonymous/public key |
| `VITE_API_URL` | ❌ | Backend URL (auto-detects localhost:4000 in dev) |

## 🛠️ Tech Stack

**Frontend:**
- React 19 + Vite
- React Router
- Three.js + @react-three/fiber (3D graphics)
- Framer Motion (animations)
- Supabase Client (auth, data)

**Backend:**
- Express.js
- Supabase (PostgreSQL database)
- Helmet, CORS (security)
- express-validator (input validation)
- express-rate-limit (API protection)

## 📝 Development Notes

**Available Scripts:**

```bash
# Client
npm run dev      # Start dev server
npm run build    # Production build
npm run preview  # Preview production build

# Server
npm run dev      # Start with nodemon (hot reload)
npm start        # Production start
```

**API Endpoints:**
- `GET /api/products` - List products (supports pagination)
- `POST /api/orders` - Place order
- `POST /api/coupons/validate` - Validate coupon code
- `GET /api/admin/*` - Admin panel routes (requires auth)

**Features:**
- ✅ User authentication (Google OAuth)
- ✅ Shopping cart with customization
- ✅ Product filtering & search
- ✅ Coupon system
- ✅ Geolocation-based delivery validation
- ✅ Admin panel (orders, products, users, coupons)
- ✅ FriooAI - 3D nutrition analysis experience

## 🚢 Deployment

### Backend (Render/Railway/Fly.io)
1. Set environment variables in platform dashboard
2. Deploy from GitHub or via CLI
3. Ensure PORT is set correctly

### Frontend (Vercel/Netlify)
1. Build command: `npm run build`
2. Publish directory: `dist`
3. Set environment variables (VITE_*)
4. Update CORS in server to allow production URL

## 🔒 Security

- Service role key must be kept secret (server-side only)
- Row Level Security (RLS) should be enabled in Supabase
- Admin routes protected with JWT verification
- Rate limiting on sensitive endpoints
- Input validation on all API endpoints

## 📄 License

[Your License Here]

## 🤝 Contributing

[Contribution guidelines]
