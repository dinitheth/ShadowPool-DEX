import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Cpu, CheckCircle, Wallet, ShieldCheck, Key, ArrowRight, Database, Code, Shield } from "lucide-react";

const steps = [
  {
    id: 0,
    icon: Lock,
    title: "Encrypt Your Order",
    description: "Connect your wallet and submit an order. The cofhejs SDK encrypts your order data (price, amount, direction) client-side before it touches the blockchain.",
    detail: "Client-side FHE encryption via Fhenix CoFHE",
  },
  {
    id: 1,
    icon: Cpu,
    title: "Encrypted Matching",
    description: "The ShadowPool smart contract receives encrypted orders and performs matching using FHE operations on ciphertext — never seeing plaintext values.",
    detail: "FHE.sol encrypted types and operations",
  },
  {
    id: 2,
    icon: CheckCircle,
    title: "Confidential Settlement",
    description: "Matched orders settle on-chain. Only matched counterparties can decrypt execution details via permit-gated decryption through the Threshold Network.",
    detail: "Threshold decryption with no single point of failure",
  },
];

const Visualizer = ({ activeStep }: { activeStep: number }) => {
  return (
    <div className="relative w-full h-[300px] sm:h-[400px] bg-[#0A0A0C] rounded-2xl border border-white/5 overflow-hidden flex items-center justify-center p-4 sm:p-8 shadow-2xl">
      {/* Background Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:32px_32px]" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0C] via-transparent to-[#0A0A0C]" />

      <AnimatePresence mode="wait">
        {/* STEP 0: ENCRYPT YOUR ORDER */}
        {activeStep === 0 && (
          <motion.div
            key="step0"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.5 }}
            className="relative z-10 w-full h-full flex flex-col items-center justify-center gap-6"
          >
            <div className="flex items-center gap-4 sm:gap-8 w-full justify-center">
              {/* Wallet Node */}
              <motion.div 
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className="flex flex-col items-center gap-3"
              >
                <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center">
                  <Wallet className="w-6 h-6 text-indigo-400" />
                </div>
                <span className="text-xs text-muted-foreground font-mono">Input: $2,500</span>
              </motion.div>

              {/* Arrow Indicator */}
              <div className="relative w-16 sm:w-24 h-px bg-white/10">
                <motion.div
                  initial={{ left: "0%" }}
                  animate={{ left: "100%" }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                  className="absolute top-1/2 -translate-y-1/2 w-4 h-1 bg-primary rounded-full blur-[2px] shadow-[0_0_10px_#22d3ee]"
                />
              </div>

              {/* Lock Node */}
              <motion.div className="flex flex-col items-center gap-3">
                <motion.div 
                  animate={{ scale: [1, 1.05, 1] }} 
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/40 flex items-center justify-center"
                >
                  <Lock className="w-7 h-7 text-primary" />
                </motion.div>
                <span className="text-xs text-primary font-mono font-bold">cofhejs.encrypt()</span>
              </motion.div>

              {/* Arrow Indicator */}
              <div className="relative w-16 sm:w-24 h-px bg-white/10">
                <motion.div
                  initial={{ left: "0%" }}
                  animate={{ left: "100%" }}
                  transition={{ repeat: Infinity, duration: 1.5, delay: 0.75, ease: "linear" }}
                  className="absolute top-1/2 -translate-y-1/2 w-4 h-1 bg-emerald-400 rounded-full blur-[2px] shadow-[0_0_10px_#34d399]"
                />
              </div>

              {/* Encrypted Data Node */}
              <motion.div 
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className="flex flex-col items-center gap-3"
              >
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                  <Code className="w-6 h-6 text-emerald-400" />
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-[10px] text-emerald-400/70 font-mono">Ciphertext</span>
                  <span className="text-xs text-emerald-400 font-mono">[0x4f8...a12b]</span>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* STEP 1: ENCRYPTED MATCHING */}
        {activeStep === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.5 }}
            className="relative z-10 w-full h-full flex items-center justify-center"
          >
             <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 sm:gap-8 w-full max-w-lg">
                <div className="flex flex-col gap-8">
                  <motion.div 
                    animate={{ y: [0, -5, 0] }} 
                    transition={{ repeat: Infinity, duration: 3 }}
                    className="p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl text-center"
                  >
                    <span className="text-[10px] text-emerald-400 font-mono block mb-1">LONG ORDER</span>
                    <span className="text-xs text-emerald-200 font-mono">[enc_0x8f...]</span>
                  </motion.div>
                  <motion.div 
                    animate={{ y: [0, 5, 0] }} 
                    transition={{ repeat: Infinity, duration: 3, delay: 1 }}
                    className="p-3 bg-rose-500/5 border border-rose-500/20 rounded-xl text-center"
                  >
                    <span className="text-[10px] text-rose-400 font-mono block mb-1">SHORT ORDER</span>
                    <span className="text-xs text-rose-200 font-mono">[enc_0x2b...]</span>
                  </motion.div>
                </div>

                <div className="relative flex items-center justify-center">
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 15, ease: "linear" }}
                    className="absolute w-32 h-32 rounded-full border border-dashed border-primary/30"
                  />
                  <div className="w-20 h-20 bg-[#16161A] border-2 border-primary/50 relative z-10 rounded-2xl flex flex-col items-center justify-center shadow-[0_0_30px_rgba(34,211,238,0.15)] overflow-hidden">
                    <div className="absolute inset-0 bg-primary/10 animate-pulse" />
                    <Cpu className="w-8 h-8 text-primary relative z-10 mb-1" />
                    <span className="text-[9px] font-mono text-primary font-bold relative z-10">FHE EVM</span>
                  </div>
                  {/* Connecting streams */}
                  <div className="absolute right-full top-1/4 w-12 h-px bg-white/10" />
                  <div className="absolute right-full bottom-1/4 w-12 h-px bg-white/10" />
                  <div className="absolute left-full top-1/2 w-12 h-px bg-white/10" />
                </div>

                <div className="flex flex-col items-center">
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 }}
                    className="p-4 bg-primary/10 border border-primary/30 rounded-xl text-center flex flex-col items-center"
                  >
                    <ShieldCheck className="w-6 h-6 text-primary mb-2" />
                    <span className="text-[10px] text-primary font-mono font-bold block mb-1">MATCHED STATE</span>
                    <span className="text-xs text-primary/80 font-mono">Encrypted Match</span>
                  </motion.div>
                </div>
             </div>
          </motion.div>
        )}

        {/* STEP 2: CONFIDENTIAL SETTLEMENT */}
        {activeStep === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.5 }}
            className="relative z-10 w-full h-full flex flex-col items-center justify-center"
          >
            <div className="flex flex-col sm:flex-row items-center justify-between w-full max-w-lg gap-8 relative">
              {/* Encrypted Position */}
              <div className="flex flex-col items-center gap-3 relative z-10">
                <div className="w-16 h-16 rounded-2xl bg-zinc-800/50 border border-zinc-700 flex items-center justify-center">
                  <Database className="w-7 h-7 text-zinc-400" />
                </div>
                <span className="text-[10px] text-zinc-400 font-mono uppercase">On-Chain State</span>
                <span className="text-xs text-zinc-500 font-mono">[Encrypted]</span>
              </div>

              {/* Threshold Network Nodes */}
              <div className="flex flex-col items-center relative z-10 w-32">
                 <div className="relative w-full h-24 flex items-center justify-center">
                    <motion.div className="absolute top-0 left-4 w-6 h-6 bg-indigo-500/20 border border-indigo-500/50 rounded-full flex items-center justify-center">
                      <Key className="w-3 h-3 text-indigo-400" />
                    </motion.div>
                    <motion.div className="absolute bottom-2 left-0 w-6 h-6 bg-indigo-500/20 border border-indigo-500/50 rounded-full flex items-center justify-center">
                       <Key className="w-3 h-3 text-indigo-400" />
                    </motion.div>
                    <motion.div className="absolute top-4 right-2 w-6 h-6 bg-indigo-500/20 border border-indigo-500/50 rounded-full flex items-center justify-center">
                       <Key className="w-3 h-3 text-indigo-400" />
                    </motion.div>
                    <motion.div className="absolute bottom-0 right-6 w-6 h-6 bg-indigo-500/20 border border-indigo-500/50 rounded-full flex items-center justify-center">
                       <Key className="w-3 h-3 text-indigo-400" />
                    </motion.div>
                    <div className="w-12 h-12 bg-indigo-500/10 border border-indigo-500/40 rounded-xl flex items-center justify-center relative z-20 backdrop-blur-sm">
                      <Shield className="w-5 h-5 text-indigo-400" />
                    </div>
                 </div>
                 <span className="text-[10px] text-indigo-400 font-mono font-bold mt-2">THRESHOLD KMS</span>
              </div>

              {/* Decrypted Output (Only for user) */}
              <div className="flex flex-col items-center gap-3 relative z-10">
                <motion.div 
                  initial={{ boxShadow: "0 0 0 rgba(16, 185, 129, 0)" }}
                  animate={{ boxShadow: "0 0 20px rgba(16, 185, 129, 0.4)" }}
                  transition={{ delay: 1 }}
                  className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/50 flex items-center justify-center"
                >
                  <CheckCircle className="w-8 h-8 text-emerald-400" />
                </motion.div>
                <div className="flex flex-col items-center">
                  <span className="text-[10px] text-emerald-400 font-bold uppercase">Decrypted by Permit</span>
                  <span className="text-xs text-white font-mono mt-1">+ $2,500 USDC</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const HowItWorks = () => {
  const [activeStep, setActiveStep] = useState(0);

  // Auto-advance
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % steps.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section id="how-it-works" className="py-24 sm:py-32 relative overflow-hidden">
      {/* Background Ornaments */}
      <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px] pointer-events-none -z-10" />
      <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none -z-10" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <motion.div
           initial={{ opacity: 0, y: 16 }}
           whileInView={{ opacity: 1, y: 0 }}
           viewport={{ once: true }}
           className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold flex justify-center gap-3 mb-4">
             How It <span className="text-transparent bg-clip-text gradient-primary font-extrabold">Works</span>
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Three steps from intent to settlement — encrypted at every stage using Fully Homomorphic Encryption.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Column: Interactive Steps List */}
          <div className="space-y-4">
            {steps.map((step, i) => (
              <motion.button
                key={step.id}
                onClick={() => setActiveStep(step.id)}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`w-full text-left flex gap-5 p-6 rounded-2xl transition-all duration-300 border ${
                  activeStep === step.id
                     ? "bg-[#16161A] border-primary/50 shadow-[0_0_30px_rgba(34,211,238,0.1)] scale-[1.02]"
                     : "bg-[#0A0A0C] border-white/5 hover:border-white/10 hover:bg-[#111114]"
                }`}
              >
                <div className="flex-shrink-0 mt-1">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors duration-300 ${
                    activeStep === step.id 
                       ? "gradient-primary text-white shadow-lg" 
                       : "bg-[#1C1C21] text-muted-foreground group-hover:bg-[#2A2A30]"
                  }`}>
                    <step.icon className="w-5 h-5" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`text-[10px] font-mono font-bold tracking-wider ${
                      activeStep === step.id ? "text-primary" : "text-muted-foreground"
                    }`}>
                      STEP {step.id + 1}
                    </span>
                    <h3 className={`text-base font-bold ${
                      activeStep === step.id ? "text-white" : "text-gray-300"
                    }`}>
                      {step.title}
                    </h3>
                  </div>
                  <p className="text-sm text-gray-400 leading-relaxed mb-3">
                    {step.description}
                  </p>
                  <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-mono transition-colors ${
                     activeStep === step.id ? "bg-primary/10 text-primary border border-primary/20" : "bg-white/5 text-gray-400 border border-white/5"
                  }`}>
                     {activeStep === step.id ? <Lock className="w-3 h-3" /> : <Shield className="w-3 h-3" />}
                     {step.detail}
                  </div>
                </div>
              </motion.button>
            ))}
          </div>

          {/* Right Column: Visualizer Graphic */}
          <motion.div
             initial={{ opacity: 0, scale: 0.9 }}
             whileInView={{ opacity: 1, scale: 1 }}
             viewport={{ once: true }}
             transition={{ duration: 0.6 }}
             className="w-full flex justify-center lg:justify-end border border-white/5 rounded-2xl shadow-2xl p-2 bg-[#1A1A1F]"
          >
             <Visualizer activeStep={activeStep} />
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
