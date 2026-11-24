-- =====================================================================
--  Chinese Learning — PostgreSQL schema (PostgreSQL 14+)
--
--  Nhóm bảng
--    1. Tài khoản        nguoi_dung, cai_dat_nguoi_dung, phien_dang_nhap, thong_bao, phan_hoi
--    2. Nội dung học     khoa_hoc, chu_de, bai_hoc, tu_vung, cau_tieng_trung, vi_du_tu_vung,
--                        mau_ngu_phap, nguoi_noi, hoi_thoai, loi_thoai_hoi_thoai,
--                        bai_kiem_tra, cau_hoi_kiem_tra, bo_bai_luyen_noi, muc_luyen_noi,
--                        chu_han, cau_tieng_trung_hang_ngay
--    3. Bộ từ & ôn tập   bo_tu_vung, tu_trong_bo_tu_vung, bo_tu_vung_nguoi_dung, the_on_tap, lich_su_on_tap
--    4. Tiến độ          khoa_hoc_nguoi_dung, tien_do_bai_hoc, lan_lam_bai_kiem_tra,
--                        lan_luyen_noi, lan_luyen_viet
--    5. Động lực         hoat_dong_hang_ngay, su_kien_xp, mau_muc_tieu_hang_ngay,
--                        thanh_tuu, thanh_tuu_nguoi_dung
--
--  Quy ước
--    * Nội dung chỉ để hiển thị và luôn đọc cùng bài học (mục tiêu, ghi chú,
--      lời dẫn từng bước) lưu jsonb/mảng trên bai_hoc. Thứ cần join, thống kê
--      hoặc dùng lại ở nhiều nơi (từ, câu, hội thoại, câu hỏi) có bảng riêng.
--    * Mọi câu tiếng Trung (ví dụ, mẫu câu, lời thoại, câu luyện nói) nằm trong
--      `cau_tieng_trung`, nên một câu có audio/pinyin ở một chỗ và dùng lại được.
--    * Trạng thái liệt kê dùng text + CHECK (dễ thêm giá trị hơn ENUM).
--    * "Ngày" (streak, mục tiêu ngày, biểu đồ tuần) tính theo múi giờ của người
--      học, xem local_today().
--    * Cột cache trên nguoi_dung (total_xp, level, streak) luôn tính lại được từ
--      su_kien_xp và hoat_dong_hang_ngay, xem database/queries.sql.
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS pg_trgm;   -- tìm từ theo pinyin / nghĩa gần đúng


-- =====================================================================
-- 1. TÀI KHOẢN
-- =====================================================================

