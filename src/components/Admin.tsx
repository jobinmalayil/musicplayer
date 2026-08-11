import { useEffect, useState, type FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import { addUser, listUsers, removeUser, type PublicUser, type Role } from '../lib/auth';
import { PersonIcon, PlusIcon, ShieldIcon, TrashIcon } from './icons';
import { UploadSongs } from './UploadSongs';

export function Admin() {
  const { username: currentUsername } = useAuth();
  const [users, setUsers] = useState<PublicUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<Role>('user');
  const [adding, setAdding] = useState(false);

  const refresh = () => {
    setLoading(true);
    listUsers()
      .then(({ users }) => setUsers(users))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load users'))
      .finally(() => setLoading(false));
  };

  useEffect(refresh, []);

  const handleAdd = (e: FormEvent) => {
    e.preventDefault();
    setAdding(true);
    setError(null);
    addUser(newUsername.trim(), newPassword, newRole)
      .then(({ users }) => {
        setUsers(users);
        setNewUsername('');
        setNewPassword('');
        setNewRole('user');
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to add user'))
      .finally(() => setAdding(false));
  };

  const handleRemove = (username: string) => {
    setError(null);
    removeUser(username)
      .then(({ users }) => setUsers(users))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to remove user'));
  };

  return (
    <div className="library">
      <h1 className="home-greeting">Admin</h1>

      <UploadSongs />

      <h2 className="home-section-title">Manage access</h2>
      <p className="hint-text">Add usernames and passwords for people you want to have access.</p>

      <form className="admin-add-form" onSubmit={handleAdd}>
        <input
          type="text"
          placeholder="Username"
          autoComplete="off"
          value={newUsername}
          onChange={(e) => setNewUsername(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          autoComplete="new-password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
        <div className="admin-role-row">
          <label className={`admin-role-pill ${newRole === 'user' ? 'active' : ''}`}>
            <input type="radio" name="role" checked={newRole === 'user'} onChange={() => setNewRole('user')} />
            Member
          </label>
          <label className={`admin-role-pill ${newRole === 'admin' ? 'active' : ''}`}>
            <input type="radio" name="role" checked={newRole === 'admin'} onChange={() => setNewRole('admin')} />
            Admin
          </label>
        </div>
        <button className="btn-primary" type="submit" disabled={adding || !newUsername.trim() || !newPassword}>
          <PlusIcon size={18} /> {adding ? 'Adding…' : 'Add user'}
        </button>
      </form>

      {error && <p className="error-text">{error}</p>}
      {loading && <p className="hint-text">Loading…</p>}

      {!loading && (
        <ul className="item-list">
          {users.map((u) => (
            <li key={u.username}>
              <div className="item-row admin-user-row">
                <span className="item-icon">{u.role === 'admin' ? <ShieldIcon size={18} /> : <PersonIcon size={18} />}</span>
                <span className="item-name">
                  {u.username}
                  {u.username === currentUsername && ' (you)'}
                </span>
                <span className="admin-role-badge">{u.role}</span>
                <button
                  className="icon-btn"
                  onClick={() => handleRemove(u.username)}
                  aria-label={`Remove ${u.username}`}
                >
                  <TrashIcon size={18} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
