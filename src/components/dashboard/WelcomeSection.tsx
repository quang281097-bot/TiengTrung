export default function WelcomeSection() {
  return (
    <section className="welcome-panel" aria-label="Welcome section">
      <div className="welcome-copy">
        <p className="section-kicker">👋 Chào Quang!</p>
        <h2>Hôm nay học tiếng Trung nhé!</h2>
      </div>

      <div className="welcome-visual" aria-hidden="true">
        <div className="visual-card visual-card-main">你好</div>
        <div className="visual-card visual-card-small">Nǐ hǎo</div>
        <div className="visual-badge">+ 40 XP</div>
      </div>
    </section>
  );
}
