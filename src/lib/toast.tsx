import React from "react";
import { toast } from "sonner";
import { TiWarning } from "react-icons/ti";
import { IoCheckbox, IoClose } from "react-icons/io5";
import { CgInfo } from "react-icons/cg";
import { AiFillInfoCircle } from "react-icons/ai";
import { RiLoader4Line } from "react-icons/ri";

interface BaseSonnerProps extends React.HTMLAttributes<HTMLDivElement> {
  header: string;
  message: string;
  subMessage?: React.ReactNode;
  duration?: number;
  toastProps?: any;
}

interface LoadingSonnerProps extends React.HTMLAttributes<HTMLDivElement> {
  message: string;
  duration?: number;
  toastProps?: any;
}

interface PlainSonnerProps extends React.HTMLAttributes<HTMLDivElement> {
  message: string;
  duration?: number;
  color?: string;
  toastProps?: any;
}

const LoadingBar: React.FC<{ duration: number }> = ({ duration }) => {
  return (
    <div className="w-full h-2 bg-gray-200 rounded mt-4 overflow-hidden">
      <div
        className="h-full bg-rollback-primary rounded animate-pulse"
        style={{
          width: "30%",
        }}
      />
    </div>
  );
};

const ToastHeader: React.FC<{
  icon: React.ReactNode;
  header: string;
}> = ({ icon, header }) => (
  <div className="bg-gray-800 flex items-center gap-2 justify-between p-3">
    <div className="flex items-center gap-2">
      {icon}
      <span className="font-semibold text-xs text-white">{header}</span>
    </div>
    <div className="flex items-center pl-3 border-l border-gray-400 cursor-pointer">
      <IoClose
        className="text-gray-400 w-4 h-4 hover:text-white"
        onClick={() => toast.dismiss()}
      />
    </div>
  </div>
);

const ToastContent: React.FC<{
  message: string;
  subMessage?: React.ReactNode;
}> = ({ message, subMessage }) => (
  <div className="p-3">
    {subMessage || (
      <div className="text-gray-600 text-sm font-normal">{message}</div>
    )}
  </div>
);

export const sonnerToasts = () => {
  const LoadingSonner = ({
    message,
    duration = 3000,
    toastProps,
    ...props
  }: LoadingSonnerProps) => {
    return toast.loading(
      <div {...props} className={`w-full p-4 ${props.className || ""}`}>
        <div className="font-semibold text-xs mb-2 w-full flex items-center gap-2">
          <RiLoader4Line className="w-4 h-4 animate-spin" />
          {message}
        </div>
        <LoadingBar duration={2500} />
      </div>,
      { duration, ...toastProps, closeButton: false }
    );
  };

  const PlainSonner = ({
    message,
    duration = 3000,
    color = "text-gray-600",
    toastProps,
    ...props
  }: PlainSonnerProps) => {
    return toast(
      <div
        {...props}
        className={`w-full p-4 flex items-center justify-between ${
          props.className || ""
        }`}
      >
        <div className={`font-semibold text-xs w-full ${color}`}>{message}</div>
        <div className="flex items-center pl-3 border-l border-gray-400 cursor-pointer">
          <IoClose
            className="text-gray-400 w-4 h-4 hover:text-white"
            onClick={() => toast.dismiss()}
          />
        </div>
      </div>,
      { duration, ...toastProps, closeButton: false }
    );
  };

  const ErrorSonner = ({
    header,
    message,
    duration = 3000,
    subMessage,
    toastProps,
    ...props
  }: BaseSonnerProps) => {
    return toast.error(
      <div
        {...props}
        className={`w-full flex flex-col ${props.className || ""}`}
      >
        <ToastHeader
          icon={<TiWarning className="text-red-500 w-4 h-4" />}
          header={header}
        />
        <ToastContent message={message} subMessage={subMessage} />
      </div>,
      { duration, ...toastProps, closeButton: false }
    );
  };

  const SuccessfulSonner = ({
    header,
    message,
    duration = 3000,
    subMessage,
    toastProps,
    ...props
  }: BaseSonnerProps) => {
    return toast.success(
      <div
        {...props}
        className={`w-full flex flex-col ${props.className || ""}`}
      >
        <ToastHeader
          icon={<IoCheckbox className="text-green-500 w-4 h-4" />}
          header={header}
        />
        <ToastContent message={message} subMessage={subMessage} />
      </div>,
      { duration, ...toastProps, closeButton: false }
    );
  };

  const WarningSonner = ({
    header,
    message,
    duration = 3000,
    subMessage,
    toastProps,
    ...props
  }: BaseSonnerProps) => {
    return toast.warning(
      <div
        {...props}
        className={`w-full flex flex-col ${props.className || ""}`}
      >
        <ToastHeader
          icon={<CgInfo className="text-yellow-500 w-4 h-4" />}
          header={header}
        />
        <ToastContent message={message} subMessage={subMessage} />
      </div>,
      { duration, ...toastProps, closeButton: false }
    );
  };

  const InfoSonner = ({
    header,
    message,
    duration = 3000,
    subMessage,
    toastProps,
    ...props
  }: BaseSonnerProps) => {
    return toast.info(
      <div
        {...props}
        className={`w-full flex flex-col ${props.className || ""}`}
      >
        <ToastHeader
          icon={<AiFillInfoCircle className="text-blue-500 w-4 h-4" />}
          header={header}
        />
        <ToastContent message={message} subMessage={subMessage} />
      </div>,
      { duration, ...toastProps, closeButton: false }
    );
  };

  return {
    LoadingSonner,
    ErrorSonner,
    SuccessfulSonner,
    WarningSonner,
    InfoSonner,
    PlainSonner,
  };
};

// Create a simple interface that matches the previous usage
export const toastHelpers = sonnerToasts();

export const toastApi = {
  success: (title: string, description?: string) =>
    toastHelpers.SuccessfulSonner({
      header: title,
      message: description || title,
    }),
  error: (title: string, description?: string) =>
    toastHelpers.ErrorSonner({ header: title, message: description || title }),
  warning: (title: string, description?: string) =>
    toastHelpers.WarningSonner({
      header: title,
      message: description || title,
    }),
  info: (title: string, description?: string) =>
    toastHelpers.InfoSonner({ header: title, message: description || title }),
  loading: (message: string) => toastHelpers.LoadingSonner({ message }),
  plain: (message: string) => toastHelpers.PlainSonner({ message }),
};

export { toastApi as toast };

// Export types for consistency
export type ToastType = "success" | "error" | "warning" | "info" | "plain";
