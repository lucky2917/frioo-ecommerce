import { useState, useEffect, useRef } from 'react';
import Field from '../components/form/Field';
import { fetchWithTimeout } from '../lib/http';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/auth-context';
import { supabase } from '../lib/supabaseClient';
import { logger } from '../utils/logger';
import { validatePhoneNumber, validateAddress, validateName, formatPhoneNumber } from '../utils/validation';

export default function Onboarding() {
  const { user, profile, fetchProfile, loading } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    full_name: '',
    phone_number: '',
    address: ''
  });
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const [lastUser, setLastUser] = useState(null);
  if (user !== lastUser) {
    setLastUser(user);
    if (user?.user_metadata?.full_name && !formData.full_name) {
      setFormData(prev => ({ ...prev, full_name: user.user_metadata.full_name }));
    }
  }

  useEffect(() => {
    if (!loading && !user) {
      logger.warn('Onboarding accessed without user - redirecting to home');
      navigate('/');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (profile?.phone_number) {
      navigate('/shop');
    }
  }, [profile?.phone_number, navigate]);

  if (loading || !user) {
    return (
      <div className="onboarding-verify">
        <h3>Verifying Login...</h3>
        <p>Please wait while we secure your session.</p>
      </div>
    );
  }

  const getLocation = () => {
    if (!navigator.geolocation) {
      setErrors(prev => ({ ...prev, address: 'This browser cannot detect your location. Please type the address instead.' }));
      return;
    }

    setLoadingLocation(true);
    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude, longitude } = position.coords;

      try {
        const res = await fetchWithTimeout(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
          { timeoutMs: 10000 }
        );
        const data = await res.json();
        if (!mountedRef.current) return;

        if (!data?.display_name) {
          setErrors(prev => ({ ...prev, address: 'We could not find your address automatically. Please type it instead.' }));
        } else {
          setFormData(prev => ({ ...prev, address: data.display_name }));
          setErrors(prev => ({ ...prev, address: undefined }));
        }
      } catch (error) {
        logger.error('Error fetching address', error);
        if (!mountedRef.current) return;
        setErrors(prev => ({ ...prev, address: 'We could not find your address automatically. Please type it instead.' }));
      }
      if (mountedRef.current) setLoadingLocation(false);
    }, () => {
      if (!mountedRef.current) return;
      setErrors(prev => ({ ...prev, address: 'Location access is off. Turn it on in your browser settings, or type the address.' }));
      setLoadingLocation(false);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user || submitting) return;

    const nextErrors = {};
    if (!validateName(formData.full_name)) nextErrors.full_name = 'Enter your name using at least 2 letters.';
    if (!validatePhoneNumber(formData.phone_number)) nextErrors.phone_number = 'Enter a 10 digit Indian mobile number starting with 6, 7, 8 or 9.';
    if (!validateAddress(formData.address)) nextErrors.address = 'Enter a delivery address of at least 10 characters so we can find you.';

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const formattedPhone = formatPhoneNumber(formData.phone_number);
    setSubmitting(true);

    try {
      const { error } = await supabase.from('profiles').upsert([
        {
          id: user.id,
          email: user.email,
          full_name: formData.full_name.trim(),
          phone_number: formattedPhone,
          address: formData.address.trim(),
          avatar_url: user.user_metadata?.avatar_url ?? null
        }
      ]);

      if (error) throw error;

      await fetchProfile(user.id);
      navigate('/shop');
    } catch (error) {
      logger.error('Profile creation error:', error);
      if (!mountedRef.current) return;
      setErrors({ form: 'We could not save your details. Check your connection and try again.' });
      setSubmitting(false);
    }
  };

  return (
    <div className="onboarding-page">
      <div className="page-content">
        <div className="onboarding-container">
          <h2 className="onboarding-title">Complete Your Profile</h2>
          <p className="onboarding-sub">We need a few more details to deliver your freshness.</p>

          <form onSubmit={handleSubmit} className="onboarding-form">
            <Field label="Full name" error={errors.full_name} required>
              {({ id, describedBy, invalid }) => (
                <input
                  id={id}
                  className="onboarding-input"
                  autoComplete="name"
                  aria-describedby={describedBy}
                  aria-invalid={invalid}
                  value={formData.full_name}
                  onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                />
              )}
            </Field>

            <Field label="Phone number" hint="10 digits, starting with 6, 7, 8 or 9" error={errors.phone_number} required>
              {({ id, describedBy, invalid }) => (
                <input
                  id={id}
                  className="onboarding-input"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel"
                  maxLength={14}
                  placeholder="98765 43210"
                  aria-describedby={describedBy}
                  aria-invalid={invalid}
                  value={formData.phone_number}
                  onChange={e => setFormData({ ...formData, phone_number: e.target.value })}
                />
              )}
            </Field>

            <Field label="Delivery address" hint="House or flat, street and area" error={errors.address} required>
              {({ id, describedBy, invalid }) => (
                <div className="address-row">
                  <textarea
                    id={id}
                    className="onboarding-input address-textarea"
                    autoComplete="street-address"
                    aria-describedby={describedBy}
                    aria-invalid={invalid}
                    value={formData.address}
                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                  />
                  <button type="button" onClick={getLocation} className="detect-btn" disabled={loadingLocation} aria-busy={loadingLocation}>
                    {loadingLocation ? 'Finding…' : 'Detect'}
                  </button>
                </div>
              )}
            </Field>

            {errors.form && <p className="onboarding-form-error" role="alert">{errors.form}</p>}
            <button type="submit" className="onboarding-submit" disabled={submitting} aria-busy={submitting}>
              {submitting ? 'Saving…' : 'Save & Continue'}
            </button>
          </form>
        </div>
      </div>

      <style>{`
        .onboarding-page {
          font-family: var(--fr-font-sans);
          min-height: 100vh;
          background: var(--fr-canvas);
        }

        .onboarding-verify {
          height: 100vh;
          height: 100dvh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          font-family: var(--fr-font-sans);
          color: var(--fr-text-2);
        }

        .onboarding-container {
          max-width: 520px;
          margin: 100px auto 80px;
          padding: 50px 40px;
          background: white;
          border-radius: var(--fr-r-surface);
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.06);
          text-align: center;
        }

        .onboarding-title {
          font-family: var(--fr-font-display);
          font-size: var(--fr-fs-headline);
          font-weight: var(--fr-fw-bold);
          line-height: var(--fr-lh-tight);
          letter-spacing: var(--fr-track-headline);
          color: #111;
          margin: 0 0 10px;
        }

        .onboarding-sub {
          color: var(--fr-text-3);
          font-size: var(--fr-fs-lead);
          font-weight: var(--fr-fw-regular);
          line-height: var(--fr-lh-normal);
          margin: 0 0 35px;
        }

        .onboarding-form {
          display: flex;
          flex-direction: column;
          gap: 8px;
          text-align: left;
        }

        .onboarding-label {
          font-family: var(--fr-font-sans);
          font-size: var(--fr-fs-eyebrow);
          font-weight: var(--fr-fw-medium);
          line-height: var(--fr-lh-snug);
          color: var(--fr-text-2);
          text-transform: uppercase;
          letter-spacing: var(--fr-track-eyebrow);
          margin-top: 12px;
        }

        .onboarding-input {
          padding: 12px 14px;
          border-radius: var(--fr-r-card);
          border: 1px solid #ddd;
          font-size: var(--fr-fs-control);
          font-weight: var(--fr-fw-regular);
          line-height: var(--fr-lh-control);
          font-family: var(--fr-font-sans);
          background: var(--fr-canvas);
          transition: border-color 0.2s, box-shadow 0.2s;
          outline: none;
          width: 100%;
          box-sizing: border-box;
        }

        .onboarding-input:focus {
          border-color: var(--fr-brand);
          box-shadow: 0 0 0 3px rgba(212, 175, 122, 0.15);
          background: white;
        }

        .address-row {
          display: flex;
          gap: 10px;
          align-items: flex-start;
        }

        .address-textarea {
          flex: 1;
          min-height: 80px;
          resize: none;
        }

        .detect-btn {
          background: #f0f7ff;
          border: 1px solid #b3d4f5;
          color: #1565c0;
          border-radius: var(--fr-r-card);
          cursor: pointer;
          font-family: var(--fr-font-sans);
          font-size: var(--fr-fs-control);
          font-weight: var(--fr-fw-medium);
          line-height: var(--fr-lh-control);
          padding: 0 16px;
          height: 46px;
          white-space: nowrap;
          transition: background 0.2s;
          flex-shrink: 0;
        }

        .detect-btn:hover {
          background: #dbeeff;
        }

        .onboarding-form-error { font-family: var(--fr-font-sans); font-size: var(--fr-fs-caption); font-weight: var(--fr-fw-regular); line-height: var(--fr-lh-normal); color: var(--fr-danger); margin: 0 0 12px; }
        .onboarding-submit {
          margin-top: 20px;
          padding: 15px;
          background: #2F4F4F;
          color: white;
          border: none;
          border-radius: var(--fr-r-card);
          font-size: var(--fr-fs-control);
          font-weight: var(--fr-fw-medium);
          line-height: var(--fr-lh-control);
          cursor: pointer;
          font-family: var(--fr-font-sans);
          transition: background 0.2s;
        }

        .onboarding-submit:hover {
          background: #1a2f2f;
        }

        @media (max-width: 600px) {
          .onboarding-container {
            margin: 80px 16px 60px;
            padding: 30px 20px;
          }
        }
      `}</style>
    </div>
  );
}
