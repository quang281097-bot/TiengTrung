import { getPool } from './db';

export type WritingCharItem = {
  char: string;
  pinyin: string;
  meaning: string;
  strokeCount?: number;
  radical?: string;
  hskLevel?: number;
};

export type WritingWordItem = {
  id: string;
  hanzi: string;
  pinyin: string;
  meaning: string;
  hskLevel: number;
};

export type WritingDeckItem = {
  id: string;
  title: string;
  subtitle: string;
  hskLevel: number;
  words: WritingWordItem[];
};

export type WritingPagePayload = {
  starterCharacters: WritingCharItem[];
  wordsByLevel: Record<number, WritingWordItem[]>;
  decks: WritingDeckItem[];
  charDictionary: Record<string, WritingCharItem>;
};

export const STARTER_CHARACTERS: WritingCharItem[] = [
  { char: '永', pinyin: 'yǒng', meaning: 'vĩnh viễn, mãi mãi', strokeCount: 5, hskLevel: 4 },
  { char: '远', pinyin: 'yuǎn', meaning: 'xa xôi, lâu dài', strokeCount: 7, hskLevel: 2 },
  { char: '学', pinyin: 'xué', meaning: 'học tập, nghiên cứu', strokeCount: 8, hskLevel: 1 },
  { char: '习', pinyin: 'xí', meaning: 'thực hành, ôn tập', strokeCount: 3, hskLevel: 1 },
  { char: '汉', pinyin: 'hàn', meaning: 'chữ Hán, người Hán', strokeCount: 5, hskLevel: 1 },
  { char: '字', pinyin: 'zì', meaning: 'văn tự, chữ viết', strokeCount: 6, hskLevel: 1 },
];

