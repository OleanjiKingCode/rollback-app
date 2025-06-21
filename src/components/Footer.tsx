import { Link } from "react-router-dom";
import { useState, useEffect } from "react";

export function Footer() {
  const [status, setStatus] = useState<
    "operational" | "maintenance" | "degraded"
  >("operational");
  const [uptime, setUptime] = useState("99.9%");

  // Real status monitoring - would fetch from actual system status API
  useEffect(() => {
    // Set initial status as operational - would be replaced with API call
    setStatus("operational");

    // In real implementation, this would fetch from status API
    // const fetchStatus = async () => {
    //   try {
    //     const response = await fetch('/api/system/status');
    //     const data = await response.json();
    //     setStatus(data.status);
    //     setUptime(data.uptime);
    //   } catch (error) {
    //     setStatus("degraded");
    //   }
    // };

    // fetchStatus();
    // const interval = setInterval(fetchStatus, 30000);
    // return () => clearInterval(interval);
  }, []);

  const getStatusColor = () => {
    switch (status) {
      case "operational":
        return "text-green-600";
      case "degraded":
        return "text-yellow-600";
      case "maintenance":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  const getStatusText = () => {
    switch (status) {
      case "operational":
        return "All systems operational";
      case "degraded":
        return "Experiencing minor issues";
      case "maintenance":
        return "Under maintenance";
      default:
        return "Status unknown";
    }
  };

  return (
    <footer className="bg-gradient-to-br from-rollback-light to-white border-t border-rollback-cream/50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex flex-col sm:flex-row justify-between items-center text-xs text-gray-500">
          <div className="flex items-center space-x-4 mb-2 sm:mb-0">
            <div className="flex items-center space-x-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  status === "operational"
                    ? "bg-green-500"
                    : status === "degraded"
                    ? "bg-yellow-500"
                    : "bg-red-500"
                } animate-pulse`}
              ></div>
              <span className={getStatusColor()}>{getStatusText()}</span>
            </div>
            <div className="text-gray-400">•</div>
            <span>Uptime {uptime}</span>
            <div className="text-gray-400">•</div>
            <span>v1.0.0</span>
          </div>
          <div className="flex items-center space-x-4">
            <span>© {new Date().getFullYear()} Rollback Labs</span>
            <div className="text-gray-400">•</div>
            <Link
              to="https://rollback-labs.gitbook.io/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-rollback-primary transition-colors"
            >
              Docs
            </Link>
            <div className="text-gray-400">•</div>
            <Link
              to="https://x.com/rollbacklabs"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-rollback-primary transition-colors"
            >
              Support
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
