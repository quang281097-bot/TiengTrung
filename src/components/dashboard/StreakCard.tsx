import type { StudyDay } from '../../data/homeData';
import Icon from '../ui/Icon';

export default function StreakCard({ days, goalMinutes }: { days: StudyDay[]; goalMinutes: number }) {
  const streak = days.filter((day) => day.minutes > 0).length;
  const today = days.find((day) => day.today) ?? days[days.length - 1];
  const todayMinutes = today?.minutes ?? 0;
  const percent = Math.min(100, Math.round((todayMinutes / goalMinutes) * 100));
  const remaining = Math.max(0, goalMinutes - todayMinutes);

  return (
    <article className="lx-streak">
      <p className="lx-streak-kicker">Đều đặn là chìa khoá</p>
      <h2 className="lx-streak-title">{streak} ngày liên tiếp</h2>
      <p className="lx-streak-sub">
        {streak > 0 ? `Bạn đã học đủ ${streak} ngày qua. Tiếp tục nhé!` : 'Bắt đầu học hôm nay để mở chuỗi ngày học nhé!'}
      </p>

      <ol className="lx-streak-days">
        {days.map((day) => (
          <li key={day.date} className={day.today ? 'is-today' : undefined}>
            <span className="lx-streak-dow">{day.day}</span>
            <span className={`lx-streak-dot${day.minutes > 0 ? ' is-done' : ''}`}>
              {day.minutes > 0 && <Icon name="check" size={13} strokeWidth={2.4} />}
            </span>
            <span className="lx-streak-date">{day.date.split('/')[0]}</span>
          </li>
        ))}
      </ol>

      <div className="lx-streak-goal">
        <div className="lx-streak-goal-row">
          <span>Mục tiêu hôm nay</span>
          <strong>
            {todayMinutes} / {goalMinutes} phút
          </strong>
        </div>
        <div
          className="lx-progress lx-progress-dark"
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Tiến độ mục tiêu hôm nay"
        >
          <span style={{ width: `${percent}%` }} />
        </div>
        <p className="lx-streak-note">
          {remaining > 0 ? `Chỉ ${remaining} phút nữa để hoàn thành mục tiêu.` : 'Bạn đã hoàn thành mục tiêu hôm nay!'}
        </p>
      </div>
    </article>
  );
}
