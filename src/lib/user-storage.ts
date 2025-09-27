import fs from 'fs';
import path from 'path';

// File-based user storage for testing (replace with database in production)
const STORAGE_FILE = path.join(process.cwd(), 'users.json');

interface User {
  id: string;
  walletAddress: string;
  userType: 'EMPLOYER' | 'EMPLOYEE';
  hasOnboarded: boolean;
  organizationName?: string;
  displayName?: string;
  createdAt: string;
}

class UserStorage {
  private loadUsers(): Map<string, User> {
    try {
      if (fs.existsSync(STORAGE_FILE)) {
        const data = fs.readFileSync(STORAGE_FILE, 'utf-8');
        const usersObj = JSON.parse(data);
        return new Map(Object.entries(usersObj));
      }
    } catch (error) {
      console.error('Error loading users:', error);
    }
    return new Map();
  }

  private saveUsers(users: Map<string, User>): void {
    try {
      const usersObj = Object.fromEntries(users);
      fs.writeFileSync(STORAGE_FILE, JSON.stringify(usersObj, null, 2));
    } catch (error) {
      console.error('Error saving users:', error);
    }
  }

  getUser(address: string): User | null {
    const users = this.loadUsers();
    return users.get(address.toLowerCase()) || null;
  }

  setUser(address: string, user: User): void {
    const users = this.loadUsers();
    users.set(address.toLowerCase(), user);
    this.saveUsers(users);
    console.log(`Stored user: ${user.userType} - ${address} ${user.organizationName ? `(${user.organizationName})` : ''}`);
  }

  hasUser(address: string): boolean {
    const users = this.loadUsers();
    return users.has(address.toLowerCase());
  }

  getAllUsers(): User[] {
    const users = this.loadUsers();
    return Array.from(users.values());
  }

  clearAll(): void {
    try {
      if (fs.existsSync(STORAGE_FILE)) {
        fs.unlinkSync(STORAGE_FILE);
      }
    } catch (error) {
      console.error('Error clearing users:', error);
    }
  }
}

// Create a singleton instance
export const userStorage = new UserStorage();
