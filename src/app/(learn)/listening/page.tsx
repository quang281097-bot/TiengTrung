import StatsCard from '../../../components/dashboard/StatsCard';
import ListeningPractice from '../../../components/practice/ListeningPractice';
import PracticeHeader from '../../../components/practice/PracticeHeader';
import { listeningStats, listeningTips, listeningTracks } from '../../../data/practiceData';

export const metadata = { title: 'Luyện nghe' };

export default function ListeningPage() {
  return (
    <>
      <PracticeHeader
        eyebrow="Luyện nghe"
        title="Nghe hội thoại ngắn, trả lời câu hỏi"
        description="Nghe các tình huống đời thường ở tốc độ phù hợp, rồi kiểm tra mức hiểu của bạn."
        aside={<span className="lx-date">{listeningTracks.length} bài · HSK 2</span>}
      />

      <section className="lx-stats" aria-label="Thống kê luyện nghe">
        {listeningStats.map((stat) => (
          <StatsCard key={stat.id} stat={stat} />
        ))}
      </section>

      <ListeningPractice tracks={listeningTracks} tips={listeningTips} />

      <p className="lx-footnote">Số liệu minh hoạ cho giao diện học tập. Âm thanh được đọc bằng giọng tiếng Trung của trình duyệt.</p>
    </>
  );
}
