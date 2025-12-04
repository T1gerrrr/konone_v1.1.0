import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, updateDoc, doc, addDoc, getDoc, setDoc, increment } from 'firebase/firestore';
import { db } from '../firebase';
import { createMoMoPayment, PREMIUM_PACKAGES, formatVND } from '../services/momoPayment';
import { t } from '../translations';
import './Premium.css';

export default function Premium() {
  const { currentUser } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [profileId, setProfileId] = useState(null);
  const [activationCode, setActivationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success' or 'error'
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('buy'); // 'buy' or 'activate'

  // Valid activation codes (in production, these should be stored in Firestore)
  const VALID_CODES = {
    'PREMIUM2024': { days: 30, name: 'Premium 1 Month', maxUses: null },
    'PREMIUM2025': { days: 30, name: 'Premium 1 Month', maxUses: null },
    'PREMIUM2026': { days: 30, name: 'Premium 1 Month', maxUses: null },
    'PREMIUM2024YEAR': { days: 365, name: 'Premium 1 Year', maxUses: null },
    'PREMIUMFOREVER': { days: 9999, name: 'Premium Lifetime', maxUses: null },
    'TESTCODE': { days: 7, name: 'Test Premium 7 Days', maxUses: null },
    'TIGERKON2025': { days: 30, name: 'Premium 1 Month', maxUses: 20 }
  };

  useEffect(() => {
    async function loadProfile() {
      try {
        const profilesRef = collection(db, 'profiles');
        const q = query(profilesRef, where('userId', '==', currentUser.uid));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const profileData = querySnapshot.docs[0].data();
          setProfileId(querySnapshot.docs[0].id);
          setProfile({
            id: querySnapshot.docs[0].id,
            ...profileData
          });
        }
      } catch (error) {
        console.error('Error loading profile:', error);
      }
    }

    if (currentUser) {
      loadProfile();
    }
  }, [currentUser]);

  async function handleActivatePremium() {
    if (!activationCode.trim()) {
      setMessage(t(language, 'premium.enterCodeError'));
      setMessageType('error');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const code = activationCode.trim().toUpperCase();
      const codeData = VALID_CODES[code];

      if (!codeData) {
        setMessage(t(language, 'premium.invalidCode'));
        setMessageType('error');
        setLoading(false);
        return;
      }

      if (!profileId) {
        setMessage(t(language, 'premium.createProfileFirstActivate'));
        setMessageType('error');
        setLoading(false);
        return;
      }

      // Check code usage limit if maxUses is set
      if (codeData.maxUses !== null && codeData.maxUses !== undefined) {
        const codeRef = doc(db, 'premiumCodes', code);
        const codeDoc = await getDoc(codeRef);
        
        let currentUses = 0;
        if (codeDoc.exists()) {
          currentUses = codeDoc.data().usedCount || 0;
        }
        
        if (currentUses >= codeData.maxUses) {
          setMessage(language === 'vi' 
            ? `Code đã hết lượt sử dụng (${currentUses}/${codeData.maxUses})` 
            : `Code has reached usage limit (${currentUses}/${codeData.maxUses})`);
          setMessageType('error');
          setLoading(false);
          return;
        }
      }

      // Calculate expiration date
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + codeData.days);

      // Update profile with premium status
      await updateDoc(doc(db, 'profiles', profileId), {
        isPremium: true,
        premiumExpiresAt: expiresAt,
        premiumActivatedAt: new Date(),
        premiumCode: code,
        updatedAt: new Date()
      });

      // Update code usage count if maxUses is set
      if (codeData.maxUses !== null && codeData.maxUses !== undefined) {
        const codeRef = doc(db, 'premiumCodes', code);
        const codeDoc = await getDoc(codeRef);
        
        if (codeDoc.exists()) {
          await updateDoc(codeRef, {
            usedCount: increment(1),
            lastUsedAt: new Date()
          });
        } else {
          await setDoc(codeRef, {
            code: code,
            usedCount: 1,
            maxUses: codeData.maxUses,
            createdAt: new Date(),
            lastUsedAt: new Date()
          });
        }
      }

      setMessage(t(language, 'premium.activateSuccess', { days: codeData.days }));
      setMessageType('success');
      setActivationCode('');

      // Reload profile
      const profilesRef = collection(db, 'profiles');
      const q = query(profilesRef, where('userId', '==', currentUser.uid));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const profileData = querySnapshot.docs[0].data();
        setProfile({
          id: querySnapshot.docs[0].id,
          ...profileData
        });
      }
    } catch (error) {
      console.error('Error activating premium:', error);
      setMessage(t(language, 'premium.activateError', { error: error.message }));
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  }

  function isPremiumActive() {
    if (!profile?.isPremium) return false;
    if (!profile?.premiumExpiresAt) return false;
    
    const expiresAt = profile.premiumExpiresAt.toDate ? 
      profile.premiumExpiresAt.toDate() : 
      new Date(profile.premiumExpiresAt);
    
    return expiresAt > new Date();
  }

  function getDaysRemaining() {
    if (!isPremiumActive()) return 0;
    
    const expiresAt = profile.premiumExpiresAt.toDate ? 
      profile.premiumExpiresAt.toDate() : 
      new Date(profile.premiumExpiresAt);
    
    const diff = expiresAt - new Date();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  async function handleMoMoPayment(pkg) {
    if (!pkg) return;

    if (!profileId) {
      setMessage(t(language, 'premium.createProfileFirst'));
      setMessageType('error');
      return;
    }

    setPaymentLoading(true);
    setSelectedPackage(pkg.id);
    setMessage('');
    setMessageType('');

    try {
      // Generate unique order ID
      const orderId = `PREMIUM_${pkg.id}_${Date.now()}_${currentUser.uid.slice(0, 8)}`;
      
      const paymentData = {
        amount: pkg.price,
        orderId: orderId,
        orderInfo: `Thanh toán Premium ${pkg.name}`,
        packageId: pkg.id,
        userId: currentUser.uid,
        profileId: profileId,
        days: pkg.days
      };

      const result = await createMoMoPayment(paymentData);
      
      if (result && result.payUrl) {
        // Redirect to MoMo payment page
        window.location.href = result.payUrl;
      } else {
        setMessage(t(language, 'premium.paymentInitError'));
        setMessageType('error');
        setPaymentLoading(false);
        setSelectedPackage(null);
      }
    } catch (error) {
      console.error('Error initiating MoMo payment:', error);
      setMessage(t(language, 'premium.paymentError', { error: error.message || t(language, 'premium.paymentInitError') }));
      setMessageType('error');
      setPaymentLoading(false);
      setSelectedPackage(null);
    }
  }

  const premiumActive = isPremiumActive();
  const daysRemaining = getDaysRemaining();

  return (
    <div className="premium-page">
      <div className="premium-container">
        <div className="premium-header">
          <h1 className="premium-title">
            <span className="premium-icon"></span>
            {t(language, 'premium.membership')}
          </h1>
          <p className="premium-subtitle">
            {t(language, 'premium.subtitle')}
          </p>
        </div>

        {/* Premium Status */}
        {premiumActive ? (
          <div className="premium-status active">
            <div className="status-icon"></div>
            <div className="status-content">
              <h2>{t(language, 'premium.active')}</h2>
              <p>{t(language, 'premium.activeMessage')} <strong>{daysRemaining} {t(language, 'premium.days')}</strong></p>
              {profile.premiumExpiresAt && (
                <p className="expires-date">
                  {t(language, 'premium.expires')} {new Date(profile.premiumExpiresAt.toDate ? 
                    profile.premiumExpiresAt.toDate() : 
                    profile.premiumExpiresAt).toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US')}
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="premium-status inactive">
            <div className="status-icon"></div>
            <div className="status-content">
              <h2>{t(language, 'premium.freeAccount')}</h2>
              <p>{t(language, 'premium.freeAccountMessage')}</p>
            </div>
          </div>
        )}

        {/* Payment Tabs */}
        <div className="payment-tabs">
          <button 
            className={`tab-button ${activeTab === 'buy' ? 'active' : ''}`}
            onClick={() => setActiveTab('buy')}
          >
            Buy Plan
          </button>
          <button 
            className={`tab-button ${activeTab === 'activate' ? 'active' : ''}`}
            onClick={() => setActiveTab('activate')}
          >
            Active Code
          </button>
        </div>

        {/* Payment Section */}
        {activeTab === 'buy' && (
          <div className="payment-section">
            <h2 className="section-title">{t(language, 'premium.selectPackage')}</h2>
            <div className="packages-grid">
              {Object.values(PREMIUM_PACKAGES).map((pkg) => (
                <div 
                  key={pkg.id}
                  className={`package-card ${pkg.popular ? 'popular' : ''} ${selectedPackage === pkg.id ? 'selected' : ''}`}
                  onClick={() => !premiumActive && setSelectedPackage(pkg.id)}
                >
                  {pkg.popular && <div className="package-badge">{t(language, 'premium.mostPopular')}</div>}
                  {pkg.badge && <div className="package-badge special">{pkg.badge}</div>}
                  <div className="package-header">
                    <h3 className="package-name">{pkg.name}</h3>
                
                    <div className="package-price">
                      <span className="price-main">{formatVND(pkg.price)}</span>
                      {pkg.originalPrice && (
                        <span className="price-original">{formatVND(pkg.originalPrice)}</span>
                      )}
                    </div>
                    {pkg.discount && (
                      <div className="package-discount">Discount {pkg.discount}</div>
                    )}
                        <div className="package-description">
                      {pkg.description}
                    </div>
                    {pkg.savings && (
                      <div className="package-savings">{pkg.savings}</div>
                    )}
                  </div>
                  <div className="package-duration">
                    {pkg.days === 9999 ? t(language, 'premium.forever') : `${pkg.days} ${t(language, 'premium.days')}`}
                  </div>
                  <button
                    className="package-select-btn"
                    disabled={premiumActive}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMoMoPayment(pkg);
                    }}
                  >
                    {paymentLoading && selectedPackage === pkg.id ? t(language, 'premium.processing') : t(language, 'premium.payWithMoMo')}
                  </button>
                </div>
              ))}
            </div>
            
            {message && activeTab === 'buy' && (
              <div className={`message ${messageType}`}>
                {message}
              </div>
            )}
          </div>
        )}

        {/* Activation Code Section */}
        {activeTab === 'activate' && (
        <div className="activation-section">
          <h2 className="section-title">{t(language, 'premium.activateByCode')}</h2>
          <div className="activation-form">
            <input
              type="text"
              value={activationCode}
              onChange={(e) => setActivationCode(e.target.value.toUpperCase())}
              placeholder={t(language, 'premium.enterCode')}
              className="activation-input"
              disabled={loading || premiumActive}
            />
            <button
              onClick={handleActivatePremium}
              disabled={loading || premiumActive}
              className="activate-btn"
            >
              {loading ? t(language, 'premium.processing') : premiumActive ? t(language, 'premium.activated') : t(language, 'premium.activatePremium')}
            </button>
          </div>
          
          {message && (
            <div className={`message ${messageType}`}>
              {message}
            </div>
          )}

          {/* <div className="code-hint">
            <p><strong>Test Codes:</strong></p>
            <ul>
              <li><code>PREMIUM2024</code> - Premium 1 tháng</li>
              <li><code>PREMIUM2024YEAR</code> - Premium 1 năm</li>
              <li><code>PREMIUMFOREVER</code> - Premium vĩnh viễn</li>
              <li><code>TESTCODE</code> - Test 7 ngày</li>
            </ul>
          </div> */}
        </div>
        )}

        {/* Premium Features */}
       
        {/* Back Button */}
        <div className="premium-actions">
          <button onClick={() => navigate('/dashboard')} className="back-btn">
            {t(language, 'premium.backToDashboard')}
          </button>
        </div>
      </div>
    </div>
  );
}

