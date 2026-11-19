import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useLocation } from 'react-router-dom';
import { collection, query, where, getDocs, updateDoc, doc, getDoc, setDoc, increment } from 'firebase/firestore';
import { db } from '../firebase';
import { createMoMoPayment, PREMIUM_PACKAGES, formatVND } from '../services/momoPayment';
import { t } from '../translations';
import { FEATURES } from '../constants/features';
import SlideCommit from './SlideCommit';
import AppSidebar from './AppSidebar';
import './Premium.css';

export default function Premium() {
  const { currentUser } = useAuth();
  const { language } = useLanguage();
  const L = (vi, en) => (language === 'vi' ? vi : en);
  const location = useLocation();
  const [profile, setProfile] = useState(null);
  const [profileId, setProfileId] = useState(null);
  const [activationCode, setActivationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success' or 'error'
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  // Khi giá đang ẩn, chỉ còn tab nhập mã kích hoạt
  const [activeTab, setActiveTab] = useState(FEATURES.showPricing ? 'buy' : 'activate'); // 'buy' or 'activate'
  const [profileReady, setProfileReady] = useState(false);
  const [introMinDone, setIntroMinDone] = useState(false);
  const [introPhase, setIntroPhase] = useState('showing'); // showing -> leaving -> done

  // Valid activation codes (in production, these should be stored in Firestore)
  const VALID_CODES = {
    'PREMIUM2024': { days: 30, name: 'Premium 1 Month', maxUses: null },
    'PREMIUM2025': { days: 30, name: 'Premium 1 Month', maxUses: null },
    'PREMIUM2026': { days: 30, name: 'Premium 1 Month', maxUses: null },
    'PREMIUM2024YEAR': { days: 365, name: 'Premium 1 Year', maxUses: null },
    'PREMIUMFOREVER': { days: 9999, name: 'Premium Lifetime', maxUses: null },
    'TESTCODE': { days: 7, name: 'Test Premium 7 Days', maxUses: null },
    'TIGERKON2025': { days: 30, name: 'Premium 1 Month', maxUses: 20 },
    // Dùng thử 7 ngày — mỗi tài khoản chỉ được dùng 1 lần
    'KONONE7DAYS': { days: 7, name: 'Premium Trial 7 Days', maxUses: null, trial: true }
  };

  // Mở từ nút "Dùng thử Premium 7 ngày" ở trang chủ: /premium?code=KONONE7DAYS
  useEffect(() => {
    const code = new URLSearchParams(location.search).get('code');
    if (code) {
      setActiveTab('activate');
      setActivationCode(code.toUpperCase());
    }
  }, [location.search]);

  useEffect(() => {
    async function loadProfile() {
      try {
        const profilesRef = collection(db, 'profiles');
        const q = query(profilesRef, where('userId', '==', currentUser.uid));
        const querySnapshot = await getDocs(q);

        // Hồ sơ tạm (do trang Links tạo) chưa tính là đã tạo hồ sơ
        const realDoc = querySnapshot.docs.find((d) => !d.data().isStub);
        if (realDoc) {
          const profileData = realDoc.data();
          setProfileId(realDoc.id);
          setProfile({
            id: querySnapshot.docs[0].id,
            ...profileData
          });
        }
      } catch (error) {
        console.error('Error loading profile:', error);
      } finally {
        setProfileReady(true);
      }
    }

    if (currentUser) {
      loadProfile();
    } else {
      setProfileReady(true);
    }
  }, [currentUser]);

  // Màn hình loading mở đầu: hiện tối thiểu ~1.8s và đến khi tải xong hồ sơ, rồi mờ dần
  useEffect(() => {
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const timer = setTimeout(() => setIntroMinDone(true), reduce ? 300 : 1800);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!introMinDone || !profileReady) return undefined;
    setIntroPhase('leaving');
    const timer = setTimeout(() => setIntroPhase('done'), 650);
    return () => clearTimeout(timer);
  }, [introMinDone, profileReady]);

  async function handleActivatePremium() {
    if (!activationCode.trim()) {
      setMessage(t(language, 'premium.enterCodeError'));
      setMessageType('error');
      return false;
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
        return false;
      }

      if (!profileId) {
        setMessage(t(language, 'premium.createProfileFirstActivate'));
        setMessageType('error');
        setLoading(false);
        return false;
      }

      // Mã dùng thử: mỗi tài khoản chỉ kích hoạt được 1 lần
      if (codeData.trial && profile?.premiumTrialUsedAt) {
        setMessage(language === 'vi'
          ? 'Tài khoản này đã dùng thử Premium 7 ngày rồi. Hãy chọn một gói ở tab Buy Plan.'
          : 'This account has already used the 7-day Premium trial. Please pick a plan in Buy Plan.');
        setMessageType('error');
        setLoading(false);
        return false;
      }

      // Check code usage limit if maxUses is set
      if (codeData.maxUses !== null && codeData.maxUses !== undefined) {
        try {
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
            return false;
          }
        } catch (usageError) {
          // If we can't check usage (permission error), allow activation but skip usage tracking
          console.warn('Cannot check code usage, proceeding without usage limit:', usageError);
          // Continue with activation but skip usage tracking
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
        ...(codeData.trial ? { premiumTrialUsedAt: new Date() } : {}),
        updatedAt: new Date()
      });

      // Update code usage count if maxUses is set (only if we have permission)
      if (codeData.maxUses !== null && codeData.maxUses !== undefined) {
        try {
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
        } catch (usageError) {
          // If we can't update usage count (permission error), log but don't fail activation
          console.warn('Cannot update code usage count, but premium activated successfully:', usageError);
          // Premium is already activated, so we just skip usage tracking
        }
      }

      setMessage(t(language, 'premium.activateSuccess', { days: codeData.days }));
      setMessageType('success');
      setActivationCode('');

      // Reload profile
      const profilesRef = collection(db, 'profiles');
      const q = query(profilesRef, where('userId', '==', currentUser.uid));
      const querySnapshot = await getDocs(q);
      const reloaded = querySnapshot.docs.find((d) => !d.data().isStub);
      if (reloaded) {
        setProfile({
          id: reloaded.id,
          ...reloaded.data()
        });
      }
      return true;
    } catch (error) {
      console.error('Error activating premium:', error);
      setMessage(t(language, 'premium.activateError', { error: error.message }));
      setMessageType('error');
      return false;
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
    <div className="profile-editor-layout premium-with-sidebar">
    <AppSidebar active="premium" profile={profile} />
    <main className="editor-main premium-main">
    <div className="premium-page">
      {/* Loading mở đầu sang trọng */}
      {introPhase !== 'done' && (
        <div className={`pm-intro ${introPhase === 'leaving' ? 'is-leaving' : ''}`} aria-hidden="true">
          <div className="pm-intro-glow" />
          <div className="pm-intro-mark">
            <img src="/logo-konone-v1.png" alt="" className="pm-intro-logo" />
          </div>
          <div className="pm-intro-word">
            {'KONONE PREMIUM'.split('').map((ch, i) => (
              <span key={i} style={{ animationDelay: `${0.35 + i * 0.05}s` }}>
                {ch === ' ' ? ' ' : ch}
              </span>
            ))}
          </div>
          <div className="pm-intro-line">
            <span />
          </div>
        </div>
      )}

      <div className="premium-container">
        <div className="premium-header">
          <h1 className="premium-title">
            <span className="premium-icon"></span>
            {t(language, 'premium.membership')}
          </h1>
          <p className="pm-greeting">
            <span className="pm-greeting-hi">
              {L('Xin chào', 'Hi')}, {profile?.displayName || profile?.username || currentUser?.displayName || L('bạn', 'there')}
            </span>
            <span className="pm-greeting-line">
              {L(
                'Nơi bạn có thể sáng tạo một cách tuyệt vời khi có gói Premium.',
                'Where you can create without limits with a Premium plan.'
              )}
            </span>
          </p>
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
          {FEATURES.showPricing && (
            <button
              className={`tab-button ${activeTab === 'buy' ? 'active' : ''}`}
              onClick={() => setActiveTab('buy')}
            >
              {L("Mua gói", "Buy Plan")}
            </button>
          )}
          <button
            className={`tab-button ${activeTab === 'activate' ? 'active' : ''}`}
            onClick={() => setActiveTab('activate')}
          >
            {L("Nhập mã kích hoạt", "Activate Code")}
          </button>
        </div>

        {/* Payment Section */}
        {FEATURES.showPricing && activeTab === 'buy' && (
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
                      <div className="package-discount">{L("Giảm", "Discount")}{' '}{pkg.discount}</div>
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
              {/* Trượt để kích hoạt (ReactBits SlideCommit) */}
              <SlideCommit
                label={premiumActive ? t(language, 'premium.activated') : L('Trượt để kích hoạt', 'Slide to activate')}
                doneLabel={L('Đã kích hoạt', 'Activated')}
                errorLabel={L('Kích hoạt thất bại', 'Activation failed')}
                onConfirm={async () => {
                  const ok = await handleActivatePremium();
                  if (!ok) throw new Error('activate-failed');
                }}
                trackColor="#141418"
                handleColor="#f65c5c"
                successColor="#22c55e"
                dangerColor="#e5484d"
                width={240}
                height={52}
                radius={14}
                holdMs={2000}
                disabled={premiumActive}
                className="activate-slide"
              />
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

      </div>
    </div>
    </main>
    </div>
  );
}

