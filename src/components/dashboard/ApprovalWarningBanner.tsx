import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ApprovalWarningBannerProps {
  showWarning: boolean;
  unapprovedCount: number;
  totalTokens: number;
  unapprovedTokens: string[];
}

export function ApprovalWarningBanner({
  showWarning,
  unapprovedCount,
  totalTokens,
  unapprovedTokens,
}: ApprovalWarningBannerProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const navigate = useNavigate();

  if (!showWarning) {
    return null;
  }

  const handleGoToApprovals = () => {
    navigate("/settings/token-approvals");
  };

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm">
      <div
        className={`transition-all duration-300 ${
          isExpanded ? "w-72" : "w-auto"
        }`}
      >
        {/* Collapsed State - Small Red Icon */}
        {!isExpanded && (
          <div className="relative">
            <Button
              onClick={() => setIsExpanded(true)}
              className="relative bg-red-500 hover:bg-red-600 text-white rounded-lg px-3 py-2 shadow-lg"
            >
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-xs font-medium">
                  {unapprovedCount} approvals needed
                </span>
                <ChevronDown className="h-3 w-3" />
              </div>
            </Button>
          </div>
        )}

        {/* Expanded State - Info Card */}
        {isExpanded && (
          <div className="bg-white border border-red-200 rounded-lg shadow-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0" />
                <span className="text-sm font-medium text-gray-900">
                  Token Approvals Needed
                </span>
              </div>
              <Button
                onClick={() => setIsExpanded(false)}
                variant="ghost"
                size="sm"
                className="p-0 h-4 w-4 text-gray-400 hover:text-gray-600"
              >
                <ChevronUp className="h-3 w-3" />
              </Button>
            </div>

            <p className="text-xs text-gray-600 mb-3">
              {unapprovedCount} of {totalTokens} tokens need approval - this is
              crucial as rollback success highly depends on proper token
              permissions.
            </p>

            <Button
              onClick={handleGoToApprovals}
              size="sm"
              className="bg-red-500 hover:bg-red-600 text-white text-xs px-3 py-1 h-auto w-full"
            >
              Review Approvals
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
