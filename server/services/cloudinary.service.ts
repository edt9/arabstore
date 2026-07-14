import { v2 as cloudinary } from 'cloudinary';

// ─── Configuration ────────────────────────────────────────────────────────────
function buildCloudinaryConfig(): boolean {
  const name   = process.env.CLOUDINARY_CLOUD_NAME?.trim() ?? '';
  const key    = process.env.CLOUDINARY_API_KEY?.trim() ?? '';
  const secret = process.env.CLOUDINARY_API_SECRET?.trim() ?? '';

  const PLACEHOLDERS = ['your-cloud', 'your-api', 'YOUR_CLOUDINARY', '<your-', '[your-', 'your_api'];
  if (!name || !key || !secret) return false;
  if (PLACEHOLDERS.some(p => name.includes(p) || key.includes(p) || secret.includes(p))) return false;

  cloudinary.config({ cloud_name: name, api_key: key, api_secret: secret });
  return true;
}

export const isCloudinaryConfigured = buildCloudinaryConfig();

// ─── Upload image buffer to Cloudinary ───────────────────────────────────────
export async function uploadImageToCloudinary(buffer: Buffer): Promise<string> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'arabstore_games', allowed_formats: ['jpg', 'jpeg', 'png', 'webp'], resource_type: 'image' },
      (error, result) => {
        if (error || !result) return reject(error ?? new Error('Cloudinary upload failed'));
        resolve(result.secure_url);
      }
    );
    stream.end(buffer);
  });
}

// ─── Delete image from Cloudinary ────────────────────────────────────────────
export async function deleteImageFromCloudinary(imageUrl: string): Promise<void> {
  if (!imageUrl.includes('res.cloudinary.com')) return;
  try {
    const publicId = extractPublicId(imageUrl);
    if (publicId) await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    console.warn('[Cloudinary] Delete failed:', (err as Error).message);
  }
}

// ─── Extract public_id from Cloudinary URL ───────────────────────────────────
function extractPublicId(url: string): string | null {
  try {
    const parts = url.split('/image/upload/');
    if (parts.length < 2) return null;
    const afterUpload = parts[1];
    const pathParts = afterUpload.split('/');
    if (pathParts[0].match(/^v\d+$/)) pathParts.shift(); // remove version
    const withExt = pathParts.join('/');
    const dotIdx = withExt.lastIndexOf('.');
    return dotIdx !== -1 ? withExt.slice(0, dotIdx) : withExt;
  } catch {
    return null;
  }
}
