# SyncRoom Enhanced - Advanced Synchronized Watch Party Platform

A comprehensive private invite-only web application with advanced features for synchronized video watching, including admin interfaces, room management, video requests, and Mega.nz integration.

## Enhanced Features

### Core Features
- **Multi-User Room Support**: Invite multiple users to watch together
- **Advanced Room Categories**: Active, Scheduled, Shared, Finished, Missed, Archived rooms
- **Video Request System**: Users can request new movies to be added
- **Admin Dashboard**: Complete admin interface for platform management
- **Enhanced Authentication**: 2-day session persistence with role-based access
- **Real-time Notifications**: Get notified for room invitations and updates
- **Room Locking**: Optional password protection for rooms
- **Room Archiving**: Automatic and manual room archiving
- **Member Management**: View and manage room members with online status
- **Calendar Integration**: Schedule rooms with calendar notifications (optional)

### Technical Features
- **Mega.nz Integration**: Custom video controls for Mega.nz hosted content
- **Enhanced Chat System**: Improved chat with overlay and persistence
- **Advanced Navigation**: Comprehensive navigation with dropdown menus
- **Responsive Design**: Mobile-optimized with touch controls
- **Real-time Sync**: Perfect synchronization across all participants
- **Database-driven**: PostgreSQL with Supabase for scalability

## Tech Stack

- **Frontend**: Next.js 16 (App Router), TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes / Server Actions
- **Database/Auth**: Supabase (PostgreSQL, Auth, Realtime, Storage)
- **State Management**: Zustand
- **Video Hosting**: Mega.nz (primary), Google Drive, Direct URLs
- **Hosting**: Vercel (recommended)

## Quick Start

### Prerequisites

1. **Node.js 18+** and npm/yarn/pnpm
2. **Supabase Project** (database + auth + realtime + storage)
3. **Mega.nz API credentials** (for video integration)

### 1. Clone and Install

```bash
git clone <repository-url>
cd syncroom-enhanced
npm install
```

### 2. Environment Variables

