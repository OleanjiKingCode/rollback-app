
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  check, 
  x,
  bell,
  shield,
  zap
} from 'lucide-react';

type SubscriptionTier = {
  id: string;
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  limitations: string[];
  popular?: boolean;
  color: string;
};

const subscriptionTiers: SubscriptionTier[] = [
  {
    id: 'basic',
    name: 'Basic',
    price: 'Free',
    period: 'forever',
    description: 'Essential rollback protection for individual users',
    features: [
      'Up to 2 Rollback Wallets',
      'Basic monitoring (ETH only)',
      'Standard inactivity thresholds',
      'Community support',
      'V1 architecture support'
    ],
    limitations: [
      'Limited to 2 wallets',
      'ETH monitoring only',
      'No priority support',
      'Standard recovery times'
    ],
    color: 'border-gray-200'
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$29',
    period: '/month',
    description: 'Advanced features for serious crypto users',
    features: [
      'Up to 10 Rollback Wallets',
      'Multi-token monitoring (up to 5 per wallet)',
      'V2 Agent Wallet support',
      'Priority recovery assistance',
      'Advanced analytics dashboard',
      'Custom inactivity thresholds',
      'Email & SMS notifications',
      'Priority support'
    ],
    limitations: [
      'Limited to 10 wallets',
      'Standard agent features'
    ],
    popular: true,
    color: 'border-rollback-primary ring-2 ring-rollback-primary'
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: '$199',
    period: '/month',
    description: 'Full-featured solution for organizations and power users',
    features: [
      'Unlimited Rollback Wallets',
      'Unlimited token monitoring',
      'Advanced V2 Agent Wallets',
      'White-glove recovery service',
      'Custom governance rules',
      'API access',
      'Dedicated account manager',
      'SLA guarantees',
      'Custom integrations',
      'Multi-signature support'
    ],
    limitations: [],
    color: 'border-purple-200'
  }
];

