# SyncRoom Enhanced - Complete Setup Guide

This guide will walk you through setting up Supabase and Mega.nz for your enhanced SyncRoom application.

## Supabase Setup

### 1. Create New Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project" or "New Project"
3. Sign in or create an account
4. Click "New Project"
5. Choose your organization
6. **Project Details:**
   - **Name**: `syncroom-enhanced`
   - **Database Password**: Create a strong password (save it!)
   - **Region**: Choose closest to your users
   - **Pricing Plan**: Free tier is fine to start

### 2. Get Supabase Credentials

Once your project is created, go to **Settings > API** and copy:

```
Project URL: https://your-project-id.supabase.co
Anon Public Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Service Role Key: (keep this secret!)
```

### 3. Run Database Schema

1. Go to **SQL Editor** in Supabase dashboard
2. Copy and paste the contents of `supabase/enhanced-schema.sql`
3. Click **Run** to execute the schema
4. Copy and paste the contents of `supabase/enhanced-policies.sql`
5. Click **Run** to set up security policies

### 4. Enable Realtime

1. Go to **Settings > API**
2. Under **Realtime**, enable these tables:
   - `room_state`
   - `messages`
   - `room_presence`
   - `notifications`
   - `room_members`

### 5. Set Up Storage (Optional)

1. Go to **Storage** in Supabase dashboard
2. Click **New bucket**
3. **Bucket name**: `videos`
4. **Public bucket**: Yes
5. **Allowed MIME types**: `video/*`, `image/*`
6. Click **Save**

### 6. Configure Environment Variables

Create `.env.local` in your project root:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Mega.nz Configuration
MEGA_EMAIL=your_mega_email@example.com
MEGA_PASSWORD=your_mega_password
MEGA_API_KEY=your_mega_api_key_if_available

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Mega.nz Setup

### Option 1: Using Mega.nz Direct Links (Recommended)

The easiest approach is to use direct Mega.nz file links:

