import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import Navbar from '../components/layout/Navbar';
import { showToast } from '../utils/toast';
import { logger } from '../utils/logger';
import { Link } from 'react-router-dom';

export default function Profile() {
  const { profile, user, loading: authLoading } = useAuth();

  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    full_name: profile?.full_name || '',
    phone_number: profile?.phone_number || '',
    address: profile?.address || ''
  });

  const nameRef = useRef(null);
  const phoneRef = useRef(null);
  const addressRef = useRef(null);

  useEffect(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name || '',
        phone_number: profile.phone_number || '',
        address: profile.address || ''
      });
    }
  }, [profile]);

  const handleUpdate = async () => {
    if (!user?.id) {
      showToast('Please login to update profile', 'error');
      return;
    }

    setLoading(true);
    try {
      const updates = {
        id: user.id,
        full_name: form.full_name,
        phone_number: form.phone_number,
        address: form.address,
        updated_at: new Date(),
      };
      const { error } = await supabase.from('profiles').upsert(updates);
      if (error) throw error;
      showToast('Profile updated!', 'success');
      setEditing(false);
    } catch (error) {
      showToast('Error updating profile', 'error');
      logger.error(error);
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (fieldRef) => {
    setEditing(true);
    setTimeout(() => {
      fieldRef.current?.focus();
    }, 50);
  };

  if (authLoading) return <div style={{ height: '100vh' }} />;

  return (
    <div className="profile-page">
      <Navbar />

      <div className="profile-hero">
        <div className="hero-content">
          <h1 className="hero-title">Welcome Back, {profile?.full_name?.split(' ')[0] || 'Friend'}</h1>
        </div>
      </div>

      <div className="profile-container">

        <div className="profile-float-card">
          <div className="avatar-wrapper">
            <img
              src={profile?.avatar_url || 'https://via.placeholder.com/150'}
              alt="Profile"
              className="avatar-img"
            />
          </div>

          <div className="field-grid">

            <div className="field-group">
              <label>Full Name</label>
              <div className="field-row">
                {editing ? (
                  <input
                    ref={nameRef}
                    value={form.full_name}
                    onChange={e => setForm({ ...form, full_name: e.target.value })}
                    className="field-input active"
                  />
                ) : (
                  <div className="field-display">{profile?.full_name || '—'}</div>
                )}
                {!editing && (
                  <button className="icon-pencil" onClick={() => startEdit(nameRef)} title="Edit Name">✎</button>
                )}
              </div>
            </div>

            <div className="field-group">
              <label>Phone</label>
              <div className="field-row">
                {editing ? (
                  <input
                    ref={phoneRef}
                    value={form.phone_number}
                    onChange={e => setForm({ ...form, phone_number: e.target.value })}
                    className="field-input active"
                  />
                ) : (
                  <div className="field-display">{profile?.phone_number || '—'}</div>
                )}
                {!editing && (
                  <button className="icon-pencil" onClick={() => startEdit(phoneRef)} title="Edit Phone">✎</button>
                )}
              </div>
            </div>

            <div className="field-group full">
              <label>Address</label>
              <div className="field-row">
                {editing ? (
                  <textarea
                    ref={addressRef}
                    value={form.address}
                    onChange={e => setForm({ ...form, address: e.target.value })}
                    className="field-input active"
                    rows={1}
                    style={{ resize: 'none' }}
                  />
                ) : (
                  <div className="field-display">{profile?.address || '—'}</div>
                )}
                {!editing && (
                  <button className="icon-pencil" onClick={() => startEdit(addressRef)} title="Edit Address">✎</button>
                )}
              </div>
            </div>

          </div>

          {editing && (
            <div className="edit-actions fade-in">
              <button onClick={handleUpdate} disabled={loading} className="btn-save">Save Changes</button>
              <button onClick={() => setEditing(false)} className="btn-cancel">Cancel</button>
            </div>
          )}
        </div>

        <div className="orders-cta">
          <div className="orders-cta-text">
            <h3>Your Orders</h3>
            <p>Track your deliveries and view past purchases.</p>
          </div>
          <Link to="/orders" className="btn-orders">View Orders</Link>
        </div>

      </div>

      <style>{`
        .profile-page {
            background-color: #FAFAFA;
            min-height: 100vh;
        }

        .profile-hero {
            height: 300px;
            background: linear-gradient(135deg, #2F4F4F 0%, #1a2f2f 100%);
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
            padding-top: var(--navbar-height-mobile);
            color: white;
            text-align: center;
        }
        .hero-title {
            font-family: 'Playfair Display', serif;
            font-size: 3rem;
            opacity: 0.9;
        }

        .profile-container {
            max-width: 900px;
            margin: 0 auto;
            padding: 0 20px 80px;
            position: relative;
            top: -60px;
        }

        .profile-float-card {
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.08);
            padding: 40px 60px;
            text-align: center;
            margin-bottom: 30px;
        }

        .avatar-wrapper {
            width: 120px;
            height: 120px;
            margin: -80px auto 30px;
            border-radius: 50%;
            background: white;
            padding: 5px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
        }
        .avatar-img {
            width: 100%;
            height: 100%;
            border-radius: 50%;
            object-fit: cover;
            border: 1px solid #eee;
        }

        .field-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            text-align: left;
            margin-bottom: 30px;
        }
        .field-group.full { grid-column: span 2; }

        .field-group label {
            display: block;
            font-size: 0.75rem;
            font-weight: 700;
            color: #333;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 8px;
        }

        .field-row {
            display: flex;
            align-items: center;
            border-bottom: 1px solid #eee;
            padding-bottom: 5px;
            min-height: 40px;
        }

        .field-display {
            font-family: 'Manrope', sans-serif;
            font-size: 1.1rem;
            color: #333;
            flex: 1;
        }

        .field-input {
            font-family: 'Manrope', sans-serif;
            font-size: 1.1rem;
            color: #111;
            flex: 1;
            border: none;
            outline: none;
            background: transparent;
            padding: 0;
            width: 100%;
        }
        .field-input.active {
            border-bottom: 2px solid #D4AF7A;
            margin-bottom: -1px;
        }

        .icon-pencil {
            background: none;
            border: none;
            cursor: pointer;
            color: #aaa;
            font-size: 1.2rem;
            padding: 0 0 0 10px;
            transition: color 0.2s;
        }
        .icon-pencil:hover { color: #D4AF7A; }

        .edit-actions {
            display: flex;
            justify-content: center;
            gap: 15px;
            margin-top: 30px;
        }
        .btn-save {
            background: #D4AF7A;
            color: white;
            border: none;
            padding: 10px 30px;
            border-radius: 30px;
            font-weight: 600;
            cursor: pointer;
        }
        .btn-cancel {
            background: none;
            border: none;
            color: #666;
            cursor: pointer;
            font-weight: 600;
        }

        .orders-cta {
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.05);
            padding: 30px 40px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 20px;
        }
        .orders-cta-text h3 {
            font-family: 'Playfair Display', serif;
            font-size: 1.4rem;
            color: #111;
            margin: 0 0 6px;
        }
        .orders-cta-text p {
            font-size: 0.9rem;
            color: #777;
            margin: 0;
        }
        .btn-orders {
            background: #2F4F4F;
            color: white;
            padding: 12px 30px;
            border-radius: 30px;
            text-decoration: none;
            font-weight: 600;
            font-size: 0.9rem;
            white-space: nowrap;
            transition: background 0.2s;
        }
        .btn-orders:hover { background: #1a2f2f; }

        .fade-in { animation: fadeIn 0.4s ease forwards; }
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }

        @media (max-width: 768px) {
            .hero-title { font-size: 2rem; }
            .profile-hero { height: 250px; }
            .profile-container { padding-left: 15px; padding-right: 15px; }
            .field-grid { grid-template-columns: 1fr; }
            .field-group.full { grid-column: span 1; }
            .profile-float-card { padding: 30px 20px; }
            .orders-cta { flex-direction: column; text-align: center; }
        }
      `}</style>
    </div>
  );
}
