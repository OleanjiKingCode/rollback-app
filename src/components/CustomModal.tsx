import React, { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CustomModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  image?: string;
  size?: "sm" | "md" | "lg" | "xl";
  showCancelButton?: boolean;
  cancelButtonText?: string;
  className?: string;
}

export function CustomModal({
  isOpen,
  onClose,
  title,
  description,
  children,
  image = "/lovable-uploads/86a7596b-4477-45a7-88bb-9de6bbadd014.png",
  size = "md",
  showCancelButton = true,
  cancelButtonText = "Cancel",
  className,
}: CustomModalProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  React.useEffect(() => {
    if (isOpen) {
      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === "Escape") {
          setIsAnimating(true);
          setTimeout(() => {
            onClose();
            setIsAnimating(false);
          }, 300);
        }
      };

      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
      return () => {
        document.removeEventListener("keydown", handleKeyDown);
        document.body.style.overflow = "unset";
      };
    }
  }, [isOpen, onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in-0 duration-300"
      onClick={handleBackdropClick}
    >
      <div
        className={cn(
          "relative w-full bg-white rounded-xl shadow-2xl animate-in zoom-in-95 duration-300",
          sizeClasses[size],
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Image Header */}
        <div className="relative h-20 bg-gradient-to-r from-rollback-primary to-rollback-secondary rounded-t-xl overflow-hidden">
          <div className="absolute inset-0 bg-black/10" />
          <div className="relative flex items-center justify-center h-full">
            <img
              src={image}
              alt="Modal Header"
              className="h-12 w-12 rounded-full border-2 border-white/20 shadow-lg"
            />
          </div>

          {/* Close Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="absolute top-3 right-3 h-8 w-8 p-0 text-white hover:bg-white/20 hover:text-white"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Modal Content */}
        <div className="p-6">
          {/* Modal Header */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-rollback-dark mb-2">
              {title}
            </h2>
            {description && (
              <p className="text-sm text-gray-600">{description}</p>
            )}
          </div>

          {/* Modal Body */}
          <div className="mb-6">{children}</div>

          {/* Modal Footer */}
          {showCancelButton && (
            <div className="flex justify-end pt-4 border-t border-gray-100">
              <Button
                variant="outline"
                onClick={onClose}
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                {cancelButtonText}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Preset modal variants for common use cases
export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirm",
  confirmVariant = "default" as const,
  isLoading = false,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  confirmVariant?: "default" | "destructive";
  isLoading?: boolean;
}) {
  return (
    <CustomModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      description={description}
      size="sm"
      showCancelButton={false}
    >
      <div className="flex space-x-3 justify-end">
        <Button
          variant="outline"
          onClick={onClose}
          disabled={isLoading}
          className="border-gray-300 text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </Button>
        <Button
          variant={confirmVariant}
          onClick={onConfirm}
          disabled={isLoading}
          className={cn(
            confirmVariant === "destructive"
              ? "bg-red-600 hover:bg-red-700 text-white"
              : "bg-rollback-primary hover:bg-rollback-primary/90 text-white"
          )}
        >
          {isLoading ? (
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              Loading...
            </div>
          ) : (
            confirmText
          )}
        </Button>
      </div>
    </CustomModal>
  );
}

// Info modal variant
export function InfoModal({
  isOpen,
  onClose,
  title,
  description,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <CustomModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      description={description}
      size="lg"
    >
      {children}
    </CustomModal>
  );
}
