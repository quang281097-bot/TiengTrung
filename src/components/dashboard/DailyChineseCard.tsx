import type { DailyChinese } from '../../data/dashboardData';

export default function DailyChineseCard({ item }: { item: DailyChinese }) {
  return (
    <section className="daily-card" aria-label="Daily Chinese phrase">
      <div className="daily-copy">
        <p className="section-label">🇨🇳 {item.title}</p>
        <h3>{item.sentence}</h3>
        <p className="daily-pinyin">{item.pinyin}</p>
        <p className="daily-meaning">{item.meaning}</p>
      </div>

      <div className="daily-actions">
        <button type="button" className="secondary-button">🔊 {item.audioLabel}</button>
        <button type="button" className="secondary-button">📚 {item.detailLabel}</button>
      </div>
    </section>
  );
}