export default function Subscription() {
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSelectPlan = (tierId: string) => {
    setSelectedTier(tierId);
    
    // Mock subscription selection - backend integration needed
    toast({
      title: "Plan Selected",
      description: `${subscriptionTiers.find(t => t.id === tierId)?.name} plan selected. Redirecting to payment...`,
    });
    
    // Note: This would typically redirect to a payment processor
    // or handle subscription logic through backend APIs
  };

  return (
    <div className="min-h-screen bg-rollback-light">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-rollback-dark mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-rollback-brown max-w-2xl mx-auto">
            Select the perfect subscription tier for your crypto recovery needs. 
            All plans include our core rollback protection technology.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto mb-12">
          {subscriptionTiers.map((tier) => (
            <Card 
              key={tier.id} 
              className={`relative ${tier.color} hover:shadow-lg transition-shadow ${
                tier.popular ? 'scale-105' : ''
              }`}
            >
              {tier.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-rollback-primary text-white px-3 py-1">
                    Most Popular
                  </Badge>
                </div>
              )}
              
              <CardHeader className="text-center pb-2">
                <CardTitle className="text-2xl font-bold text-rollback-dark">
                  {tier.name}
                </CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-rollback-dark">
                    {tier.price}
                  </span>
                  <span className="text-rollback-brown ml-1">
                    {tier.period}
                  </span>
                </div>
                <CardDescription className="mt-2 text-rollback-brown">
                  {tier.description}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-6">
                {/* Features */}
                <div>
                  <h4 className="font-semibold text-rollback-dark mb-3 flex items-center">
                    <check className="h-4 w-4 text-green-600 mr-2" />
                    What's Included
                  </h4>
                  <ul className="space-y-2">
                    {tier.features.map((feature, index) => (
                      <li key={index} className="flex items-start space-x-2 text-sm">
                        <check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-rollback-brown">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Limitations */}
                {tier.limitations.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-rollback-dark mb-3 flex items-center">
                      <x className="h-4 w-4 text-red-500 mr-2" />
                      Limitations
                    </h4>
                    <ul className="space-y-2">
                      {tier.limitations.map((limitation, index) => (
                        <li key={index} className="flex items-start space-x-2 text-sm">
                          <x className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                          <span className="text-rollback-brown">{limitation}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <Button
                  onClick={() => handleSelectPlan(tier.id)}
                  className={`w-full ${
                    tier.popular
                      ? 'bg-rollback-primary hover:bg-rollback-primary/90 text-white'
                      : 'bg-white border-2 border-rollback-primary text-rollback-primary hover:bg-rollback-primary hover:text-white'
                  }`}
                  disabled={tier.id === 'basic'} // Free tier doesn't need payment
                >
                  {tier.id === 'basic' ? 'Current Plan' : `Choose ${tier.name}`}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Feature Comparison */}
        <Card className="border-rollback-cream max-w-6xl mx-auto">
          <CardHeader>
            <CardTitle className="text-center">Feature Comparison</CardTitle>
            <CardDescription className="text-center">
              Compare features across all subscription tiers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-rollback-cream">
                    <th className="text-left py-3 px-4 font-medium text-rollback-dark">Feature</th>
                    <th className="text-center py-3 px-4 font-medium text-rollback-dark">Basic</th>
                    <th className="text-center py-3 px-4 font-medium text-rollback-dark">Pro</th>
                    <th className="text-center py-3 px-4 font-medium text-rollback-dark">Enterprise</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-rollback-cream">
                  <tr>
                    <td className="py-3 px-4 text-rollback-brown">Rollback Wallets</td>
                    <td className="py-3 px-4 text-center">2</td>
                    <td className="py-3 px-4 text-center">10</td>
                    <td className="py-3 px-4 text-center">Unlimited</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 text-rollback-brown">Token Monitoring</td>
                    <td className="py-3 px-4 text-center">ETH only</td>
                    <td className="py-3 px-4 text-center">5 per wallet</td>
                    <td className="py-3 px-4 text-center">Unlimited</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 text-rollback-brown">V2 Agent Wallets</td>
                    <td className="py-3 px-4 text-center"><x className="h-4 w-4 text-red-500 mx-auto" /></td>
                    <td className="py-3 px-4 text-center"><check className="h-4 w-4 text-green-600 mx-auto" /></td>
                    <td className="py-3 px-4 text-center"><check className="h-4 w-4 text-green-600 mx-auto" /></td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 text-rollback-brown">Priority Support</td>
                    <td className="py-3 px-4 text-center"><x className="h-4 w-4 text-red-500 mx-auto" /></td>
                    <td className="py-3 px-4 text-center"><check className="h-4 w-4 text-green-600 mx-auto" /></td>
                    <td className="py-3 px-4 text-center"><check className="h-4 w-4 text-green-600 mx-auto" /></td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 text-rollback-brown">API Access</td>
                    <td className="py-3 px-4 text-center"><x className="h-4 w-4 text-red-500 mx-auto" /></td>
                    <td className="py-3 px-4 text-center"><x className="h-4 w-4 text-red-500 mx-auto" /></td>
                    <td className="py-3 px-4 text-center"><check className="h-4 w-4 text-green-600 mx-auto" /></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* FAQ Section */}
        <div className="max-w-4xl mx-auto mt-16">
          <h2 className="text-2xl font-bold text-rollback-dark text-center mb-8">
            Frequently Asked Questions
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-rollback-cream">
              <CardContent className="p-6">
                <h3 className="font-semibold text-rollback-dark mb-2">
                  Can I upgrade my plan anytime?
                </h3>
                <p className="text-sm text-rollback-brown">
                  Yes, you can upgrade your subscription at any time. The new features will be 
                  available immediately, and billing will be prorated.
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-rollback-cream">
              <CardContent className="p-6">
                <h3 className="font-semibold text-rollback-dark mb-2">
                  What happens to my wallets if I downgrade?
                </h3>
                <p className="text-sm text-rollback-brown">
                  Existing rollback wallets remain active, but you may lose access to advanced 
                  features like V2 Agent Wallets and priority support.
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-rollback-cream">
              <CardContent className="p-6">
                <h3 className="font-semibold text-rollback-dark mb-2">
                  Is there a trial period?
                </h3>
                <p className="text-sm text-rollback-brown">
                  The Basic plan is free forever. Pro and Enterprise plans offer a 14-day 
                  trial period with full access to all features.
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-rollback-cream">
              <CardContent className="p-6">
                <h3 className="font-semibold text-rollback-dark mb-2">
                  Do you offer custom enterprise solutions?
                </h3>
                <p className="text-sm text-rollback-brown">
                  Yes, we offer custom enterprise solutions with tailored features, 
                  dedicated support, and custom integrations. Contact our sales team.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Backend Integration Note */}
        <div className="max-w-4xl mx-auto mt-12">
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="p-6">
              <div className="flex items-start space-x-3">
                <bell className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-yellow-800 mb-2">
                    Backend Integration Required
                  </h3>
                  <p className="text-sm text-yellow-700">
                    This subscription interface requires backend integration for payment processing, 
                    subscription management, and feature access control. The UI is fully functional 
                    and ready for backend API integration.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
