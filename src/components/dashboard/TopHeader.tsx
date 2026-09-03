import { userProfile } from '../../data/dashboardData';

export default function TopHeader() {
  return (
    <header className="topbar">
      <div className="greeting-wrap">
        <p className="eyebrow">👋 Chào Quang!</p>
        <h1 className="greeting-title">Hôm nay học tiếng Trung nhé!</h1>
      </div>

      <div className="topbar-actions">
        <div className="pill-badge pill-fire">
          <span className="pill-icon">🔥</span>
          <span>{userProfile.streak} ngày</span>
        </div>
        <div className="pill-badge pill-xp">
          <span className="pill-icon">⭐</span>
          <span>{userProfile.xp.toLocaleString()} XP</span>
        </div>

        <div className="user-chip">
          <div className="avatar">Q</div>
          <div>
            <p className="user-name">{userProfile.name}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
