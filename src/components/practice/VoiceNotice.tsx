'use client';

import type { ChineseSpeech } from '../../lib/useChineseSpeech';

export default function VoiceNotice({ speech }: { speech: ChineseSpeech }) {
  if (!speech.supported) {
    return (
      <p className="lx-notice" role="note">
        Trình duyệt này chưa hỗ trợ đọc văn bản nên chưa nghe được phát âm. Hãy dùng Microsoft Edge hoặc Google Chrome.
      </p>
    );
  }
  if (speech.voicesReady && !speech.hasVoice) {
    return (
      <p className="lx-notice" role="note">
        Máy chưa có giọng đọc tiếng Trung. Microsoft Edge có sẵn giọng đọc online; trên Windows bạn cũng có thể cài thêm
        giọng tiếng Trung trong Cài đặt › Thời gian &amp; ngôn ngữ › Giọng nói.
      </p>
    );
  }
  return null;
}
