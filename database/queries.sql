-- =====================================================================
--  Truy vấn mẫu cho từng khối trên UI.
--  Tham số theo kiểu node-postgres: $1 = user_id (trừ khi ghi khác).
--  Mỗi khối bắt đầu bằng "-- name: <tên>".
-- =====================================================================


-- name: header
-- Header / thẻ thống kê: tên, streak, XP, level, khoá đang học.
-- Streak cache về 0 nếu hôm qua và hôm nay đều chưa học.
SELECT u.display_name,
       CASE WHEN u.last_study_date >= local_today(u.id) - 1 THEN u.current_streak ELSE 0 END AS streak,
       u.total_xp, u.level,
       c.title AS current_course
FROM nguoi_dung u
LEFT JOIN khoa_hoc_nguoi_dung uc ON uc.user_id = u.id AND uc.status = 'current'
LEFT JOIN khoa_hoc c ON c.id = uc.course_id
WHERE u.id = $1;


-- name: home_stats
-- "Số bài đã học", "Thời gian học hôm nay", "Tổng thời gian học".
SELECT
  (SELECT count(*) FROM tien_do_bai_hoc
    WHERE user_id = $1 AND completed_at IS NOT NULL)                         AS lessons_done,
  (SELECT count(*) FROM tien_do_bai_hoc
    WHERE user_id = $1 AND completed_at >= now() - interval '7 days')        AS lessons_done_7d,
  (SELECT coalesce(sum(seconds), 0) / 60 FROM hoat_dong_hang_ngay
    WHERE user_id = $1 AND day = local_today($1))                            AS today_minutes,
  (SELECT daily_goal_minutes FROM cai_dat_nguoi_dung WHERE user_id = $1)          AS goal_minutes,
  (SELECT round(coalesce(sum(seconds), 0) / 3600.0, 1) FROM hoat_dong_hang_ngay
    WHERE user_id = $1)                                                      AS total_hours;


-- name: study_week
-- Biểu đồ 7 ngày gần nhất, ngày không học vẫn có cột 0 phút.
SELECT d::date AS day,
       coalesce(sum(a.seconds), 0) / 60 AS minutes,
       d::date = local_today($1) AS is_today
FROM generate_series(local_today($1) - 6, local_today($1), interval '1 day') AS d
LEFT JOIN hoat_dong_hang_ngay a ON a.user_id = $1 AND a.day = d::date
GROUP BY d
ORDER BY d;


-- name: continue_lesson
-- "Bài học gần đây" / "Tiếp tục học": bài đang học dở gần nhất.
SELECT l.slug, c.title AS course, t.name_vi AS topic, l.number, l.title, l.title_zh,
       l.description, l.cover_hanzi, l.cover_caption,
       cardinality(p.completed_steps) AS parts_done,
       jsonb_array_length(l.steps)    AS parts_total,
       p.current_step, p.last_activity_at
FROM tien_do_bai_hoc p
JOIN bai_hoc l ON l.id = p.lesson_id
JOIN khoa_hoc c ON c.id = l.course_id
LEFT JOIN chu_de t ON t.id = l.topic_id
WHERE p.user_id = $1 AND p.completed_at IS NULL
ORDER BY p.last_activity_at DESC
LIMIT 1;


-- name: current_course
-- "HSK 2 · Sơ cấp — 8/24 bài".
SELECT c.title, c.subtitle,
       count(l.id)            AS lessons_total,
       count(p.completed_at)  AS lessons_done
FROM khoa_hoc_nguoi_dung uc
JOIN khoa_hoc c ON c.id = uc.course_id
JOIN bai_hoc l ON l.course_id = c.id AND l.is_published
LEFT JOIN tien_do_bai_hoc p ON p.lesson_id = l.id AND p.user_id = uc.user_id
WHERE uc.user_id = $1 AND uc.status = 'current'
GROUP BY c.id;


