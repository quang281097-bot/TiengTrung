import FeaturePageLayout from '../../../components/dashboard/FeaturePageLayout';
import { profilePageData } from '../../../data/featureMenuData';
import { getSessionUser } from '../../../lib/auth';
import { getPool } from '../../../lib/db';

export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
  const sessionUser = await getSessionUser();
  const pool = getPool();

  if (sessionUser && pool) {
    try {
      const res = await pool.query(
        `SELECT display_name, role, total_xp, level,
                CASE WHEN last_study_date >= local_today(id) - 1 THEN current_streak ELSE 0 END AS streak
         FROM nguoi_dung WHERE id = $1`,
        [sessionUser.id],
      );
      const u = res.rows[0];
      if (u) {
        return (
          <FeaturePageLayout
            data={{
              ...profilePageData,
              title: `${u.display_name} · ${u.role === 'admin' ? 'Quản trị viên hệ thống' : 'Người học tiếng Trung'}`,
              stats: [
                { label: 'Streak', value: `${u.streak} ngày`, hint: 'liên tiếp' },
                { label: 'XP', value: Number(u.total_xp).toLocaleString('en-US'), hint: 'của bạn' },
                { label: 'Mức', value: `Level ${u.level}`, hint: 'đạt được' },
              ],
            }}
          />
        );
      }
    } catch {
      // Fallback sang dữ liệu tĩnh bên dưới nếu lỗi kết nối
    }
  }

  return <FeaturePageLayout data={profilePageData} />;
}
