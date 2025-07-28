import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Loader2, Shield, Settings, CheckCircle, AlertTriangle, Wifi, WifiOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface BackendIntegrationCheckProps {
  userAddress: string;
  rollbackWalletAddress: string;
  userData: any;
  onBackendIntegrationComplete?: () => void;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

export const BackendIntegrationCheck: React.FC<BackendIntegrationCheckProps> = ({
  userAddress,
  rollbackWalletAddress,
  userData,
  onBackendIntegrationComplete
}) => {
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(true);
  const [hasBackendIntegration, setHasBackendIntegration] = useState(false);
  const [isIntegrating, setIsIntegrating] = useState(false);
  const [integrationError, setIntegrationError] = useState<string | null>(null);

  // Check if backend integration exists
  const checkBackendIntegration = async () => {
    try {
      setIsChecking(true);
      const response = await fetch(`${API_BASE_URL}/wallets/users/${userAddress}`);
      
      if (response.ok) {
        const backendUser = await response.json();
        setHasBackendIntegration(!!backendUser);
        return !!backendUser;
      } else if (response.status === 404) {
        setHasBackendIntegration(false);
        return false;
      } else {
        throw new Error('Failed to check backend integration');
      }
    } catch (error) {
      console.warn('Could not check backend integration:', error);
      setHasBackendIntegration(false);
      return false;
    } finally {
      setIsChecking(false);
    }
  };

  // Complete backend integration
  const completeBackendIntegration = async () => {
    if (!userData || !userData.rollbackConfig) {
      toast.error("Cannot complete backend integration without wallet configuration");
      return;
    }

    try {
      setIsIntegrating(true);
      setIntegrationError(null);

      const backendPayload = {
        user_address: userAddress,
        wallet_addresses: userData.wallets.map((w: any) => w.address),
        email: '', // User can add email later in settings
        rollback_config: {
          inactivity_threshold: userData.rollbackConfig.inactivity_threshold,
          rollback_method: userData.rollbackConfig.rollback_method === 'randomized' ? 'random' : 'priority',
          fallback_wallet: userData.rollbackConfig.fallback_wallet,
          agent_wallet: userData.rollbackConfig.agent_wallet,
          rollback_wallet_address: rollbackWalletAddress,
          tokens_to_monitor: userData.rollbackConfig.tokens_to_monitor || [],
        },
        agent_wallet_private_key: userData.rollbackConfig.agent_wallet + '_key', // Placeholder
      };

      const response = await fetch(`${API_BASE_URL}/wallets/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(backendPayload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Backend integration failed: ${response.status}`);
      }

      setHasBackendIntegration(true);
      toast.success("Your rollback wallet is now fully integrated with our monitoring system.");

      if (onBackendIntegrationComplete) {
        onBackendIntegrationComplete();
      }

      setTimeout(() => navigate("/dashboard"), 1500);

    } catch (error: any) {
      console.error('Backend integration failed:', error);
      setIntegrationError(error.message || 'Failed to complete backend integration');
      toast.error(error.message || "Could not complete backend integration");
    } finally {
      setIsIntegrating(false);
    }
  };

  useEffect(() => {
    checkBackendIntegration();
  }, [userAddress]);

  if (isChecking) {
    return (
      <div className="min-h-[90vh] bg-gradient-to-br from-gray-50 to-gray-100 pt-16 lg:pt-8 flex items-center justify-center">
        <div className="container mx-auto px-4 py-8 flex items-center justify-center">
          <Card className="w-full max-w-lg">
            <CardContent className="p-8 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <Loader2 className="h-10 w-10 text-white animate-spin" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Checking Wallet Status
              </h3>
              <p className="text-gray-600 text-sm">
                Verifying your rollback wallet configuration...
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (hasBackendIntegration) {
    return (
      <div className="min-h-[90vh] bg-gradient-to-br from-gray-50 to-gray-100 pt-16 lg:pt-8 flex items-center justify-center">
        <div className="container mx-auto px-4 py-8 flex items-center justify-center">
          <Card className="w-full max-w-lg">
            <CardContent className="p-8 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Rollback Wallet Active
              </h3>
              <p className="text-gray-600 mb-8 text-sm leading-relaxed">
                Your rollback wallet is fully configured and being monitored by our backend service.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  onClick={() => navigate("/dashboard")}
                  className="bg-gradient-to-r from-[#E9A344] to-[#D4941A] hover:from-[#D4941A] hover:to-[#E9A344] text-white px-6 py-3 rounded-2xl"
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Go to Dashboard
                </Button>
                <Button
                  onClick={() => navigate("/settings")}
                  variant="outline"
                  className="border-gray-300 text-gray-700 px-6 py-3 rounded-2xl"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Manage Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Backend integration missing - offer to complete it
  return (
    <div className="min-h-[90vh] bg-gradient-to-br from-gray-50 to-gray-100 pt-16 lg:pt-8 flex items-center justify-center">
      <div className="container mx-auto px-4 py-8 flex items-center justify-center">
        <Card className="w-full max-w-lg">
          <CardContent className="p-8">
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-orange-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <WifiOff className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Complete Your Setup
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Your rollback wallet exists but needs backend integration for monitoring and notifications.
              </p>
            </div>

            <Alert className="mb-6">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Current Status:</strong> Wallet works manually, but automated monitoring is disabled.
              </AlertDescription>
            </Alert>

            {integrationError && (
              <Alert className="mb-6 border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  <strong>Error:</strong> {integrationError}
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-4">
              <Button
                onClick={completeBackendIntegration}
                disabled={isIntegrating}
                className="w-full bg-gradient-to-r from-[#E9A344] to-[#D4941A] hover:from-[#D4941A] hover:to-[#E9A344] text-white px-6 py-3 rounded-2xl"
              >
                {isIntegrating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Completing Integration...
                  </>
                ) : (
                  <>
                    <Wifi className="h-4 w-4 mr-2" />
                    Complete Backend Integration
                  </>
                )}
              </Button>

              <div className="flex gap-3">
                <Button
                  onClick={() => navigate("/dashboard")}
                  variant="outline"
                  className="flex-1 border-gray-300 text-gray-700 px-4 py-2 rounded-2xl"
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
                <Button
                  onClick={() => navigate("/settings")}
                  variant="outline"
                  className="flex-1 border-gray-300 text-gray-700 px-4 py-2 rounded-2xl"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>
              </div>
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">What you'll get:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Automated wallet activity monitoring</li>
                <li>• Email notifications for inactivity warnings</li>
                <li>• Rollback execution alerts</li>
                <li>• Enhanced security features</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BackendIntegrationCheck;
