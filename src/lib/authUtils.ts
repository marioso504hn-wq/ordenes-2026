import { UserAccount, UserStatus } from '../types';

const USERS_STORAGE_KEY = 'emdep_registered_users_v2';

// Default initial users
const DEFAULT_USERS: UserAccount[] = [
  {
    id: 'user-mario-admin',
    name: 'Mario',
    email: 'mario@emdep.com',
    password: 'marioso1318',
    status: 'approved',
    role: 'admin',
    verificationCode: '131826',
    createdAt: Date.now() - 30 * 86400000,
  },
  {
    id: 'user-gladys',
    name: 'Gladys',
    email: 'gladys@emdep.com',
    password: '123',
    status: 'approved',
    role: 'user',
    verificationCode: '882103',
    createdAt: Date.now() - 20 * 86400000,
  },
  {
    id: 'user-rolvin',
    name: 'Rolvin',
    email: 'rolvin@emdep.com',
    password: '123',
    status: 'approved',
    role: 'user',
    verificationCode: '912041',
    createdAt: Date.now() - 10 * 86400000,
  },
];

/**
 * Retrieves all registered users from storage.
 */
export function getRegisteredUsers(): UserAccount[] {
  try {
    const stored = localStorage.getItem(USERS_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Ensure Mario always exists with correct admin password
        const marioIndex = parsed.findIndex((u) => u.name.toLowerCase() === 'mario');
        if (marioIndex === -1) {
          parsed.unshift(DEFAULT_USERS[0]);
        } else {
          parsed[marioIndex].password = 'marioso1318';
          parsed[marioIndex].role = 'admin';
          parsed[marioIndex].status = 'approved';
        }
        return parsed;
      }
    }
  } catch {
    // fallback
  }
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(DEFAULT_USERS));
  return DEFAULT_USERS;
}

/**
 * Saves users array to storage.
 */
export function saveRegisteredUsers(users: UserAccount[]): void {
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
}

/**
 * Registers a new user account with 'pending' approval status and a verification code.
 */
export function registerNewUser(
  name: string,
  email: string,
  password: string
): { user: UserAccount; verificationCode: string } {
  const users = getRegisteredUsers();
  const cleanName = name.trim();
  const cleanEmail = email.trim();

  // Generate random 6-digit verification code
  const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

  const isMario = cleanName.toLowerCase() === 'mario';

  const newUser: UserAccount = {
    id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    name: cleanName,
    email: cleanEmail || `${cleanName.toLowerCase()}@emdep.com`,
    password: password || '123',
    status: isMario ? 'approved' : 'pending', // Mario is auto approved, others require Mario's approval
    role: isMario ? 'admin' : 'user',
    verificationCode,
    createdAt: Date.now(),
  };

  const updatedUsers = [...users, newUser];
  saveRegisteredUsers(updatedUsers);

  return { user: newUser, verificationCode };
}

/**
 * Updates a user's status (e.g., 'approved' | 'rejected' | 'pending')
 */
export function updateUserStatus(userId: string, newStatus: UserStatus): UserAccount[] {
  const users = getRegisteredUsers();
  const updated = users.map((u) => {
    if (u.id === userId) {
      return { ...u, status: newStatus };
    }
    return u;
  });
  saveRegisteredUsers(updated);
  return updated;
}

/**
 * Permanently deletes a user from the system
 */
export function deleteUserAccount(userId: string): UserAccount[] {
  const users = getRegisteredUsers();
  const updated = users.filter((u) => u.id !== userId && u.name.toLowerCase() !== 'mario');
  saveRegisteredUsers(updated);
  return updated;
}

/**
 * Checks if a username corresponds to Super Admin Mario
 */
export function isSuperAdmin(userName: string | null): boolean {
  if (!userName) return false;
  return userName.trim().toLowerCase() === 'mario';
}
