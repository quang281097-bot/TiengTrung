import nextEnv from '@next/env';
import pg from 'pg';

nextEnv.loadEnvConfig(process.cwd());

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function resetAdminStats() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const res = await client.query(
      `UPDATE nguoi_dung
       SET current_streak = 0,
           longest_streak = 0,
           total_xp = 0,
           level = 1,
           last_study_date = NULL,
           updated_at = now()
       WHERE role = 'admin' OR lower(email) = 'admin'
       RETURNING id, email, display_name, role, current_streak, total_xp, level`
    );

    for (const u of res.rows) {
      await client.query('DELETE FROM tien_do_bai_hoc WHERE user_id = $1', [u.id]);
      await client.query('DELETE FROM tien_do_bai_doc WHERE user_id = $1', [u.id]);
      await client.query('DELETE FROM hoat_dong_hang_ngay WHERE user_id = $1', [u.id]);
      await client.query('DELETE FROM su_kien_xp WHERE user_id = $1', [u.id]);
      await client.query('DELETE FROM khoa_hoc_nguoi_dung WHERE user_id = $1', [u.id]);
      await client.query('DELETE FROM lan_lam_bai_kiem_tra WHERE user_id = $1', [u.id]);
      await client.query('DELETE FROM lan_luyen_noi WHERE user_id = $1', [u.id]);
      await client.query('DELETE FROM lan_luyen_viet WHERE user_id = $1', [u.id]);
    }

    await client.query('COMMIT');
    console.log('Đã đặt lại dữ liệu học tập của Admin về 0:', res.rows);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Lỗi:', err);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

resetAdminStats();
