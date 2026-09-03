import type { FooterLink } from '../../data/dashboardData';

export default function Footer({ links }: { links: FooterLink[] }) {
  return (
    <footer className="site-footer">
      <div>
        <p className="footer-brand">Trung Hoa</p>
        <p className="footer-tagline">Học tiếng Trung dễ hơn mỗi ngày.</p>
      </div>

      <nav className="footer-links" aria-label="Footer links">
        {links.map((link) => (
          <a key={link.label} href={link.href}>
            {link.label}
          </a>
        ))}
      </nav>
    </footer>
  );
}
