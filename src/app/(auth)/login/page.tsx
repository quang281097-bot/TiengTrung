import Link from 'next/link';

export default function LoginPage() {
  return <main className="home"><div className="hero"><div className="eyebrow">Welcome back</div><h1>Keep your Chinese practice moving.</h1><p className="intro">Sign in to continue your learning journey.</p><div className="actions"><Link className="button" href="/dashboard">Continue to dashboard</Link><Link className="button secondary" href="/">Back home</Link></div></div></main>;
}
