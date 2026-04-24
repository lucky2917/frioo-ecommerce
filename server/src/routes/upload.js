const express = require('express');
const router = express.Router();
const multer = require('multer');
const { supabaseAdmin } = require('../db');
const { requireAdmin } = require('../middleware/auth');

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

        const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
        const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'];

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

        const fileName = `${Date.now()}_${Math.round(Math.random() * 1E9)}.${fileExt}`;

        const { data, error: uploadError } = await supabaseAdmin.storage
            .from('frioo-assets')
            .upload(fileName, file.buffer, {
                contentType: file.mimetype,
                upsert: false
            });

        if (uploadError) {
            console.error('Supabase Upload Error:', uploadError);
            return res.status(500).json({ success: false, error: 'Storage upload failed' });
        }

        const { data: urlData } = supabaseAdmin.storage
            .from('frioo-assets')
            .getPublicUrl(fileName);

        res.json({
            success: true,
            url: urlData.publicUrl
        });

    } catch (err) {
        console.error('Server Upload Error:', err);
        res.status(500).json({ success: false, error: 'Server error during upload' });
    }
});

module.exports = router;