CREATE TABLE nguoi_dung (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email            text NOT NULL,
  password_hash    text,                      -- NULL nếu chỉ đăng nhập bằng Google/Facebook
  display_name     text NOT NULL,
  avatar_url       text,
  role             text NOT NULL DEFAULT 'learner' CHECK (role IN ('learner', 'admin')),
  -- cache cho header/dashboard
  total_xp         integer  NOT NULL DEFAULT 0 CHECK (total_xp >= 0),
  level            smallint NOT NULL DEFAULT 1,
  current_streak   integer  NOT NULL DEFAULT 0,
  longest_streak   integer  NOT NULL DEFAULT 0,
  last_study_date  date,                      -- ngày học gần nhất (giờ địa phương)
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX users_email_key ON nguoi_dung (lower(email));

CREATE TABLE cai_dat_nguoi_dung (
  user_id                  uuid PRIMARY KEY REFERENCES nguoi_dung (id) ON DELETE CASCADE,
  timezone                 text     NOT NULL DEFAULT 'Asia/Ho_Chi_Minh',
  target_hsk_level         smallint CHECK (target_hsk_level BETWEEN 1 AND 9),   -- "Mục tiêu tháng: HSK 2"
  daily_goal_minutes       smallint NOT NULL DEFAULT 30 CHECK (daily_goal_minutes > 0),
  weekly_listening_minutes smallint NOT NULL DEFAULT 60,
  weekly_speaking_minutes  smallint NOT NULL DEFAULT 40,
  new_words_per_day        smallint NOT NULL DEFAULT 20,
  show_pinyin              boolean  NOT NULL DEFAULT true,
  show_meaning             boolean  NOT NULL DEFAULT false,
  speech_rate              real     NOT NULL DEFAULT 0.9,   -- tốc độ đọc mẫu, 0.6 = "Chậm"
  reminder_time            time,                            -- giờ nhắc học, NULL = tắt
  updated_at               timestamptz NOT NULL DEFAULT now()
);

-- Phiên đăng nhập (cookie). Nếu dùng Auth.js thì thay bằng các bảng của adapter.
CREATE TABLE phien_dang_nhap (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES nguoi_dung (id) ON DELETE CASCADE,
  token_hash  text NOT NULL UNIQUE,          -- chỉ lưu hash của token, không lưu token gốc
  user_agent  text,
  expires_at  timestamptz NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX sessions_user_idx ON phien_dang_nhap (user_id);

CREATE TABLE thong_bao (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id     uuid NOT NULL REFERENCES nguoi_dung (id) ON DELETE CASCADE,
  kind        text NOT NULL,                 -- 'new_lesson', 'streak_risk', 'achievement', ...
  title       text NOT NULL,
  body        text,
  link        text,
  read_at     timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX notifications_user_idx ON thong_bao (user_id, created_at DESC);

CREATE TABLE phan_hoi (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id     uuid REFERENCES nguoi_dung (id) ON DELETE SET NULL,
  rating      smallint CHECK (rating BETWEEN 1 AND 5),
  message     text NOT NULL,
  page        text,                          -- trang người học đang ở khi gửi
  created_at  timestamptz NOT NULL DEFAULT now()
);


-- =====================================================================
-- 2. NỘI DUNG HỌC
-- =====================================================================

-- Bỏ dấu thanh và khoảng trắng của pinyin: 'Nǐ hǎo' → 'nihao', 'lǚyóu' → 'lvyou'.
CREATE FUNCTION pinyin_plain(p text) RETURNS text
LANGUAGE sql IMMUTABLE PARALLEL SAFE AS $$
  SELECT lower(translate(p,
    'āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜüĀÁǍÀĒÉĚÈĪÍǏÌŌÓǑÒŪÚǓÙǕǗǙǛÜ'' ',
    'aaaaeeeeiiiioooouuuuvvvvvaaaaeeeeiiiioooouuuuvvvvv'))
$$;

CREATE TABLE khoa_hoc (
  id            integer GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  slug          text NOT NULL UNIQUE,         -- 'hsk-2'
  title         text NOT NULL,                -- 'HSK 2'
  subtitle      text,                         -- 'Sơ cấp'
  hsk_level     smallint CHECK (hsk_level BETWEEN 1 AND 9),
  position      smallint NOT NULL,
  is_published  boolean NOT NULL DEFAULT false
);

CREATE TABLE chu_de (
  id       integer GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  slug     text NOT NULL UNIQUE,              -- 'daily-life'
  name_vi  text NOT NULL,                     -- 'Giao tiếp đời sống'
  name_zh  text                               -- '日常'
);

CREATE TABLE bai_hoc (
  id             integer GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  course_id      integer NOT NULL REFERENCES khoa_hoc (id),
  topic_id       integer REFERENCES chu_de (id),
  number         smallint NOT NULL,           -- 9 → "Bài 09"
  slug           text NOT NULL UNIQUE,        -- 'hsk2-09-my-day'
  title          text NOT NULL,               -- 'Một ngày của tôi'
  title_zh       text,                        -- '我的一天'
  description    text,
  est_minutes    smallint,
  cover_hanzi    text,                        -- '日常' trên ảnh bìa
  cover_caption  text,                        -- 'Cuộc sống hằng ngày'
  goals          text[] NOT NULL DEFAULT '{}',
  -- [{"kind":"vocabulary|patterns|dialogue|quiz|summary","label":"Từ vựng","intro":"..."}]
  steps          jsonb  NOT NULL DEFAULT '[]' CHECK (jsonb_typeof(steps) = 'array'),
  -- [{"title":"Nói giờ với 点 và 半","body":"..."}]
  notes          jsonb  NOT NULL DEFAULT '[]' CHECK (jsonb_typeof(notes) = 'array'),
  is_published   boolean NOT NULL DEFAULT false,
  UNIQUE (course_id, number)
);

CREATE TABLE cau_tieng_trung (
  id          bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  hanzi       text NOT NULL,                  -- '我每天早上七点起床。'
  pinyin      text NOT NULL,                  -- 'Wǒ měitiān zǎoshang qī diǎn qǐchuáng.'
  syllables   text,                           -- pinyin theo từng chữ, cách nhau bởi dấu cách (cho <ruby> và chấm điểm nói)
  meaning_vi  text NOT NULL,
  audio_url   text,                           -- NULL → dùng giọng đọc của trình duyệt
  hsk_level   smallint
);
CREATE INDEX sentences_hanzi_idx ON cau_tieng_trung (hanzi);

CREATE TABLE tu_vung (
  id              integer GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  hanzi           text NOT NULL,              -- giản thể: '起床'
  traditional     text,                       -- phồn thể, nếu khác
  pinyin          text NOT NULL,              -- 'qǐchuáng'
  pinyin_search   text GENERATED ALWAYS AS (pinyin_plain(pinyin)) STORED,   -- 'qichuang'
  meaning_vi      text NOT NULL,
  part_of_speech  text,                       -- 'động từ', 'danh từ', ...
  hsk_level       smallint CHECK (hsk_level BETWEEN 1 AND 9),
  audio_url       text,
  UNIQUE (hanzi, pinyin)                      -- 了 le / liǎo là hai mục khác nhau
);
CREATE INDEX words_hsk_idx        ON tu_vung (hsk_level);
CREATE INDEX words_pinyin_trgm    ON tu_vung USING gin (pinyin_search gin_trgm_ops);
CREATE INDEX words_meaning_trgm   ON tu_vung USING gin (meaning_vi gin_trgm_ops);

CREATE TABLE vi_du_tu_vung (
  word_id      integer NOT NULL REFERENCES tu_vung (id) ON DELETE CASCADE,
  sentence_id  bigint  NOT NULL REFERENCES cau_tieng_trung (id),
  position     smallint NOT NULL DEFAULT 0,
  PRIMARY KEY (word_id, sentence_id)
);

CREATE TABLE mau_ngu_phap (
  id           integer GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  lesson_id    integer NOT NULL REFERENCES bai_hoc (id) ON DELETE CASCADE,
  position     smallint NOT NULL,
  structure    text NOT NULL,                 -- 'Chủ ngữ + 几点 + động từ？'
  sentence_id  bigint NOT NULL REFERENCES cau_tieng_trung (id),   -- câu ví dụ
  UNIQUE (lesson_id, position)
);

-- Nhân vật trong hội thoại, dùng lại giữa các bài (Tiểu Minh, Anna, ...).
CREATE TABLE nguoi_noi (
  id       integer GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  slug     text NOT NULL UNIQUE,
  name_vi  text NOT NULL,                     -- 'Tiểu Minh'
  name_zh  text,                              -- '小明'
  avatar   text                               -- '明' hoặc URL ảnh
);

-- Một bảng cho cả: hội thoại trong bài học (lesson_id có giá trị),
-- bài luyện nghe và thư viện hội thoại (lesson_id NULL).
CREATE TABLE hoi_thoai (
  id            integer GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  slug          text NOT NULL UNIQUE,         -- 'cafe'
  title         text NOT NULL,                -- 'Ở quán cà phê'
  title_zh      text,                         -- '在咖啡店'
  cover_hanzi   text,                         -- '咖啡'
  situation     text,                         -- 'Gọi đồ uống và trả tiền'
  topic_id      integer REFERENCES chu_de (id),
  lesson_id     integer REFERENCES bai_hoc (id) ON DELETE CASCADE,
  hsk_level     smallint,
  audio_url     text,
  duration_sec  smallint,
  is_published  boolean NOT NULL DEFAULT false
);
CREATE INDEX dialogues_lesson_idx ON hoi_thoai (lesson_id) WHERE lesson_id IS NOT NULL;

CREATE TABLE loi_thoai_hoi_thoai (
  dialogue_id  integer  NOT NULL REFERENCES hoi_thoai (id) ON DELETE CASCADE,
  position     smallint NOT NULL,
  speaker_id   integer  NOT NULL REFERENCES nguoi_noi (id),
  sentence_id  bigint   NOT NULL REFERENCES cau_tieng_trung (id),
  PRIMARY KEY (dialogue_id, position)
);

-- Bộ câu hỏi: luyện tập cuối bài, câu hỏi bài nghe, hoặc đề thi thử HSK.
CREATE TABLE bai_kiem_tra (
  id              integer GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  kind            text NOT NULL CHECK (kind IN ('lesson', 'listening', 'hsk_mock')),
  lesson_id       integer UNIQUE REFERENCES bai_hoc (id)   ON DELETE CASCADE,
  dialogue_id     integer UNIQUE REFERENCES hoi_thoai (id) ON DELETE CASCADE,
  title           text,
  hsk_level       smallint,
  time_limit_sec  integer,
  CHECK ((kind = 'lesson')    = (lesson_id IS NOT NULL)),
  CHECK ((kind = 'listening') = (dialogue_id IS NOT NULL))
);

CREATE TABLE cau_hoi_kiem_tra (
  id                integer GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  quiz_id           integer  NOT NULL REFERENCES bai_kiem_tra (id) ON DELETE CASCADE,
  position          smallint NOT NULL,
  kind              text NOT NULL DEFAULT 'single_choice'
                    CHECK (kind IN ('single_choice', 'fill_blank', 'dictation')),
  prompt            text NOT NULL,
  options           text[],                   -- single_choice
  correct_index     smallint,                 -- vị trí đáp án đúng, bắt đầu từ 0 như trên UI
  accepted_answers  text[],                   -- fill_blank / dictation
  explanation       text,
  UNIQUE (quiz_id, position),
  CHECK (
    (kind = 'single_choice' AND options IS NOT NULL AND correct_index IS NOT NULL
       AND correct_index >= 0 AND correct_index < cardinality(options))
    OR
    (kind <> 'single_choice' AND accepted_answers IS NOT NULL AND cardinality(accepted_answers) > 0)
  )
);

CREATE TABLE bo_bai_luyen_noi (
  id         integer GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  slug       text NOT NULL UNIQUE,
  title      text NOT NULL,                   -- 'Giới thiệu bản thân & thói quen hằng ngày'
  topic_id   integer REFERENCES chu_de (id),
  hsk_level  smallint,
  position   smallint NOT NULL DEFAULT 0
);

CREATE TABLE muc_luyen_noi (
  set_id       integer  NOT NULL REFERENCES bo_bai_luyen_noi (id) ON DELETE CASCADE,
  position     smallint NOT NULL,
  sentence_id  bigint   NOT NULL REFERENCES cau_tieng_trung (id),   -- cần có syllables
  tip          text,                          -- mẹo phát âm
  PRIMARY KEY (set_id, position)
);

-- Dữ liệu chữ Hán cho phần Viết chữ.
CREATE TABLE chu_han (
  char          text PRIMARY KEY CHECK (char_length(char) = 1),
  pinyin        text NOT NULL,
  meaning_vi    text NOT NULL,
  radical       text,                         -- bộ thủ: 亻
  stroke_count  smallint,
  strokes       jsonb,                        -- dữ liệu nét (SVG path + median), ví dụ cho Hanzi Writer
  hsk_level     smallint
);

-- "Câu tiếng Trung hôm nay".
CREATE TABLE cau_tieng_trung_hang_ngay (
  day          date PRIMARY KEY,
  sentence_id  bigint NOT NULL REFERENCES cau_tieng_trung (id),
  explanation  text
);


-- =====================================================================
-- 3. BỘ TỪ & ÔN TẬP (SRS)
-- =====================================================================

-- Một danh sách từ: theo cấp HSK, theo bài học, theo chủ đề, hoặc do người học tạo.
-- Từ vựng của một bài học chính là bộ từ có lesson_id của bài đó.
CREATE TABLE bo_tu_vung (
  id          integer GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  owner_id    uuid REFERENCES nguoi_dung (id) ON DELETE CASCADE,   -- NULL = bộ từ hệ thống
  kind        text NOT NULL CHECK (kind IN ('hsk', 'lesson', 'topic', 'custom')),
  title       text NOT NULL,                  -- 'HSK 2', 'Bài 09 · Một ngày của tôi', 'Gia đình'
  hsk_level   smallint,
  lesson_id   integer UNIQUE REFERENCES bai_hoc (id) ON DELETE CASCADE,
  topic_id    integer REFERENCES chu_de (id),
  created_at  timestamptz NOT NULL DEFAULT now(),
  CHECK ((kind = 'custom') = (owner_id IS NOT NULL)),
  CHECK ((kind = 'lesson') = (lesson_id IS NOT NULL))
);
CREATE INDEX decks_owner_idx ON bo_tu_vung (owner_id) WHERE owner_id IS NOT NULL;

CREATE TABLE tu_trong_bo_tu_vung (
  deck_id   integer  NOT NULL REFERENCES bo_tu_vung (id) ON DELETE CASCADE,
  word_id   integer  NOT NULL REFERENCES tu_vung (id) ON DELETE CASCADE,
  position  smallint NOT NULL DEFAULT 0,
  PRIMARY KEY (deck_id, word_id)
);
CREATE INDEX deck_words_word_idx ON tu_trong_bo_tu_vung (word_id);

-- Bộ từ người học đã thêm ("Thêm bộ từ", "Bộ từ yêu thích").
CREATE TABLE bo_tu_vung_nguoi_dung (
  user_id      uuid    NOT NULL REFERENCES nguoi_dung (id) ON DELETE CASCADE,
  deck_id      integer NOT NULL REFERENCES bo_tu_vung (id) ON DELETE CASCADE,
  is_favorite  boolean NOT NULL DEFAULT false,
  added_at     timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, deck_id)
);

-- Trạng thái ghi nhớ của MỘT từ với MỘT người học (không theo bộ từ),
-- nên một từ nằm trong cả bộ "HSK 2" lẫn "Bài 09" chỉ ôn một lần.
-- Thông số theo SM-2 (kiểu Anki); muốn đổi sang FSRS thì thay ease/interval_days
-- bằng stability/difficulty.
CREATE TABLE the_on_tap (
  user_id           uuid    NOT NULL REFERENCES nguoi_dung (id) ON DELETE CASCADE,
  word_id           integer NOT NULL REFERENCES tu_vung (id) ON DELETE CASCADE,
  state             text NOT NULL DEFAULT 'new'
                    CHECK (state IN ('new', 'learning', 'review', 'relearning')),   -- 'review' = đã thuộc
  due_at            timestamptz NOT NULL DEFAULT now(),
  interval_days     real    NOT NULL DEFAULT 0,
  ease              real    NOT NULL DEFAULT 2.5,
  reps              integer NOT NULL DEFAULT 0,
  lapses            integer NOT NULL DEFAULT 0,  -- số lần "Quên" sau khi đã thuộc
  last_reviewed_at  timestamptz,
  created_at        timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, word_id)
);
CREATE INDEX srs_cards_due_idx ON the_on_tap (user_id, due_at);

CREATE TABLE lich_su_on_tap (
  id               bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id          uuid    NOT NULL,
  word_id          integer NOT NULL,
  rating           text NOT NULL CHECK (rating IN ('again', 'hard', 'good', 'easy')),   -- Quên / Khó / Nhớ / Dễ
  state_before     text NOT NULL,
  interval_before  real,
  interval_after   real,
  duration_ms      integer,
  reviewed_at      timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (user_id, word_id) REFERENCES the_on_tap (user_id, word_id) ON DELETE CASCADE
);
CREATE INDEX review_logs_user_time_idx ON lich_su_on_tap (user_id, reviewed_at);


-- =====================================================================
-- 4. TIẾN ĐỘ & KẾT QUẢ LUYỆN TẬP
-- =====================================================================

-- Không có dòng = khoá đang khoá. Mỗi người chỉ có một khoá 'current'.
CREATE TABLE khoa_hoc_nguoi_dung (
  user_id       uuid    NOT NULL REFERENCES nguoi_dung (id) ON DELETE CASCADE,
  course_id     integer NOT NULL REFERENCES khoa_hoc (id),
  status        text NOT NULL CHECK (status IN ('current', 'completed')),
  started_at    timestamptz NOT NULL DEFAULT now(),
  completed_at  timestamptz,
  PRIMARY KEY (user_id, course_id)
);
CREATE UNIQUE INDEX user_courses_one_current ON khoa_hoc_nguoi_dung (user_id) WHERE status = 'current';

CREATE TABLE tien_do_bai_hoc (
  user_id           uuid    NOT NULL REFERENCES nguoi_dung (id) ON DELETE CASCADE,
  lesson_id         integer NOT NULL REFERENCES bai_hoc (id) ON DELETE CASCADE,
  current_step      smallint   NOT NULL DEFAULT 0,      -- chỉ số trong bai_hoc.steps
  completed_steps   smallint[] NOT NULL DEFAULT '{}',   -- {0,1} = xong "Từ vựng" và "Mẫu câu"
  started_at        timestamptz NOT NULL DEFAULT now(),
  last_activity_at  timestamptz NOT NULL DEFAULT now(),
  completed_at      timestamptz,                        -- có giá trị = đã học xong bài
  PRIMARY KEY (user_id, lesson_id)
);
CREATE INDEX user_lesson_progress_recent_idx ON tien_do_bai_hoc (user_id, last_activity_at DESC);

CREATE TABLE lan_lam_bai_kiem_tra (
  id             bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id        uuid    NOT NULL REFERENCES nguoi_dung (id) ON DELETE CASCADE,
  quiz_id        integer NOT NULL REFERENCES bai_kiem_tra (id) ON DELETE CASCADE,
  correct_count  smallint NOT NULL CHECK (correct_count >= 0),
  total_count    smallint NOT NULL CHECK (total_count > 0 AND correct_count <= total_count),
  answers        jsonb NOT NULL DEFAULT '{}',   -- {"<question_id>": 1, ...} đáp án người học chọn/gõ
  started_at     timestamptz,
  finished_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX quiz_attempts_user_idx ON lan_lam_bai_kiem_tra (user_id, quiz_id, finished_at DESC);

CREATE TABLE lan_luyen_noi (
  id           bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id      uuid   NOT NULL REFERENCES nguoi_dung (id) ON DELETE CASCADE,
  sentence_id  bigint NOT NULL REFERENCES cau_tieng_trung (id),
  score        smallint NOT NULL CHECK (score BETWEEN 0 AND 100),
  transcript   text,                          -- văn bản nhận dạng được
  char_hits    boolean[],                     -- chữ nào nói đúng (kết quả scoreAttempt)
  audio_url    text,                          -- bản ghi âm, nếu người học cho lưu
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX speaking_attempts_user_idx     ON lan_luyen_noi (user_id, created_at DESC);
CREATE INDEX speaking_attempts_sentence_idx ON lan_luyen_noi (user_id, sentence_id);

CREATE TABLE lan_luyen_viet (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id     uuid NOT NULL REFERENCES nguoi_dung (id) ON DELETE CASCADE,
  char        text NOT NULL REFERENCES chu_han (char),
  accuracy    smallint NOT NULL CHECK (accuracy BETWEEN 0 AND 100),
  mistakes    smallint NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX writing_attempts_user_idx ON lan_luyen_viet (user_id, created_at DESC);


-- =====================================================================
-- 5. ĐỘNG LỰC: THỜI GIAN HỌC, XP, MỤC TIÊU, THÀNH TÍCH
-- =====================================================================

-- Tổng hợp theo ngày × loại hoạt động. Nguồn cho: thời gian học hôm nay/tổng,
-- biểu đồ 7 ngày, streak (chung và theo từng kỹ năng), tiến độ mục tiêu ngày.
CREATE TABLE hoat_dong_hang_ngay (
  user_id   uuid NOT NULL REFERENCES nguoi_dung (id) ON DELETE CASCADE,
  day       date NOT NULL,                    -- theo múi giờ người học
  activity  text NOT NULL CHECK (activity IN
            ('lesson', 'review', 'listening', 'speaking', 'reading', 'writing', 'exam')),
  seconds   integer NOT NULL DEFAULT 0 CHECK (seconds >= 0),
  items     integer NOT NULL DEFAULT 0 CHECK (items >= 0),   -- số từ / câu / chữ đã làm
  PRIMARY KEY (user_id, day, activity)
);

-- Sổ cái XP. ref_key chống cộng trùng, ví dụ 'goal:vocab:2026-11-24', 'lesson:42'.
CREATE TABLE su_kien_xp (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id     uuid NOT NULL REFERENCES nguoi_dung (id) ON DELETE CASCADE,
  amount      integer NOT NULL,
  reason      text NOT NULL,                  -- 'daily_goal', 'lesson_completed', 'quiz', 'achievement', ...
  ref_key     text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, ref_key)
);

-- Mục tiêu hằng ngày: "Học 20 từ +50 XP", "Nghe 10 phút +30 XP", ...
-- Tiến độ đọc từ hoat_dong_hang_ngay; "đã xong" = có su_kien_xp với ref_key 'goal:<code>:<ngày>'.
CREATE TABLE mau_muc_tieu_hang_ngay (
  id         smallint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  code       text NOT NULL UNIQUE,            -- 'vocab'
  label      text NOT NULL,                   -- 'Học 20 từ'
  activity   text NOT NULL,                   -- khớp hoat_dong_hang_ngay.activity
  metric     text NOT NULL CHECK (metric IN ('items', 'minutes')),
  target     smallint NOT NULL CHECK (target > 0),
  xp_reward  smallint NOT NULL DEFAULT 0,
  position   smallint NOT NULL DEFAULT 0,
  is_active  boolean  NOT NULL DEFAULT true
);

CREATE TABLE thanh_tuu (
  id           smallint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  code         text NOT NULL UNIQUE,          -- 'streak-7'
  title        text NOT NULL,                 -- 'Huy chương 7 ngày'
  description  text,
  icon         text,
  category     text NOT NULL CHECK (category IN
               ('streak', 'bai_hoc', 'vocabulary', 'listening', 'speaking', 'writing', 'xp')),
  threshold    integer NOT NULL,              -- 7 ngày, 35 bài, ...
  xp_reward    smallint NOT NULL DEFAULT 0
);

CREATE TABLE thanh_tuu_nguoi_dung (
  user_id         uuid     NOT NULL REFERENCES nguoi_dung (id) ON DELETE CASCADE,
  achievement_id  smallint NOT NULL REFERENCES thanh_tuu (id) ON DELETE CASCADE,
  earned_at       timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, achievement_id)
);


-- =====================================================================
-- HÀM TIỆN ÍCH
-- =====================================================================

CREATE FUNCTION user_tz(p_user uuid) RETURNS text
LANGUAGE sql STABLE AS $$
  SELECT coalesce((SELECT timezone FROM cai_dat_nguoi_dung WHERE user_id = p_user), 'Asia/Ho_Chi_Minh')
$$;

-- "Hôm nay" theo múi giờ của người học.
CREATE FUNCTION local_today(p_user uuid) RETURNS date
LANGUAGE sql STABLE AS $$
  SELECT (now() AT TIME ZONE user_tz(p_user))::date
$$;

-- Level n cần 20·n·(n−1) XP: 0 → Lv1, 40 → Lv2, 1120 → Lv8, 1440 → Lv9.
CREATE FUNCTION level_for_xp(p_xp integer) RETURNS smallint
LANGUAGE sql IMMUTABLE PARALLEL SAFE AS $$
  SELECT floor((1 + sqrt(1 + greatest(p_xp, 0) / 5.0)) / 2)::smallint
$$;

-- Cộng thời gian/số mục vào ngày hôm nay và nối streak. Gọi mỗi khi người học
-- hoàn thành một phần (hoặc theo nhịp heartbeat từ client).
CREATE FUNCTION record_activity(p_user uuid, p_activity text, p_seconds integer, p_items integer DEFAULT 0)
RETURNS void LANGUAGE plpgsql AS $$
DECLARE
  v_today date := local_today(p_user);
BEGIN
  INSERT INTO hoat_dong_hang_ngay (user_id, day, activity, seconds, items)
  VALUES (p_user, v_today, p_activity, p_seconds, p_items)
  ON CONFLICT (user_id, day, activity) DO UPDATE
    SET seconds = hoat_dong_hang_ngay.seconds + EXCLUDED.seconds,
        items   = hoat_dong_hang_ngay.items   + EXCLUDED.items;

  UPDATE nguoi_dung SET
    current_streak = CASE
      WHEN last_study_date = v_today     THEN current_streak
      WHEN last_study_date = v_today - 1 THEN current_streak + 1
      ELSE 1 END,
    longest_streak = greatest(longest_streak, CASE
      WHEN last_study_date = v_today     THEN current_streak
      WHEN last_study_date = v_today - 1 THEN current_streak + 1
      ELSE 1 END),
    last_study_date = v_today,
    updated_at = now()
  WHERE id = p_user;
END
$$;

-- Cộng XP một lần duy nhất cho mỗi ref_key. Trả về false nếu đã cộng trước đó.
CREATE FUNCTION award_xp(p_user uuid, p_amount integer, p_reason text, p_ref_key text DEFAULT NULL)
RETURNS boolean LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO su_kien_xp (user_id, amount, reason, ref_key)
  VALUES (p_user, p_amount, p_reason, p_ref_key)
  ON CONFLICT (user_id, ref_key) DO NOTHING;
  IF NOT FOUND THEN
    RETURN false;
  END IF;

  UPDATE nguoi_dung SET
    total_xp   = total_xp + p_amount,
    level      = level_for_xp(total_xp + p_amount),
    updated_at = now()
  WHERE id = p_user;
  RETURN true;
END
$$;
