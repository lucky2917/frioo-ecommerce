import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { logger } from '../utils/logger';
import { showToast } from '../utils/toast';
import { validatePhoneNumber, validateAddress, validateName, formatPhoneNumber } from '../utils/validation';

export default function Onboarding() {
  const { user, profile, fetchProfile } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    full_name: user?.user_metadata?.full_name || '',
    phone_number: '',
    address: ''
  });
  const [loadingLocation, setLoadingLocation] = useState(false);

  // If user is already fully profiled (has phone), redirect to shop
  useEffect(() => {
    if (profile?.phone_number) {
      navigate('/shop');
    }
  }, [profile?.phone_number, navigate]);

  // --- GEO LOCATION LOGIC ---
  const getLocation = () => {
    if (!navigator.geolocation) {
      showToast("Geolocation is not supported by your browser", 'error');
      return;
    }

    setLoadingLocation(true);
    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude, longitude } = position.coords;

      // Use OpenStreetMap (Free) to get address text
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
        const data = await res.json();
        setFormData(prev => ({ ...prev, address: data.display_name }));
      } catch (error) {
        logger.error("Error fetching address", error);
        showToast("Could not fetch address automatically. Please type it manually.", 'warning');
      }
      setLoadingLocation(false);
    }, () => {
      showToast("Permission denied. Please enable location services.", 'error');
      setLoadingLocation(false);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;

    // Validate inputs
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

    // Format phone number before saving
    const formattedPhone = formatPhoneNumber(formData.phone_number);

    // Insert into Supabase
    const { error } = await supabase.from('profiles').insert([
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
      showToast("Error creating profile: " + error.message, 'error');
    } else {
      await fetchProfile(user.id); // Update Context state immediately
      navigate('/shop'); // Redirect to Shop
    }
  };

  return (
    <div style={{ fontFamily: '"Helvetica Neue", sans-serif' }}>
      <Navbar />
      <div className="page-content">
        <div style={styles.container}>
          <h2 style={styles.title}>Complete Your Profile</h2>
          <p style={styles.sub}>We need a few more details to deliver your freshness.</p>

          <form onSubmit={handleSubmit} style={styles.form}>
            <label style={styles.label}>Full Name</label>
            <input
              style={styles.input}
              value={formData.full_name}
              onChange={e => setFormData({ ...formData, full_name: e.target.value })}
              required
            />

            <label style={styles.label}>Phone Number</label>
            <input
              style={styles.input}
              type="tel"
              placeholder="+91 98765 43210"
              value={formData.phone_number}
              onChange={e => setFormData({ ...formData, phone_number: e.target.value })}
              required
            />

            <label style={styles.label}>Delivery Address</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <textarea
                style={{ ...styles.input, flex: 1, minHeight: '80px' }}
                value={formData.address}
                onChange={e => setFormData({ ...formData, address: e.target.value })}
                required
              />
              <button type="button" onClick={getLocation} style={styles.locBtn}>
                {loadingLocation ? '...' : '📍 Detect'}
              </button>
            </div>

            <button type="submit" style={styles.submitBtn}>Save & Continue &rarr;</button>
          </form>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: { maxWidth: '500px', margin: '50px auto', padding: '20px', textAlign: 'center' },
  title: { fontFamily: 'Georgia, serif', fontSize: '2rem', marginBottom: '10px' },
  sub: { color: '#666', marginBottom: '30px' },
  form: { display: 'flex', flexDirection: 'column', gap: '15px', textAlign: 'left' },
  label: { fontWeight: 'bold', fontSize: '0.9rem', color: '#333' },
  input: { padding: '12px', borderRadius: '8px', border: '1px solid #ccc', fontSize: '1rem', fontFamily: 'inherit' },
  locBtn: { background: '#e3f2fd', border: '1px solid #2196F3', color: '#0d47a1', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', padding: '0 15px' },
  submitBtn: { padding: '15px', background: '#1a1a1a', color: 'white', border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' }
};