import { motion } from "framer-motion";
import { Shield, Eye, Lock, Cpu, Gavel, Vault, TrendingUp, Building2 } from "lucide-react";

const features = [
  {
    icon: Lock,
    title: "Private Positions",
    description:
      "Open and manage trading positions with fully encrypted size, entry price, and direction. No one — not even validators — can see your exposure.",
  },
  {
    icon: Gavel,
    title: "Sealed-Bid Auctions",
    description:
      "Submit encrypted bids that are matched on ciphertext. Prevents bid sniping, last-look manipulation, and information asymmetry in OTC markets.",
  },
  {
    icon: Shield,
    title: "MEV-Protected Execution",
    description:
      "Encrypting all order data makes MEV extraction mathematically impossible. Execute large block trades without sandwich attacks or front-running.",
  },
  {
    icon: Building2,
    title: "Institutional Architecture",
    description:
      "Compliance-ready infrastructure for funds, treasuries, and market makers. Permit-gated disclosure lets you prove trade execution without revealing strategy.",
  },
  {
    icon: Cpu,
    title: "FHE-Powered Matching Engine",
    description:
      "Order matching operates entirely on encrypted data via Fhenix CoFHE coprocessor. The matching engine never touches plaintext — only ciphertext computations.",
  },
  {
    icon: Eye,
    title: "Selective Disclosure",
    description:
      "Cryptographic permits allow authorized parties to verify specific trade details. Full audit trail without exposing your trading history or strategies.",
  },
  {
    icon: Vault,
    title: "Treasury Management",
    description:
      "Execute large treasury rebalances without market impact. Encrypted orders prevent information leakage during multi-million dollar position adjustments.",
  },
  {
    icon: TrendingUp,
    title: "Confidential Lending",
    description:
      "Post encrypted collateral and borrow without revealing portfolio composition. Liquidation thresholds computed on encrypted balances via FHE.",
  },
];

const Features = () => {
  return (
    <section id="features" className="py-24 sm:py-32">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <p className="text-xs font-mono text-primary tracking-widest uppercase mb-3">
            Private Trading Infrastructure
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4 tracking-tight">
            Institutional-Grade Confidential DeFi
          </h2>
          <p className="text-sm text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Private positions, sealed-bid auctions, MEV-protected execution.
            Built for trading, lending, and treasury management — encrypted end-to-end.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20, filter: "blur(4px)" }}
              whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ delay: i * 0.06, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="group p-5 rounded-xl border border-border bg-card hover:border-primary/20 transition-all duration-300 hover:shadow-glow"
            >
              <div className="w-9 h-9 rounded-lg bg-primary/[0.08] flex items-center justify-center mb-4 group-hover:bg-primary/[0.12] transition-colors">
                <feature.icon className="w-4 h-4 text-primary" />
              </div>
              <h3 className="text-sm font-semibold text-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
