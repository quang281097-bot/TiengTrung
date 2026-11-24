import ReviewNotebookHub from '../../../components/practice/ReviewNotebookHub';
import { getSessionUser } from '../../../lib/auth';
import { getReviewPageData } from '../../../lib/reviewRepo';

export const metadata = {
  title: 'Sổ tay & Ôn tập từ vựng HSK 1 - HSK 7-9 | DoDo.',
  description:
    'Hệ thống sổ tay từ vựng chuẩn Hanzii với đầy đủ 4 chế độ: Ôn tập trắc nghiệm, Luyện phát âm AI, Luyện viết chữ Hán theo nét và Thẻ ghi nhớ Flashcard.',
};

export const dynamic = 'force-dynamic';

export default async function ReviewPage({
  searchParams,
}: {
  searchParams?: { deck?: string };
}) {
  const user = await getSessionUser();
  const data = await getReviewPageData(user?.id);

  return <ReviewNotebookHub initialData={data} initialDeckSlug={searchParams?.deck} />;
}