-- name: learning_path
-- Lộ trình HSK 1–6: completed / current / locked.
SELECT c.title, coalesce(uc.status, 'locked') AS status
FROM khoa_hoc c
LEFT JOIN khoa_hoc_nguoi_dung uc ON uc.course_id = c.id AND uc.user_id = $1
WHERE c.is_published
ORDER BY c.position;


-- name: daily_goals
-- Mục tiêu hôm nay, tiến độ và đã nhận XP chưa.
SELECT g.code, g.label, g.target, g.metric, g.xp_reward,
       CASE g.metric WHEN 'minutes' THEN coalesce(a.seconds, 0) / 60 ELSE coalesce(a.items, 0) END AS progress,
       EXISTS (SELECT 1 FROM su_kien_xp x
               WHERE x.user_id = $1 AND x.ref_key = 'goal:' || g.code || ':' || local_today($1)) AS done
FROM mau_muc_tieu_hang_ngay g
LEFT JOIN hoat_dong_hang_ngay a
       ON a.user_id = $1 AND a.day = local_today($1) AND a.activity = g.activity
WHERE g.is_active
ORDER BY g.position;


-- name: review_summary
-- Trang Ôn tập: đến hạn hôm nay, từ đã thuộc, tỉ lệ nhớ 30 ngày.
SELECT
  count(*) FILTER (WHERE c.due_at < (local_today($1) + 1)::timestamp AT TIME ZONE user_tz($1)) AS due_today,
  count(*) FILTER (WHERE c.state = 'review') AS known_words,
  (SELECT round(100.0 * count(*) FILTER (WHERE rating <> 'again') / nullif(count(*), 0))
     FROM lich_su_on_tap
    WHERE user_id = $1 AND reviewed_at >= now() - interval '30 days') AS recall_pct
FROM the_on_tap c
WHERE c.user_id = $1;


-- name: deck_stats
-- Các bộ từ: tổng số từ, đã thuộc, đến hạn hôm nay.
SELECT d.title,
       count(*)                                       AS total,
       count(*) FILTER (WHERE c.state = 'review')     AS learned,
       count(*) FILTER (WHERE c.due_at < (local_today($1) + 1)::timestamp AT TIME ZONE user_tz($1)) AS due
FROM bo_tu_vung_nguoi_dung ud
JOIN bo_tu_vung d       ON d.id = ud.deck_id
JOIN tu_trong_bo_tu_vung dw ON dw.deck_id = d.id
LEFT JOIN the_on_tap c ON c.user_id = ud.user_id AND c.word_id = dw.word_id
WHERE ud.user_id = $1
GROUP BY d.id
ORDER BY d.id;


-- name: review_queue
-- Thẻ cần ôn ngay, kèm câu ví dụ đầu tiên.
SELECT w.id AS word_id, w.hanzi, w.pinyin, w.meaning_vi, w.hsk_level, c.state,
       ex.hanzi AS example_hanzi, ex.pinyin AS example_pinyin, ex.meaning_vi AS example_meaning
FROM the_on_tap c
JOIN tu_vung w ON w.id = c.word_id
LEFT JOIN LATERAL (
  SELECT s.hanzi, s.pinyin, s.meaning_vi
  FROM vi_du_tu_vung we JOIN cau_tieng_trung s ON s.id = we.sentence_id
  WHERE we.word_id = w.id
  ORDER BY we.position
  LIMIT 1
) ex ON true
WHERE c.user_id = $1 AND c.due_at <= now()
ORDER BY c.due_at
LIMIT 50;


-- name: review_forecast
-- Số thẻ đến hạn 7 ngày tới (thẻ quá hạn tính vào hôm nay).
SELECT d::date AS day, count(c.word_id) AS due
FROM generate_series(local_today($1), local_today($1) + 6, interval '1 day') AS d
LEFT JOIN the_on_tap c
       ON c.user_id = $1
      AND greatest((c.due_at AT TIME ZONE user_tz($1))::date, local_today($1)) = d::date
GROUP BY d
ORDER BY d;


