import fs from 'fs';
import path from 'path';
import { uploadImage } from '../../middleware/fileUpload.js';
import { FILE_UPLOAD } from '../../config/index.js';

describe('middleware/fileUpload', () => {
  const uploadDir = path.join(process.cwd(), 'static', 'uploads');

  test('exports a configured multer instance', () => {
    expect(uploadImage).toBeDefined();
    expect(typeof uploadImage.single).toBe('function');
    expect(typeof uploadImage.array).toBe('function');
    expect(typeof uploadImage.fields).toBe('function');
  });

  test('creates upload middleware for single file', () => {
    const middleware = uploadImage.single('image');

    expect(typeof middleware).toBe('function');
    expect(middleware.length).toBe(3);
  });

  test('creates upload middleware for multiple files', () => {
    const middleware = uploadImage.array('images', 5);

    expect(typeof middleware).toBe('function');
    expect(middleware.length).toBe(3);
  });

  test('ensures static upload directory exists', () => {
    expect(uploadDir.endsWith(path.join('static', 'uploads'))).toBe(true);
    expect(fs.existsSync(uploadDir)).toBe(true);
  });

  test('uses sane file upload limits from config', () => {
    expect(FILE_UPLOAD.MAX_FILE_SIZE).toBeGreaterThan(0);
    expect(Array.isArray(FILE_UPLOAD.ALLOWED_IMAGE_TYPES)).toBe(true);
    expect(FILE_UPLOAD.ALLOWED_IMAGE_TYPES.length).toBeGreaterThan(0);
  });

  test('allowed mime types contain common image formats', () => {
    expect(FILE_UPLOAD.ALLOWED_IMAGE_TYPES).toEqual(
      expect.arrayContaining(['image/jpeg', 'image/png'])
    );
  });
});
