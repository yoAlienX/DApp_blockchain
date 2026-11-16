const USERS_KEY = 'sealmark_users_v2';
const SESSION_KEY = 'sealmark_session_v1';
const LOGIN_ATTEMPTS_KEY = 'sealmark_login_attempts_v1';
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MS = 30_000;
const PBKDF2_ITERATIONS = 100_000;

export const AVATAR_COLORS = [
  { id: 'indigo', label: 'Indigo', bg: 'from-indigo-500 to-violet-600' },
  { id: 'emerald', label: 'Emerald', bg: 'from-emerald-500 to-teal-600' },
  { id: 'sky', label: 'Sky', bg: 'from-sky-500 to-blue-600' },
  { id: 'amber', label: 'Amber', bg: 'from-amber-500 to-orange-600' },
  { id: 'rose', label: 'Rose', bg: 'from-rose-500 to-pink-600' },
  { id: 'slate', label: 'Slate', bg: 'from-slate-600 to-slate-800' }
];

export const AVATAR_ICONS = ['shield', 'landmark', 'graduation', 'briefcase', 'file', 'user'];
export const ALLOWED_AVATAR_MIMES = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif']);

export function isSafeRasterDataUrl(value) {
  return typeof value === 'string' && /^data:image\/(png|jpeg|jpg|webp|gif);base64,[a-z0-9+/=]+$/i.test(value);
}

function toHex(bytes) {
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
}

function fromHex(hex) {
  if (typeof hex !== 'string' || !/^[\da-f]+$/i.test(hex) || hex.length % 2 !== 0) return null;
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i += 1) {
    out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

function constantTimeEqualHex(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

function requireCrypto() {
  if (!globalThis.crypto?.subtle || !globalThis.crypto?.getRandomValues) {
    throw new Error('Secure Web Crypto API requires HTTPS or localhost.');
  }
}

export async function hashPassword(password) {
  requireCrypto();
  const salt = globalThis.crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await globalThis.crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  const derived = await globalThis.crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    keyMaterial,
    256
  );
  return `pbkdf2$${toHex(salt)}$${toHex(new Uint8Array(derived))}`;
}

export async function verifyPassword(password, storedHash) {
  if (typeof storedHash !== 'string' || !storedHash.startsWith('pbkdf2$')) return false;
  const parts = storedHash.split('$');
  if (parts.length !== 3) return false;
  const salt = fromHex(parts[1]);
  const expectedHex = parts[2];
  if (!salt || !/^[\da-f]{64}$/i.test(expectedHex)) return false;

  requireCrypto();
  const keyMaterial = await globalThis.crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  const derived = await globalThis.crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    keyMaterial,
    256
  );
  return constantTimeEqualHex(toHex(new Uint8Array(derived)), expectedHex);
}

function sanitizeAvatar(raw) {
  const src = raw && typeof raw === 'object' ? raw : {};
  const style = ['icon', 'initials', 'image'].includes(src.style) ? src.style : 'icon';
  const color = AVATAR_COLORS.some(c => c.id === src.color) ? src.color : 'indigo';
  const icon = AVATAR_ICONS.includes(src.icon) ? src.icon : 'user';
  const initials = typeof src.initials === 'string' ? src.initials.slice(0, 2).toUpperCase() : 'U';
  const imageUrl = style === 'image' && isSafeRasterDataUrl(src.imageUrl) ? src.imageUrl : '';
  return {
    style: style === 'image' && !imageUrl ? 'icon' : style,
    icon,
    color,
    initials,
    imageUrl
  };
}

function sanitizeUser(entry) {
  if (!entry || typeof entry !== 'object') return null;
  if (typeof entry.id !== 'string' || typeof entry.email !== 'string' || typeof entry.passwordHash !== 'string') return null;
  return {
    id: entry.id.slice(0, 64),
    email: entry.email.slice(0, 160),
    passwordHash: entry.passwordHash,
    role: entry.role === 'admin' ? 'admin' : 'user',
    name: typeof entry.name === 'string' ? entry.name.slice(0, 80) : 'User',
    organization: typeof entry.organization === 'string' ? entry.organization.slice(0, 100) : '',
    bio: typeof entry.bio === 'string' ? entry.bio.slice(0, 300) : '',
    avatar: sanitizeAvatar(entry.avatar),
    lastPath: typeof entry.lastPath === 'string' && entry.lastPath.startsWith('/') ? entry.lastPath : '/verify',
    lastAction: typeof entry.lastAction === 'string' ? entry.lastAction.slice(0, 80) : '',
    lastSeenAt: typeof entry.lastSeenAt === 'string' ? entry.lastSeenAt : null
  };
}

