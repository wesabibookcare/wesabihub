export class FileValidationService {
  static validateImage(file: File): string | null {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) return 'Invalid file type. Only JPG, PNG, WEBP allowed.';
    if (file.size > 2 * 1024 * 1024) return 'File too large. Max 2MB.';
    return null;
  }

  static validateDocument(file: File): string | null {
    if (file.type !== 'application/pdf') return 'Invalid file type. Only PDF allowed.';
    if (file.size > 5 * 1024 * 1024) return 'File too large. Max 5MB.';
    return null;
  }
}