-- name: apply_review
-- Ghi một lần chấm thẻ. App tính lịch ôn mới (SM-2) rồi truyền vào:
-- $2 word_id, $3 rating, $4 state mới, $5 interval_days mới, $6 ease mới, $7 duration_ms.
-- Sau đó gọi: SELECT record_activity($1, 'review', <giây>, 1);
WITH old AS (
  SELECT * FROM the_on_tap WHERE user_id = $1 AND word_id = $2::int FOR UPDATE
), upd AS (
  UPDATE the_on_tap c SET
    state            = $4::text,
    interval_days    = $5::real,
    ease             = $6::real,
    due_at           = now() + make_interval(secs => $5::real * 86400),
    reps             = c.reps + 1,
    lapses           = c.lapses + CASE WHEN $3::text = 'again' AND old.state = 'review' THEN 1 ELSE 0 END,
    last_reviewed_at = now()
  FROM old
  WHERE c.user_id = old.user_id AND c.word_id = old.word_id
  RETURNING c.word_id
)
INSERT INTO lich_su_on_tap (user_id, word_id, rating, state_before, interval_before, interval_after, duration_ms)
SELECT old.user_id, old.word_id, $3::text, old.state, old.interval_days, $5::real, $7::int
FROM old JOIN upd ON upd.word_id = old.word_id
RETURNING id;


-- name: activity_streak
-- Chuỗi ngày liên tiếp của một kỹ năng ($2 = 'review' | 'listening' | 'speaking' ...).
-- Chuỗi còn sống nếu ngày cuối là hôm nay hoặc hôm qua.
WITH days AS (
  SELECT day FROM hoat_dong_hang_ngay
  WHERE user_id = $1 AND activity = $2 AND day <= local_today($1)
), runs AS (
  SELECT max(day) AS end_day, count(*) AS len
  FROM (SELECT day, day - (row_number() OVER (ORDER BY day))::int AS grp FROM days) x
  GROUP BY grp
)
SELECT coalesce((SELECT len FROM runs
                 WHERE end_day >= local_today($1) - 1
                 ORDER BY end_day DESC LIMIT 1), 0) AS streak;


-- name: listening_stats
-- Trang Luyện nghe: số bài đã nghe, % nghe hiểu, phút nghe tuần này.
SELECT count(DISTINCT q.dialogue_id) AS tracks_done,
       round(100.0 * sum(a.correct_count) / nullif(sum(a.total_count), 0)) AS accuracy_pct,
       (SELECT coalesce(sum(seconds), 0) / 60 FROM hoat_dong_hang_ngay
         WHERE user_id = $1 AND activity = 'listening'
           AND day >= date_trunc('week', local_today($1))::date) AS minutes_this_week
FROM lan_lam_bai_kiem_tra a
JOIN bai_kiem_tra q ON q.id = a.quiz_id AND q.kind = 'listening'
WHERE a.user_id = $1;


-- name: speaking_set
-- Danh sách câu luyện nói của một bộ ($2 = slug) kèm điểm cao nhất của người học.
SELECT si.position, s.id AS sentence_id, s.hanzi, s.syllables, s.meaning_vi, si.tip,
       (SELECT max(score) FROM lan_luyen_noi a
         WHERE a.user_id = $1 AND a.sentence_id = s.id) AS best
FROM bo_bai_luyen_noi ss
JOIN muc_luyen_noi si ON si.set_id = ss.id
JOIN cau_tieng_trung s       ON s.id = si.sentence_id
WHERE ss.slug = $2
ORDER BY si.position;


-- name: speaking_stats
-- "Câu đã luyện", "Điểm phát âm (trung bình 10 lần gần nhất)".
SELECT count(DISTINCT sentence_id) AS sentences_practiced,
       (SELECT round(avg(score)) FROM (
          SELECT score FROM lan_luyen_noi WHERE user_id = $1
          ORDER BY created_at DESC LIMIT 10) t) AS avg_last_10
FROM lan_luyen_noi
WHERE user_id = $1;


