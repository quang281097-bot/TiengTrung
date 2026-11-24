BEGIN;

ALTER TABLE bai_doc
  ADD COLUMN IF NOT EXISTS important_vocabulary jsonb NOT NULL DEFAULT '[]'::jsonb
  CHECK (jsonb_typeof(important_vocabulary) = 'array');

WITH lexicon (hsk_level, position, hanzi, pinyin, meaning_vi) AS (
  VALUES
    (1, 1, '起床', 'qǐchuáng', 'thức dậy'),
    (1, 2, '牛奶', 'niúnǎi', 'sữa'),
    (1, 3, '学校', 'xuéxiào', 'trường học'),
    (1, 4, '家', 'jiā', 'nhà, gia đình'),
    (1, 5, '朋友', 'péngyou', 'bạn bè'),
    (1, 6, '公共汽车', 'gōnggòng qìchē', 'xe buýt'),
    (1, 7, '苹果', 'píngguǒ', 'táo'),
    (1, 8, '天气', 'tiānqì', 'thời tiết'),
    (1, 9, '房间', 'fángjiān', 'phòng'),
    (1, 10, '星期六', 'xīngqīliù', 'thứ Bảy'),
    (1, 11, '吃饭', 'chīfàn', 'ăn cơm'),
    (1, 12, '水果', 'shuǐguǒ', 'trái cây'),
    (2, 1, '银行', 'yínháng', 'ngân hàng'),
    (2, 2, '超市', 'chāoshì', 'siêu thị'),
    (2, 3, '邻居', 'línjū', 'hàng xóm'),
    (2, 4, '周末', 'zhōumò', 'cuối tuần'),
    (2, 5, '爬山', 'páshān', 'leo núi'),
    (2, 6, '做饭', 'zuòfàn', 'nấu ăn'),
    (2, 7, '奶奶', 'nǎinai', 'bà nội'),
    (2, 8, '手机', 'shǒujī', 'điện thoại'),
    (2, 9, '暑假', 'shǔjià', 'nghỉ hè'),
    (2, 10, '书店', 'shūdiàn', 'hiệu sách'),
    (2, 11, '散步', 'sànbù', 'đi dạo'),
    (2, 12, '建议', 'jiànyì', 'lời khuyên, đề nghị'),
    (3, 1, '图书馆', 'túshūguǎn', 'thư viện'),
    (3, 2, '自行车', 'zìxíngchē', 'xe đạp'),
    (3, 3, '家乡', 'jiāxiāng', 'quê hương'),
    (3, 4, '调查', 'diàochá', 'khảo sát'),
    (3, 5, '合作', 'hézuò', 'hợp tác'),
    (3, 6, '复习', 'fùxí', 'ôn tập'),
    (3, 7, '环境', 'huánjìng', 'môi trường'),
    (3, 8, '锻炼', 'duànliàn', 'rèn luyện'),
    (3, 9, '习惯', 'xíguàn', 'thói quen'),
    (3, 10, '社区', 'shèqū', 'cộng đồng'),
    (3, 11, '传统', 'chuántǒng', 'truyền thống'),
    (3, 12, '发音', 'fāyīn', 'phát âm'),
    (4, 1, '拥堵', 'yōngdǔ', 'ùn tắc'),
    (4, 2, '远程办公', 'yuǎnchéng bàngōng', 'làm việc từ xa'),
    (4, 3, '急救', 'jíjiù', 'sơ cứu'),
    (4, 4, '营养', 'yíngyǎng', 'dinh dưỡng'),
    (4, 5, '文化遗产', 'wénhuà yíchǎn', 'di sản văn hóa'),
    (4, 6, '包装', 'bāozhuāng', 'bao bì'),
    (4, 7, '分工', 'fēngōng', 'phân công'),
    (4, 8, '展品', 'zhǎnpǐn', 'hiện vật trưng bày'),
    (4, 9, '效率', 'xiàolǜ', 'hiệu suất'),
    (4, 10, '管理', 'guǎnlǐ', 'quản lý'),
    (4, 11, '交通', 'jiāotōng', 'giao thông'),
    (4, 12, '计划', 'jìhuà', 'kế hoạch'),
    (5, 1, '数字', 'shùzì', 'kỹ thuật số'),
    (5, 2, '木雕', 'mùdiāo', 'điêu khắc gỗ'),
    (5, 3, '景点', 'jǐngdiǎn', 'điểm tham quan'),
    (5, 4, '顾客', 'gùkè', 'khách hàng'),
    (5, 5, '阅读', 'yuèdú', 'đọc sách'),
    (5, 6, '职业', 'zhíyè', 'nghề nghiệp'),
    (5, 7, '改建', 'gǎijiàn', 'cải tạo'),
    (5, 8, '失败', 'shībài', 'thất bại'),
    (5, 9, '隐私', 'yǐnsī', 'quyền riêng tư'),
    (5, 10, '研究', 'yánjiū', 'nghiên cứu'),
    (5, 11, '数据', 'shùjù', 'dữ liệu'),
    (5, 12, '风险', 'fēngxiǎn', 'rủi ro'),
    (6, 1, '自动化', 'zìdònghuà', 'tự động hóa'),
    (6, 2, '公共空间', 'gōnggòng kōngjiān', 'không gian công cộng'),
    (6, 3, '知识', 'zhīshi', 'tri thức'),
    (6, 4, '传承', 'chuánchéng', 'kế thừa, truyền lại'),
    (6, 5, '可持续', 'kě chíxù', 'bền vững'),
    (6, 6, '议题', 'yìtí', 'chủ đề thảo luận'),
    (6, 7, '城市记忆', 'chéngshì jìyì', 'ký ức đô thị'),
    (6, 8, '人工智能', 'réngōng zhìnéng', 'trí tuệ nhân tạo'),
    (6, 9, '不确定性', 'bù quèdìngxìng', 'sự không chắc chắn'),
    (6, 10, '证据', 'zhèngjù', 'bằng chứng'),
    (6, 11, '设计', 'shèjì', 'thiết kế'),
    (6, 12, '责任', 'zérèn', 'trách nhiệm')
), vocabulary_by_reading AS (
  SELECT r.id,
         coalesce(
           jsonb_agg(jsonb_build_object(
             'hanzi', matched.hanzi,
             'pinyin', matched.pinyin,
             'meaningVi', matched.meaning_vi
           ) ORDER BY matched.position) FILTER (WHERE matched.hanzi IS NOT NULL),
           jsonb_build_array(jsonb_build_object(
             'hanzi', coalesce(nullif(r.title_zh, ''), r.title_vi),
             'pinyin', '',
             'meaningVi', r.title_vi
           ))
         ) AS items
  FROM bai_doc r
  JOIN khoa_hoc c ON c.id = r.course_id
  LEFT JOIN LATERAL (
    SELECT l.hanzi, l.pinyin, l.meaning_vi, l.position
    FROM lexicon l
    WHERE l.hsk_level = c.hsk_level
      AND strpos(r.passage_zh, l.hanzi) > 0
    ORDER BY l.position
    LIMIT 8
  ) matched ON true
  GROUP BY r.id
)
UPDATE bai_doc r
SET important_vocabulary = v.items,
    updated_at = now()
FROM vocabulary_by_reading v
WHERE r.id = v.id
  AND jsonb_array_length(r.important_vocabulary) = 0;

COMMIT;