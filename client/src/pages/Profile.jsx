import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { supabase } from '../lib/supabaseClient';
import Navbar from '../components/layout/Navbar';
import { showToast } from '../utils/toast';
import { logger } from '../utils/logger';
import { Link } from 'react-router-dom';

export default function Profile() {
  const { addToCart } = useCart();
  const { profile, user } = useAuth();

  // We can track which field is being edited, or just a global edit mode.
  // User asked for "pencil icon beside every field", implying granular control or just visual cues.
  // Let's stick to global editing for simplicity in state management, 
  // but if they click a pencil, we focus that input.
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('saved');

  const [form, setForm] = useState({
    full_name: profile?.full_name || '',
    phone_number: profile?.phone_number || '',
    address: profile?.address || ''
  });
  const [savedRecipes, setSavedRecipes] = useState([]);

  // Refs to focus specific fields
  const nameRef = useRef(null);
  const phoneRef = useRef(null);
  const addressRef = useRef(null);

  // Load Saved Recipes
  useEffect(() => {
    const fetchSavedRecipes = async () => {
      if (!user?.id) return;
      const { data, error } = await supabase
        .from('saved_recipes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!error && data) setSavedRecipes(data);
    };

    if (user?.id) {
      fetchSavedRecipes();
    }
  }, [user]);

  // Sync form
  useEffect(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name || '',
        phone_number: profile.phone_number || '',
        address: profile.address || ''
      });
    }
  }, [profile]);

  const handleOrderRecipe = (recipe) => {
    const ingredientsList = recipe.items.map(i => i.name).join(', ');
    const virtualProduct = {
      id: recipe.id,
      title: `AI Plan: ${recipe.recipe_name}`,
      price: recipe.price,
      images: ['/ai-bowl-placeholder.png'],
      description: `Your saved custom mix: ${ingredientsList}`,
      isVirtual: true
    };
    addToCart(virtualProduct, 'Saved', recipe.price, { note: `Ingredients: ${ingredientsList}` });
  };

  const handleDeleteRecipe = async (id) => {
    const { error } = await supabase.from('saved_recipes').delete().eq('id', id);
    if (!error) {
      showToast('Recipe removed', 'success');
      setSavedRecipes(prev => prev.filter(r => r.id !== id));
    }
  };

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
    // Small timeout to allow render to switch to input, then focus
    setTimeout(() => {
      fieldRef.current?.focus();
    }, 50);
  };

  return (
    <div className="profile-page">
      <Navbar />

      {/* HERO BANNER SECTION */}
      <div className="profile-hero">
        <div className="hero-content">
          <h1 className="hero-title">Welcome Back, {profile?.full_name?.split(' ')[0] || 'Friend'}</h1>
        </div>
      </div>

      <div className="profile-container">

        {/* FLOATING CARD */}
        <div className="profile-float-card">
          <div className="avatar-wrapper">
            <img
              src={profile?.avatar_url || 'https://via.placeholder.com/150'}
              alt="Profile"
              className="avatar-img"
            />
          </div>

          {/* Always show the Form Layout (Grid) */}
          <div className="field-grid">

            {/* FULL NAME */}
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

            {/* PHONE */}
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

            {/* ADDRESS (Full Width) */}
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
                  // Auto-grow could be added but 1 row is fine for display similarity
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

          {/* SAVE / CANCEL ACTIONS (Only when editing) */}
          {editing && (
            <div className="edit-actions fade-in">
              <button onClick={handleUpdate} disabled={loading} className="btn-save">Save Changes</button>
              <button onClick={() => setEditing(false)} className="btn-cancel">Cancel</button>
            </div>
          )}
        </div>

        {/* TABS / SECTIONS */}
        <div className="profile-sections">
          <div className="section-tabs">
            <button
              className={`tab-btn ${activeTab === 'saved' ? 'active' : ''}`}
              onClick={() => setActiveTab('saved')}
            >
              Saved Recipes
            </button>
            <Link to="/orders" className="tab-link">My Orders ↗</Link>
          </div>

          {activeTab === 'saved' && (
            <div className="recipes-grid fade-in">
              {savedRecipes.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">🥗</div>
                  <h3>Your Cookbook is Empty</h3>
                  <p>Discover personalized nutrition with our AI.</p>
                  <Link to="/frioo-ai" className="btn-gold">Create a Plan</Link>
                </div>
              ) : (
                savedRecipes.map(recipe => (
                  <div key={recipe.id} className="recipe-card-modern">
                    <div className="rcm-image-placeholder">
                      <span>🥗</span>
                    </div>
                    <div className="rcm-content">
                      <div className="rcm-top">
                        <h3 className="rcm-title">{recipe.recipe_name}</h3>
                        <span className="rcm-price">₹{recipe.price}</span>
                      </div>
                      <p className="rcm-desc">
                        {recipe.items.map(i => i.name).join(', ')}
                      </p>
                      <button onClick={() => handleOrderRecipe(recipe)} className="btn-add-cart">
                        Add To Cart
                      </button>
                    </div>
                    <button onClick={() => handleDeleteRecipe(recipe.id)} className="btn-remove-x">×</button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

      </div>

      <style>{`
        /* --- LAYOUT --- */
        .profile-page {
            background-color: #FAFAFA;
            min-height: 100vh;
        }

        /* --- HERO --- */
        .profile-hero {
            height: 300px;
            background: linear-gradient(135deg, #2F4F4F 0%, #1a2f2f 100%);
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
            padding-top: var(--navbar-height-mobile); /* Responsive navbar clearance */
            color: white;
            text-align: center;
        }
        .hero-title {
            font-family: 'Playfair Display', serif;
            font-size: 3rem;
            opacity: 0.9;
        }

        /* --- CONTAINER --- */
        .profile-container {
            max-width: 900px;
            margin: 0 auto;
            padding: 0 20px 80px;
            position: relative;
            top: -60px; /* Overlap hero */
        }

        /* --- FLOAT CARD --- */
        .profile-float-card {
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.08);
            padding: 40px 60px;
            text-align: center;
            margin-bottom: 50px;
        }
        
        .avatar-wrapper {
            width: 120px;
            height: 120px;
            margin: -80px auto 30px; /* Pull up partially out of card */
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

        /* --- FIELD GRID (Similar to Edit Mode in screenshot) --- */
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
            border-bottom: 2px solid #D4AF7A; /* Highlight when editing */
            margin-bottom: -1px; /* Overlap existing border */
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

        /* --- ACTIONS --- */
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

        /* --- TABS --- */
        .section-tabs {
            display: flex;
            justify-content: center;
            gap: 40px;
            margin-bottom: 40px;
            border-bottom: 1px solid #eee;
            padding-bottom: 15px;
        }
        .tab-btn {
            background: none;
            border: none;
            font-size: 1.2rem;
            font-family: 'Playfair Display', serif;
            color: #aaa;
            cursor: pointer;
            padding-bottom: 5px;
            position: relative;
        }
        .tab-btn.active {
            color: #111;
        }
        .tab-btn.active::after {
            content: '';
            position: absolute;
            bottom: -16px;
            left: 0;
            width: 100%;
            height: 2px;
            background: #D4AF7A;
        }
        .tab-link {
            text-decoration: none;
            font-size: 1rem;
            color: #666;
            margin-top: 5px; /* Align slightly */
            transition: color 0.2s;
        }
        .tab-link:hover { color: #111; }

        /* --- RECIPES GRID --- */
        .recipes-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
            gap: 30px;
        }
        
        .recipe-card-modern {
            background: white;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 10px 30px rgba(0,0,0,0.03);
            transition: transform 0.3s;
            position: relative;
            display: flex;
        }
        .recipe-card-modern:hover {
            transform: translateY(-5px);
            box-shadow: 0 15px 40px rgba(0,0,0,0.06);
        }

        .rcm-image-placeholder {
            width: 100px;
            background: #fafaf5;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 2.5rem;
        }
        .rcm-content {
            flex: 1;
            padding: 20px;
        }
        .rcm-top {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 8px;
        }
        .rcm-title {
            font-family: 'Playfair Display', serif;
            font-size: 1.1rem;
            margin: 0;
            color: #111;
        }
        .rcm-price {
            font-weight: 700;
            color: #D4AF7A;
            font-size: 1rem;
        }
        .rcm-desc {
            font-size: 0.85rem;
            color: #777;
            margin-bottom: 15px;
            line-height: 1.4;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
        }
        
        .btn-add-cart {
            font-size: 0.8rem;
            font-weight: 700;
            color: #111;
            background: transparent;
            border: 1px solid #111;
            padding: 6px 14px;
            border-radius: 30px;
            cursor: pointer;
            transition: all 0.2s;
        }
        .btn-add-cart:hover {
            background: #111;
            color: white;
        }

        .btn-remove-x {
            position: absolute;
            top: 10px;
            right: 10px;
            background: none;
            border: none;
            font-size: 1.2rem;
            color: #ccc;
            cursor: pointer;
            line-height: 1;
        }
        .btn-remove-x:hover { color: #d32f2f; }


        /* --- BUTTONS UTILS --- */
        .btn-gold {
            background: #D4AF7A;
            color: white;
            padding: 12px 30px;
            border-radius: 30px;
            text-decoration: none;
            font-weight: 600;
            display: inline-block;
        }

        /* --- EMPTY STATE --- */
        .empty-state {
            grid-column: 1 / -1;
            text-align: center;
            padding: 60px;
            background: white;
            border-radius: 20px;
            border: 2px dashed #f0f0f0;
        }
        .empty-icon { font-size: 3rem; margin-bottom: 15px; }

        /* --- ANIMATIONS --- */
        .fade-in { animation: fadeIn 0.4s ease forwards; }
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }

        /* --- MEDIA QUERIES --- */
        @media (max-width: 768px) {
            .hero-title { font-size: 2rem; }
            .profile-hero { height: 250px; }
            .profile-container { padding-left: 15px; padding-right: 15px; }
            .field-grid { grid-template-columns: 1fr; }
            .field-group.full { grid-column: span 1; }
            .profile-float-card { padding: 30px 20px; }
        }
      `}</style>
    </div>
  );
}