1. **Upload Videos to Mega.nz:**
   - Go to [mega.nz](https://mega.nz)
   - Sign up or log in
   - Upload your video files
   - Get share links for each video

2. **Format Video URLs:**
   - Share link format: `https://mega.nz/file/abc123#def456`
   - Add these URLs to your video library through the admin panel

### Option 2: Mega.nz API Integration (Advanced)

For full API integration:

1. **Get Mega.nz API Access:**
   - Apply for Mega.nz API access at [developers.mega.nz](https://developers.mega.nz)
   - Register your application
   - Get API credentials

2. **Set Up Mega.nz SDK:**
   - Install Mega.nz SDK: `npm install megajs`
   - Configure API credentials in environment variables

3. **API Features Available:**
   - Direct file streaming
   - Thumbnail extraction
   - File metadata retrieval
   - Search functionality
   - Upload capabilities

### Mega.nz URL Format

For the enhanced SyncRoom, use these URL formats:

```
# Direct file link
https://mega.nz/file/abc123#def456

# Folder link
https://mega.nz/#F!abc123!def456

# Encrypted link
https://mega.nz/#!abc123!def456
```

## Testing Your Setup

### 1. Test Supabase Connection

Run the development server:

```bash
npm run dev
```

Visit `http://localhost:3000/login` and try logging in with:
- **Username**: `shaheer`
- **Access Code**: `SHAHEER123`

### 2. Test Database Connection

1. Go to Supabase **SQL Editor**
2. Run this test query:

```sql
SELECT * FROM users WHERE username = 'shaheer';
```

You should see the admin user record.

### 3. Test Realtime Features

1. Open two browser windows
2. Log in as `shaheer` in both
3. Create a room and test real-time updates

## Adding Sample Data

### Add Sample Users

Run this SQL in Supabase SQL Editor:

```sql
INSERT INTO public.users (username, access_code, name, role, email) VALUES
  ('john_doe', 'USER123', 'John Doe', 'user', 'john@example.com'),
  ('jane_smith', 'USER456', 'Jane Smith', 'user', 'jane@example.com');
```

### Add Sample Videos

```sql
INSERT INTO public.videos (title, description, video_url, source_type, is_public) VALUES
  ('Sample Movie 1', 'A test movie', 'https://mega.nz/file/sample1', 'mega', true),
  ('Sample Movie 2', 'Another test movie', 'https://mega.nz/file/sample2', 'mega', true);
```

### Add Sample Rooms

```sql
INSERT INTO public.rooms (name, description, created_by, video_id, status, category) VALUES
  ('Movie Night', 'Weekly movie watching session', 
   (SELECT id FROM users WHERE username = 'shaheer'),
   (SELECT id FROM videos WHERE title = 'Sample Movie 1'),
   'active', 'shared');
```

## Mega.nz Best Practices

### Video Upload Guidelines

1. **File Formats**: Use MP4, WebM, or OGG
2. **File Size**: Keep videos under 5GB for better performance
3. **Resolution**: 1080p recommended, 720p for mobile
4. **Bitrate**: 2-5 Mbps for good quality

### Organization Tips

1. **Folder Structure**: Create folders by genre or year
2. **Naming Convention**: Use consistent naming (e.g., `Movie_Title_Year.mp4`)
3. **Metadata**: Include descriptions and tags
4. **Backup**: Keep local backups of important videos

### Security Considerations

1. **Private Links**: Use private links for sensitive content
2. **Access Control**: Set appropriate permissions
3. **Encryption**: Enable encryption for private content
4. **Regular Cleanup**: Remove unused files periodically

## Troubleshooting

### Common Supabase Issues

1. **Connection Errors**:
   - Check environment variables
   - Verify project URL and keys
   - Ensure database is running

2. **RLS Policy Errors**:
   - Run the policies SQL script
   - Check table permissions
   - Verify user authentication

3. **Realtime Not Working**:
   - Enable realtime for tables
   - Check WebSocket connections
   - Review browser console for errors

### Common Mega.nz Issues

1. **Link Not Working**:
   - Verify link format
   - Check if file is still available
   - Ensure proper permissions

2. **Streaming Issues**:
   - Check file format compatibility
   - Verify file size limits
   - Test with different browsers

3. **API Rate Limits**:
   - Implement request throttling
   - Cache responses when possible
   - Use efficient data structures

## Production Deployment

### Environment Variables for Production

```env
# Production Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-prod-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=prod_anon_key
SUPABASE_SERVICE_ROLE_KEY=prod_service_key

# Production Mega.nz
MEGA_EMAIL=prod_mega_email
MEGA_PASSWORD=prod_mega_password

# Production App
NEXT_PUBLIC_APP_URL=https://your-domain.com
NODE_ENV=production
```

### Security Checklist

1. **Environment Variables**: Never commit secrets to git
2. **Database Security**: Enable RLS on all tables
3. **API Keys**: Rotate keys regularly
4. **Access Control**: Implement proper user permissions
5. **Monitoring**: Set up error tracking and monitoring

## Next Steps

Once you've completed this setup:

1. **Test All Features**: Verify everything works as expected
2. **Add Content**: Upload your video library to Mega.nz
3. **Invite Users**: Create user accounts for your friends
4. **Monitor Performance**: Keep an eye on system performance
5. **Regular Backups**: Back up your database regularly

## Support Resources

- **Supabase Docs**: [docs.supabase.com](https://docs.supabase.com)
- **Mega.nz API**: [developers.mega.nz](https://developers.mega.nz)
- **Next.js Docs**: [nextjs.org/docs](https://nextjs.org/docs)
- **Project Issues**: Check GitHub issues for common problems

---

**Note**: This setup guide assumes you're starting with a fresh Supabase project. If you're migrating from an existing project, you'll need to adapt the steps accordingly.