Create `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Mega.nz (Optional)
MEGA_EMAIL=your_mega_email
MEGA_PASSWORD=your_mega_password

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Database Setup

1. **Run Enhanced Database Schema**
   ```sql
   -- Run supabase/enhanced-schema.sql in your Supabase SQL editor
   -- Then run supabase/enhanced-policies.sql for Row Level Security
   ```

2. **Enable Realtime**
   - Settings -> API
   - Enable Realtime for: `room_state`, `messages`, `room_presence`, `notifications`

3. **Create Storage Bucket** (if using Supabase Storage)
   - In Supabase Dashboard: Storage
   - Click "New bucket"
   - Name it: `videos`
   - Set as: **Public**

### 4. Default Admin User

The system comes with a default admin user:
- **Username**: `shaheer`
- **Access Code**: `SHAHEER123`
- **Role**: Admin (access to both admin and user interfaces)

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Mega.nz Integration

### Setting up Mega.nz

1. **Create Mega.nz Account**: Sign up for a Mega.nz account
2. **Get API Credentials**: Register your application for API access
3. **Configure Environment Variables**: Add Mega.nz credentials to `.env.local`

### Features Supported
- Direct video streaming from Mega.nz links
- Custom video controls (play/pause, seek, volume)
- Thumbnail extraction
- File size and duration detection

## Database Schema

### Enhanced Tables

- **users**: Enhanced user profiles with roles and preferences
- **videos**: Video library with request system and source tracking
- **video_requests**: User video request management
- **rooms**: Enhanced rooms with scheduling, locking, and categories
- **room_members**: Multi-user room membership management
- **room_presence**: Real-time user presence tracking
- **room_state**: Synchronized video player state with queue support
- **messages**: Enhanced chat with reply system
- **notifications**: Real-time notification system
- **calendar_events**: Calendar integration for scheduled rooms

### Security Features

- Row Level Security (RLS) on all tables
- Role-based access control (Admin/User)
- Session management with 2-day persistence
- Secure API endpoints with validation
- Input sanitization and XSS protection

## Admin Features

### Admin Dashboard
- **Overview**: Platform statistics and health monitoring
- **User Management**: View, edit, and manage user accounts
- **Video Management**: Approve/reject video requests, manage library
- **Room Management**: Monitor and manage all rooms
- **System Settings**: Configure platform settings

### Admin Access
- Default admin: `shaheer` / `SHAHEER123`
- Full access to both admin and user interfaces
- Can create additional admin users
- Platform-wide configuration access

## User Features

### Room Management
- **Create Rooms**: Multi-user rooms with various settings
- **Room Categories**: Organize rooms by status and type
- **Schedule Rooms**: Set future viewing times
- **Lock Rooms**: Optional password protection
- **Archive Rooms**: Manual and automatic archiving

### Video System
- **Browse Library**: View available videos
- **Request Videos**: Submit requests for new content
- **Track Requests**: Monitor request status
- **Watch Together**: Synchronized playback

### Communication
- **Real-time Chat**: Persistent chat in rooms
- **Notifications**: Get notified for important events
- **Member List**: See who's online in rooms
- **Activity Tracking**: Monitor room activity

## Deployment

### Vercel Deployment

1. **Connect to Vercel**
   ```bash
   npx vercel
   ```

2. **Environment Variables**
   Add all environment variables in Vercel dashboard

3. **Database Setup**
   - Deploy Supabase to production
   - Run enhanced schema and policies SQL
   - Configure storage and realtime

4. **Deploy**
   ```bash
   vercel --prod
   ```

### GitHub Deployment

1. **Create Repository**
   ```bash
   git init
   git add .
   git commit -m "Initial commit - SyncRoom Enhanced"
   git remote add origin <github-repo-url>
   git push -u origin main
   ```

2. **Configure GitHub Actions** (optional)
   - Set up CI/CD pipeline
   - Automated testing and deployment
   - Environment variable management

## API Documentation

### Authentication Endpoints

- `POST /api/auth/login` - User authentication
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Room Endpoints

- `GET /api/rooms` - List rooms (with filters)
- `POST /api/rooms` - Create new room
- `GET /api/rooms/[id]` - Get room details
- `PUT /api/rooms/[id]` - Update room
- `DELETE /api/rooms/[id]` - Delete room

### Video Endpoints

- `GET /api/videos` - List videos
- `POST /api/videos/request` - Request new video
- `GET /api/videos/requests` - List video requests
- `PUT /api/videos/requests/[id]` - Update video request (admin)

### Notification Endpoints

- `GET /api/notifications` - Get user notifications
- `PUT /api/notifications/[id]/read` - Mark notification as read

## Troubleshooting

### Common Issues

1. **Authentication errors**
   - Check Supabase environment variables
   - Verify user exists in database with correct role
   - Check session cookie settings

2. **Real-time not working**
   - Ensure Supabase Realtime is enabled
   - Check RLS policies allow realtime subscriptions
   - Verify WebSocket connections

3. **Video playback issues**
   - Verify Mega.nz API credentials
   - Check video URLs and permissions
   - Ensure proper CORS configuration

4. **Database connection errors**
   - Verify Supabase URL and keys
   - Check network connectivity
   - Review database logs

### Debug Mode

Enable debug logging:

```env
NEXT_PUBLIC_DEBUG=true
```

## Contributing

1. Fork the repository
2. Create feature branch
3. Implement changes with TypeScript types
4. Test thoroughly
5. Submit pull request

## License

Private project - all rights reserved.

## Support

For issues and questions:
- Check this README
- Review Supabase and Mega.nz documentation
- Contact project administrator

## Roadmap

### Upcoming Features
- [ ] Mobile app development
- [ ] Advanced video codec support
- [ ] Screen sharing capabilities
- [ ] Voice chat integration
- [ ] Multi-language support
- [ ] Advanced analytics dashboard
- [ ] API rate limiting
- [ ] Content recommendation system

### Known Limitations
- Mega.nz API rate limits
- Browser compatibility for some features
- Mobile video performance optimization needed
- Large file handling improvements required