-- name: lesson_player
-- Toàn bộ nội dung một bài học cho LessonPlayer, trong một lần gọi ($1 = slug bài).
SELECT l.slug, l.number, l.title, l.title_zh, l.description, l.goals, l.steps, l.notes,
       l.cover_hanzi, l.cover_caption,
       (SELECT jsonb_agg(jsonb_build_object('hanzi', w.hanzi, 'pinyin', w.pinyin, 'meaning', w.meaning_vi)
                         ORDER BY dw.position)
          FROM bo_tu_vung d JOIN tu_trong_bo_tu_vung dw ON dw.deck_id = d.id JOIN tu_vung w ON w.id = dw.word_id
         WHERE d.lesson_id = l.id) AS vocabulary,
       (SELECT jsonb_agg(jsonb_build_object('structure', gp.structure, 'hanzi', s.hanzi,
                                            'pinyin', s.pinyin, 'meaning', s.meaning_vi)
                         ORDER BY gp.position)
          FROM mau_ngu_phap gp JOIN cau_tieng_trung s ON s.id = gp.sentence_id
         WHERE gp.lesson_id = l.id) AS patterns,
       (SELECT jsonb_agg(jsonb_build_object('speaker', sp.name_vi, 'avatar', sp.avatar, 'hanzi', s.hanzi,
                                            'pinyin', s.pinyin, 'meaning', s.meaning_vi)
                         ORDER BY dl.position)
          FROM hoi_thoai dg
          JOIN loi_thoai_hoi_thoai dl ON dl.dialogue_id = dg.id
          JOIN nguoi_noi sp       ON sp.id = dl.speaker_id
          JOIN cau_tieng_trung s       ON s.id = dl.sentence_id
         WHERE dg.lesson_id = l.id) AS dialogue,
       (SELECT jsonb_agg(jsonb_build_object('id', qq.id, 'prompt', qq.prompt,
                                            'options', qq.options, 'answer', qq.correct_index)
                         ORDER BY qq.position)
          FROM bai_kiem_tra qz JOIN cau_hoi_kiem_tra qq ON qq.quiz_id = qz.id
         WHERE qz.lesson_id = l.id) AS quiz
FROM bai_hoc l
WHERE l.slug = $1;


-- name: search_words
-- Ô tìm kiếm: gõ chữ Hán, pinyin có/không dấu, hoặc nghĩa tiếng Việt ($1 = từ khoá).
SELECT id, hanzi, pinyin, meaning_vi, hsk_level
FROM tu_vung
WHERE hanzi LIKE '%' || $1 || '%'
   OR pinyin_search LIKE '%' || pinyin_plain($1) || '%'
   OR meaning_vi ILIKE '%' || $1 || '%'
ORDER BY (hanzi = $1) DESC, (pinyin_search = pinyin_plain($1)) DESC, hsk_level, hanzi
LIMIT 20;


-- name: recompute_streaks
-- Sửa cache streak nếu nghi lệch (chạy định kỳ hoặc khi cần).
WITH days AS (
  SELECT DISTINCT day FROM hoat_dong_hang_ngay WHERE user_id = $1
), runs AS (
  SELECT max(day) AS end_day, count(*) AS len
  FROM (SELECT day, day - (row_number() OVER (ORDER BY day))::int AS grp FROM days) x
  GROUP BY grp
)
UPDATE nguoi_dung SET
  longest_streak  = coalesce((SELECT max(len) FROM runs), 0),
  current_streak  = coalesce((SELECT len FROM runs WHERE end_day >= local_today($1) - 1
                              ORDER BY end_day DESC LIMIT 1), 0),
  last_study_date = (SELECT max(day) FROM days)
WHERE id = $1
RETURNING current_streak, longest_streak, last_study_date;


-- name: recompute_xp
-- Sửa cache XP / level từ sổ cái.
UPDATE nguoi_dung u SET total_xp = x.total, level = level_for_xp(x.total)
FROM (SELECT coalesce(sum(amount), 0)::int AS total FROM su_kien_xp WHERE user_id = $1) x
WHERE u.id = $1
RETURNING u.total_xp, u.level;