export const STATIC_CHAR_DICTIONARY: Record<string, { pinyin: string; meaning: string; strokeCount?: number }> = {
  永: { pinyin: 'yǒng', meaning: 'vĩnh viễn, mãi mãi', strokeCount: 5 },
  远: { pinyin: 'yuǎn', meaning: 'xa xôi, lâu dài', strokeCount: 7 },
  学: { pinyin: 'xué', meaning: 'học tập, nghiên cứu', strokeCount: 8 },
  习: { pinyin: 'xí', meaning: 'thực hành, ôn tập', strokeCount: 3 },
  汉: { pinyin: 'hàn', meaning: 'chữ Hán, nhà Hán', strokeCount: 5 },
  字: { pinyin: 'zì', meaning: 'chữ viết, văn tự', strokeCount: 6 },
  你: { pinyin: 'nǐ', meaning: 'bạn, anh, chị', strokeCount: 7 },
  好: { pinyin: 'hǎo', meaning: 'tốt, đẹp, khỏe', strokeCount: 6 },
  我: { pinyin: 'wǒ', meaning: 'tôi, ta', strokeCount: 7 },
  是: { pinyin: 'shì', meaning: 'là, đúng, phải', strokeCount: 9 },
  人: { pinyin: 'rén', meaning: 'con người', strokeCount: 2 },
  中: { pinyin: 'zhōng', meaning: 'ở giữa, Trung Quốc', strokeCount: 4 },
  国: { pinyin: 'guó', meaning: 'đất nước, quốc gia', strokeCount: 8 },
  语: { pinyin: 'yǔ', meaning: 'ngôn ngữ, tiếng nói', strokeCount: 9 },
  文: { pinyin: 'wén', meaning: 'văn hóa, chữ viết', strokeCount: 4 },
  老: { pinyin: 'lǎo', meaning: 'già, lâu năm, thầy', strokeCount: 6 },
  师: { pinyin: 'shī', meaning: 'thầy giáo, bậc thầy', strokeCount: 6 },
  生: { pinyin: 'shēng', meaning: 'sinh sống, học sinh', strokeCount: 5 },
  朋: { pinyin: 'péng', meaning: 'bạn bè, bằng hữu', strokeCount: 8 },
  友: { pinyin: 'yǒu', meaning: 'thân hữu, bạn bè', strokeCount: 4 },
  家: { pinyin: 'jiā', meaning: 'gia đình, nhà', strokeCount: 10 },
  爱: { pinyin: 'ài', meaning: 'yêu thương, thích', strokeCount: 10 },
  心: { pinyin: 'xīn', meaning: 'trái tim, tấm lòng', strokeCount: 4 },
  水: { pinyin: 'shuǐ', meaning: 'nước, sông ngòi', strokeCount: 4 },
  火: { pinyin: 'huǒ', meaning: 'lửa, nhiệt huyết', strokeCount: 4 },
  山: { pinyin: 'shān', meaning: 'núi non', strokeCount: 3 },
  日: { pinyin: 'rì', meaning: 'mặt trời, ngày', strokeCount: 4 },
  月: { pinyin: 'yuè', meaning: 'mặt trăng, tháng', strokeCount: 4 },
  天: { pinyin: 'tiān', meaning: 'bầu trời, ngày', strokeCount: 4 },
  气: { pinyin: 'qì', meaning: 'khí, thời tiết', strokeCount: 4 },
  书: { pinyin: 'shū', meaning: 'sách vở, thư pháp', strokeCount: 4 },
  写: { pinyin: 'xiě', meaning: 'viết, chép', strokeCount: 5 },
  读: { pinyin: 'dú', meaning: 'đọc, học tập', strokeCount: 10 },
  听: { pinyin: 'tīng', meaning: 'nghe, lắng nghe', strokeCount: 7 },
  说: { pinyin: 'shuō', meaning: 'nói, trò chuyện', strokeCount: 9 },
  看: { pinyin: 'kàn', meaning: 'nhìn, xem, đọc', strokeCount: 9 },
  吃: { pinyin: 'chī', meaning: 'ăn, thưởng thức', strokeCount: 6 },
  喝: { pinyin: 'hē', meaning: 'uống', strokeCount: 12 },
  茶: { pinyin: 'chá', meaning: 'trà, chè', strokeCount: 9 },
  饭: { pinyin: 'fàn', meaning: 'cơm, bữa ăn', strokeCount: 7 },
  早: { pinyin: 'zǎo', meaning: 'buổi sáng, sớm', strokeCount: 6 },
  晚: { pinyin: 'wǎn', meaning: 'buổi tối, muộn', strokeCount: 11 },
  上: { pinyin: 'shàng', meaning: 'trên, đi lên', strokeCount: 3 },
  下: { pinyin: 'xià', meaning: 'dưới, đi xuống', strokeCount: 3 },
  大: { pinyin: 'dà', meaning: 'to lớn, vĩ đại', strokeCount: 3 },
  小: { pinyin: 'xiǎo', meaning: 'nhỏ bé', strokeCount: 3 },
  多: { pinyin: 'duō', meaning: 'nhiều', strokeCount: 6 },
  少: { pinyin: 'shǎo', meaning: 'ít, trẻ', strokeCount: 4 },
  今: { pinyin: 'jīn', meaning: 'hôm nay, hiện tại', strokeCount: 4 },
  明: { pinyin: 'míng', meaning: 'sáng sủa, ngày mai', strokeCount: 8 },
  年: { pinyin: 'nián', meaning: 'năm, tuổi', strokeCount: 6 },
  时: { pinyin: 'shí', meaning: 'thời gian, giờ', strokeCount: 7 },
  间: { pinyin: 'jiān', meaning: 'không gian, khoảng', strokeCount: 7 },
  工: { pinyin: 'gōng', meaning: 'công việc, lao động', strokeCount: 3 },
  作: { pinyin: 'zuò', meaning: 'làm việc, sáng tác', strokeCount: 7 },
  公: { pinyin: 'gōng', meaning: 'công cộng, chung', strokeCount: 4 },
  司: { pinyin: 'sī', meaning: 'quản lý, công ty', strokeCount: 5 },
  路: { pinyin: 'lù', meaning: 'con đường, lối đi', strokeCount: 13 },
  车: { pinyin: 'chē', meaning: 'xe cộ', strokeCount: 4 },
  走: { pinyin: 'zǒu', meaning: 'đi bộ, rời đi', strokeCount: 7 },
  来: { pinyin: 'lái', meaning: 'đến, tới', strokeCount: 7 },
  去: { pinyin: 'qù', meaning: 'đi, đến nơi khác', strokeCount: 5 },
  回: { pinyin: 'huí', meaning: 'trở về, quay lại', strokeCount: 6 },
  快: { pinyin: 'kuài', meaning: 'nhanh, vui vẻ', strokeCount: 7 },
  乐: { pinyin: 'lè', meaning: 'vui vẻ, hạnh phúc', strokeCount: 5 },
  高: { pinyin: 'gāo', meaning: 'cao, giỏi', strokeCount: 10 },
  兴: { pinyin: 'xìng', meaning: 'hứng thú, phấn khởi', strokeCount: 6 },
  谢: { pinyin: 'xiè', meaning: 'cảm ơn, tạ ơn', strokeCount: 12 },
  再: { pinyin: 'zài', meaning: 'lại, lần nữa', strokeCount: 6 },
  见: { pinyin: 'jiàn', meaning: 'gặp gỡ, nhìn thấy', strokeCount: 4 },
  请: { pinyin: 'qǐng', meaning: 'mời, xin', strokeCount: 10 },
  问: { pinyin: 'wèn', meaning: 'hỏi thăm', strokeCount: 6 },
  新: { pinyin: 'xīn', meaning: 'mới mẻ', strokeCount: 13 },
  春: { pinyin: 'chūn', meaning: 'mùa xuân', strokeCount: 9 },
  福: { pinyin: 'fú', meaning: 'phúc lộc, may mắn', strokeCount: 13 },
  安: { pinyin: 'ān', meaning: 'bình an, yên ổn', strokeCount: 6 },
  康: { pinyin: 'kāng', meaning: 'khỏe mạnh, an khang', strokeCount: 11 },
  健: { pinyin: 'jiàn', meaning: 'khỏe khoắn, tráng kiện', strokeCount: 10 },
  美: { pinyin: 'měi', meaning: 'đẹp đẽ, tốt đẹp', strokeCount: 9 },
  丽: { pinyin: 'lì', meaning: 'diễm lệ, xinh đẹp', strokeCount: 7 },
  梦: { pinyin: 'mèng', meaning: 'giấc mơ, ước mơ', strokeCount: 11 },
  想: { pinyin: 'xiǎng', meaning: 'suy nghĩ, nhớ, muốn', strokeCount: 13 },
  努: { pinyin: 'nǔ', meaning: 'nỗ lực, cố gắng', strokeCount: 7 },
  力: { pinyin: 'lì', meaning: 'sức lực, năng lực', strokeCount: 2 },
  成: { pinyin: 'chéng', meaning: 'thành công, hoàn thành', strokeCount: 6 },
  功: { pinyin: 'gōng', meaning: 'công lao, thành tựu', strokeCount: 5 },
  坚: { pinyin: 'jiān', meaning: 'kiên định, vững chắc', strokeCount: 7 },
  持: { pinyin: 'chí', meaning: 'duy trì, nắm giữ', strokeCount: 9 },
  进: { pinyin: 'jìn', meaning: 'tiến lên, bước vào', strokeCount: 7 },
  步: { pinyin: 'bù', meaning: 'bước đi, tiến bộ', strokeCount: 7 },
  智: { pinyin: 'zhì', meaning: 'trí tuệ, thông thái', strokeCount: 12 },
  慧: { pinyin: 'huì', meaning: 'thông minh, tuệ giác', strokeCount: 15 },
  和: { pinyin: 'hé', meaning: 'hòa bình, cùng với', strokeCount: 8 },
  平: { pinyin: 'píng', meaning: 'bình đẳng, yên bình', strokeCount: 5 },
};

