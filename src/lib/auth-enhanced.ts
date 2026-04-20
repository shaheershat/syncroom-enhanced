import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    maxSessionTime: 2 * 24 * 60 * 60, // 2 days in seconds
    detectSessionInUrl: false,
    flowType: 'pkce'
  }
})

export interface User {
  id: string
  username: string
  name: string
  email?: string
  role: 'admin' | 'user'
  avatar_url?: string
  is_online: boolean
  last_active: string
  preferences: Record<string, any>
}

export interface AuthResult {
  success: boolean
  user?: User
  error?: string
}

export async function authenticateUser(username: string, accessCode: string): Promise<AuthResult> {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username.toLowerCase())
      .eq('access_code', accessCode)
      .single()

    if (error || !user) {
      return { success: false, error: 'Invalid username or access code' }
    }

    // Update last active and online status
    await supabase
      .from('users')
      .update({
        last_active: new Date().toISOString(),
        is_online: true
      })
      .eq('id', user.id)

    // Store user session in a secure cookie
    const sessionData = {
      userId: user.id,
      username: user.username,
      role: user.role,
      loginTime: new Date().toISOString()
    }

    // In a real app, you'd want to encrypt this data
    const cookieStore = await cookies()
    cookieStore.set('syncroom_session', JSON.stringify(sessionData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 2 * 24 * 60 * 60 // 2 days
    })

    return { 
      success: true, 
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role as 'admin' | 'user',
        avatar_url: user.avatar_url,
        is_online: user.is_online,
        last_active: user.last_active,
        preferences: user.preferences
      }
    }
  } catch (error) {
    console.error('Authentication error:', error)
    return { success: false, error: 'Authentication failed' }
  }
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('syncroom_session')
    
    if (!sessionCookie) {
      return null
    }

    const sessionData = JSON.parse(sessionCookie.value)
    
    // Check if session is still valid (2 days)
    const loginTime = new Date(sessionData.loginTime)
    const now = new Date()
    const diffInHours = (now.getTime() - loginTime.getTime()) / (1000 * 60 * 60)
    
    if (diffInHours > 48) {
      // Session expired
      cookieStore.delete('syncroom_session')
      return null
    }

    // Get fresh user data from database
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', sessionData.userId)
      .single()

    if (error || !user) {
      cookieStore.delete('syncroom_session')
      return null
    }

    return {
      id: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
      role: user.role as 'admin' | 'user',
      avatar_url: user.avatar_url,
      is_online: user.is_online,
      last_active: user.last_active,
      preferences: user.preferences
    }
  } catch (error) {
    console.error('Session validation error:', error)
    return null
  }
}

export async function logoutUser(): Promise<void> {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('syncroom_session')
    
    if (sessionCookie) {
      const sessionData = JSON.parse(sessionCookie.value)
      
      // Update user offline status
      await supabase
        .from('users')
        .update({ is_online: false })
        .eq('id', sessionData.userId)
      
      cookieStore.delete('syncroom_session')
    }
  } catch (error) {
    console.error('Logout error:', error)
  }
}

export async function isAdmin(userId: string): Promise<boolean> {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single()

    return !error && user?.role === 'admin'
  } catch (error) {
    console.error('Admin check error:', error)
    return false
  }
}

export async function requireAuth(): Promise<User> {
  const user = await getCurrentUser()
  
  if (!user) {
    throw new Error('Authentication required')
  }
  
  return user
}

export async function requireAdmin(): Promise<User> {
  const user = await getCurrentUser()
  
  if (!user) {
    throw new Error('Authentication required')
  }
  
  if (user.role !== 'admin') {
    throw new Error('Admin access required')
  }
  
  return user
}
