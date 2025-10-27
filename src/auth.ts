// Authentication utilities
import bcrypt from 'bcryptjs';

export interface User {
  id: number;
  employee_code: string;
  employee_name: string;
  designation?: string;
  department?: string;
}

export interface Session {
  user: User;
  token: string;
  expiresAt: Date;
}

// Hash password
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

// Verify password
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Generate session token
export function generateToken(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Create session (7 days validity)
export function createSession(user: User): Session {
  const token = generateToken();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);
  
  return {
    user,
    token,
    expiresAt
  };
}

// Verify session token from database
export async function verifySession(db: D1Database, token: string): Promise<User | null> {
  const result = await db.prepare(`
    SELECT u.id, u.employee_code, u.employee_name, u.designation, u.department
    FROM sessions s
    JOIN users u ON s.user_id = u.id
    WHERE s.session_token = ? AND s.expires_at > datetime('now')
  `).bind(token).first();
  
  if (!result) return null;
  
  return {
    id: result.id as number,
    employee_code: result.employee_code as string,
    employee_name: result.employee_name as string,
    designation: result.designation as string | undefined,
    department: result.department as string | undefined
  };
}
