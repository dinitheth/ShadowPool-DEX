import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

type ToastType = "success" | "error" | "info";

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue>({ showToast: () => {} });

export const useToast = () => useContext(ToastContext);

let toastId = 0;

const ICONS: Record<ToastType, typeof CheckCircle2> = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
};

const STYLES: Record<ToastType, string> = {
  success: "bg-emerald-500/15 border-emerald-500/30 text-emerald-300",
  error: "bg-rose-500/15 border-rose-500/30 text-rose-300",
  info: "bg-indigo-500/15 border-indigo-500/30 text-indigo-300",
};

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = "info") => {
    const id = ++toastId;
    // Simplify long raw error messages for user-friendliness
    let msg = message;
    if (msg.includes("User rejected")) {
      msg = "Transaction cancelled by user";
    } else if (msg.includes("transaction is likely to fail") || msg.includes("execution reverted")) {
      msg = "Transaction failed — please claim USDC from faucet first, then try again";
    } else if (msg.includes("insufficient funds")) {
      msg = "Insufficient funds — make sure you have SepoliaETH for gas and EUSDC for margin";
    } else if (msg.length > 120) {
      msg = msg.slice(0, 120) + "…";
    }

    setToasts((prev) => [...prev.slice(-4), { id, message: msg, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* Toast container: bottom-right */}
      <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none" style={{ maxWidth: 420 }}>
        <AnimatePresence>
          {toasts.map((t) => {
            const Icon = ICONS[t.type];
            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, x: 80, scale: 0.9 }}
                transition={{ duration: 0.25 }}
                className={`pointer-events-auto flex items-start gap-2.5 px-4 py-3 rounded-lg border backdrop-blur-md shadow-xl ${STYLES[t.type]}`}
              >
                <Icon className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span className="text-sm font-medium leading-snug flex-1">{t.message}</span>
                <button onClick={() => dismiss(t.id)} className="opacity-60 hover:opacity-100 transition-opacity flex-shrink-0 mt-0.5">
                  <X className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};
