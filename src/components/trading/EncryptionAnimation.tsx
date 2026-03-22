import { motion } from "framer-motion";
import { Lock, ArrowRight, Shield, CheckCircle } from "lucide-react";

interface EncryptionAnimationProps {
  isComplete: boolean;
}

/**
 * Full-overlay animation showing the FHE encryption process:
 * plaintext data → ciphertext → on-chain submission
 */
const EncryptionAnimation = ({ isComplete }: EncryptionAnimationProps) => {
  const cipherChars = "█▓▒░╔╗╚╝║═╬╦╩╠╣▄▀■□●○◆◇▲△";
  const generateCipher = (len: number) =>
    Array.from({ length: len }, () => cipherChars[Math.floor(Math.random() * cipherChars.length)]).join("");

  return (
    <motion.div
      className="absolute inset-0 z-30 bg-background/95 backdrop-blur-sm flex flex-col items-center justify-center p-3"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {!isComplete ? (
        <div className="flex flex-col items-center gap-3 w-full max-w-[200px]">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-1.5"
          >
            <Shield className="w-3.5 h-3.5 text-primary" />
            <span className="text-[10px] font-semibold text-foreground">FHE Encryption</span>
          </motion.div>

          {/* Plaintext → Ciphertext Flow */}
          <div className="w-full space-y-2">
            {/* Step 1: Plaintext data */}
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="border border-border rounded p-1.5 bg-card"
            >
              <p className="text-[7px] text-muted-foreground mb-0.5">PLAINTEXT</p>
              <div className="font-mono text-[8px] text-foreground space-y-0.5">
                <div>price: <span className="text-buy">2347.50</span></div>
                <div>size:  <span className="text-buy">5.2400</span></div>
                <div>side:  <span className="text-buy">LONG</span></div>
              </div>
            </motion.div>

            {/* Arrow + Lock */}
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6 }}
              className="flex items-center justify-center gap-1"
            >
              <ArrowRight className="w-2.5 h-2.5 text-primary/50" />
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ repeat: Infinity, duration: 1.2 }}
              >
                <Lock className="w-3 h-3 text-encrypted" />
              </motion.div>
              <ArrowRight className="w-2.5 h-2.5 text-primary/50" />
            </motion.div>

            {/* Step 2: Ciphertext */}
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1 }}
              className="border border-encrypted/20 rounded p-1.5 bg-encrypted/5"
            >
              <p className="text-[7px] text-encrypted/60 mb-0.5">CIPHERTEXT (euint64)</p>
              <div className="font-mono text-[8px] text-encrypted/80 space-y-0.5 overflow-hidden">
                <motion.div
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                >
                  {generateCipher(28)}
                </motion.div>
                <motion.div
                  animate={{ opacity: [1, 0.4, 1] }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                >
                  {generateCipher(28)}
                </motion.div>
                <motion.div
                  animate={{ opacity: [0.6, 1, 0.6] }}
                  transition={{ repeat: Infinity, duration: 1.3, ease: "easeInOut" }}
                >
                  {generateCipher(28)}
                </motion.div>
              </div>
            </motion.div>
          </div>

          {/* Progress bar */}
          <div className="w-full h-0.5 bg-border rounded-full overflow-hidden">
            <motion.div
              className="h-full gradient-primary rounded-full"
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 2.5, ease: "easeInOut" }}
            />
          </div>

          {/* Status text */}
          <motion.p
            className="text-[8px] text-muted-foreground"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            Encrypting via CoFHE coprocessor...
          </motion.p>
        </div>
      ) : (
        /* Completion state */
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-2"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", bounce: 0.5 }}
          >
            <CheckCircle className="w-5 h-5 text-buy" />
          </motion.div>
          <p className="text-[10px] font-semibold text-foreground">Order Encrypted</p>
          <p className="text-[8px] text-muted-foreground">Submitting to ShadowPool...</p>
        </motion.div>
      )}
    </motion.div>
  );
};

export default EncryptionAnimation;
