import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { logger } from '../utils/logger';
import { showToast } from '../utils/toast';
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
      showToast('Geolocation is not supported by your browser', 'error');
      return;
    }

    setLoadingLocation(true);
    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude, longitude } = position.coords;

      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
        const data = await res.json();
        setFormData(prev => ({ ...prev, address: data.display_name }));
      } catch (error) {
        logger.error('Error fetching address', error);
        showToast('Could not fetch address automatically. Please type it manually.', 'warning');
      }
      setLoadingLocation(false);
    }, () => {
      showToast('Permission denied. Please enable location services.', 'error');
      setLoadingLocation(false);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;

    if (!validateName(formData.full_name)) {
      showToast('Please enter a valid name (at least 2 letters)', 'error');
      return;
    }

    if (!validatePhoneNumber(formData.phone_number)) {
      showToast('Please enter a valid Indian phone number (10 digits starting with 6-9)', 'error');
      return;
    }

    if (!validateAddress(formData.address)) {
      showToast('Please enter a valid address (at least 10 characters)', 'error');
      return;
    }

    const formattedPhone = formatPhoneNumber(formData.phone_number);

    const { error } = await supabase.from('profiles').upsert([
      {
        id: user.id,
        email: user.email,
        full_name: formData.full_name,
        phone_number: formattedPhone,
        address: formData.address,
        avatar_url: user.user_metadata.avatar_url
      }
    ]);

    if (error) {
      logger.error('Profile creation error:', error);
      showToast('Error saving profile: ' + error.message, 'error');
    } else {
      await fetchProfile(user.id);
      navigate('/shop');
    }
  };

  return (
    <div className="onboarding-page">
      <Navbar />
      <div className="page-content">
        <div className="onboarding-container">
          <h2 className="onboarding-title">Complete Your Profile</h2>
          <p className="onboarding-sub">We need a few more details to deliver your freshness.</p>

          <form onSubmit={handleSubmit} className="onboarding-form">
            <label className="onboarding-label">Full Name</label>
            <input
              className="onboarding-input"
              value={formData.full_name}
              onChange={e => setFormData({ ...formData, full_name: e.target.value })}
              required
            />

            <label className="onboarding-label">Phone Number</label>
            <input
              className="onboarding-input"
              type="tel"
              placeholder="+91 98765 43210"
              value={formData.phone_number}
              onChange={e => setFormData({ ...formData, phone_number: e.target.value })}
              required
            />

            <label className="onboarding-label">Delivery Address</label>
            <div className="address-row">
              <textarea
                className="onboarding-input address-textarea"
                value={formData.address}
                onChange={e => setFormData({ ...formData, address: e.target.value })}
                required
              />
              <button type="button" onClick={getLocation} className="detect-btn">
                {loadingLocation ? '...' : 'Detect'}
              </button>
            </div>

            <button type="submit" className="onboarding-submit">Save &amp; Continue</button>
          </form>
        </div>
      </div>

      <style>{`
        .onboarding-page {
          font-family: var(--fr-font-sans);
          min-height: 100vh;
          background: #FAFAFA;
        }

        .onboarding-verify {
          height: 100vh;
          height: 100dvh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          font-family: var(--fr-font-sans);
          color: #666;
        }

        .onboarding-container {
          max-width: 520px;
          margin: 100px auto 80px;
          padding: 50px 40px;
          background: white;
          border-radius: 16px;
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
          color: #888;
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
          color: #555;
          text-transform: uppercase;
          letter-spacing: var(--fr-track-eyebrow);
          margin-top: 12px;
        }

        .onboarding-input {
          padding: 12px 14px;
          border-radius: 8px;
          border: 1px solid #ddd;
          font-size: var(--fr-fs-control);
          font-weight: var(--fr-fw-regular);
          line-height: var(--fr-lh-control);
          font-family: var(--fr-font-sans);
          background: #fafafa;
          transition: border-color 0.2s, box-shadow 0.2s;
          outline: none;
          width: 100%;
          box-sizing: border-box;
        }

        .onboarding-input:focus {
          border-color: #D4AF7A;
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
          border-radius: 8px;
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

        .onboarding-submit {
          margin-top: 20px;
          padding: 15px;
          background: #2F4F4F;
          color: white;
          border: none;
          border-radius: 8px;
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
