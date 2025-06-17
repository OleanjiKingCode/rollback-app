import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-gray-50 pt-16 lg:pt-8 flex items-center justify-center">
      <div className="container mx-auto px-4 py-8 flex items-center justify-center">
        <div className="text-center max-w-lg">
          <div className="text-8xl font-bold text-rollback-primary mb-6">
            404
          </div>
          <h1 className="text-3xl font-bold text-rollback-dark mb-4">
            Page Not Found
          </h1>
          <p className="text-gray-600 mb-8 text-lg leading-relaxed">
            The page you're looking for doesn't exist or has been moved. Let's
            get you back to your rollback dashboard.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              asChild
              className="bg-rollback-primary hover:bg-rollback-primary/90 text-white px-8 py-3 text-lg transition-colors duration-200"
            >
              <Link to="/dashboard">
                <Home className="h-5 w-5 mr-3" />
                Go to Dashboard
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="border-gray-300 text-gray-700 hover:bg-gray-100 px-8 py-3 text-lg transition-colors duration-200"
            >
              <button onClick={() => window.history.back()}>
                <ArrowLeft className="h-5 w-5 mr-3" />
                Go Back
              </button>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
