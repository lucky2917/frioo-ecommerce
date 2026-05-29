const express = require('express');
const router = express.Router();
const multer = require('multer');
const { supabaseAdmin } = require('../db');
const { requireAdmin } = require('../middleware/auth');
const logger = require('../utils/logger');

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'];

function matchesMagicBytes(buffer, mimetype) {
    if (!buffer || buffer.length < 12) return false;
    if (mimetype === 'image/jpeg') {
        return buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF;
    }
    if (mimetype === 'image/png') {
        return buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47;
    }
    if (mimetype === 'image/webp') {
        return (
            buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
            buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50
        );
    }
    return false;
}

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
});

/**
 * @swagger
 * /api/upload:
 *   post:
 *     summary: Upload a product image
 *     description: |
 *       Uploads an image to Supabase Storage (`frioo-assets` bucket) and returns the public CDN URL.
 *
 *       **Validations performed:**
 *       - MIME type must be `image/jpeg`, `image/png`, or `image/webp`
 *       - File extension must be `.jpg`, `.jpeg`, `.png`, or `.webp`
 *       - File content is verified against magic bytes (no spoofing)
 *       - Maximum file size: **5 MB**
 *
 *       The returned URL can be used directly in the `images` field when creating or updating a product.
 *
 *       **Rate limit:** 20 requests per 15 minutes per IP (shared with admin auth limiter).
 *
 *       Admin only.
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [file]
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Image file (JPEG, PNG, or WebP — max 5 MB)
 *     responses:
 *       200:
 *         description: File uploaded — public CDN URL returned
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 url:
 *                   type: string
 *                   format: uri
 *                   example: https://qxeoywdfozfwoaksyfyh.supabase.co/storage/v1/object/public/frioo-assets/1717000000000_123456789.jpg
 *             example:
 *               success: true
 *               url: https://qxeoywdfozfwoaksyfyh.supabase.co/storage/v1/object/public/frioo-assets/1717000000000_123456789.jpg
 *       400:
 *         description: No file uploaded, invalid MIME type, bad extension, or magic byte mismatch
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: Invalid file type. Only JPEG, PNG, and WebP images are allowed.
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       413:
 *         description: File exceeds 5 MB limit
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: File too large. Maximum size is 5 MB.
 *       429:
 *         $ref: '#/components/responses/TooManyRequests'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.post('/', requireAdmin, upload.single('file'), async (req, res) => {
    try {
        const file = req.file;
        if (!file) {
            return res.status(400).json({ success: false, error: 'No file uploaded' });
        }

        if (!ALLOWED_TYPES.includes(file.mimetype)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid file type. Only JPEG, PNG, and WebP images are allowed.'
            });
        }

        const fileExt = file.originalname.split('.').pop().toLowerCase();
        if (!ALLOWED_EXTENSIONS.includes(fileExt)) {
            return res.status(400).json({
                success: false,
                error: `Invalid file extension .${fileExt}. Only ${ALLOWED_EXTENSIONS.join(', ')} are allowed.`
            });
        }

        if (!matchesMagicBytes(file.buffer, file.mimetype)) {
            return res.status(400).json({
                success: false,
                error: 'File content does not match the declared type.'
            });
        }

        const fileName = `${Date.now()}_${Math.round(Math.random() * 1E9)}.${fileExt}`;

        const { error: uploadError } = await supabaseAdmin.storage
            .from('frioo-assets')
            .upload(fileName, file.buffer, {
                contentType: file.mimetype,
                upsert: false
            });

        if (uploadError) {
            logger.error('Supabase Upload Error:', uploadError);
            return res.status(500).json({ success: false, error: 'Storage upload failed' });
        }

        const { data: urlData } = supabaseAdmin.storage
            .from('frioo-assets')
            .getPublicUrl(fileName);

        return res.json({ success: true, url: urlData.publicUrl });

    } catch (err) {
        logger.error('Server Upload Error:', err);
        return res.status(500).json({ success: false, error: 'Server error during upload' });
    }
});

module.exports = router;
