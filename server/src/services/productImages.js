const { supabaseAdmin } = require('../db');
const logger = require('../utils/logger');

const BUCKET = 'frioo-assets';
const PUBLIC_MARKER = `/storage/v1/object/public/${BUCKET}/`;

const extractStoragePath = (url) => {
    if (typeof url !== 'string') return null;

    const markerIndex = url.indexOf(PUBLIC_MARKER);
    if (markerIndex === -1) return null;

    const [path] = url.slice(markerIndex + PUBLIC_MARKER.length).split('?');
    if (!path) return null;

    try {
        return decodeURIComponent(path);
    } catch {
        return path;
    }
};

const toUrlList = (value) =>
    (Array.isArray(value) ? value : []).filter((item) => typeof item === 'string' && item.length > 0);

const isStillReferenced = async (url, productId) => {
    const { data, error } = await supabaseAdmin
        .from('products')
        .select('id')
        .neq('id', productId)
        .contains('images', [url])
        .limit(1);

    if (error) {
        logger.warn('Could not check image references, keeping file', { url, error: error.message });
        return true;
    }

    return Array.isArray(data) && data.length > 0;
};

const discardReplacedImages = async ({ previousImages, nextImages, productId }) => {
    const next = new Set(toUrlList(nextImages));
    const discarded = toUrlList(previousImages).filter((url) => !next.has(url));

    if (discarded.length === 0) return { deleted: [], skipped: [] };

    const deleted = [];
    const skipped = [];

    for (const url of discarded) {
        const path = extractStoragePath(url);

        if (!path) {
            skipped.push({ url, reason: 'external' });
            continue;
        }

        if (await isStillReferenced(url, productId)) {
            skipped.push({ url, reason: 'shared' });
            continue;
        }

        const { error } = await supabaseAdmin.storage.from(BUCKET).remove([path]);

        if (error) {
            logger.warn('Could not delete replaced product image', { path, error: error.message });
            skipped.push({ url, reason: 'delete-failed' });
            continue;
        }

        deleted.push(path);
    }

    if (deleted.length > 0) logger.info('Deleted replaced product images', { productId, deleted });

    return { deleted, skipped };
};

module.exports = { extractStoragePath, discardReplacedImages, BUCKET };
