import type { ReactNode } from 'react';

/** Phần đầu trang dùng chung cho các trang luyện tập (cùng kiểu với lời chào ở Trang chủ). */
export default function PracticeHeader({
  eyebrow,
  title,
  titleHanzi,
  description,
  aside,
}: {
  eyebrow: string;
  title: string;
  titleHanzi?: string;
  description: string;
  aside?: ReactNode;
}) {
  return (
    <section className="lx-greeting">
      <div>
        <p className="lx-eyebrow">{eyebrow}</p>
        <h1>
          {title}
          {titleHanzi && (
            <span className="lx-title-hanzi" lang="zh-CN">
              {titleHanzi}
            </span>
          )}
        </h1>
        <p>{description}</p>
      </div>
      {aside}
    </section>
  );
}
