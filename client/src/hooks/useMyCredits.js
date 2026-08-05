import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { API_BASE_URL } from '../config/constants';
import { fetchWithTimeout } from '../lib/http';
import { logger } from '../utils/logger';

const BASE = `${API_BASE_URL}/api/credits`;

const authedGet = async (path, signal) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return null;

    const res = await fetchWithTimeout(`${BASE}${path}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
        signal
    });

    const payload = await res.json().catch(() => null);
    if (!res.ok || payload?.success === false) return null;
    return payload?.data ?? null;
};

export const fetchCreditPreview = async (totalPaise) => {
    const data = await authedGet(`/preview?total_paise=${totalPaise}`);
    return data?.preview ?? null;
};

export const fetchPublicPlans = async () => {
    try {
        const res = await fetchWithTimeout(`${BASE}/plans`);
        const payload = await res.json().catch(() => null);
        return payload?.data?.plans ?? [];
    } catch (err) {
        logger.warn('Could not load credit plans', err);
        return [];
    }
};

export const useMyCredits = ({ withHistory = false } = {}) => {
    const [summary, setSummary] = useState(null);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    const abortRef = useRef(null);

    const load = useCallback(async () => {
        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;

        setLoading(true);
        setError(false);

        try {
            const requests = [authedGet('/summary', controller.signal)];
            if (withHistory) requests.push(authedGet('/history?limit=150', controller.signal));

            const [summaryData, historyData] = await Promise.all(requests);

            if (controller.signal.aborted) return;

            setSummary(summaryData?.summary ?? null);
            if (withHistory) setHistory(historyData?.rows ?? []);
        } catch (err) {
            if (err?.name !== 'AbortError') {
                logger.warn('Could not load credits', err);
                setError(true);
            }
        } finally {
            if (!controller.signal.aborted) setLoading(false);
        }
    }, [withHistory]);

    useEffect(() => {
        void load();
        const ref = abortRef;
        return () => ref.current?.abort();
    }, [load]);

    return { summary, history, loading, error, refresh: load };
};