async function seedDefaultUsers() {
  const [userHash, adminHash] = await Promise.all([
    hashPassword('User@123'),
    hashPassword('Admin@123')
  ]);
  return [
    {
      id: 'user-demo',
      email: 'user@sealmark.org',
      passwordHash: userHash,
      role: 'user',
      name: 'Aarav Nair',
      organization: 'Citizen Verifier',
      bio: 'Verifying academic certificates and civic records on Sepolia.',
      avatar: { style: 'icon', icon: 'user', color: 'sky', initials: 'AN', imageUrl: '' },
      lastPath: '/verify',
      lastAction: 'Document Verification',
      lastSeenAt: null
    },
    {
      id: 'admin-demo',
      email: 'admin@sealmark.org',
      passwordHash: adminHash,
      role: 'admin',
      name: 'Dr. Meera Krishnan',
      organization: 'State Academic & Records Authority',
      bio: 'Authorized issuing officer managing official Sepolia document seals.',
      avatar: { style: 'icon', icon: 'landmark', color: 'indigo', initials: 'MK', imageUrl: '' },
      lastPath: '/admin',
      lastAction: 'Authority Issuance Portal',
      lastSeenAt: null
    }
  ];
}

export async function loadUsers() {
  try {
    const raw = window.localStorage.getItem(USERS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const clean = parsed.map(sanitizeUser).filter(Boolean);
        if (clean.length > 0) return clean;
      }
    }
  } catch {
    // Fallback to seeded users
  }
  const seeded = await seedDefaultUsers();
  saveUsers(seeded);
  return seeded;
}

export function saveUsers(users) {
  try {
    window.localStorage.setItem(USERS_KEY, JSON.stringify(users));
  } catch {
    // Ignore storage quota issues
  }
}

export function loadSessionUserId() {
  try {
    return window.localStorage.getItem(SESSION_KEY) || '';
  } catch {
    return '';
  }
}

export function saveSessionUserId(userId) {
  try {
    if (userId) window.localStorage.setItem(SESSION_KEY, userId);
    else window.localStorage.removeItem(SESSION_KEY);
  } catch {
    // Ignore storage errors
  }
}

function readAttempts() {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(LOGIN_ATTEMPTS_KEY) || '{}');
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function checkLoginThrottle(email) {
  const key = (email || '').trim().toLowerCase();
  const entry = readAttempts()[key];
  if (entry?.lockedUntil && entry.lockedUntil > Date.now()) {
    const seconds = Math.ceil((entry.lockedUntil - Date.now()) / 1000);
    throw new Error(`Too many failed sign-in attempts. Try again in ${seconds} seconds.`);
  }
}

export function recordFailedLogin(email) {
  const key = (email || '').trim().toLowerCase();
  if (!key) return;
  const attempts = readAttempts();
  const current = attempts[key] || { count: 0, lockedUntil: 0 };
  const nextCount = current.count + 1;
  attempts[key] = nextCount >= MAX_FAILED_ATTEMPTS
    ? { count: 0, lockedUntil: Date.now() + LOCKOUT_MS }
    : { count: nextCount, lockedUntil: 0 };
  try {
    window.localStorage.setItem(LOGIN_ATTEMPTS_KEY, JSON.stringify(attempts));
  } catch {
    // Ignore storage errors
  }
}

export function clearLoginFailures(email) {
  const key = (email || '').trim().toLowerCase();
  if (!key) return;
  const attempts = readAttempts();
  if (attempts[key]) {
    delete attempts[key];
    try {
      window.localStorage.setItem(LOGIN_ATTEMPTS_KEY, JSON.stringify(attempts));
    } catch {
      // Ignore storage errors
    }
  }
}
