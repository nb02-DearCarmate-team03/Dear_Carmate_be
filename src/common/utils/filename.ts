export function toUtf8Filename(name: string): string {
  if (!name) return name;
  try {
    return Buffer.from(name, 'latin1').toString('utf8'); // 깨진 한글 복원
  } catch {
    return name;
  }
}
export function sanitizeFilename(name: string): string {
  return name.replace(/[\\/:*?"<>|]/g, '_'); // OS 예약문자 제거
}