const STATIC_WORDS_BY_LEVEL: Record<number, WritingWordItem[]> = {
  1: [
    { id: 'hsk1-1', hanzi: '你好', pinyin: 'nǐ hǎo', meaning: 'xin chào', hskLevel: 1 },
    { id: 'hsk1-2', hanzi: '学习', pinyin: 'xué xí', meaning: 'học tập', hskLevel: 1 },
    { id: 'hsk1-3', hanzi: '汉语', pinyin: 'hàn yǔ', meaning: 'tiếng Hán', hskLevel: 1 },
    { id: 'hsk1-4', hanzi: '汉字', pinyin: 'hàn zì', meaning: 'chữ Hán', hskLevel: 1 },
    { id: 'hsk1-5', hanzi: '老师', pinyin: 'lǎo shī', meaning: 'giáo viên, thầy cô', hskLevel: 1 },
    { id: 'hsk1-6', hanzi: '学生', pinyin: 'xué shēng', meaning: 'học sinh, sinh viên', hskLevel: 1 },
    { id: 'hsk1-7', hanzi: '朋友', pinyin: 'péng yǒu', meaning: 'bạn bè', hskLevel: 1 },
    { id: 'hsk1-8', hanzi: '中国', pinyin: 'zhōng guó', meaning: 'Trung Quốc', hskLevel: 1 },
    { id: 'hsk1-9', hanzi: '写字', pinyin: 'xiě zì', meaning: 'viết chữ', hskLevel: 1 },
    { id: 'hsk1-10', hanzi: '读书', pinyin: 'dú shū', meaning: 'đọc sách', hskLevel: 1 },
    { id: 'hsk1-11', hanzi: '喝茶', pinyin: 'hē chá', meaning: 'uống trà', hskLevel: 1 },
    { id: 'hsk1-12', hanzi: '吃饭', pinyin: 'chī fàn', meaning: 'ăn cơm', hskLevel: 1 },
    { id: 'hsk1-13', hanzi: '今天', pinyin: 'jīn tiān', meaning: 'hôm nay', hskLevel: 1 },
    { id: 'hsk1-14', hanzi: '明天', pinyin: 'míng tiān', meaning: 'ngày mai', hskLevel: 1 },
    { id: 'hsk1-15', hanzi: '高兴', pinyin: 'gāo xìng', meaning: 'vui mừng', hskLevel: 1 },
    { id: 'hsk1-16', hanzi: '谢谢', pinyin: 'xiè xie', meaning: 'cảm ơn', hskLevel: 1 },
    { id: 'hsk1-17', hanzi: '再见', pinyin: 'zài jiàn', meaning: 'tạm biệt', hskLevel: 1 },
    { id: 'hsk1-18', hanzi: '工作', pinyin: 'gōng zuò', meaning: 'công việc, làm việc', hskLevel: 1 },
  ],
  2: [
    { id: 'hsk2-1', hanzi: '时间', pinyin: 'shí jiān', meaning: 'thời gian', hskLevel: 2 },
    { id: 'hsk2-2', hanzi: '快乐', pinyin: 'kuài lè', meaning: 'vui vẻ, hạnh phúc', hskLevel: 2 },
    { id: 'hsk2-3', hanzi: '公司', pinyin: 'gōng sī', meaning: 'công ty', hskLevel: 2 },
    { id: 'hsk2-4', hanzi: '早上', pinyin: 'zǎo shang', meaning: 'buổi sáng', hskLevel: 2 },
    { id: 'hsk2-5', hanzi: '晚上', pinyin: 'wǎn shang', meaning: 'buổi tối', hskLevel: 2 },
    { id: 'hsk2-6', hanzi: '准备', pinyin: 'zhǔn bèi', meaning: 'chuẩn bị', hskLevel: 2 },
    { id: 'hsk2-7', hanzi: '运动', pinyin: 'yùn dòng', meaning: 'vận động, thể thao', hskLevel: 2 },
    { id: 'hsk2-8', hanzi: '旅游', pinyin: 'lǚ yóu', meaning: 'du lịch', hskLevel: 2 },
    { id: 'hsk2-9', hanzi: '休息', pinyin: 'xiū xi', meaning: 'nghỉ ngơi', hskLevel: 2 },
    { id: 'hsk2-10', hanzi: '帮助', pinyin: 'bāng zhù', meaning: 'giúp đỡ', hskLevel: 2 },
    { id: 'hsk2-11', hanzi: '开始', pinyin: 'kāi shǐ', meaning: 'bắt đầu', hskLevel: 2 },
    { id: 'hsk2-12', hanzi: '希望', pinyin: 'xī wàng', meaning: 'hy vọng', hskLevel: 2 },
  ],
  3: [
    { id: 'hsk3-1', hanzi: '努力', pinyin: 'nǔ lì', meaning: 'nỗ lực, cố gắng', hskLevel: 3 },
    { id: 'hsk3-2', hanzi: '健康', pinyin: 'jiàn kāng', meaning: 'sức khỏe, khỏe mạnh', hskLevel: 3 },
    { id: 'hsk3-3', hanzi: '认真', pinyin: 'rèn zhēn', meaning: 'chăm chỉ, nghiêm túc', hskLevel: 3 },
    { id: 'hsk3-4', hanzi: '文化', pinyin: 'wén huà', meaning: 'văn hóa', hskLevel: 3 },
    { id: 'hsk3-5', hanzi: '练习', pinyin: 'liàn xí', meaning: 'luyện tập', hskLevel: 3 },
    { id: 'hsk3-6', hanzi: '习惯', pinyin: 'xí guàn', meaning: 'thói quen', hskLevel: 3 },
    { id: 'hsk3-7', hanzi: '办法', pinyin: 'bàn fǎ', meaning: 'biện pháp, cách làm', hskLevel: 3 },
    { id: 'hsk3-8', hanzi: '安静', pinyin: 'ān jìng', meaning: 'yên tĩnh', hskLevel: 3 },
    { id: 'hsk3-9', hanzi: '简单', pinyin: 'jiǎn dān', meaning: 'đơn giản', hskLevel: 3 },
    { id: 'hsk3-10', hanzi: '重要', pinyin: 'zhòng yào', meaning: 'quan trọng', hskLevel: 3 },
  ],
  4: [
    { id: 'hsk4-1', hanzi: '永远', pinyin: 'yǒng yuǎn', meaning: 'vĩnh viễn, mãi mãi', hskLevel: 4 },
    { id: 'hsk4-2', hanzi: '坚持', pinyin: 'jiān chí', meaning: 'kiên trì, bền bỉ', hskLevel: 4 },
    { id: 'hsk4-3', hanzi: '成功', pinyin: 'chéng gōng', meaning: 'thành công', hskLevel: 4 },
    { id: 'hsk4-4', hanzi: '进步', pinyin: 'jìn bù', meaning: 'tiến bộ', hskLevel: 4 },
    { id: 'hsk4-5', hanzi: '美丽', pinyin: 'měi lì', meaning: 'xinh đẹp, tươi đẹp', hskLevel: 4 },
    { id: 'hsk4-6', hanzi: '理想', pinyin: 'lǐ xiǎng', meaning: 'lý tưởng, ước mơ', hskLevel: 4 },
    { id: 'hsk4-7', hanzi: '经验', pinyin: 'jīng yàn', meaning: 'kinh nghiệm', hskLevel: 4 },
    { id: 'hsk4-8', hanzi: '幸福', pinyin: 'xìng fú', meaning: 'hạnh phúc', hskLevel: 4 },
    { id: 'hsk4-9', hanzi: '精彩', pinyin: 'jīng cǎi', meaning: 'đặc sắc, tuyệt vời', hskLevel: 4 },
    { id: 'hsk4-10', hanzi: '勇敢', pinyin: 'yǒng gǎn', meaning: 'dũng cảm', hskLevel: 4 },
  ],
  5: [
    { id: 'hsk5-1', hanzi: '梦想', pinyin: 'mèng xiǎng', meaning: 'ước mơ, hoài bão', hskLevel: 5 },
    { id: 'hsk5-2', hanzi: '和平', pinyin: 'hé píng', meaning: 'hòa bình', hskLevel: 5 },
    { id: 'hsk5-3', hanzi: '书法', pinyin: 'shū fǎ', meaning: 'thư pháp', hskLevel: 5 },
    { id: 'hsk5-4', hanzi: '传统', pinyin: 'chuán tǒng', meaning: 'truyền thống', hskLevel: 5 },
    { id: 'hsk5-5', hanzi: '珍惜', pinyin: 'zhēn xī', meaning: 'trân trọng, quý trọng', hskLevel: 5 },
    { id: 'hsk5-6', hanzi: '谦虚', pinyin: 'qiān xū', meaning: 'khiêm tốn', hskLevel: 5 },
    { id: 'hsk5-7', hanzi: '乐观', pinyin: 'lè guān', meaning: 'lạc quan', hskLevel: 5 },
    { id: 'hsk5-8', hanzi: '奋斗', pinyin: 'fèn dòu', meaning: 'phấn đấu', hskLevel: 5 },
  ],
  6: [
    { id: 'hsk6-1', hanzi: '智慧', pinyin: 'zhì huì', meaning: 'trí tuệ, thông thái', hskLevel: 6 },
    { id: 'hsk6-2', hanzi: '毅力', pinyin: 'yì lì', meaning: 'nghị lực, ý chí', hskLevel: 6 },
    { id: 'hsk6-3', hanzi: '辉煌', pinyin: 'huī huáng', meaning: 'huy hoàng, rực rỡ', hskLevel: 6 },
    { id: 'hsk6-4', hanzi: '从容', pinyin: 'cóng róng', meaning: 'ung dung, điềm tĩnh', hskLevel: 6 },
    { id: 'hsk6-5', hanzi: '卓越', pinyin: 'zhuó yuè', meaning: 'trác việt, xuất sắc', hskLevel: 6 },
    { id: 'hsk6-6', hanzi: '胸怀', pinyin: 'xiōng huái', meaning: 'tấm lòng, hoài bão', hskLevel: 6 },
    { id: 'hsk6-7', hanzi: '意境', pinyin: 'yì jìng', meaning: 'ý cảnh, chiều sâu nghệ thuật', hskLevel: 6 },
    { id: 'hsk6-8', hanzi: '永恒', pinyin: 'yǒng héng', meaning: 'vĩnh hằng, bất diệt', hskLevel: 6 },
  ],
};

