import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { CreditCard, Check, ShieldCheck, X, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Subscription = () => {
  const { user, refreshUser } = useAuth();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showMockModal, setShowMockModal] = useState(false);
  const [mockOrderId, setMockOrderId] = useState('');
  const navigate = useNavigate();

  const [paying, setPaying] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Load plans & Razorpay script
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const res = await api.get('/plans');
        setPlans(res.data);
      } catch (err) {
        console.error('Error fetching plans:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPlans();

    // Inject Razorpay script dynamically
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  const handleSubscribeClick = async (plan) => {
    if (!user) {
      navigate('/login');
      return;
    }

    setError('');
    setPaying(true);

    try {
      // 1. Create order on backend
      const res = await api.post('/plans/razorpay-order', { planId: plan._id });
      const { order, keyId, isMock } = res.data;

      // Check if backend decided to fall back to mock checkout
      if (isMock) {
        setSelectedPlan(plan);
        setMockOrderId(order.id);
        setShowMockModal(true);
        setPaying(false);
        return;
      }

      // 2. Configure Razorpay options
      const options = {
        key: keyId,
        amount: order.amount,
        currency: order.currency,
        name: 'OTT Stream',
        description: `${plan.name} Subscription`,
        image: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=100',
        order_id: order.id,
        handler: async function (response) {
          setPaying(true);
          try {
            // 3. Verify payment signature on backend
            const verifyRes = await api.post('/plans/razorpay-verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              planId: plan._id,
            });

            if (verifyRes.data.success) {
              setSelectedPlan(plan);
              setSuccess(true);
              setShowCheckout(true); // Open modal just to show success checkmark!
              await refreshUser();
              
              setTimeout(() => {
                setShowCheckout(false);
                setSuccess(false);
                navigate('/profile');
              }, 2500);
            }
          } catch (err) {
            console.error('Verification failed:', err);
            setError(err.response?.data?.message || 'Payment signature verification failed.');
            setShowCheckout(true);
          } finally {
            setPaying(false);
          }
        },
        prefill: {
          name: user.name,
          email: user.email,
        },
        theme: {
          color: '#FF6B6B', // Coral accent
        },
        modal: {
          ondismiss: function () {
            setPaying(false);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error('Order initiation failed:', err);
      setError(err.response?.data?.message || 'Failed to initialize payment gateway.');
      setShowCheckout(true);
      setPaying(false);
    }
  };

  const handleConfirmMockPayment = async () => {
    setShowMockModal(false);
    setPaying(true);
    setError('');

    try {
      const verifyRes = await api.post('/plans/razorpay-verify', {
        isMock: true,
        planId: selectedPlan._id,
        razorpay_order_id: mockOrderId,
        razorpay_payment_id: `pay_mock_${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
      });

      if (verifyRes.data.success) {
        setSuccess(true);
        setShowCheckout(true); // Show success checkmark modal
        await refreshUser();
        
        setTimeout(() => {
          setShowCheckout(false);
          setSuccess(false);
          navigate('/profile');
        }, 2500);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Payment simulation failed.');
      setShowCheckout(true);
    } finally {
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-cosmic-dark">
        <div className="h-12 w-12 animate-spin rounded-full border-t-4 border-coral"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cosmic-dark pb-20 px-4 sm:px-6 lg:px-8 pt-8 bg-radial-glow">
      <div className="mx-auto max-w-7xl">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-extrabold text-white sm:text-5xl">Select Your Plan</h1>
          <p className="mt-3 text-sm text-silver uppercase tracking-widest">
            Unlock ad-free streaming, 4K quality, and interactive watch parties
          </p>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid gap-8 md:grid-cols-3 max-w-6xl mx-auto">
          {plans.map((plan) => {
            const isUserCurrent = user?.subscription?.plan?._id === plan._id && user?.subscription?.status === 'active';
            
            return (
              <div
                key={plan._id}
                className={`flex flex-col rounded-2xl glass-panel p-8 relative overflow-hidden transition-all duration-300 ${
                  isUserCurrent
                    ? 'border-coral shadow-xl shadow-coral/10 scale-105'
                    : 'hover:scale-102 hover:shadow-2xl'
                }`}
              >
                {isUserCurrent && (
                  <div className="absolute -right-12 -top-1 px-12 py-2 bg-coral text-white text-[9px] font-extrabold rotate-45 uppercase tracking-wider">
                    Current Plan
                  </div>
                )}
                
                <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                
                <div className="mt-4 flex items-baseline">
                  <span className="text-4xl font-extrabold text-white">₹{plan.price}</span>
                  <span className="ml-1.5 text-xs text-silver">
                    /{plan.durationMonths > 1 ? `${plan.durationMonths} months` : 'month'}
                  </span>
                </div>

                <ul className="mt-6 space-y-4 flex-1 border-t border-white/5 pt-6 text-xs text-silver">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center">
                      <Check className="mr-2 h-4 w-4 text-coral shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleSubscribeClick(plan)}
                  disabled={isUserCurrent || paying}
                  className={`mt-8 block w-full rounded-xl py-3 text-center text-xs font-bold text-white transition-all ${
                    isUserCurrent
                      ? 'bg-green-600/20 text-green-400 border border-green-500/20 cursor-default'
                      : paying
                        ? 'bg-coral/50 cursor-wait'
                        : 'bg-coral hover:bg-coral-hover shadow-lg shadow-coral/15'
                  }`}
                >
                  {isUserCurrent ? 'Current Plan Active' : paying ? 'Initializing Gateway...' : 'Subscribe Now'}
                </button>
              </div>
            );
          })}
        </div>

        {/* MOCK PAYMENT SIMULATOR MODAL */}
        {showMockModal && selectedPlan && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4">
            <div className="relative w-full max-w-md rounded-2xl p-6 glass-panel border border-white/10 shadow-2xl overflow-hidden">
              
              <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4">
                <div className="flex items-center space-x-2">
                  <CreditCard className="h-5 w-5 text-coral animate-pulse" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Razorpay Sandbox Simulator</h3>
                </div>
                <button onClick={() => setShowMockModal(false)} className="text-silver hover:text-white">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-coral/10 rounded-xl p-3 border border-coral/20 text-xs text-silver leading-relaxed">
                  <span className="font-bold text-coral block mb-1">Notice: Placeholder Keys Detected</span>
                  We detected default or blank Razorpay credentials. To enable seamless local testing, we have initialized a Sandbox transaction simulation.
                </div>

                <div className="bg-cosmic-light/40 rounded-xl p-3 border border-white/5 flex justify-between items-center text-xs">
                  <span className="text-silver">Subscribing to: <strong>{selectedPlan.name}</strong></span>
                  <span className="font-extrabold text-white text-sm">₹{selectedPlan.price}</span>
                </div>

                <div className="text-[10px] text-silver/60">
                  <p>Order ID: <code className="text-white">{mockOrderId}</code></p>
                  <p>Client Prefill: <code className="text-white">{user.name} ({user.email})</code></p>
                </div>

                <button
                  onClick={handleConfirmMockPayment}
                  className="w-full rounded-lg bg-coral py-2.5 text-xs font-bold text-white shadow-lg transition-all hover:bg-coral-hover"
                >
                  Authorize Payment Simulation
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STATUS POPUP MODAL (Verification Results) */}
        {showCheckout && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4">
            <div className="relative w-full max-w-md rounded-2xl p-6 glass-panel border border-white/10 shadow-2xl overflow-hidden">
              
              {/* Header */}
              <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4">
                <div className="flex items-center space-x-2">
                  <CreditCard className="h-5 w-5 text-coral" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Payment Verification</h3>
                </div>
                {!success && (
                  <button onClick={() => setShowCheckout(false)} className="text-silver hover:text-white">
                    <X className="h-5 w-5" />
                  </button>
                )}
              </div>

              {success ? (
                // Success State
                <div className="flex flex-col items-center justify-center py-10 text-center space-y-3">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-500/10 text-green-400 border border-green-500/30 animate-bounce">
                    <ShieldCheck className="h-8 w-8" />
                  </div>
                  <h4 className="text-base font-bold text-white">Payment Verified!</h4>
                  <p className="text-xs text-silver">
                    Your account has been upgraded to <strong className="text-coral">{selectedPlan.name}</strong>.<br />
                    Redirecting to your dashboard profile...
                  </p>
                </div>
              ) : (
                // Error Alert Box
                <div className="py-6 text-center space-y-4">
                  <div className="flex items-center justify-center text-red-400">
                    <AlertCircle className="h-12 w-12" />
                  </div>
                  <h4 className="text-sm font-bold text-white">Transaction Failed</h4>
                  <p className="text-xs text-silver px-4">
                    {error || 'The signature validation check failed. Please contact support.'}
                  </p>
                  <button
                    onClick={() => setShowCheckout(false)}
                    className="rounded-lg bg-cosmic-light hover:bg-cosmic-light/80 border border-white/10 px-6 py-2 text-xs font-bold text-white"
                  >
                    Close
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Subscription;
