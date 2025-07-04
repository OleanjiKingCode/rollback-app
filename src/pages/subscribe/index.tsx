"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Check, X, Bell, Shield, Zap, Ban, Wallet, Unlink } from "lucide-react";

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
    id: "basic",
    name: "Basic",
    price: "Free",
    period: "forever",
    description: "Essential rollback protection for individual users",
    features: [
      "Up to 2 Rollback Wallets",
      "Basic monitoring (ETH only)",
      "Standard inactivity thresholds",
      "Community support",
      "V1 architecture support",
    ],
    limitations: [
      "Limited to 2 wallets",
      "ETH monitoring only",
      "No priority support",
      "Standard recovery times",
    ],
    color: "border-gray-200",
  },
  {
    id: "pro",
    name: "Pro",
    price: "$29",
    period: "/month",
    description: "Advanced features for serious crypto users",
    features: [
      "Up to 10 Rollback Wallets",
      "Multi-token monitoring (up to 5 per wallet)",
      "Agent Wallet support",
      "Priority recovery assistance",
      "Advanced analytics dashboard",
      "Custom inactivity thresholds",
      "Email & SMS notifications",
      "Priority support",
    ],
    limitations: ["Limited to 10 wallets", "Standard agent features"],
    popular: true,
    color: "border-rollback-primary ring-2 ring-rollback-primary",
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "$199",
    period: "/month",
    description: "Full-featured solution for organizations and power users",
    features: [
      "Unlimited Rollback Wallets",
      "Unlimited token monitoring",
      "Advanced  Agent Wallets",
      "White-glove recovery service",
      "Custom governance rules",
      "API access",
      "Dedicated account manager",
      "SLA guarantees",
      "Custom integrations",
      "Multi-signature support",
    ],
    limitations: [],
    color: "border-purple-200",
  },
];