function isHanziChar(ch: string): boolean {
  return /[\u3400-\u9fff\uF900-\uFAFF]/.test(ch);
}

/** Tách từ nhiều chữ Hán thành từng chữ đơn kèm pinyin tương ứng */
export function splitWordToChars(
  hanzi: string,
  pinyin: string,
  meaning: string,
  charDictionary?: Record<string, WritingCharItem>,
): WritingCharItem[] {
  const cleanChars = Array.from(hanzi.trim()).filter(isHanziChar);
  const syllables = pinyin.trim().split(/\s+/).filter(Boolean);

  return cleanChars.map((ch, idx) => {
    const dictEntry = charDictionary?.[ch] ?? STATIC_CHAR_DICTIONARY[ch];
    const syllable =
      cleanChars.length === syllables.length && syllables[idx]
        ? syllables[idx]
        : dictEntry?.pinyin || syllables[idx] || pinyin;

    return {
      char: ch,
      pinyin: syllable,
      meaning: dictEntry?.meaning || meaning,
      strokeCount: dictEntry?.strokeCount,
    };
  });
}

export async function getWritingPageData(): Promise<WritingPagePayload> {
  const charDictionary: Record<string, WritingCharItem> = {};
  for (const [char, info] of Object.entries(STATIC_CHAR_DICTIONARY)) {
    charDictionary[char] = {
      char,
      pinyin: info.pinyin,
      meaning: info.meaning,
      strokeCount: info.strokeCount,
    };
  }

  const wordsByLevel: Record<number, WritingWordItem[]> = {
    1: [...STATIC_WORDS_BY_LEVEL[1]],
    2: [...STATIC_WORDS_BY_LEVEL[2]],
    3: [...STATIC_WORDS_BY_LEVEL[3]],
    4: [...STATIC_WORDS_BY_LEVEL[4]],
    5: [...STATIC_WORDS_BY_LEVEL[5]],
    6: [...STATIC_WORDS_BY_LEVEL[6]],
  };

  const decks: WritingDeckItem[] = [
    {
      id: 'starter-calligraphy',
      title: 'Bộ chữ Vĩnh Tự Bát Pháp & Khai bút',
      subtitle: '6 chữ chuẩn luyện nét cơ bản (永, 远, 学, 习, 汉, 字)',
      hskLevel: 1,
      words: [
        { id: 'sc-1', hanzi: '永远', pinyin: 'yǒng yuǎn', meaning: 'vĩnh viễn, mãi mãi', hskLevel: 1 },
        { id: 'sc-2', hanzi: '学习', pinyin: 'xué xí', meaning: 'học tập, ôn luyện', hskLevel: 1 },
        { id: 'sc-3', hanzi: '汉字', pinyin: 'hàn zì', meaning: 'chữ Hán', hskLevel: 1 },
      ],
    },
    {
      id: 'daily-greetings',
      title: 'Giao tiếp & Chào hỏi hằng ngày',
      subtitle: 'Từ vựng nền tảng HSK 1 viết nhiều nhất',
      hskLevel: 1,
      words: STATIC_WORDS_BY_LEVEL[1].slice(0, 8),
    },
    {
      id: 'motivation-calligraphy',
      title: 'Châm ngôn Học tập & Kiên trì',
      subtitle: 'Các chữ Hán truyền cảm hứng luyện viết thư pháp',
      hskLevel: 4,
      words: [
        { id: 'mc-1', hanzi: '努力', pinyin: 'nǔ lì', meaning: 'nỗ lực, cố gắng', hskLevel: 3 },
        { id: 'mc-2', hanzi: '坚持', pinyin: 'jiān chí', meaning: 'kiên trì, bền bỉ', hskLevel: 4 },
        { id: 'mc-3', hanzi: '成功', pinyin: 'chéng gōng', meaning: 'thành công', hskLevel: 4 },
        { id: 'mc-4', hanzi: '进步', pinyin: 'jìn bù', meaning: 'tiến bộ', hskLevel: 4 },
        { id: 'mc-5', hanzi: '梦想', pinyin: 'mèng xiǎng', meaning: 'ước mơ, hoài bão', hskLevel: 5 },
        { id: 'mc-6', hanzi: '智慧', pinyin: 'zhì huì', meaning: 'trí tuệ, thông thái', hskLevel: 6 },
      ],
    },
  ];

  const pool = getPool();
  if (!pool) {
    return {
      starterCharacters: STARTER_CHARACTERS,
      wordsByLevel,
      decks,
      charDictionary,
    };
  }

  for (const level of Object.keys(wordsByLevel)) {
    wordsByLevel[Number(level)] = [];
  }

  try {
    const [charsRes, wordsRes] = await Promise.all([
      pool.query(
        `SELECT hanzi, pinyin, meaning_vi AS meaning, stroke_count AS "strokeCount", radical, hsk_level AS "hskLevel"
         FROM chu_han
         ORDER BY hsk_level ASC, id ASC
         LIMIT 500`,
      ),
      pool.query(
        `SELECT w.id::text, w.hanzi, w.pinyin,
                COALESCE((
                  SELECT sense.meaning_vi
                  FROM tu_vung_nghia sense
                  WHERE sense.word_id = w.id
                  ORDER BY sense.position, sense.id
                  LIMIT 1
                ), '') AS meaning,
                w.hsk_level AS "hskLevel"
         FROM tu_vung w
         ORDER BY w.hsk_level ASC NULLS LAST, w.id ASC
        `,
      ),
    ]);

    for (const row of charsRes.rows) {
      if (row.hanzi && !charDictionary[row.hanzi]) {
        charDictionary[row.hanzi] = {
          char: row.hanzi,
          pinyin: row.pinyin || '',
          meaning: row.meaning || '',
          strokeCount: row.strokeCount ?? undefined,
          radical: row.radical ?? undefined,
          hskLevel: row.hskLevel ?? undefined,
        };
      }
    }

    for (const row of wordsRes.rows) {
      const lv = Number(row.hskLevel);
      if (!Number.isInteger(lv) || lv < 1 || lv > 7) continue;
      if (!wordsByLevel[lv]) wordsByLevel[lv] = [];
      const word: WritingWordItem = {
        id: `db-w-${row.id}`,
        hanzi: row.hanzi,
        pinyin: row.pinyin,
        meaning: row.meaning,
        hskLevel: lv,
      };
      wordsByLevel[lv].push(word);
      const splitChars = splitWordToChars(row.hanzi, row.pinyin, row.meaning, charDictionary);
      for (const item of splitChars) {
        if (!charDictionary[item.char]) {
          charDictionary[item.char] = { ...item, hskLevel: lv };
        }
      }
    }
  } catch (error) {
    console.error('[writingRepo] Không thể tải dữ liệu luyện viết từ PostgreSQL:', error);
    throw error;
  }

  return {
    starterCharacters: STARTER_CHARACTERS,
    wordsByLevel,
    decks,
    charDictionary,
  };
}
