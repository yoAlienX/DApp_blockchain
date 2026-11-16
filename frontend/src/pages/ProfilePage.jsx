import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { KeyRound, LogOut, Palette, Save, Upload, User } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useWallet } from '../hooks/useWallet';
import { ALLOWED_AVATAR_MIMES, AVATAR_COLORS, AVATAR_ICONS, isSafeRasterDataUrl } from '../lib/authStorage';
import UserAvatar from '../components/UserAvatar';
import { InlineError, StatusBadge, Toast } from '../components';

export default function ProfilePage() {
  const auth = useAuth();
  const wallet = useWallet();
  const navigate = useNavigate();
  const imageInput = useRef(null);

  const user = auth.user;
  const [name, setName] = useState(user?.name || '');
  const [organization, setOrganization] = useState(user?.organization || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [avatar, setAvatar] = useState(user?.avatar || { style: 'icon', icon: 'user', color: 'indigo', initials: 'U', imageUrl: '' });
  const [profileMsg, setProfileMsg] = useState('');
  const [profileErr, setProfileErr] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passMsg, setPassMsg] = useState('');
  const [passErr, setPassErr] = useState('');

  if (!user) {
    return (
      <div className="mx-auto max-w-xl card text-center">
        <User className="mx-auto text-indigo-600 dark:text-indigo-400" size={32} aria-hidden="true" />
        <h1 className="mt-3 text-2xl">Sign in to view your profile</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          Customize your avatar, update your organization details, reset your password, and save your session checkpoint.
        </p>
        <Link to="/login" state={{ from: '/profile' }} className="button-primary mt-5">
          Go to Sign In
        </Link>
      </div>
    );
  }

  const handleSaveProfile = event => {
    event.preventDefault();
    setProfileErr('');
    setProfileMsg('');
    try {
      if (!name.trim()) throw new Error('Display name cannot be empty.');
      auth.updateProfile({ name, organization, bio, avatar });
      setProfileMsg('Profile and avatar updated.');
    } catch (err) {
      setProfileErr(err.message);
    }
  };

  const handleAvatarUpload = event => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!ALLOWED_AVATAR_MIMES.has(file.type)) {
      setProfileErr('Avatar must be a PNG, JPEG, WebP, or GIF image (SVG is not allowed).');
      return;
    }
    if (file.size > 512 * 1024) {
      setProfileErr('Avatar image must be 512 KB or smaller.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string' && isSafeRasterDataUrl(reader.result)) {
        setAvatar(prev => ({ ...prev, style: 'image', imageUrl: reader.result }));
        setProfileErr('');
      } else {
        setProfileErr('Unsupported or malformed image file.');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleResetPassword = async event => {
    event.preventDefault();
    setPassErr('');
    setPassMsg('');
    try {
      if (newPassword !== confirmPassword) throw new Error('New passwords do not match.');
      await auth.resetPassword({ currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPassMsg('Password updated successfully.');
    } catch (err) {
      setPassErr(err.message);
    }
  };

  const handleLogout = () => {
    auth.logout();
    navigate('/login');
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="eyebrow">Account Settings</p>
          <h1 className="mt-2">Your profile</h1>
          <p className="lead">Personalize your avatar, edit profile details, or reset your password.</p>
        </div>

        <button type="button" onClick={handleLogout} className="button-secondary">
          <LogOut size={15} aria-hidden="true" />
          Log out (save progress)
        </button>
      </div>

      {/* Identity Overview */}
      <section className="card flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <UserAvatar avatar={avatar} name={name || user.name} size="lg" />
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">{name || user.name}</h2>
              <StatusBadge kind={user.role === 'admin' ? 'info' : 'verified'}>
                {user.role === 'admin' ? 'Authority Admin' : 'Standard User'}
              </StatusBadge>
            </div>
            <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-400">{user.email}</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Last saved checkpoint: <span className="font-medium text-slate-700 dark:text-slate-300">{user.lastAction || user.lastPath}</span>
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs dark:border-slate-700 dark:bg-slate-800/60">
          <p className="font-medium text-slate-500 dark:text-slate-400">Linked MetaMask Wallet</p>
          <p className="mt-1 font-mono font-semibold text-slate-800 dark:text-slate-200">
            {wallet.account ? `${wallet.account.slice(0, 8)}…${wallet.account.slice(-6)}` : 'Not connected'}
          </p>
        </div>
      </section>

      <div className="grid items-start gap-6 lg:grid-cols-2">
        {/* Profile & Avatar Customization */}
        <section className="card">
          <div className="flex items-center gap-2">
            <Palette size={19} className="text-indigo-600 dark:text-indigo-400" aria-hidden="true" />
            <h2>Personalize profile &amp; avatar</h2>
          </div>

          <form onSubmit={handleSaveProfile} className="mt-5 space-y-5">
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-700 dark:bg-slate-800/40">
              <p className="label">Avatar style</p>
              <div className="flex flex-wrap gap-2">
                {['icon', 'initials'].map(style => (
                  <button
                    key={style}
                    type="button"
                    onClick={() => setAvatar(prev => ({ ...prev, style }))}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition-colors ${
                      avatar.style === style
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700'
                    }`}
                  >
                    {style}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => imageInput.current?.click()}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700"
                >
                  <Upload size={13} aria-hidden="true" />
                  Upload image
                </button>
                <input ref={imageInput} type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="hidden" onChange={handleAvatarUpload} />
              </div>

              {avatar.style === 'icon' && (
                <div className="mt-4">
                  <p className="label">Badge icon</p>
                  <div className="flex flex-wrap gap-2">
                    {AVATAR_ICONS.map(icon => (
                      <button
                        key={icon}
                        type="button"
                        onClick={() => setAvatar(prev => ({ ...prev, icon }))}
                        className={`rounded-lg px-2.5 py-1 text-xs font-medium capitalize ${
                          avatar.icon === icon
                            ? 'bg-indigo-100 text-indigo-800 ring-1 ring-indigo-300 dark:bg-indigo-950 dark:text-indigo-200'
                            : 'bg-white text-slate-600 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:ring-slate-700'
                        }`}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {avatar.style === 'initials' && (
                <div className="mt-4">
                  <label htmlFor="avatar-initials" className="label block">Initials (2 letters)</label>
                  <input
                    id="avatar-initials"
                    maxLength={2}
                    value={avatar.initials || ''}
                    onChange={e => setAvatar(prev => ({ ...prev, initials: e.target.value.toUpperCase() }))}
                    className="w-24 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-center font-semibold uppercase dark:border-slate-700 dark:bg-slate-950"
                  />
                </div>
              )}

              {avatar.style !== 'image' && (
                <div className="mt-4">
                  <p className="label">Accent gradient</p>
                  <div className="flex flex-wrap gap-2">
                    {AVATAR_COLORS.map(color => (
                      <button
                        key={color.id}
                        type="button"
                        aria-label={`Color ${color.label}`}
                        onClick={() => setAvatar(prev => ({ ...prev, color: color.id }))}
                        className={`h-7 w-7 rounded-full bg-gradient-to-br ${color.bg} ${
                          avatar.color === color.id ? 'ring-2 ring-indigo-600 ring-offset-2 dark:ring-offset-slate-900' : ''
                        }`}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="profile-name" className="label block">Display name</label>
              <input
                id="profile-name"
                type="text"
                required
                maxLength={80}
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-950"
              />
            </div>

            <div>
              <label htmlFor="profile-org" className="label block">Organization / Department</label>
              <input
                id="profile-org"
                type="text"
                maxLength={100}
                value={organization}
                onChange={e => setOrganization(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-950"
              />
            </div>

            <div>
              <label htmlFor="profile-bio" className="label block">Bio / Role description</label>
              <textarea
                id="profile-bio"
                rows={3}
                maxLength={300}
                value={bio}
                onChange={e => setBio(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-950"
              />
            </div>

            <InlineError>{profileErr}</InlineError>
            <Toast message={profileMsg} />

            <button type="submit" className="button-primary w-full">
              <Save size={15} aria-hidden="true" />
              Save profile changes
            </button>
          </form>
        </section>

        {/* Password Reset */}
        <section className="card">
          <div className="flex items-center gap-2">
            <KeyRound size={19} className="text-indigo-600 dark:text-indigo-400" aria-hidden="true" />
            <h2>Reset password</h2>
          </div>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Update your local account password. Passwords are stored as SHA-256 hashes.
          </p>

          <form onSubmit={handleResetPassword} className="mt-5 space-y-4">
            <div>
              <label htmlFor="curr-pass" className="label block">Current password</label>
              <input
                id="curr-pass"
                type="password"
                required
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-950"
              />
            </div>

            <div>
              <label htmlFor="new-pass" className="label block">New password (min 8 characters)</label>
              <input
                id="new-pass"
                type="password"
                required
                minLength={8}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-950"
              />
            </div>

            <div>
              <label htmlFor="confirm-pass" className="label block">Confirm new password</label>
              <input
                id="confirm-pass"
                type="password"
                required
                minLength={8}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-950"
              />
            </div>

            <InlineError>{passErr}</InlineError>
            <Toast message={passMsg} />

            <button type="submit" className="button-secondary w-full">
              Update password
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
