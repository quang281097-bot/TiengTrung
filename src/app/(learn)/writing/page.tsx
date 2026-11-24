import WritingWorksheet from '../../../components/practice/WritingWorksheet';
import { getWritingPageData } from '../../../lib/writingRepo';

export const metadata = {
  title: 'Luyện viết chữ Hán theo thứ tự nét & Tạo phiếu in A4 | lǎoshi.',
  description:
    'Tạo phiếu luyện viết chữ Hán khổ A4 theo từng nét bút đỏ (Ô Mễ, Ô Điền, Ô Vuông), chọn từ vựng HSK 1-6 hoặc tập viết trực tiếp trên màn hình.',
};

export const dynamic = 'force-dynamic';

export default async function WritingPage() {
  const data = await getWritingPageData();

  return <WritingWorksheet data={data} />;
}
