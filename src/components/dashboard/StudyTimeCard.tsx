import type { StudyDay } from '../../data/homeData';

const AXIS_MAX = 60;
const AXIS_TICKS = [60, 45, 30, 15, 0];

function formatDuration(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes} phút`;
  return minutes === 0 ? `${hours} giờ` : `${hours} giờ ${minutes} phút`;
}

export default function StudyTimeCard({ days }: { days: StudyDay[] }) {
  const total = days.reduce((sum, day) => sum + day.minutes, 0);
  const average = Math.round(total / days.length);
  const summary = days.map((day) => `${day.day} ${day.date}: ${day.minutes} phút`).join(', ');

  return (
    <article className="lx-card lx-study">
      <div className="lx-study-head">
        <div>
          <h2 className="lx-card-title">Thời gian học</h2>
          <p className="lx-study-total">
            <strong>{formatDuration(total)}</strong>
            <span>Trung bình {average} phút / ngày</span>
          </p>
        </div>
        <span className="lx-chip">{days.length} ngày qua</span>
      </div>

      <div className="lx-chart" role="img" aria-label={`Số phút học mỗi ngày: ${summary}`}>
        <div className="lx-chart-axis" aria-hidden="true">
          <span className="lx-chart-unit">Phút</span>
          {AXIS_TICKS.map((tick) => (
            <span key={tick}>{tick}</span>
          ))}
        </div>

        <div className="lx-chart-body" aria-hidden="true">
          <div className="lx-chart-plot">
            {AXIS_TICKS.map((tick) => (
              <i key={tick} className={`lx-chart-grid${tick === 0 ? ' is-base' : ''}`} style={{ bottom: `${(tick / AXIS_MAX) * 100}%` }} />
            ))}
            {days.map((day) => (
              <div key={day.date} className={`lx-chart-col${day.today ? ' is-today' : ''}`}>
                <span className="lx-chart-value">{day.minutes}</span>
                <span
                  className="lx-chart-bar"
                  style={{ height: `${(Math.min(day.minutes, AXIS_MAX) / AXIS_MAX) * 100}%` }}
                />
              </div>
            ))}
          </div>

          <div className="lx-chart-labels">
            {days.map((day) => (
              <div key={day.date} className={day.today ? 'is-today' : undefined}>
                <span>{day.day}</span>
                <small>{day.date}</small>
              </div>
            ))}
          </div>
        </div>
      </div>
    </article>
  );
}
