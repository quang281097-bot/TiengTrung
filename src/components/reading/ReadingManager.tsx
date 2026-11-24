'use client';

import Link from 'next/link';
import Image from 'next/image';
import { FormEvent, useEffect, useState } from 'react';

import type { ImportantVocabularyItem } from '../../lib/readingVocabulary';
import Icon from '../ui/Icon';

type Reading = {
  id: number;
  hskLevel: number;
  title: string;
  titleZh: string | null;
  passageZh: string;
  pinyin: string;
  translationVi: string;
  importantVocabulary: ImportantVocabularyItem[];
  imageUrl?: string | null;
  estMinutes: number;
  isPublished: boolean;
};

type ReadingForm = Omit<Reading, 'id' | 'hskLevel' | 'isPublished' | 'imageUrl'> & {
  hskLevel: number;
  isPublished: boolean;
};

const emptyForm: ReadingForm = {
  hskLevel: 1,
  title: '',
  titleZh: '',
  passageZh: '',
  pinyin: '',
  translationVi: '',
  importantVocabulary: [],
  estMinutes: 5,
  isPublished: false,
};

export default function ReadingManager() {
  const [readings, setReadings] = useState<Reading[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState<Reading | null>(null);
  const [form, setForm] = useState<ReadingForm>(emptyForm);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [removeImage, setRemoveImage] = useState(false);

  useEffect(() => {
    if (!selectedImage) return;
    const previewUrl = URL.createObjectURL(selectedImage);
    setImagePreview(previewUrl);
    return () => URL.revokeObjectURL(previewUrl);
  }, [selectedImage]);

  async function loadReadings() {
    setIsLoading(true);
    try {
      const response = await fetch('/api/readings?all=1', { cache: 'no-store' });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? 'Không tải được bài đọc.');
      setReadings(result.readings);
      setError('');
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Không tải được bài đọc.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadReadings();
  }, []);

  function openCreateForm() {
    setEditing(null);
    setForm(emptyForm);
    setSelectedImage(null);
    setImagePreview(null);
    setRemoveImage(false);
    setIsFormOpen(true);
  }

  function openEditForm(reading: Reading) {
    setEditing(reading);
    setForm({
      hskLevel: reading.hskLevel,
      title: reading.title,
      titleZh: reading.titleZh ?? '',
      passageZh: reading.passageZh,
      pinyin: reading.pinyin,
      translationVi: reading.translationVi,
      importantVocabulary: reading.importantVocabulary ?? [],
      estMinutes: reading.estMinutes,
      isPublished: reading.isPublished,
    });
    setSelectedImage(null);
    setImagePreview(reading.imageUrl ?? null);
    setRemoveImage(false);
    setIsFormOpen(true);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setError('');

    try {
      const response = await fetch(editing ? `/api/readings/${editing.id}` : '/api/readings', {
        method: editing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? 'Không lưu được bài đọc.');

      const readingId = editing?.id ?? result.id;
      if (!editing && typeof readingId === 'number') {
        setEditing({ ...form, id: readingId, hskLevel: form.hskLevel, isPublished: form.isPublished, imageUrl: null });
      }

      if (selectedImage) {
        const upload = new FormData();
        upload.append('image', selectedImage);
        const imageResponse = await fetch(`/api/readings/${readingId}/image`, { method: 'POST', body: upload });
        const imageResult = await imageResponse.json();
        if (!imageResponse.ok) throw new Error(imageResult.error ?? 'Không tải được ảnh.');
        setImagePreview(imageResult.imageUrl);
        setSelectedImage(null);
        setRemoveImage(false);
      } else if (removeImage && editing) {
        const imageResponse = await fetch(`/api/readings/${readingId}/image`, { method: 'DELETE' });
        const imageResult = await imageResponse.json();
        if (!imageResponse.ok) throw new Error(imageResult.error ?? 'Không gỡ được ảnh.');
        setImagePreview(null);
        setRemoveImage(false);
      }

      setIsFormOpen(false);
      await loadReadings();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Không lưu được bài đọc.');
    } finally {
      setIsSaving(false);
    }
  }

  function updateVocabulary(index: number, field: keyof ImportantVocabularyItem, value: string) {
    setForm((current) => ({
      ...current,
      importantVocabulary: current.importantVocabulary.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item,
      ),
    }));
  }

  function clearImageSelection() {
    if (selectedImage) {
      setSelectedImage(null);
      setImagePreview(editing?.imageUrl ?? null);
      setRemoveImage(false);
      return;
    }
    if (editing?.imageUrl) {
      setImagePreview(null);
      setRemoveImage(true);
    }
  }

  async function deleteReading(reading: Reading) {
    if (!window.confirm(`Xóa bài đọc “${reading.title}”?`)) return;
    setError('');
    try {
      const response = await fetch(`/api/readings/${reading.id}`, { method: 'DELETE' });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? 'Không xóa được bài đọc.');
      await loadReadings();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Không xóa được bài đọc.');
    }
  }

  return (
    <div className="reading-manager">
      <header className="reading-manager-heading">
        <div>
          <p className="reading-eyebrow">KHU VỰC QUẢN TRỊ</p>
          <h1>Quản lý bài đọc</h1>
          <p>Thêm nội dung, cập nhật bản dịch hoặc ẩn bài khỏi danh sách học viên.</p>
        </div>
        <div className="reading-manager-actions">
          <Link className="reading-secondary-button" href="/practice">
            <Icon name="arrow-left" size={16} />
            Về luyện đọc
          </Link>
          <button className="reading-primary-button" type="button" onClick={openCreateForm}>
            <span aria-hidden="true">+</span>
            Thêm bài đọc
          </button>
        </div>
      </header>

      {error && <p className="reading-manager-error" role="alert">{error}</p>}

      <section className="reading-manager-table-wrap" aria-label="Danh sách quản lý bài đọc">
        {isLoading ? (
          <p className="reading-manager-state">Đang tải danh sách...</p>
        ) : readings.length ? (
          <table className="reading-manager-table">
            <thead>
              <tr>
                <th scope="col">Cấp độ</th>
                <th scope="col">Bài đọc</th>
                <th scope="col">Thời lượng</th>
                <th scope="col">Trạng thái</th>
                <th scope="col"><span className="reading-sr-only">Thao tác</span></th>
              </tr>
            </thead>
            <tbody>
              {readings.map((reading) => (
                <tr key={reading.id}>
                  <td><span className="reading-level-tag">HSK {reading.hskLevel}</span></td>
                  <td>
                    <strong>{reading.title}</strong>
                    {reading.titleZh && <small lang="zh-Hans">{reading.titleZh}</small>}
                  </td>
                  <td>{reading.estMinutes} phút</td>
                  <td>
                    <span className={`reading-status${reading.isPublished ? ' is-published' : ''}`}>
                      {reading.isPublished ? 'Đã xuất bản' : 'Bản nháp'}
                    </span>
                  </td>
                  <td>
                    <div className="reading-row-actions">
                      <button type="button" className="reading-icon-action" onClick={() => openEditForm(reading)} aria-label={`Sửa ${reading.title}`} title="Sửa bài đọc">
                        <Icon name="pen" size={16} />
                      </button>
                      <button type="button" className="reading-icon-action is-danger" onClick={() => void deleteReading(reading)} aria-label={`Xóa ${reading.title}`} title="Xóa bài đọc">
                        <Icon name="x" size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="reading-manager-state">Chưa có bài đọc. Thêm bài đầu tiên để bắt đầu.</p>
        )}
      </section>

      {isFormOpen && (
        <div className="reading-modal-backdrop">
          <section className="reading-modal" role="dialog" aria-modal="true" aria-labelledby="reading-form-title">
            <header className="reading-modal-heading">
              <div>
                <p className="reading-eyebrow">NỘI DUNG HỌC</p>
                <h2 id="reading-form-title">{editing ? 'Sửa bài đọc' : 'Thêm bài đọc'}</h2>
              </div>
              <button type="button" className="reading-icon-action" onClick={() => setIsFormOpen(false)} aria-label="Đóng biểu mẫu">
                <Icon name="x" size={18} />
              </button>
            </header>

            <form className="reading-form" onSubmit={handleSubmit}>
              <div className="reading-form-grid">
                <label>
                  Cấp độ HSK
                  <select value={form.hskLevel} onChange={(event) => setForm((current) => ({ ...current, hskLevel: Number(event.target.value) }))}>
                    {[1, 2, 3, 4, 5, 6].map((level) => <option key={level} value={level}>HSK {level}</option>)}
                  </select>
                </label>
                <label>
                  Thời lượng (phút)
                  <input min={1} max={180} type="number" value={form.estMinutes} onChange={(event) => setForm((current) => ({ ...current, estMinutes: Number(event.target.value) }))} />
                </label>
              </div>
              <label>
                Tiêu đề tiếng Việt
                <input required maxLength={180} value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} />
              </label>
              <label>
                Tiêu đề tiếng Trung
                <input lang="zh-Hans" maxLength={180} value={form.titleZh ?? ''} onChange={(event) => setForm((current) => ({ ...current, titleZh: event.target.value }))} />
              </label>
              <section className="reading-image-editor" aria-label="Ảnh minh họa bài đọc">
                <div className="reading-vocabulary-editor-heading">
                  <div>
                    <h3>Ảnh minh họa</h3>
                    <p>Không bắt buộc · JPEG, PNG hoặc WebP · tối đa 5 MB</p>
                  </div>
                  {imagePreview && (
                    <button className="reading-secondary-button" type="button" onClick={clearImageSelection}>
                      {selectedImage ? 'Bỏ ảnh chọn' : 'Gỡ ảnh'}
                    </button>
                  )}
                </div>
                {imagePreview && (
                  <Image
                    className="reading-image-preview"
                    src={imagePreview}
                    alt="Xem trước ảnh minh họa"
                    width={640}
                    height={360}
                    unoptimized
                  />
                )}
                <label>
                  Tải ảnh lên
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(event) => {
                      const file = event.target.files?.[0] ?? null;
                      setSelectedImage(file);
                      if (file) setRemoveImage(false);
                    }}
                  />
                </label>
              </section>
              <label>
                Đoạn văn tiếng Trung
                <textarea required rows={5} value={form.passageZh} onChange={(event) => setForm((current) => ({ ...current, passageZh: event.target.value }))} />
              </label>
              <label>
                Pinyin
                <textarea rows={3} value={form.pinyin} onChange={(event) => setForm((current) => ({ ...current, pinyin: event.target.value }))} />
              </label>
              <label>
                Bản dịch tiếng Việt
                <textarea rows={3} value={form.translationVi} onChange={(event) => setForm((current) => ({ ...current, translationVi: event.target.value }))} />
              </label>
              <section className="reading-vocabulary-editor" aria-labelledby="reading-vocabulary-title">
                <header className="reading-vocabulary-editor-heading">
                  <div>
                    <h3 id="reading-vocabulary-title">Từ vựng quan trọng</h3>
                    <p>Thêm chữ Hán, pinyin và nghĩa cho từng từ.</p>
                  </div>
                  <button
                    className="reading-secondary-button"
                    type="button"
                    onClick={() => setForm((current) => ({
                      ...current,
                      importantVocabulary: [...current.importantVocabulary, { hanzi: '', pinyin: '', meaningVi: '' }],
                    }))}
                  >
                    <span aria-hidden="true">+</span>
                    Thêm từ
                  </button>
                </header>
                {form.importantVocabulary.length === 0 ? (
                  <p className="reading-vocabulary-empty">Chưa có từ vựng. Bài muốn xuất bản cần ít nhất một từ.</p>
                ) : (
                  <div className="reading-vocabulary-fields">
                    {form.importantVocabulary.map((item, index) => (
                      <div className="reading-vocabulary-field-row" key={index}>
                        <label>
                          Chữ Hán
                          <input lang="zh-Hans" required value={item.hanzi} onChange={(event) => updateVocabulary(index, 'hanzi', event.target.value)} />
                        </label>
                        <label>
                          Pinyin
                          <input required value={item.pinyin} onChange={(event) => updateVocabulary(index, 'pinyin', event.target.value)} />
                        </label>
                        <label>
                          Nghĩa tiếng Việt
                          <input required value={item.meaningVi} onChange={(event) => updateVocabulary(index, 'meaningVi', event.target.value)} />
                        </label>
                        <button
                          className="reading-icon-action is-danger"
                          type="button"
                          aria-label={`Xóa từ vựng ${item.hanzi || index + 1}`}
                          title="Xóa từ"
                          onClick={() => setForm((current) => ({
                            ...current,
                            importantVocabulary: current.importantVocabulary.filter((_, itemIndex) => itemIndex !== index),
                          }))}
                        >
                          <Icon name="x" size={15} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </section>
              <label className="reading-publish-toggle">
                <input type="checkbox" checked={form.isPublished} onChange={(event) => setForm((current) => ({ ...current, isPublished: event.target.checked }))} />
                Xuất bản để học viên nhìn thấy
              </label>
              <footer className="reading-form-actions">
                <button className="reading-secondary-button" type="button" onClick={() => setIsFormOpen(false)}>Hủy</button>
                <button className="reading-primary-button" type="submit" disabled={isSaving}>
                  {isSaving ? 'Đang lưu...' : editing ? 'Lưu thay đổi' : 'Tạo bài đọc'}
                </button>
              </footer>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}