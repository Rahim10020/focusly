/**
 * @fileoverview Image compression utility for optimizing avatar uploads.
 * Provides functions to compress images before uploading to reduce file size.
 * @module lib/utils/imageCompression
 */

/**
 * Compression options for images
 */
export interface CompressionOptions {
    /** Maximum width or height in pixels */
    maxWidthOrHeight?: number;
    /** Maximum file size in MB */
    maxSizeMB?: number;
    /** Quality (0-1) for JPEG compression */
    quality?: number;
}

/**
 * Compresses an image file using canvas-based compression.
 * Resizes the image to fit within maxWidthOrHeight while maintaining aspect ratio.
 * Converts to JPEG with specified quality.
 *
 * @param {File} file - The image file to compress
 * @param {CompressionOptions} options - Compression options
 * @returns {Promise<File>} Promise resolving to the compressed image file
 *
 * @example
 * const compressedFile = await compressImage(avatarFile, {
 *   maxWidthOrHeight: 400,
 *   maxSizeMB: 0.5,
 *   quality: 0.8
 * });
 */
export async function compressImage(
    file: File,
    options: CompressionOptions = {}
): Promise<File> {
    const {
        maxWidthOrHeight = 400,
        maxSizeMB = 0.5,
        quality = 0.8,
    } = options;

    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            const img = new Image();

            img.onload = () => {
                const canvas = document.createElement('canvas');
                let { width, height } = img;

                // Calculate new dimensions while maintaining aspect ratio
                if (width > height) {
                    if (width > maxWidthOrHeight) {
                        height = (height * maxWidthOrHeight) / width;
                        width = maxWidthOrHeight;
                    }
                } else {
                    if (height > maxWidthOrHeight) {
                        width = (width * maxWidthOrHeight) / height;
                        height = maxWidthOrHeight;
                    }
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    reject(new Error('Failed to get canvas context'));
                    return;
                }

                // Draw the image on canvas with new dimensions
                ctx.drawImage(img, 0, 0, width, height);

                // Convert to blob
                canvas.toBlob(
                    (blob) => {
                        if (!blob) {
                            reject(new Error('Failed to create blob'));
                            return;
                        }

                        // Check if size is within limit
                        const sizeMB = blob.size / 1024 / 1024;
                        if (sizeMB > maxSizeMB && quality > 0.1) {
                            // Try with lower quality if still too large
                            canvas.toBlob(
                                (retryBlob) => {
                                    if (!retryBlob) {
                                        reject(new Error('Failed to create blob'));
                                        return;
                                    }

                                    const compressedFile = new File(
                                        [retryBlob],
                                        file.name.replace(/\.[^.]+$/, '.jpg'),
                                        { type: 'image/jpeg' }
                                    );
                                    resolve(compressedFile);
                                },
                                'image/jpeg',
                                Math.max(0.1, quality - 0.2)
                            );
                        } else {
                            const compressedFile = new File(
                                [blob],
                                file.name.replace(/\.[^.]+$/, '.jpg'),
                                { type: 'image/jpeg' }
                            );
                            resolve(compressedFile);
                        }
                    },
                    'image/jpeg',
                    quality
                );
            };

            img.onerror = () => {
                reject(new Error('Failed to load image'));
            };

            img.src = e.target?.result as string;
        };

        reader.onerror = () => {
            reject(new Error('Failed to read file'));
        };

        reader.readAsDataURL(file);
    });
}

/**
 * Validates if a file is a valid image type
 * @param {File} file - The file to validate
 * @returns {boolean} True if file is a valid image
 */
export function isValidImageFile(file: File): boolean {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    return validTypes.includes(file.type);
}

/**
 * Gets human-readable file size string
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted file size (e.g., "2.5 MB")
 */
export function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}
