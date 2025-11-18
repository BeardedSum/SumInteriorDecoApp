import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, Crown, LogOut, User, Mail, Phone, Calendar } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { usePaymentStore } from '../store/paymentStore';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button, Modal } from '../components/ui';
import { toast } from 'react-toastify';

export const Account: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { creditPackages, fetchCreditPackages, initializePayment } = usePaymentStore();
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<any>(null);

  useEffect(() => {
    fetchCreditPackages();
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
    toast.success('Logged out successfully');
  };

  const handlePurchase = async (pkg: any) => {
    try {
      const { authorizationUrl } = await initializePayment(pkg.id);
      window.location.href = authorizationUrl;
    } catch (error) {
      toast.error('Failed to initialize payment');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Profile Card */}
      <Card variant="elevated">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-gradient-to-br from-primary-navy to-secondary-luxury-purple rounded-full flex items-center justify-center text-white text-3xl font-bold">
              {user?.full_name?.charAt(0) || 'U'}
            </div>
            <div>
              <h2 className="text-2xl font-bold">{user?.full_name}</h2>
              <p className="text-gray-600 capitalize">{user?.user_type} Account</p>
            </div>
          </div>
          <Button variant="ghost" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {user?.email && (
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Mail className="w-5 h-5 text-gray-600" />
              <div>
                <p className="text-xs text-gray-600">Email</p>
                <p className="font-medium">{user.email}</p>
              </div>
            </div>
          )}

          {user?.phone_number && (
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Phone className="w-5 h-5 text-gray-600" />
              <div>
                <p className="text-xs text-gray-600">Phone</p>
                <p className="font-medium">{user.phone_number}</p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <Calendar className="w-5 h-5 text-gray-600" />
            <div>
              <p className="text-xs text-gray-600">Member Since</p>
              <p className="font-medium">
                {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Credits Card */}
      <Card variant="premium">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold mb-2">Credits Balance</h3>
            <p className="text-4xl font-bold">{user?.credits_balance || 0}</p>
            <p className="text-white/80 mt-2">Available for generating designs</p>
          </div>
          <CreditCard className="w-24 h-24 opacity-20" />
        </div>
      </Card>

      {/* Buy Credits */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Buy Credits</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {creditPackages.map((pkg) => (
            <Card
              key={pkg.id}
              hover
              className="cursor-pointer"
              onClick={() => {
                setSelectedPackage(pkg);
                setShowPurchaseModal(true);
              }}
            >
              <CardHeader>
                <CardTitle>{pkg.name}</CardTitle>
                <CardDescription>{pkg.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <p className="text-3xl font-bold">
                    {pkg.credits_amount}
                    {pkg.bonus_credits && (
                      <span className="text-lg text-success ml-2">
                        +{pkg.bonus_credits} bonus
                      </span>
                    )}
                  </p>
                  <p className="text-sm text-gray-600">credits</p>
                </div>
                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-2xl font-bold">₦{pkg.price.toLocaleString()}</span>
                  <span className="text-sm text-gray-600">{pkg.currency}</span>
                </div>
                <Button variant="primary" fullWidth>
                  Purchase
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Subscription Plans */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Subscription Plans</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { name: 'Basic', price: 5000, credits: 30, features: ['30 renders/month', 'All styles', 'HD quality'] },
            { name: 'Pro', price: 15000, credits: 100, features: ['100 renders/month', 'Priority processing', 'Batch upload'] },
            { name: 'Agency', price: 40000, credits: 500, features: ['500 renders/month', 'API access', 'Team collaboration'] },
          ].map((plan) => (
            <Card key={plan.name} hover className={plan.name === 'Pro' ? 'border-2 border-secondary-luxury-purple' : ''}>
              {plan.name === 'Pro' && (
                <div className="bg-gradient-to-r from-secondary-luxury-purple to-purple-700 text-white text-center py-2 -mt-6 -mx-6 mb-4 rounded-t-2xl flex items-center justify-center gap-2">
                  <Crown className="w-4 h-4" />
                  <span className="font-semibold">Most Popular</span>
                </div>
              )}
              <CardHeader>
                <CardTitle>{plan.name}</CardTitle>
                <CardDescription>{plan.credits} credits/month</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <span className="text-3xl font-bold">₦{plan.price.toLocaleString()}</span>
                  <span className="text-gray-600">/month</span>
                </div>
                <ul className="space-y-2 mb-4">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <span className="text-success">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button variant={plan.name === 'Pro' ? 'premium' : 'primary'} fullWidth>
                  Upgrade
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Purchase Confirmation Modal */}
      <Modal
        isOpen={showPurchaseModal}
        onClose={() => setShowPurchaseModal(false)}
        title="Confirm Purchase"
      >
        {selectedPackage && (
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-lg mb-2">{selectedPackage.name}</h3>
              <p className="text-gray-600 mb-4">{selectedPackage.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">
                  {selectedPackage.credits_amount}
                  {selectedPackage.bonus_credits && (
                    <span className="text-lg text-success ml-2">
                      +{selectedPackage.bonus_credits}
                    </span>
                  )}{' '}
                  credits
                </span>
                <span className="text-2xl font-bold">
                  ₦{selectedPackage.price.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="secondary" fullWidth onClick={() => setShowPurchaseModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" fullWidth onClick={() => handlePurchase(selectedPackage)}>
                Pay with Paystack
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Account;
