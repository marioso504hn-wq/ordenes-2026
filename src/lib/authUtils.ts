import { UserAccount, UserStatus } from '../types';
import { db, tx, id } from './instant';

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
 * Retrieves all registered users from local storage.
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
 * Merges InstantDB user accounts with local accounts.
 */
export function mergeUsersWithDb(dbUsers?: any[]): UserAccount[] {
  const localUsers = getRegisteredUsers();
  const map = new Map<string, UserAccount>();

  // Add default local users
  localUsers.forEach((u) => {
    map.set(u.name.toLowerCase(), u);
  });

  // Add/override with InstantDB users
  if (Array.isArray(dbUsers)) {
    dbUsers.forEach((u) => {
      if (u && u.name) {
        map.set(u.name.toLowerCase(), {
          id: u.id,
          name: u.name,
          email: u.email || `${u.name.toLowerCase()}@emdep.com`,
          password: u.password || '123',
          status: (u.status as UserStatus) || 'pending',
          role: u.role || 'user',
          verificationCode: u.verificationCode || '123456',
          createdAt: u.createdAt || Date.now(),
        });
      }
    });
  }

  // Ensure Mario is always present
  const mario = map.get('mario');
  if (!mario) {
    map.set('mario', DEFAULT_USERS[0]);
  } else {
    mario.password = 'marioso1318';
    mario.role = 'admin';
    mario.status = 'approved';
  }

  return Array.from(map.values());
}

/**
 * Saves users array to local storage cache.
 */
export function saveRegisteredUsers(users: UserAccount[]): void {
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
}

/**
 * Registers a new user account both in InstantDB (Realtime) and local storage.
 */
export function registerNewUser(
  name: string,
  email: string,
  password: string
): { user: UserAccount; verificationCode: string } {
  const cleanName = name.trim();
  const cleanEmail = email.trim() || `${cleanName.toLowerCase()}@emdep.com`;

  // Generate random 6-digit verification code
  const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
  const isMario = cleanName.toLowerCase() === 'mario';
  const newUserId = id();

  const newUser: UserAccount = {
    id: newUserId,
    name: cleanName,
    email: cleanEmail,
    password: password || '123',
    status: isMario ? 'approved' : 'pending',
    role: isMario ? 'admin' : 'user',
    verificationCode,
    createdAt: Date.now(),
  };

  // Sync to InstantDB so Mario receives it in real time across any device
  try {
    db.transact(
      tx.userAccounts[newUserId].update({
        name: newUser.name,
        email: newUser.email,
        password: newUser.password,
        status: newUser.status,
        role: newUser.role,
        verificationCode: newUser.verificationCode,
        createdAt: newUser.createdAt,
      })
    ).catch((err) => {
      console.error('InstantDB user transaction error:', err);
    });
  } catch (err) {
    console.error('InstantDB user transaction error:', err);
  }

  const local = getRegisteredUsers();
  saveRegisteredUsers([...local, newUser]);

  return { user: newUser, verificationCode };
}

/**
 * Updates a user's status (e.g., 'approved' | 'rejected' | 'pending') in InstantDB & local
 */
export function updateUserStatus(userId: string, newStatus: UserStatus): void {
  try {
    db.transact(
      tx.userAccounts[userId].update({
        status: newStatus,
      })
    ).catch((err) => {
      console.error('Failed to update status in InstantDB', err);
    });
  } catch (err) {
    console.error('Failed to update status in InstantDB', err);
  }

  const users = getRegisteredUsers();
  const updated = users.map((u) => {
    if (u.id === userId) {
      return { ...u, status: newStatus };
    }
    return u;
  });
  saveRegisteredUsers(updated);
}

/**
 * Permanently deletes a user from InstantDB & local storage
 */
export function deleteUserAccount(userId: string): void {
  try {
    db.transact(tx.userAccounts[userId].delete()).catch((err) => {
      console.error('Failed to delete user in InstantDB', err);
    });
  } catch (err) {
    console.error('Failed to delete user in InstantDB', err);
  }

  const users = getRegisteredUsers();
  const updated = users.filter((u) => u.id !== userId && u.name.toLowerCase() !== 'mario');
  saveRegisteredUsers(updated);
}

/**
 * Checks if a username corresponds to Super Admin Mario
 */
export function isSuperAdmin(userName: string | null): boolean {
  if (!userName) return false;
  return userName.trim().toLowerCase() === 'mario';
}
