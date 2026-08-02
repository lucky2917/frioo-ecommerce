const MAX_SAMPLES = 500;
const MAX_TRACKED_ROUTES = 100;

const startedAt = Date.now();

const state = {
    total: 0,
    errors: 0,
    byStatusClass: {},
    byRoute: new Map(),
    samples: [],
    sampleCursor: 0
};

const normalizeRoute = (method, path) => {
    const [pathname] = path.split('?');
    const normalized = pathname
        .split('/')
        .map((segment) => {
            if (!segment) return segment;
            if (/^\d+$/.test(segment)) return ':id';
            if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment)) return ':uuid';
            return segment;
        })
        .join('/');

    return `${method} ${normalized || '/'}`;
};

const record = ({ method, path, status, durationMs }) => {
    state.total += 1;

    const statusClass = `${Math.floor(status / 100)}xx`;
    state.byStatusClass[statusClass] = (state.byStatusClass[statusClass] || 0) + 1;
    if (status >= 500) state.errors += 1;

    if (state.samples.length < MAX_SAMPLES) {
        state.samples.push(durationMs);
    } else {
        state.samples[state.sampleCursor] = durationMs;
        state.sampleCursor = (state.sampleCursor + 1) % MAX_SAMPLES;
    }

    const key = normalizeRoute(method, path);
    const existing = state.byRoute.get(key);

    if (existing) {
        existing.count += 1;
        existing.totalMs += durationMs;
        if (status >= 500) existing.errors += 1;
        return;
    }

    if (state.byRoute.size >= MAX_TRACKED_ROUTES) return;
    state.byRoute.set(key, { count: 1, totalMs: durationMs, errors: status >= 500 ? 1 : 0 });
};

const percentile = (sorted, fraction) => {
    if (sorted.length === 0) return 0;
    const index = Math.min(sorted.length - 1, Math.ceil(fraction * sorted.length) - 1);
    return sorted[Math.max(0, index)];
};

const round = (value) => Math.round(value * 100) / 100;

const getSummary = () => {
    const sorted = [...state.samples].sort((a, b) => a - b);
    const sum = sorted.reduce((acc, value) => acc + value, 0);

    return {
        totalRequests: state.total,
        errors: state.errors,
        byStatusClass: { ...state.byStatusClass },
        avgResponseMs: sorted.length ? round(sum / sorted.length) : 0,
        p95ResponseMs: round(percentile(sorted, 0.95)),
        sampleSize: sorted.length,
        instanceUptimeSeconds: round((Date.now() - startedAt) / 1000)
    };
};

const getRoutes = () =>
    [...state.byRoute.entries()]
        .map(([route, value]) => ({
            route,
            count: value.count,
            errors: value.errors,
            avgResponseMs: round(value.totalMs / value.count)
        }))
        .sort((a, b) => b.count - a.count);

const getProcessInfo = () => {
    const memory = process.memoryUsage();
    return {
        node: process.version,
        pid: process.pid,
        processUptimeSeconds: round(process.uptime()),
        memory: {
            heapUsedMb: round(memory.heapUsed / 1048576),
            heapTotalMb: round(memory.heapTotal / 1048576),
            rssMb: round(memory.rss / 1048576)
        }
    };
};

module.exports = { record, getSummary, getRoutes, getProcessInfo };
