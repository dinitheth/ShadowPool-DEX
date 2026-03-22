import { motion } from "framer-motion";
import { Lock, Cpu, CheckCircle, ArrowDown } from "lucide-react";

const steps = [
  {
    icon: Lock,
    step: "01",
    title: "Encrypt Your Order",
    description:
      "Connect your wallet and submit an order. The cofhejs SDK encrypts your order data (price, amount, direction) client-side before it touches the blockchain.",
    detail: "Client-side FHE encryption via Fhenix CoFHE",
  },
  {
    icon: Cpu,
    step: "02",
    title: "Encrypted Matching",
    description:
      "The ShadowPool smart contract receives encrypted orders and performs matching using FHE operations on ciphertext — never seeing plaintext values.",
    detail: "FHE.sol encrypted types and operations",
  },
  {
    icon: CheckCircle,
    step: "03",
    title: "Confidential Settlement",
    description:
      "Matched orders settle on-chain. Only matched counterparties can decrypt execution details via permit-gated decryption through the Threshold Network.",
    detail: "Threshold decryption with no single point of failure",
  },
];

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-20 sm:py-28">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">
            How It Works
          </h2>
          <p className="text-sm text-muted-foreground max-w-lg mx-auto">
            Three steps from intent to settlement — encrypted at every stage.
          </p>
        </motion.div>

        <div className="space-y-4">
          {steps.map((step, i) => (
            <div key={step.step}>
              <motion.div
                initial={{ opacity: 0, x: -16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex gap-4 p-5 rounded-xl border border-border bg-card"
              >
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                    <step.icon className="w-4 h-4 text-primary-foreground" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2.5 mb-1.5">
                    <span className="text-[10px] font-mono text-primary font-bold">
                      STEP {step.step}
                    </span>
                    <h3 className="text-sm font-semibold text-foreground">
                      {step.title}
                    </h3>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-2.5">
                    {step.description}
                  </p>
                  <div className="encrypted-badge text-[10px]">
                    <Lock className="w-2.5 h-2.5" />
                    {step.detail}
                  </div>
                </div>
              </motion.div>
              {i < steps.length - 1 && (
                <div className="flex justify-center py-1.5">
                  <ArrowDown className="w-3.5 h-3.5 text-primary/30" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
