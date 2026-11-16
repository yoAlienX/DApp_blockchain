import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  checkLoginThrottle,
  clearLoginFailures,
  hashPassword,
  isSafeRasterDataUrl,
  loadSessionUserId,
  loadUsers,
  recordFailedLogin,
  saveSessionUserId,
  saveUsers,
  verifyPassword
} from '../lib/authStorage';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [users, setUsers] = useState([]);
  const [userId, setUserId] = useState(() => loadSessionUserId());
  const [ready, setReady] = useState(false);
  const [resumeBanner, setResumeBanner] = useState('');

  useEffect(() => {
    let active = true;
    loadUsers().then(loaded => {
      if (!active) return;
      setUsers(loaded);
      setReady(true);
    });
    return () => { active = false; };
  }, []);

  const user = users.find(entry => entry.id === userId) || null;

  const persistUsers = useCallback(updater => {
    setUsers(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      saveUsers(next);
      return next;
    });
  }, []);

  const login = async ({ email, password }) => {
    const normalizedEmail = (email || '').trim().toLowerCase();
    checkLoginThrottle(normalizedEmail);

    const currentUsers = users.length ? users : await loadUsers();
    const matched = currentUsers.find(entry => entry.email.toLowerCase() === normalizedEmail);
    const valid = matched ? await verifyPassword(password || '', matched.passwordHash) : false;
    if (!matched || !valid) {
      recordFailedLogin(normalizedEmail);
      throw new Error('Invalid email or password.');
    }

    clearLoginFailures(normalizedEmail);
    saveSessionUserId(matched.id);
    setUserId(matched.id);
    if (matched.lastPath && matched.lastSeenAt) {
      setResumeBanner(`Welcome back, ${matched.name}. Resumed at ${matched.lastAction || matched.lastPath}.`);
    } else {
      setResumeBanner('');
    }
    return matched;
  };

  const register = async ({ name, email, password, organization = '' }) => {
    const normalizedEmail = (email || '').trim().toLowerCase();
    const cleanName = (name || '').trim().slice(0, 80);
    if (!cleanName) throw new Error('Enter your full name.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) throw new Error('Enter a valid email address.');
    if (!password || password.length < 8) throw new Error('Password must be at least 8 characters.');

    const currentUsers = users.length ? users : await loadUsers();
    if (currentUsers.some(entry => entry.email.toLowerCase() === normalizedEmail)) {
      throw new Error('An account with this email already exists.');
    }

    const passwordHash = await hashPassword(password);
    const initials = cleanName.split(/\s+/).slice(0, 2).map(part => part[0]?.toUpperCase() || '').join('') || 'U';
    // Public registration strictly creates Standard User accounts to prevent privilege escalation.
    const newUser = {
      id: `acct-${Date.now()}`,
      email: normalizedEmail.slice(0, 160),
      passwordHash,
      role: 'user',
      name: cleanName,
      organization: organization.trim().slice(0, 100) || 'Independent Verifier',
      bio: '',
      avatar: { style: 'initials', icon: 'user', color: 'emerald', initials, imageUrl: '' },
      lastPath: '/verify',
      lastAction: 'Document Verification',
      lastSeenAt: null
    };

    const updated = [...currentUsers, newUser];
    saveUsers(updated);
    setUsers(updated);
    saveSessionUserId(newUser.id);
    setUserId(newUser.id);
    setResumeBanner('');
    return newUser;
  };

  const logout = () => {
    if (user) {
      persistUsers(prev => prev.map(entry =>
        entry.id === user.id ? { ...entry, lastSeenAt: new Date().toISOString() } : entry
      ));
    }
    saveSessionUserId('');
    setUserId('');
    setResumeBanner('');
  };

  const recordProgress = useCallback((path, actionLabel) => {
    if (!userId) return;
    if (['/login', '/'].includes(path)) return;
    setUsers(prev => {
      const target = prev.find(entry => entry.id === userId);
      if (!target || (target.lastPath === path && target.lastAction === actionLabel)) return prev;
      const next = prev.map(entry =>
        entry.id === userId
          ? { ...entry, lastPath: path, lastAction: actionLabel, lastSeenAt: new Date().toISOString() }
          : entry
      );
      saveUsers(next);
      return next;
    });
  }, [userId]);

  const updateProfile = updates => {
    if (!user) throw new Error('Sign in to update your profile.');
    persistUsers(prev => prev.map(entry => {
      if (entry.id !== user.id) return entry;
      const nextAvatar = updates.avatar ? { ...entry.avatar, ...updates.avatar } : entry.avatar;
      if (nextAvatar.style === 'image' && !isSafeRasterDataUrl(nextAvatar.imageUrl)) {
        nextAvatar.style = 'icon';
        nextAvatar.imageUrl = '';
      }
      return {
        ...entry,
        name: updates.name?.trim().slice(0, 80) || entry.name,
        organization: updates.organization !== undefined ? updates.organization.trim().slice(0, 100) : entry.organization,
        bio: updates.bio !== undefined ? updates.bio.trim().slice(0, 300) : entry.bio,
        avatar: nextAvatar
      };
    }));
  };

  const resetPassword = async ({ currentPassword, newPassword }) => {
    if (!user) throw new Error('Sign in to change your password.');
    if (!newPassword || newPassword.length < 8) throw new Error('New password must be at least 8 characters.');
    const valid = await verifyPassword(currentPassword || '', user.passwordHash);
    if (!valid) throw new Error('Current password is incorrect.');
    const nextHash = await hashPassword(newPassword);
    persistUsers(prev => prev.map(entry =>
      entry.id === user.id ? { ...entry, passwordHash: nextHash } : entry
    ));
  };

  const value = {
    ready,
    user,
    isLoggedIn: Boolean(user),
    isAdmin: user?.role === 'admin',
    isStandardUser: user?.role === 'user',
    resumeBanner,
    clearResumeBanner: () => setResumeBanner(''),
    login,
    register,
    logout,
    recordProgress,
    updateProfile,
    resetPassword
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth requires AuthProvider.');
  return ctx;
}
