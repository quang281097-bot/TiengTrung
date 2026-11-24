import Link from 'next/link';

import PracticeHeader from '../../../components/practice/PracticeHeader';
import ReadingPracticeView from '../../../components/practice/ReadingPracticeView';
import Icon from '../../../components/ui/Icon';
import { getSessionUser } from '../../../lib/auth';
import { getPublishedReadings } from '../../../lib/readingRepository';

export const metadata = {
  title: 'Luyện đọc tiếng Trung theo cấp độ HSK | DoDo.',
  description: 'Luyện đọc đoạn văn và hội thoại tiếng Trung từ cấp độ HSK 1 đến HSK 6 kèm phiên âm Pinyin, bản dịch và phát âm chuẩn.',
};

export const dynamic = 'force-dynamic';

export default async function PracticePage() {
  const user = await getSessionUser();
  const isAdmin = user?.role === 'admin';
  const readings = await getPublishedReadings(user?.id);

  return (
    <>
      <PracticeHeader
        eyebrow="Luyện đọc tiếng Trung"
        title="Luyện đọc đoạn văn & hội thoại theo chuẩn HSK"
        description="Chọn cấp độ HSK bạn muốn luyện, đọc văn bản kèm Pinyin, nghe giọng đọc bản xứ và đối chiếu bản dịch tiếng Việt."
        aside={
          <div className="lx-page-actions" style={{ alignItems: 'center' }}>
            <span className="lx-date">{readings.length} bài đọc trong kho dữ liệu</span>
            {isAdmin && (
              <Link className="reading-admin-link" href="/practice/manage">
                <Icon name="pen" size={16} />
                Quản lý &amp; đăng bài
              </Link>
            )}
          </div>
        }
      />

      <ReadingPracticeView readings={readings} isSignedIn={Boolean(user)} />

      <p className="lx-footnote" style={{ marginTop: '24px' }}>
        Dữ liệu bài đọc được đồng bộ hóa trực tiếp từ Database PostgreSQL. Tính năng phát âm sử dụng công nghệ Web Speech API bản xứ hoàn toàn miễn phí.
      </p>
    </>
  );
}
