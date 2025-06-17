import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Home, ArrowLeft, Search, Shield } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
    document.title = "Page Not Found - Rollback";
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-rollback-light pt-16 lg:pt-8 flex items-center justify-center">
      <div className="container mx-auto px-4 py-8 flex items-center justify-center">
        <Card className="max-w-2xl w-full border-rollback-cream bg-white shadow-xl rounded-3xl">
          <CardContent className="p-8 lg:p-12 text-center">
            {/* Logo/Icon */}
            <div className="w-20 h-20 bg-gradient-to-br from-rollback-primary to-rollback-secondary rounded-full flex items-center justify-center mx-auto mb-6">
              <Shield className="h-10 w-10 text-white" />
            </div>

            {/* 404 Number */}
            <div className="text-8xl lg:text-9xl font-bold text-rollback-primary mb-4 leading-none">
              404
            </div>

            {/* Main Message */}
            <h1 className="text-2xl lg:text-3xl font-bold text-rollback-dark mb-4">
              Oops! Page Not Found
            </h1>

            {/* Description */}
            <p className="text-rollback-brown mb-2 text-lg leading-relaxed max-w-md mx-auto">
              The page you're looking for doesn't exist or has been moved.
            </p>
            <p className="text-rollback-brown/70 mb-8 leading-relaxed max-w-md mx-auto">
              Let's get you back to managing your rollback wallets safely.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                asChild
                size="lg"
                className="bg-rollback-primary hover:bg-rollback-primary/90 text-white px-8 py-3 text-lg transition-all duration-200 rounded-xl shadow-lg hover:shadow-rollback-primary/25"
              >
                <Link to="/dashboard">
                  <Home className="h-5 w-5 mr-3" />
                  Go to Dashboard
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="border-rollback-cream text-rollback-brown hover:bg-rollback-cream hover:border-rollback-secondary px-8 py-3 text-lg transition-all duration-200 rounded-xl"
              >
                <button onClick={() => window.history.back()}>
                  <ArrowLeft className="h-5 w-5 mr-3" />
                  Go Back
                </button>
              </Button>
            </div>

            {/* Helpful Links */}
            <div className="mt-8 pt-8 border-t border-rollback-cream">
              <p className="text-sm text-rollback-brown/70 mb-4">
                Need help? Try these popular pages:
              </p>
              <div className="flex flex-wrap gap-3 justify-center">
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="text-rollback-brown hover:text-rollback-primary hover:bg-rollback-cream/50 rounded-xl"
                >
                  <Link to="/create">Create Wallet</Link>
                </Button>
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="text-rollback-brown hover:text-rollback-primary hover:bg-rollback-cream/50 rounded-xl"
                >
                  <Link to="/governance">Governance</Link>
                </Button>
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="text-rollback-brown hover:text-rollback-primary hover:bg-rollback-cream/50 rounded-xl"
                >
                  <Link to="/subscribe">Subscribe</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default NotFound;
