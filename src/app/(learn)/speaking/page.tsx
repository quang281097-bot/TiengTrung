import StatsCard from '../../../components/dashboard/StatsCard';
import PracticeHeader from '../../../components/practice/PracticeHeader';
import SpeakingPractice from '../../../components/practice/SpeakingPractice';
import { speakingSentences, speakingStats, speakingTopic, tones } from '../../../data/practiceData';

export const metadata = { title: 'Luyện nói' };

export default function SpeakingPage() {
  return (
    <>
      <PracticeHeader
        eyebrow="Luyện nói"
        title="Nói theo câu mẫu, nhận phản hồi ngay"
        description="Nghe mẫu, bấm micro và đọc to. Hệ thống so từng chữ với câu mẫu để bạn biết chỗ cần sửa."
        aside={<span className="lx-date">{speakingSentences.length} câu · HSK 2</span>}
      />

      <section className="lx-stats" aria-label="Thống kê luyện nói">
        {speakingStats.map((stat) => (
          <StatsCard key={stat.id} stat={stat} />
        ))}
      </section>

      <SpeakingPractice topic={speakingTopic} sentences={speakingSentences} tones={tones} />

      <p className="lx-footnote">
        Số liệu minh hoạ cho giao diện học tập. Chấm điểm dùng nhận dạng giọng nói của trình duyệt (Chrome/Edge), chỉ
        mang tính tham khảo.
      </p>
    </>
  );
}
