'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';

import './login.css';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const result = await response.json();

      if (!response.ok) {
        setError(result.error ?? 'Đăng nhập thất bại.');
        return;
      }

      router.replace(result.role === 'admin' ? '/practice' : '/dashboard');
      router.refresh();
    } catch {
      setError('Không thể kết nối máy chủ. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="auth-screen">
      <section className="auth-panel" aria-labelledby="login-title">
        <Link href="/" className="auth-brand">lǎoshi.</Link>
        <p className="auth-kicker">KHÔNG GIAN HỌC TẬP</p>
        <h1 id="login-title">Chào mừng trở lại</h1>
        <p className="auth-copy">Đăng nhập để tiếp tục hành trình học tiếng Trung.</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            Tên đăng nhập
            <input
              autoComplete="username"
              name="username"
              required
              value={username}
              onChange={(event) => setUsername(event.target.value)}
            />
          </label>
          <label>
            Mật khẩu
            <input
              autoComplete="current-password"
              name="password"
              type="password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>
          {error && <p className="auth-error" role="alert">{error}</p>}
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>

        <Link href="/" className="auth-back">Quay lại trang chủ</Link>
      </section>
    </main>
  );
}
