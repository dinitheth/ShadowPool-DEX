import { motion } from "framer-motion";
import { ShieldCheck, Network, KeyRound, FileSearch } from "lucide-react";

const securityFeatures = [
  {
    icon: ShieldCheck,
    title: "Fully Homomorphic Encryption",
    description: "Computations on encrypted data without decryption. Based on lattice-based cryptography — quantum-resistant by design.",
  },
  {
    icon: Network,
    title: "Threshold Decryption Network",
    description: "No single entity holds the decryption key. Multi-party computation ensures distributed trust with no central point of failure.",
  },
  {
    icon: KeyRound,
    title: "ACL & Permit System",
    description: "Fine-grained access control for encrypted data. Only authorized wallets can decrypt specific values via cryptographic permits.",
  },
  {
    icon: FileSearch,
    title: "On-Chain Verifiability",
    description: "All operations verifiable on-chain. Encrypted inputs validated via ZK proofs before entering the ciphertext registry.",
  },
];

const Security = () => {
  return (
    <section id="security" className="py-20 sm:py-28">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">
            Security Architecture
          </h2>
          <p className="text-sm text-muted-foreground max-w-lg mx-auto">
            Built on battle-tested cryptographic primitives with no shortcuts.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 gap-4">
          {securityFeatures.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
              className="flex gap-3.5 p-5 rounded-xl border border-border bg-card"
            >
              <div className="w-8 h-8 rounded-lg bg-encrypted/10 flex items-center justify-center flex-shrink-0">
                <feature.icon className="w-4 h-4 text-encrypted" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-1">
                  {feature.title}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Security;
