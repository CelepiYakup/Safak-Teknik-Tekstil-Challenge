import React, { useEffect } from "react";
import "./Toast.scss";

interface ToastProps {
  message: string;
  type: "success" | "error" | "warning" | "info";
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`toast toast--${type}`}>
      <div className="toast__content">
        <span className="toast__message">{message}</span>
        <button onClick={onClose} className="toast__close">×</button>
      </div>
    </div>
  );
};

export default Toast;
