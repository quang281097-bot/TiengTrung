import StatsCard from '../../../components/dashboard/StatsCard';
import PracticeHeader from '../../../components/practice/PracticeHeader';
import ReviewSession from '../../../components/practice/ReviewSession';
import { reviewCards, reviewDecks, reviewForecast, reviewStats } from '../../../data/practiceData';

export const metadata = { title: 'Ôn tập' };

export default function ReviewPage() {
  const maxForecast = Math.max(...reviewForecast.map((d) => d.count));

  return (
    <>
      <PracticeHeader
        eyebrow="Ôn tập"
        title={`Ôn lại ${reviewCards.length} từ đến hạn hôm nay`}
        description="Ôn đúng lúc sắp quên giúp bạn nhớ lâu hơn. Lật thẻ, tự chấm mức độ nhớ, hệ thống sẽ hẹn lịch ôn lại."
        aside={<span className="lx-date">Khoảng 6 phút</span>}
      />

      <section className="lx-stats" aria-label="Thống kê ôn tập">
        {reviewStats.map((stat) => (
          <StatsCard key={stat.id} stat={stat} />
        ))}
      </section>

      <div className="lx-row lx-row-practice">
        <ReviewSession cards={reviewCards} />

        <aside className="lx-stack">
          <section className="lx-card lx-side-card">
            <div className="lx-card-head">
              <h2 className="lx-card-title">Lịch ôn 7 ngày tới</h2>
              <span className="lx-card-meta">thẻ / ngày</span>
            </div>
            <ol
              className="lx-mini-bars"
              aria-label={reviewForecast.map((d) => `${d.day}: ${d.count} thẻ`).join(', ')}
            >
              {reviewForecast.map((d, i) => (
                <li key={d.day} className={i === 0 ? 'is-today' : undefined} aria-hidden="true">
                  <span className="lx-mini-track">
                    <span className="lx-mini-value">{d.count}</span>
                    <span
                      className="lx-mini-bar"
                      style={{ height: `calc((100% - 18px) * ${(d.count / maxForecast).toFixed(3)})` }}
                    />
                  </span>
                  <span className="lx-mini-label">{d.day}</span>
                </li>
              ))}
            </ol>
          </section>

          <section className="lx-card lx-side-card">
            <h2 className="lx-card-title">Bộ thẻ của bạn</h2>
            <ul className="lx-decks">
              {reviewDecks.map((deckItem) => {
                const pct = Math.round((deckItem.learned / deckItem.total) * 100);
                return (
                  <li key={deckItem.name}>
                    <div className="lx-progress-row">
                      <span>
                        <strong>{deckItem.name}</strong> · {deckItem.learned}/{deckItem.total} từ
                      </span>
                      <span className={deckItem.due ? 'lx-due' : 'lx-card-meta'}>
                        {deckItem.due ? `${deckItem.due} đến hạn` : 'Đã ôn xong'}
                      </span>
                    </div>
                    <div className="lx-progress lx-progress-deep" aria-hidden="true">
                      <span style={{ width: `${pct}%` }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        </aside>
      </div>

      <p className="lx-footnote">Số liệu minh hoạ cho giao diện học tập.</p>
    </>
  );
}
