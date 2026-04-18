# SyncRoom - Private Synchronized Watch Party

A private invite-only web application where predefined users can create rooms, invite other approved users, and watch Cloudinary-hosted videos together in perfect sync with real-time controls and chat.

## Features

- **Invite-Only System**: Only pre-approved users can access the platform
- **Real-time Sync**: Perfect synchronization of play/pause, seek, and playback speed
- **Live Chat**: Persistent room chat with real-time messaging
- **Confirmation System**: Modal confirmations for actions that affect other users
- **Overlay Chat**: Glassmorphism chat overlay when chat panel is closed
- **Premium UI**: Dark theme with glassmorphism, animations, and modern design
- **Mobile Support**: Auto-fullscreen and landscape orientation on mobile devices
- **Video Library**: Supabase Storage-integrated video hosting

## Tech Stack

- **Frontend**: Next.js 15 (App Router), TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes / Server Actions
- **Database/Auth**: Supabase (PostgreSQL, Auth, Realtime, Storage)
- **State Management**: Zustand
- **Hosting**: Vercel

## Quick Start

### Prerequisites

1. **Node.js 18+** and npm/yarn/pnpm
2. **Supabase Project** (database + auth + realtime + storage)

### 1. Clone and Install

```bash
git clone <repository-url>
cd syncroom
npm install
```

### 2. Environment Variables

Create `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Database & Storage Setup

1. **Run Database Schema**
   ```sql
   -- Run supabase/schema.sql in your Supabase SQL editor
   -- Then run supabase/policies.sql for Row Level Security
   ```

2. **Create Storage Bucket**
   - In Supabase Dashboard: Storage
   - Click "New bucket"
   - Name it: `videos`
   - Set as: **Public**
   - Enable file uploads for authenticated users

3. **Enable Realtime**
   - Settings -> API
   - Enable Realtime for: `room_state`, `messages`, `room_presence`

### 4. Seed Initial Data

Create approved users:

```sql
-- Add approved users (use actual auth user IDs)
INSERT INTO public.users (id, email, name, approved) VALUES
  ('auth-user-id-1', 'user1@example.com', 'John Doe', true),
  ('auth-user-id-2', 'user2@example.com', 'Jane Smith', true);
```

**Upload Videos:**
- Use the video upload component in the dashboard
- Or upload directly to Supabase Storage bucket
- Videos will be automatically added to the database

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Deployment

### Vercel Deployment

1. **Connect to Vercel**
   ```bash
   npx vercel
   ```

2. **Environment Variables**
   Add all environment variables in Vercel dashboard

3. **Database & Storage Setup**
   - Deploy Supabase to production
   - Run schema and policies SQL
   - Create videos storage bucket
   - Update environment variables with production URLs

4. **Deploy**
   ```bash
   vercel --prod
   ```

### Manual Deployment

```bash
npm run build
npm start
```

## Database Schema

### Tables

- **users**: Approved users with authentication
- **rooms**: Private watch rooms with invitations
- **videos**: Cloudinary video library
- **room_presence**: Real-time user presence tracking
- **room_state**: Synchronized video player state
- **messages**: Room chat messages

### Security

- Row Level Security (RLS) enabled on all tables
- Only approved users can access the platform
- Room access restricted to invited users only
- Server-side validation for all operations

## Architecture

### Authentication Flow

1. User logs in with email/password or magic link
2. System checks if user is approved in database
3. If approved, user gets access to dashboard
4. If not approved, user is logged out with error message

### Real-time Sync

1. Video actions trigger confirmation modal
2. User confirms action
3. Action updates room state in database
4. Supabase Realtime broadcasts changes
5. All users receive and apply sync updates

### Chat System

1. Messages stored in Supabase database
2. Real-time subscriptions for new messages
3. Overlay mode shows recent messages when panel closed
4. Glassmorphism design with fade animations

## Mobile Features

- Auto-fullscreen when video starts playing
- Landscape orientation lock (when supported)
- Touch-optimized controls
- Responsive design for all screen sizes

## Admin Features

- Seed approved users via database
- Add/remove videos from library
- Monitor active rooms
- User management through Supabase dashboard

## Troubleshooting

### Common Issues

1. **Authentication errors**
   - Check Supabase environment variables
   - Verify user is marked as approved in database

2. **Real-time not working**
   - Ensure Supabase Realtime is enabled
   - Check RLS policies allow realtime subscriptions

3. **Video playback issues**
   - Verify Supabase Storage bucket is public
   - Check video formats and storage permissions
   - Ensure storage URLs are accessible

4. **Database connection errors**
   - Verify Supabase URL and keys
   - Check network connectivity

### Debug Mode

Enable debug logging:

```env
NEXT_PUBLIC_DEBUG=true
```

## Contributing

1. Fork the repository
2. Create feature branch
3. Make changes with TypeScript types
4. Test thoroughly
5. Submit pull request

## License

Private project - all rights reserved.

## Support

For issues and questions:
- Check this README
- Review Supabase and Cloudinary documentation
- Contact project administrator
