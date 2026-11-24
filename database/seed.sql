-- =====================================================================
--  Dữ liệu mẫu, chuyển từ src/data/*.ts
--  Chạy sau schema.sql. Người học mẫu: Minh Anh (id 11111111-...).
--  Ngày tháng tính tương đối theo "hôm nay" nên chạy lúc nào cũng ra số
--  liệu giống trên dashboard: streak 7 ngày, 24 bài đã học, 12,5 giờ, 12 thẻ đến hạn.
-- =====================================================================
BEGIN;

-- ---------------------------------------------------------------- Khoá học & chủ đề
INSERT INTO khoa_hoc (slug, title, subtitle, hsk_level, position, is_published) VALUES
  ('hsk-1', 'HSK 1', 'Nhập môn',      1, 1, true),
  ('hsk-2', 'HSK 2', 'Sơ cấp',        2, 2, true),
  ('hsk-3', 'HSK 3', 'Sơ trung cấp',  3, 3, true),
  ('hsk-4', 'HSK 4', 'Trung cấp',     4, 4, true),
  ('hsk-5', 'HSK 5', 'Trung cao cấp', 5, 5, true),
  ('hsk-6', 'HSK 6', 'Cao cấp',       6, 6, true);

INSERT INTO bai_doc (course_id, slug, title_vi, title_zh, passage_zh, pinyin, translation_vi, est_minutes, is_published)
SELECT c.id, r.slug, r.title_vi, r.title_zh, r.passage_zh, r.pinyin, r.translation_vi, r.est_minutes, true
FROM (VALUES
  ('hsk-1', 'hsk1-buoi-sang', 'Buổi sáng của An', '安的早晨', '安早上七点起床。他喝牛奶，然后去学校。', 'Ān zǎoshang qī diǎn qǐchuáng. Tā hē niúnǎi, ránhòu qù xuéxiào.', 'An thức dậy lúc bảy giờ sáng. Bạn ấy uống sữa rồi đi học.', 3),
  ('hsk-2', 'hsk2-cuoi-tuan', 'Cuối tuần của tôi', '我的周末', '星期六我和朋友去公园。我们先跑步，再一起吃午饭。', 'Xīngqīliù wǒ hé péngyou qù gōngyuán. Wǒmen xiān pǎobù, zài yìqǐ chī wǔfàn.', 'Thứ Bảy tôi đi công viên với bạn. Chúng tôi chạy bộ trước rồi cùng ăn trưa.', 4),
  ('hsk-3', 'hsk3-tiem-sach-nho', 'Hiệu sách nhỏ', '小书店', '我家附近有一家小书店。老板每天推荐一本新书，很多学生放学后去那里看书。', 'Wǒ jiā fùjìn yǒu yì jiā xiǎo shūdiàn. Lǎobǎn měitiān tuījiàn yì běn xīn shū, hěn duō xuésheng fàngxué hòu qù nàli kàn shū.', 'Gần nhà tôi có một hiệu sách nhỏ. Chủ tiệm mỗi ngày giới thiệu một cuốn sách mới; nhiều học sinh đến đó đọc sau giờ học.', 5),
  ('hsk-4', 'hsk4-di-chuyen-xanh', 'Một chuyến đi xanh', '绿色出行', '为了减少空气污染，越来越多的人选择骑自行车或乘公共汽车上班。虽然有时需要多花一点时间，但城市变得更安静了。', 'Wèile jiǎnshǎo kōngqì wūrǎn, yuèláiyuè duō de rén xuǎnzé qí zìxíngchē huò chéng gōnggòng qìchē shàngbān. Suīrán yǒushí xūyào duō huā yìdiǎn shíjiān, dàn chéngshì biàn de gèng ānjìng le.', 'Để giảm ô nhiễm không khí, ngày càng nhiều người chọn đi xe đạp hoặc xe buýt đến nơi làm việc. Dù đôi khi mất thêm chút thời gian, thành phố trở nên yên tĩnh hơn.', 7),
  ('hsk-5', 'hsk5-hoc-tu-thu-vien', 'Học tập ở thư viện', '在图书馆学习', '考试前，林娜习惯把任务分成几个小部分。她先查资料，再整理笔记，最后和同学讨论难题。她发现，有计划地学习比熬夜更有效。', 'Kǎoshì qián, Lín Nà xíguàn bǎ rènwu fēn chéng jǐ ge xiǎo bùfen. Tā xiān chá zīliào, zài zhěnglǐ bǐjì, zuìhòu hé tóngxué tǎolùn nántí. Tā fāxiàn, yǒu jìhuà de xuéxí bǐ áoyè gèng yǒuxiào.', 'Trước kỳ thi, Lâm Na thường chia nhiệm vụ thành vài phần nhỏ. Cô tra cứu tài liệu, sắp xếp ghi chú rồi thảo luận câu khó với bạn học. Cô nhận ra học có kế hoạch hiệu quả hơn thức khuya.', 8),
  ('hsk-6', 'hsk6-thoi-quen-doc-sach', 'Thói quen đọc sách', '阅读的习惯', '阅读并不只是获取信息，也是一种整理思路的方式。当人们愿意停下来理解不同的观点，讨论就不再是为了证明谁对谁错，而是共同寻找更全面的答案。', 'Yuèdú bìng bù zhǐ shì huòqǔ xìnxī, yě shì yì zhǒng zhěnglǐ sīlù de fāngshì. Dāng rénmen yuànyì tíng xiàlái lǐjiě bùtóng de guāndiǎn, tǎolùn jiù bú zài shì wèile zhèngmíng shéi duì shéi cuò, ér shì gòngtóng xúnzhǎo gèng quánmiàn de dá''àn.', 'Đọc sách không chỉ để tiếp nhận thông tin mà còn là cách sắp xếp suy nghĩ. Khi mọi người sẵn lòng dừng lại để hiểu những góc nhìn khác nhau, thảo luận không còn nhằm chứng minh ai đúng ai sai mà trở thành quá trình cùng tìm câu trả lời toàn diện hơn.', 10)
) AS r (course_slug, slug, title_vi, title_zh, passage_zh, pinyin, translation_vi, est_minutes)
JOIN khoa_hoc c ON c.slug = r.course_slug
ON CONFLICT (slug) DO UPDATE SET
  course_id = EXCLUDED.course_id,
  title_vi = EXCLUDED.title_vi,
  title_zh = EXCLUDED.title_zh,
  passage_zh = EXCLUDED.passage_zh,
  pinyin = EXCLUDED.pinyin,
  translation_vi = EXCLUDED.translation_vi,
  est_minutes = EXCLUDED.est_minutes,
  is_published = true,
  updated_at = now();

INSERT INTO chu_de (slug, name_vi, name_zh) VALUES
  ('greetings',  'Chào hỏi',           '问候'),
  ('family',     'Gia đình',           '家人'),
  ('food',       'Món ăn',             '食物'),
  ('travel',     'Du lịch',            '旅游'),
  ('daily-life', 'Giao tiếp đời sống', '日常'),
  ('shopping',   'Mua sắm',            '购物');

-- ---------------------------------------------------------------- Bài học
-- Khung: HSK 1 có 16 bài, HSK 2 có 24 bài. Bài 09 của HSK 2 có đủ nội dung.
INSERT INTO bai_hoc (course_id, number, slug, title, is_published)
SELECT c.id, n, c.slug || '-' || lpad(n::text, 2, '0'), 'Bài ' || lpad(n::text, 2, '0'), true
FROM khoa_hoc c
CROSS JOIN LATERAL generate_series(1, CASE c.slug WHEN 'hsk-1' THEN 16 ELSE 24 END) AS n
WHERE c.slug IN ('hsk-1', 'hsk-2');

UPDATE bai_hoc l
SET title = v.title, title_zh = v.title_zh, topic_id = t.id
FROM (VALUES
  ('hsk-1-01', 'Chào hỏi', '你好', 'greetings'),
  ('hsk-1-02', 'Gia đình', '家人', 'family'),
  ('hsk-1-03', 'Món ăn',   '食物', 'food')
) AS v (slug, title, title_zh, topic)
JOIN chu_de t ON t.slug = v.topic
WHERE l.slug = v.slug;

UPDATE bai_hoc SET
  topic_id      = (SELECT id FROM chu_de WHERE slug = 'daily-life'),
  title         = 'Một ngày của tôi',
  title_zh      = '我的一天',
  description   = 'Nói về giờ giấc và những việc bạn làm trong một ngày.',
  est_minutes   = 20,
  cover_hanzi   = '日常',
  cover_caption = 'Cuộc sống hằng ngày',
  goals         = ARRAY['Nói giờ với 点 và 半', 'Hỏi giờ với 几点', 'Kể lịch sinh hoạt trong một ngày'],
  steps = '[
    {"kind": "vocabulary", "label": "Từ vựng",   "intro": "Nghe và ghi nhớ 10 từ mới của bài. Bấm biểu tượng loa để nghe phát âm."},
    {"kind": "patterns",   "label": "Mẫu câu",   "intro": "Ba cấu trúc câu dùng để nói về giờ giấc và lịch sinh hoạt."},
    {"kind": "dialogue",   "label": "Hội thoại", "intro": "Tiểu Minh và Anna kể về một ngày của mình. Bấm vào từng câu để nghe lại."},
    {"kind": "quiz",       "label": "Luyện tập", "intro": "Trả lời 3 câu hỏi để kiểm tra nhanh những gì bạn vừa học."},
    {"kind": "summary",    "label": "Tổng kết",  "intro": "Xem lại kết quả và chọn bước học tiếp theo."}
  ]',
  notes = '[
    {"title": "Nói giờ với 点 và 半",          "body": "七点 = 7 giờ · 七点半 = 7 giờ rưỡi."},
    {"title": "Thời gian đứng trước động từ", "body": "我七点起床。Không nói 我起床七点。"},
    {"title": "Hỏi giờ với 几点",              "body": "你几点上班？— Mấy giờ bạn đi làm?"}
  ]'
WHERE slug = 'hsk-2-09';

-- ---------------------------------------------------------------- Câu
INSERT INTO cau_tieng_trung (hanzi, pinyin, syllables, meaning_vi, hsk_level) VALUES
  -- mẫu câu bài 09 (câu đầu cũng dùng cho luyện nói)
  ('我每天早上七点起床。', 'Wǒ měitiān zǎoshang qī diǎn qǐchuáng.', 'wǒ měi tiān zǎo shang qī diǎn qǐ chuáng', 'Mỗi sáng tôi thức dậy lúc 7 giờ.', 2),
  ('你几点上班？',         'Nǐ jǐ diǎn shàngbān?',                 NULL, 'Mấy giờ bạn đi làm?', 2),
  ('我晚上十一点半睡觉。', 'Wǒ wǎnshang shíyī diǎn bàn shuìjiào.', NULL, 'Tôi đi ngủ lúc 11 giờ rưỡi tối.', 2),
  -- hội thoại bài 09
  ('安娜，你每天几点起床？',         'Ānnà, nǐ měitiān jǐ diǎn qǐchuáng?',                     NULL, 'Anna, mỗi ngày bạn dậy lúc mấy giờ?', 2),
  ('我六点半起床。你呢？',           'Wǒ liù diǎn bàn qǐchuáng. Nǐ ne?',                       NULL, 'Mình dậy lúc 6 giờ rưỡi. Còn bạn?', 2),
  ('我七点起床，八点上班。',         'Wǒ qī diǎn qǐchuáng, bā diǎn shàngbān.',                 NULL, 'Mình dậy lúc 7 giờ, 8 giờ đi làm.', 2),
  ('你中午在哪儿吃饭？',             'Nǐ zhōngwǔ zài nǎr chīfàn?',                             NULL, 'Buổi trưa bạn ăn cơm ở đâu?', 2),
  ('我在公司吃饭。晚上我常常看书。', 'Wǒ zài gōngsī chīfàn. Wǎnshang wǒ chángcháng kàn shū.', NULL, 'Mình ăn ở công ty. Buổi tối mình thường đọc sách.', 2),
  ('我晚上喜欢跑步。',               'Wǒ wǎnshang xǐhuan pǎobù.',                              NULL, 'Buổi tối mình thích chạy bộ.', 2),
  -- luyện nghe: ở quán cà phê
  ('你好，你想喝点儿什么？', 'Nǐ hǎo, nǐ xiǎng hē diǎnr shénme?', NULL, 'Chào bạn, bạn muốn uống gì?', 2),
  ('我要一杯咖啡，不要糖。', 'Wǒ yào yì bēi kāfēi, bú yào táng.', NULL, 'Cho tôi một cốc cà phê, không đường.', 2),
  ('要大杯还是小杯？',       'Yào dà bēi háishi xiǎo bēi?',       NULL, 'Cốc lớn hay cốc nhỏ ạ?', 2),
  ('大杯。多少钱？',         'Dà bēi. Duōshao qián?',             NULL, 'Cốc lớn. Bao nhiêu tiền?', 2),
  ('二十八块。',             'Èrshíbā kuài.',                     NULL, '28 tệ.', 2),
  ('好的，给你。',           'Hǎo de, gěi nǐ.',                   NULL, 'Vâng, gửi bạn.', 2),
  -- luyện nghe: hỏi đường
  ('请问，地铁站怎么走？',       'Qǐngwèn, dìtiězhàn zěnme zǒu?',               NULL, 'Xin hỏi, ga tàu điện ngầm đi thế nào?', 2),
  ('一直往前走，到路口往右拐。', 'Yìzhí wǎng qián zǒu, dào lùkǒu wǎng yòu guǎi.', NULL, 'Cứ đi thẳng, đến ngã tư thì rẽ phải.', 2),
  ('远吗？',                     'Yuǎn ma?',                                    NULL, 'Có xa không?', 2),
  ('不远，走路五分钟就到了。',   'Bù yuǎn, zǒulù wǔ fēnzhōng jiù dào le.',      NULL, 'Không xa, đi bộ 5 phút là tới.', 2),
  ('谢谢你！',                   'Xièxie nǐ!',                                  NULL, 'Cảm ơn bạn!', 1),
  ('不客气。',                   'Bú kèqi.',                                    NULL, 'Không có gì.', 1),
  -- luyện nghe: kế hoạch cuối tuần
  ('这个周末你有什么打算？',       'Zhège zhōumò nǐ yǒu shénme dǎsuàn?',          NULL, 'Cuối tuần này bạn có dự định gì?', 2),
  ('星期六我想去爬山。',           'Xīngqīliù wǒ xiǎng qù páshān.',               NULL, 'Thứ Bảy mình muốn đi leo núi.', 2),
  ('星期天呢？',                   'Xīngqītiān ne?',                              NULL, 'Còn Chủ nhật?', 2),
  ('星期天我在家休息，看看电影。', 'Xīngqītiān wǒ zài jiā xiūxi, kànkan diànyǐng.', NULL, 'Chủ nhật mình ở nhà nghỉ ngơi, xem phim.', 2),
  ('我也想去爬山，我们一起去吧！', 'Wǒ yě xiǎng qù páshān, wǒmen yìqǐ qù ba!',    NULL, 'Mình cũng muốn đi leo núi, chúng ta cùng đi nhé!', 2),
  -- luyện nói
  ('你好，我叫明英。',   'Nǐ hǎo, wǒ jiào Míngyīng.',         'nǐ hǎo wǒ jiào Míng yīng',          'Xin chào, tôi tên là Minh Anh.', 1),
  ('我是越南人。',       'Wǒ shì Yuènánrén.',                 'wǒ shì Yuè nán rén',                'Tôi là người Việt Nam.', 1),
  ('我喜欢喝咖啡。',     'Wǒ xǐhuan hē kāfēi.',               'wǒ xǐ huan hē kā fēi',              'Tôi thích uống cà phê.', 2),
  ('周末我常常去爬山。', 'Zhōumò wǒ chángcháng qù páshān.',   'zhōu mò wǒ cháng cháng qù pá shān', 'Cuối tuần tôi thường đi leo núi.', 2),
  ('我在学习汉语。',     'Wǒ zài xuéxí Hànyǔ.',               'wǒ zài xué xí Hàn yǔ',              'Tôi đang học tiếng Trung.', 1),
  -- câu ví dụ của từ trong thẻ ôn tập
  ('我喜欢喝茶。',       'Wǒ xǐhuan hē chá.',          NULL, 'Tôi thích uống trà.', 1),
  ('他是我的好朋友。',   'Tā shì wǒ de hǎo péngyou.',  NULL, 'Anh ấy là bạn tốt của tôi.', 1),
  ('我每天早上喝咖啡。', 'Wǒ měitiān zǎoshang hē kāfēi.', NULL, 'Sáng nào tôi cũng uống cà phê.', 2),
  ('我们的学校很大。',   'Wǒmen de xuéxiào hěn dà.',   NULL, 'Trường của chúng tôi rất rộng.', 1),
  ('商店几点关门？',     'Shāngdiàn jǐ diǎn guānmén?', NULL, 'Cửa hàng mấy giờ đóng cửa?', 1),
  ('你明天有时间吗？',   'Nǐ míngtiān yǒu shíjiān ma?', NULL, 'Ngày mai bạn có thời gian không?', 2),
  ('我在准备考试。',     'Wǒ zài zhǔnbèi kǎoshì.',     NULL, 'Tôi đang chuẩn bị đi thi.', 2),
  ('我想去北京旅游。',   'Wǒ xiǎng qù Běijīng lǚyóu.', NULL, 'Tôi muốn đi du lịch Bắc Kinh.', 2),
  ('这件衣服很便宜。',   'Zhè jiàn yīfu hěn piányi.',  NULL, 'Bộ quần áo này rất rẻ.', 2),
  ('我已经吃饭了。',     'Wǒ yǐjīng chīfàn le.',       NULL, 'Tôi ăn cơm rồi.', 2),
  ('你累了，休息一下吧。', 'Nǐ lèi le, xiūxi yíxià ba.', NULL, 'Bạn mệt rồi, nghỉ một chút đi.', 2),
  ('我每天都运动。',     'Wǒ měitiān dōu yùndòng.',    NULL, 'Ngày nào tôi cũng tập thể thao.', 2),
  -- câu hôm nay
  ('你好，我叫 Quang。', 'Nǐ hǎo, wǒ jiào Quang.', NULL, 'Xin chào, tôi tên là Quang.', 1);

-- ---------------------------------------------------------------- Từ vựng
INSERT INTO tu_vung (hanzi, pinyin, meaning_vi, part_of_speech, hsk_level) VALUES
  -- bài 09
  ('起床', 'qǐchuáng', 'thức dậy',          'động từ',   2),
  ('早上', 'zǎoshang', 'buổi sáng',         'danh từ',   2),
  ('上班', 'shàngbān', 'đi làm',            'động từ',   2),
  ('中午', 'zhōngwǔ',  'buổi trưa',         'danh từ',   2),
  ('下午', 'xiàwǔ',    'buổi chiều',        'danh từ',   2),
  ('晚上', 'wǎnshang', 'buổi tối',          'danh từ',   2),
  ('睡觉', 'shuìjiào', 'đi ngủ',            'động từ',   2),
  ('每天', 'měitiān',  'mỗi ngày',          'danh từ',   2),
  ('点',   'diǎn',     'giờ (giờ đồng hồ)', 'lượng từ',  2),
  ('半',   'bàn',      'rưỡi, một nửa',     'số từ',     2),
  -- thẻ ôn tập
  ('喜欢', 'xǐhuan',    'thích',              'động từ',  1),
  ('朋友', 'péngyou',   'bạn bè',             'danh từ',  1),
  ('学校', 'xuéxiào',   'trường học',         'danh từ',  1),
  ('商店', 'shāngdiàn', 'cửa hàng',           'danh từ',  1),
  ('咖啡', 'kāfēi',     'cà phê',             'danh từ',  2),
  ('时间', 'shíjiān',   'thời gian',          'danh từ',  2),
  ('准备', 'zhǔnbèi',   'chuẩn bị',           'động từ',  2),
  ('旅游', 'lǚyóu',     'du lịch',            'động từ',  2),
  ('便宜', 'piányi',    'rẻ',                 'tính từ',  2),
  ('已经', 'yǐjīng',    'đã (rồi)',           'phó từ',   2),
  ('休息', 'xiūxi',     'nghỉ ngơi',          'động từ',  2),
  ('运动', 'yùndòng',   'vận động, thể thao', 'động từ',  2);

INSERT INTO vi_du_tu_vung (word_id, sentence_id, position)
SELECT w.id, s.id, 1
FROM (VALUES
  ('喜欢', '我喜欢喝茶。'),     ('朋友', '他是我的好朋友。'),   ('咖啡', '我每天早上喝咖啡。'),
  ('学校', '我们的学校很大。'), ('商店', '商店几点关门？'),     ('时间', '你明天有时间吗？'),
  ('准备', '我在准备考试。'),   ('旅游', '我想去北京旅游。'),   ('便宜', '这件衣服很便宜。'),
  ('已经', '我已经吃饭了。'),   ('休息', '你累了，休息一下吧。'), ('运动', '我每天都运动。'),
  ('起床', '我每天早上七点起床。')
) AS v (word, sentence)
JOIN tu_vung w ON w.hanzi = v.word
JOIN cau_tieng_trung s ON s.hanzi = v.sentence;

INSERT INTO mau_ngu_phap (lesson_id, position, structure, sentence_id)
SELECT l.id, v.pos, v.structure, s.id
FROM (VALUES
  (1, 'Chủ ngữ + thời gian + động từ', '我每天早上七点起床。'),
  (2, 'Chủ ngữ + 几点 + động từ？',     '你几点上班？'),
  (3, 'Số + 点 + 半',                   '我晚上十一点半睡觉。')
) AS v (pos, structure, sentence)
JOIN bai_hoc l ON l.slug = 'hsk-2-09'
JOIN cau_tieng_trung s ON s.hanzi = v.sentence;

-- ---------------------------------------------------------------- Hội thoại & bài nghe
INSERT INTO nguoi_noi (slug, name_vi, name_zh, avatar) VALUES
  ('xiao-ming', 'Tiểu Minh',      '小明',   '明'),
  ('anna',      'Anna',           '安娜',   '安'),
  ('waiter',    'Phục vụ',        '服务员', '服'),
  ('passerby',  'Người đi đường', '路人',   '路');

INSERT INTO hoi_thoai (slug, title, title_zh, cover_hanzi, situation, topic_id, lesson_id, hsk_level, duration_sec, is_published)
SELECT v.slug, v.title, v.title_zh, v.cover, v.situation, t.id, l.id, 2, v.duration, true
FROM (VALUES
  ('hsk-2-09-dialogue', 'Một ngày của tôi',   '我的一天', '日常', 'Tiểu Minh và Anna kể về một ngày', 'daily-life', 'hsk-2-09', 90),
  ('cafe',              'Ở quán cà phê',      '在咖啡店', '咖啡', 'Gọi đồ uống và trả tiền',          'food',       NULL,       120),
  ('directions',        'Hỏi đường',          '问路',     '问路', 'Hỏi đường đến ga tàu điện ngầm',   'travel',     NULL,       240),
  ('weekend',           'Kế hoạch cuối tuần', '周末计划', '周末', 'Rủ bạn cùng đi leo núi',           'daily-life', NULL,       150)
) AS v (slug, title, title_zh, cover, situation, topic, lesson, duration)
JOIN chu_de t ON t.slug = v.topic
LEFT JOIN bai_hoc l ON l.slug = v.lesson;

INSERT INTO loi_thoai_hoi_thoai (dialogue_id, position, speaker_id, sentence_id)
SELECT d.id, v.pos, sp.id, s.id
FROM (VALUES
  ('hsk-2-09-dialogue', 1, 'xiao-ming', '安娜，你每天几点起床？'),
  ('hsk-2-09-dialogue', 2, 'anna',      '我六点半起床。你呢？'),
  ('hsk-2-09-dialogue', 3, 'xiao-ming', '我七点起床，八点上班。'),
  ('hsk-2-09-dialogue', 4, 'anna',      '你中午在哪儿吃饭？'),
  ('hsk-2-09-dialogue', 5, 'xiao-ming', '我在公司吃饭。晚上我常常看书。'),
  ('hsk-2-09-dialogue', 6, 'anna',      '我晚上喜欢跑步。'),
  ('cafe', 1, 'waiter', '你好，你想喝点儿什么？'),
  ('cafe', 2, 'anna',   '我要一杯咖啡，不要糖。'),
  ('cafe', 3, 'waiter', '要大杯还是小杯？'),
  ('cafe', 4, 'anna',   '大杯。多少钱？'),
  ('cafe', 5, 'waiter', '二十八块。'),
  ('cafe', 6, 'anna',   '好的，给你。'),
  ('directions', 1, 'xiao-ming', '请问，地铁站怎么走？'),
  ('directions', 2, 'passerby',  '一直往前走，到路口往右拐。'),
  ('directions', 3, 'xiao-ming', '远吗？'),
  ('directions', 4, 'passerby',  '不远，走路五分钟就到了。'),
  ('directions', 5, 'xiao-ming', '谢谢你！'),
  ('directions', 6, 'passerby',  '不客气。'),
  ('weekend', 1, 'anna',      '这个周末你有什么打算？'),
  ('weekend', 2, 'xiao-ming', '星期六我想去爬山。'),
  ('weekend', 3, 'anna',      '星期天呢？'),
  ('weekend', 4, 'xiao-ming', '星期天我在家休息，看看电影。'),
  ('weekend', 5, 'anna',      '我也想去爬山，我们一起去吧！')
) AS v (dialogue, pos, speaker, sentence)
JOIN hoi_thoai d ON d.slug = v.dialogue
JOIN nguoi_noi sp ON sp.slug = v.speaker
JOIN cau_tieng_trung s ON s.hanzi = v.sentence;

-- ---------------------------------------------------------------- Câu hỏi
INSERT INTO bai_kiem_tra (kind, lesson_id, title)
SELECT 'lesson', id, 'Luyện tập · ' || title FROM bai_hoc WHERE slug = 'hsk-2-09';

INSERT INTO bai_kiem_tra (kind, dialogue_id, title)
SELECT 'listening', id, title FROM hoi_thoai WHERE slug IN ('cafe', 'directions', 'weekend');

INSERT INTO cau_hoi_kiem_tra (quiz_id, position, prompt, options, correct_index)
SELECT q.id, v.pos, v.prompt, v.options, v.answer
FROM (VALUES
  ('hsk-2-09', 1, '“起床” nghĩa là gì?',                   ARRAY['Đi ngủ', 'Thức dậy', 'Đi làm', 'Ăn cơm'], 1),
  ('hsk-2-09', 2, 'Chọn cách nói đúng của “8 giờ rưỡi”.', ARRAY['八点半', '半八点', '八半点', '点八半'], 0),
  ('hsk-2-09', 3, 'Trong hội thoại, Anna dậy lúc mấy giờ?', ARRAY['6 giờ', '6 giờ rưỡi', '7 giờ', '8 giờ'], 1),
  ('cafe', 1, 'Anna gọi đồ uống gì?',    ARRAY['Trà sữa', 'Cà phê không đường', 'Cà phê có đường', 'Nước cam'], 1),
  ('cafe', 2, 'Anna chọn cốc cỡ nào?',   ARRAY['Cốc nhỏ', 'Cốc lớn'], 1),
  ('cafe', 3, 'Đồ uống giá bao nhiêu?',  ARRAY['18 tệ', '28 tệ', '82 tệ'], 1),
  ('directions', 1, 'Tiểu Minh muốn đi đâu?',         ARRAY['Bến xe buýt', 'Ga tàu điện ngầm', 'Nhà ga xe lửa', 'Sân bay'], 1),
  ('directions', 2, 'Đến ngã tư thì phải làm gì?',    ARRAY['Rẽ trái', 'Rẽ phải', 'Đi thẳng', 'Quay lại'], 1),
  ('directions', 3, 'Đi bộ mất bao lâu?',             ARRAY['5 phút', '10 phút', '15 phút'], 0),
  ('weekend', 1, 'Thứ Bảy Tiểu Minh định làm gì?',  ARRAY['Đi leo núi', 'Xem phim', 'Đi bơi'], 0),
  ('weekend', 2, 'Chủ nhật Tiểu Minh làm gì?',      ARRAY['Đi làm', 'Ở nhà nghỉ ngơi, xem phim', 'Đi du lịch'], 1),
  ('weekend', 3, 'Anna đề nghị điều gì?',           ARRAY['Cùng đi leo núi', 'Cùng xem phim', 'Cùng đi ăn'], 0)
) AS v (owner, pos, prompt, options, answer)
JOIN bai_kiem_tra q
  ON q.lesson_id   IN (SELECT id FROM bai_hoc   WHERE slug = v.owner)
  OR q.dialogue_id IN (SELECT id FROM hoi_thoai WHERE slug = v.owner);

-- ---------------------------------------------------------------- Luyện nói & viết
INSERT INTO bo_bai_luyen_noi (slug, title, topic_id, hsk_level, position)
SELECT 'self-intro-daily', 'Giới thiệu bản thân & thói quen hằng ngày', id, 1, 1
FROM chu_de WHERE slug = 'greetings';

INSERT INTO muc_luyen_noi (set_id, position, sentence_id, tip)
SELECT ss.id, v.pos, s.id, v.tip
FROM (VALUES
  (1, '你好，我叫明英。',     '你好: hai thanh 3 đứng liền nhau thì chữ đầu đọc thành thanh 2 — “ní hǎo”.'),
  (2, '我是越南人。',         '越南: “Yuè” thanh 4 hạ giọng dứt khoát, rồi “nán” thanh 2 đi lên.'),
  (3, '我每天早上七点起床。', '起床: “q” bật hơi mạnh, môi dẹt; “chuáng” uốn lưỡi rồi lên giọng.'),
  (4, '我喜欢喝咖啡。',       '喜欢: chữ 欢 đọc nhẹ và ngắn (thanh nhẹ) — “xǐhuan”.'),
  (5, '周末我常常去爬山。',   '常常: “ch” uốn lưỡi, hai thanh 2 cùng đi lên đều nhau.'),
  (6, '我在学习汉语。',       '汉语: “Hàn” thanh 4 rơi mạnh, “yǔ” thanh 3 hạ thấp giọng.')
) AS v (pos, sentence, tip)
JOIN bo_bai_luyen_noi ss ON ss.slug = 'self-intro-daily'
JOIN cau_tieng_trung s ON s.hanzi = v.sentence;

INSERT INTO chu_han (char, pinyin, meaning_vi, radical, stroke_count, hsk_level) VALUES
  ('你', 'nǐ',  'bạn', '亻', 7, 1),
  ('好', 'hǎo', 'tốt', '女', 6, 1),
  ('吃', 'chī', 'ăn',  '口', 6, 1);

INSERT INTO cau_tieng_trung_hang_ngay (day, sentence_id, explanation)
SELECT (now() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date, id, '叫 (jiào) dùng để nói tên: 我叫 + tên.'
FROM cau_tieng_trung WHERE hanzi = '你好，我叫 Quang。';

-- ---------------------------------------------------------------- Bộ từ
INSERT INTO bo_tu_vung (kind, title, hsk_level) VALUES
  ('hsk', 'HSK 1', 1),
  ('hsk', 'HSK 2', 2);
INSERT INTO bo_tu_vung (kind, title, lesson_id)
SELECT 'lesson', 'Bài 09 · Một ngày của tôi', id FROM bai_hoc WHERE slug = 'hsk-2-09';

INSERT INTO tu_trong_bo_tu_vung (deck_id, word_id, position)
SELECT d.id, w.id, row_number() OVER (PARTITION BY d.id ORDER BY w.id)
FROM bo_tu_vung d JOIN tu_vung w ON w.hsk_level = d.hsk_level
WHERE d.kind = 'hsk';

INSERT INTO tu_trong_bo_tu_vung (deck_id, word_id, position)
SELECT d.id, w.id, v.pos
FROM (VALUES (1,'起床'),(2,'早上'),(3,'上班'),(4,'中午'),(5,'下午'),
             (6,'晚上'),(7,'睡觉'),(8,'每天'),(9,'点'),(10,'半')) AS v (pos, word)
JOIN tu_vung w ON w.hanzi = v.word
JOIN bo_tu_vung d ON d.kind = 'lesson';

-- ---------------------------------------------------------------- Mục tiêu ngày & thành tích
INSERT INTO mau_muc_tieu_hang_ngay (code, label, activity, metric, target, xp_reward, position) VALUES
  ('vocab',     'Học 20 từ',       'review',    'items',   20, 50, 1),
  ('listening', 'Nghe 10 phút',    'listening', 'minutes', 10, 30, 2),
  ('speaking',  'Luyện nói 5 câu', 'speaking',  'items',    5, 50, 3),
  ('writing',   'Viết 10 chữ',     'writing',   'items',   10, 30, 4);

INSERT INTO thanh_tuu (code, title, description, icon, category, threshold, xp_reward) VALUES
  ('streak-7',   'Huy chương 7 ngày',  'Học 7 ngày liên tiếp',        '🔥', 'streak',     7,   50),
  ('streak-30',  'Bền bỉ 30 ngày',     'Học 30 ngày liên tiếp',       '🏅', 'streak',     30,  200),
  ('bai_hoc-10', 'Khởi đầu tốt',       'Hoàn thành 10 bài học',       '📚', 'bai_hoc',    10,  50),
  ('bai_hoc-35', 'Người học chăm chỉ', 'Hoàn thành 35 bài học',       '🏆', 'bai_hoc',    35,  100),
  ('speaking-7', 'Nói tốt hơn',        'Luyện nói 7 lần',             '🎤', 'speaking',   7,   30),
  ('vocab-100',  '100 từ đầu tiên',    'Thuộc 100 từ vựng',           '🧠', 'vocabulary', 100, 100);


-- =====================================================================
-- Người học mẫu
-- =====================================================================
INSERT INTO nguoi_dung (id, email, display_name, total_xp, level, current_streak, longest_streak, last_study_date)
VALUES ('11111111-1111-4111-8111-111111111111', 'minhanh@example.com', 'Minh Anh',
        1280, 8, 7, 45, (now() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date);

INSERT INTO cai_dat_nguoi_dung (user_id, target_hsk_level)
VALUES ('11111111-1111-4111-8111-111111111111', 2);

INSERT INTO khoa_hoc_nguoi_dung (user_id, course_id, status, started_at, completed_at)
SELECT '11111111-1111-4111-8111-111111111111', id,
       CASE slug WHEN 'hsk-1' THEN 'completed' ELSE 'current' END,
       now() - CASE slug WHEN 'hsk-1' THEN interval '60 days' ELSE interval '30 days' END,
       CASE slug WHEN 'hsk-1' THEN now() - interval '32 days' END
FROM khoa_hoc WHERE slug IN ('hsk-1', 'hsk-2');

-- HSK 1: 16 bài xong; HSK 2: bài 1–8 xong (6, 7, 8 trong 7 ngày qua); bài 9 đang học bước 3.
INSERT INTO tien_do_bai_hoc (user_id, lesson_id, current_step, completed_steps, started_at, last_activity_at, completed_at)
SELECT '11111111-1111-4111-8111-111111111111', l.id, 4, '{0,1,2,3,4}', t.done - interval '1 hour', t.done, t.done
FROM bai_hoc l
JOIN khoa_hoc c ON c.id = l.course_id
CROSS JOIN LATERAL (SELECT CASE c.slug
  WHEN 'hsk-1' THEN now() - make_interval(days => 55 - l.number)
  ELSE              now() - make_interval(days => (9 - l.number) * 2) END AS done) t
WHERE c.slug = 'hsk-1' OR (c.slug = 'hsk-2' AND l.number <= 8);

INSERT INTO tien_do_bai_hoc (user_id, lesson_id, current_step, completed_steps, started_at, last_activity_at)
SELECT '11111111-1111-4111-8111-111111111111', id, 2, '{0,1}', now() - interval '1 day', now() - interval '30 minutes'
FROM bai_hoc WHERE slug = 'hsk-2-09';

INSERT INTO bo_tu_vung_nguoi_dung (user_id, deck_id)
SELECT '11111111-1111-4111-8111-111111111111', id FROM bo_tu_vung;

-- Thẻ ôn tập: 12 thẻ đến hạn (4 HSK 1 · 8 HSK 2) + 4 từ bài 09 đã thuộc, hẹn ôn sau.
INSERT INTO the_on_tap (user_id, word_id, state, due_at, interval_days, ease, reps, last_reviewed_at)
SELECT '11111111-1111-4111-8111-111111111111', w.id, 'review',
       CASE WHEN w.hanzi IN ('起床', '早上', '上班', '中午')
            THEN now() + make_interval(days => 1 + (w.id % 5))
            ELSE now() - interval '2 hours' END,
       3 + (w.id % 7), 2.5, 3 + (w.id % 4), now() - interval '3 days'
FROM tu_vung w
WHERE w.hsk_level = 1
   OR w.hanzi IN ('咖啡', '时间', '准备', '旅游', '便宜', '已经', '休息', '运动', '起床', '早上', '上班', '中午');

-- Lịch sử ôn: 4 ngày trước mỗi ngày 6 thẻ, hôm nay 20 thẻ; 6/44 lần "Quên" → tỉ lệ nhớ 86%.
INSERT INTO lich_su_on_tap (user_id, word_id, rating, state_before, interval_before, interval_after, duration_ms, reviewed_at)
SELECT c.user_id, c.word_id,
       CASE WHEN i % 7 = 0 THEN 'again' WHEN i % 5 = 0 THEN 'hard' WHEN i % 3 = 0 THEN 'easy' ELSE 'good' END,
       'review', 2, 4, 4000 + (i * 137) % 5000,
       CASE WHEN i <= 24
            THEN ((now() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date - (4 - (i - 1) / 6) + time '20:00'
                  + make_interval(mins => i)) AT TIME ZONE 'Asia/Ho_Chi_Minh'
            ELSE now() - make_interval(secs => (44 - i) * 10) END
FROM generate_series(1, 44) AS i
JOIN LATERAL (
  SELECT user_id, word_id FROM the_on_tap ORDER BY word_id OFFSET (i % 16) LIMIT 1
) c ON true;

-- Thời gian học theo ngày (phút). 7 ngày gần nhất: 20, 35, 15, 40, 30, 45, 25.
-- Ngày -7 nghỉ → streak hiện tại 7. Ngày -52..-8: 45 ngày liền, 12 phút/ngày → streak dài nhất 45.
-- Tổng: 210 + 540 = 750 phút = 12,5 giờ.
INSERT INTO hoat_dong_hang_ngay (user_id, day, activity, seconds, items)
SELECT '11111111-1111-4111-8111-111111111111'::uuid,
       (now() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date - v.ago, v.activity, v.minutes * 60, v.items
FROM (VALUES
  (6, 'lesson', 20, 0),
  (5, 'lesson', 35, 0),
  (4, 'lesson',  7, 0), (4, 'review',  8, 6),
  (3, 'lesson', 14, 0), (3, 'review',  8, 6), (3, 'listening', 10, 1), (3, 'speaking', 8, 5),
  (2, 'lesson',  6, 0), (2, 'review',  8, 6), (2, 'listening',  8, 1), (2, 'speaking', 8, 5),
  (1, 'lesson', 15, 0), (1, 'review', 10, 6), (1, 'listening', 12, 1), (1, 'speaking', 8, 5),
  (0, 'lesson', 10, 0), (0, 'review',  8, 20), (0, 'listening', 4, 0), (0, 'speaking', 3, 3)
) AS v (ago, activity, minutes, items)
UNION ALL
SELECT '11111111-1111-4111-8111-111111111111'::uuid,
       (now() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date - ago, 'lesson', 12 * 60, 0
FROM generate_series(8, 52) AS ago;

INSERT INTO su_kien_xp (user_id, amount, reason, ref_key, created_at) VALUES
  ('11111111-1111-4111-8111-111111111111', 1230, 'import', 'seed:import', now() - interval '40 days'),
  ('11111111-1111-4111-8111-111111111111', 50, 'daily_goal',
   'goal:vocab:' || (now() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date, now() - interval '20 minutes');

-- Bài nghe: 7/9 câu đúng → nghe hiểu 78%.
INSERT INTO lan_lam_bai_kiem_tra (user_id, quiz_id, correct_count, total_count, finished_at)
SELECT '11111111-1111-4111-8111-111111111111', q.id, v.correct, 3, now() - make_interval(days => v.ago)
FROM (VALUES ('cafe', 3, 3), ('directions', 2, 2), ('weekend', 2, 1)) AS v (dialogue, correct, ago)
JOIN hoi_thoai d ON d.slug = v.dialogue
JOIN bai_kiem_tra q ON q.dialogue_id = d.id;

-- Luyện nói: điểm cao nhất 96 / 91 / 78, trung bình 10 lần gần nhất 86.
INSERT INTO lan_luyen_noi (user_id, sentence_id, score, transcript, created_at)
SELECT '11111111-1111-4111-8111-111111111111', s.id, v.score, v.sentence, now() - make_interval(hours => v.hours_ago)
FROM (VALUES
  ('你好，我叫明英。', 80, 72), ('你好，我叫明英。', 86, 70), ('你好，我叫明英。', 90, 48),
  ('你好，我叫明英。', 88, 46), ('你好，我叫明英。', 96, 24),
  ('我是越南人。', 82, 23), ('我是越南人。', 85, 22), ('我是越南人。', 84, 2), ('我是越南人。', 91, 1),
  ('我每天早上七点起床。', 78, 0)
) AS v (sentence, score, hours_ago)
JOIN cau_tieng_trung s ON s.hanzi = v.sentence;

INSERT INTO lan_luyen_viet (user_id, char, accuracy, mistakes, created_at) VALUES
  ('11111111-1111-4111-8111-111111111111', '你', 85, 1, now() - interval '3 days'),
  ('11111111-1111-4111-8111-111111111111', '好', 80, 2, now() - interval '2 days'),
  ('11111111-1111-4111-8111-111111111111', '吃', 78, 2, now() - interval '1 day');

INSERT INTO thanh_tuu_nguoi_dung (user_id, achievement_id, earned_at)
SELECT '11111111-1111-4111-8111-111111111111', id, now() - make_interval(days => v.ago)
FROM (VALUES ('streak-7', 40), ('streak-30', 17), ('bai_hoc-10', 45), ('speaking-7', 2)) AS v (code, ago)
JOIN thanh_tuu a ON a.code = v.code;

INSERT INTO thong_bao (user_id, kind, title, body, link)
VALUES ('11111111-1111-4111-8111-111111111111', 'new_lesson', 'Bài 10 đã sẵn sàng',
        'Học xong Bài 09 để mở Bài 10 của HSK 2.', '/bai_hoc?level=2');

COMMIT;
