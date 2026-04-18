# Environment Variables Setup

## Required Environment Variables for Netlify Deployment

Add these environment variables in your Netlify dashboard under Site settings > Environment variables:

### Supabase Configuration
- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous key

### Cloudinary Configuration (for image uploads)
- `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`: Your Cloudinary cloud name
- `NEXT_PUBLIC_CLOUDINARY_API_KEY`: Your Cloudinary API key

### Application URL
- `NEXT_PUBLIC_APP_URL`: Your Netlify site URL (e.g., https://your-site.netlify.app)

## How to Get These Values

### Supabase
1. Go to your Supabase project dashboard
2. Settings > API
3. Copy the Project URL and anon public key

### Cloudinary
1. Go to your Cloudinary dashboard
2. Copy your Cloud name from the dashboard
3. Go to Settings > API Keys > Security
4. Copy your API Key

### Netlify URL
1. After deploying, your site URL will be provided by Netlify
2. Update the NEXT_PUBLIC_APP_URL environment variable
