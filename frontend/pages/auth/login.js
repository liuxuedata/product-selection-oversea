import { useState } from 'react';

export default function Login() {
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.username || !form.password) {
      setError('Username and password required');
      return;
    }
    try {
      const res = await fetch('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.message || 'Login failed');
      } else {
        setError('');
        // handle success
      }
    } catch (err) {
      setError('Network error');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <p style={{color: 'red'}}>{error}</p>}
      <div>
        <label>Username</label>
        <input name="username" value={form.username} onChange={handleChange} />
      </div>
      <div>
        <label>Password</label>
        <input name="password" type="password" value={form.password} onChange={handleChange} />
      </div>
      <button type="submit">Login</button>
    </form>
  );
}