// Wallet connection states
const WalletConnectionState = ({ isConnected }: any) => {
  const { openConnectModal } = useConnectModal();

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rollback-light to-white pt-16 lg:pt-8 flex items-center justify-center">
        <div className="container mx-auto px-4 py-8 flex items-center justify-center">
          <div className="text-center max-w-lg rounded-3xl p-8 border border-gray-100 relative overflow-hidden">
            {/* Decorative background */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-rollback-primary/10 to-rollback-secondary/10 rounded-full -mr-16 -mt-16" />
            <div className="absolute bottom-0 left-0 w-20 h-20 bg-gradient-to-tr from-rollback-cream to-rollback-secondary/20 rounded-full -ml-10 -mb-10" />

            <div className="relative z-10">
              <div className="w-10 h-10 bg-gradient-to-br from-rollback-primary to-rollback-primary/80 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Unlink className="h-5 w-5 text-white" />
              </div>  

              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Connect Your Wallet
              </h3>

              <p className="text-gray-600 mb-8 text-sm leading-relaxed">
                Connect your wallet to access rollback wallet settings.
              </p>

              <button
                onClick={openConnectModal}
                className="bg-gradient-to-r from-rollback-primary to-rollback-primary/90 hover:from-rollback-primary/90 hover:to-rollback-primary text-white px-4 py-2 rounded-xl text-lg font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-lg flex items-center mx-auto space-x-3"
              >
                <Wallet className="h-4 w-4" />
                <span className="text-sm">Connect Wallet</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default function Subscription() {
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const { toast } = useToast();
  const { isConnected } = useAccount();

  // Show wallet connection state if not connected
  if (!isConnected) {
    return <WalletConnectionState isConnected={isConnected} />;
  }

  const handleSelectPlan = (tierId: string) => {
    setSelectedTier(tierId);

    // Subscription selection - will integrate with payment processor
    toast({
      title: "Plan Selected",
      description: `${
        subscriptionTiers.find((t) => t.id === tierId)?.name
      } plan selected. Redirecting to payment...`,
    });

    // Note: This would typically redirect to a payment processor
    // or handle subscription logic through backend APIs
  };

  return (
    <div className="min-h-screen bg-rollback-light">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-xl font-bold text-rollback-dark mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xs text-rollback-brown max-w-2xl mx-auto">
            Select the perfect subscription tier for your crypto recovery needs.
            All plans include our core rollback protection technology.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto mb-12">
          {subscriptionTiers.map((tier) => (
            <Card
              key={tier.id}
              className={`relative ${
                tier.color
              } hover:shadow-lg transition-shadow ${
                tier.popular ? "scale-105" : ""
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
                    <Check className="h-4 w-4 text-[#E9A344] mr-2" />
                    What's Included
                  </h4>
                  <ul className="space-y-2">
                    {tier.features.map((feature, index) => (
                      <li
                        key={index}
                        className="flex items-start space-x-2 text-sm"
                      >
                        <Check className="h-4 w-4 text-[#E9A344] mt-0.5 flex-shrink-0" />
                        <span className="text-rollback-brown">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Limitations */}
                {tier.limitations.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-rollback-dark mb-3 flex items-center">
                      <X className="h-4 w-4 text-red-500 mr-2" />
                      Limitations
                    </h4>
                    <ul className="space-y-2">
                      {tier.limitations.map((limitation, index) => (
                        <li
                          key={index}
                          className="flex items-start space-x-2 text-sm"
                        >
                          <X className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                          <span className="text-rollback-brown">
                            {limitation}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <Button
                  onClick={() => handleSelectPlan(tier.id)}
                  className={`w-full ${
                    tier.popular
                      ? "bg-rollback-primary hover:bg-rollback-primary/90 text-white"
                      : "bg-white border-2 border-rollback-primary text-rollback-primary hover:bg-rollback-primary hover:text-white"
                  }`}
                  disabled={tier.id === "basic"} // Free tier doesn't need payment
                >
                  {tier.id === "basic" ? "Current Plan" : `Choose ${tier.name}`}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Feature Comparison */}
        <Card className="border-rollback-cream max-w-6xl mx-auto">
          <CardHeader>
            <CardTitle className="text-center">Feature Comparison</CardTitle>
            <CardDescription className="text-center text-rollback-dark">
              Compare features across all subscription tiers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-rollback-cream">
                    <th className="text-left py-3 px-4 font-medium text-rollback-dark">
                      Feature
                    </th>
                    <th className="text-center py-3 px-4 font-medium text-rollback-dark">
                      Basic
                    </th>
                    <th className="text-center py-3 px-4 font-medium text-rollback-dark">
                      Pro
                    </th>
                    <th className="text-center py-3 px-4 font-medium text-rollback-dark">
                      Enterprise
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-rollback-cream">
                  <tr>
                    <td className="py-3 px-4 text-rollback-brown">
                      Rollback Wallets
                    </td>
                    <td className="py-3 px-4 text-center">2</td>
                    <td className="py-3 px-4 text-center">10</td>
                    <td className="py-3 px-4 text-center">Unlimited</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 text-rollback-brown">
                      Token Monitoring
                    </td>
                    <td className="py-3 px-4 text-center">ETH only</td>
                    <td className="py-3 px-4 text-center">5 per wallet</td>
                    <td className="py-3 px-4 text-center">Unlimited</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 text-rollback-brown">
                      Agent Wallets
                    </td>
                    <td className="py-3 px-4 text-center">
                      <X className="h-4 w-4 text-red-500 mx-auto" />
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Check className="h-4 w-4 text-[#E9A344] mx-auto" />
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Check className="h-4 w-4 text-[#E9A344] mx-auto" />
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 text-rollback-brown">
                      Priority Support
                    </td>
                    <td className="py-3 px-4 text-center">
                      <X className="h-4 w-4 text-rollback-brown mx-auto" />
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Check className="h-4 w-4 text-rollback-primary mx-auto" />
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Check className="h-4 w-4 text-rollback-primary mx-auto" />
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 text-rollback-brown">
                      API Access
                    </td>
                    <td className="py-3 px-4 text-center">
                      <X className="h-4 w-4 text-rollback-brown mx-auto" />
                    </td>
                    <td className="py-3 px-4 text-center">
                      <X className="h-4 w-4 text-rollback-brown mx-auto" />
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Check className="h-4 w-4 text-rollback-primary mx-auto" />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* FAQ Section */}
        <div className="max-w-4xl mx-auto mt-16">
          <h2 className="text-xl font-bold text-rollback-dark text-center mb-8">
            Frequently Asked Questions
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-rollback-cream">
              <CardContent className="p-6">
                <h3 className="font-semibold text-rollback-dark mb-2">
                  Can I upgrade my plan anytime?
                </h3>
                <p className="text-sm text-rollback-brown">
                  Yes, you can upgrade your subscription at any time, The new
                  features will be available immediately.
                </p>
              </CardContent>
            </Card>

            <Card className="border-rollback-cream">
              <CardContent className="p-6">
                <h3 className="font-semibold text-rollback-dark mb-2">
                  What happens to my wallets if I downgrade?
                </h3>
                <p className="text-sm text-rollback-brown">
                  Existing rollback wallets remain active, but you may lose
                  access to advanced features.
                </p>
              </CardContent>
            </Card>

            {/* <Card className="border-rollback-cream">
              <CardContent className="p-6">
                <h3 className="font-semibold text-rollback-dark mb-2">
                  Is there a trial period?
                </h3>
                <p className="text-sm text-rollback-brown">
                  The Basic plan is free forever. Pro and Enterprise plans doesnt offer a 14-day 
                  trial period with full access to all features.
                </p>
              </CardContent>
            </Card> */}

            <Card className="border-rollback-cream">
              <CardContent className="p-6">
                <h3 className="font-semibold text-rollback-dark mb-2">
                  Do you offer custom enterprise solutions?
                </h3>
                <p className="text-sm text-rollback-brown">
                  Yes, we offer custom enterprise solutions with tailored
                  features, dedicated support, and custom integrations. Contact
                  our sales team.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
