'use server'
import { authenticateUser as _auth, logoutUser as _logout } from './auth-enhanced'
import type { AuthResult } from './auth-enhanced'

export async function authenticateUser(username: string, accessCode: string): Promise<AuthResult> {
  return _auth(username, accessCode)
}

export async function logoutUser(): Promise<void> {
  return _logout()
}
