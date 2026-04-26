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
