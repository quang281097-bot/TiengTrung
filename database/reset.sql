-- Destructive: drops the app's old English and new Vietnamese tables.
-- Does not remove unrelated tables or the pg_trgm extension.
DROP TABLE IF EXISTS
  users, user_settings, sessions, notifications, feedback,
  courses, topics, lessons, bai_doc, sentences, words, word_examples,
  grammar_patterns, speakers, dialogues, dialogue_lines, quizzes,
  quiz_questions, speaking_sets, speaking_items, hanzi_characters,
  daily_sentences, decks, deck_words, user_decks, srs_cards,
  review_logs, user_courses, user_lesson_progress, quiz_attempts,
  speaking_attempts, writing_attempts, user_daily_activity, xp_events,
  daily_goal_templates, achievements, user_achievements,
  nguoi_dung, cai_dat_nguoi_dung, phien_dang_nhap, thong_bao, phan_hoi,
  khoa_hoc, chu_de, bai_hoc, cau_tieng_trung, tu_vung, tu_vung_nghia, vi_du_tu_vung,
  bai_doc_tu_vung,
  mau_ngu_phap, nguoi_noi, hoi_thoai, loi_thoai_hoi_thoai,
  bai_kiem_tra, cau_hoi_kiem_tra, bo_bai_luyen_noi, muc_luyen_noi,
  chu_han, cau_tieng_trung_hang_ngay, bo_tu_vung, tu_trong_bo_tu_vung,
  bo_tu_vung_nguoi_dung, the_on_tap, lich_su_on_tap, khoa_hoc_nguoi_dung,
  tien_do_bai_hoc, lan_lam_bai_kiem_tra, lan_luyen_noi, lan_luyen_viet,
  hoat_dong_hang_ngay, su_kien_xp, mau_muc_tieu_hang_ngay, thanh_tuu,
  thanh_tuu_nguoi_dung
CASCADE;

DROP FUNCTION IF EXISTS pinyin_plain(text) CASCADE;
DROP FUNCTION IF EXISTS user_tz(uuid) CASCADE;
DROP FUNCTION IF EXISTS local_today(uuid) CASCADE;
DROP FUNCTION IF EXISTS level_for_xp(integer) CASCADE;
DROP FUNCTION IF EXISTS record_activity(uuid, text, integer, integer) CASCADE;
DROP FUNCTION IF EXISTS award_xp(uuid, integer, text, text) CASCADE;