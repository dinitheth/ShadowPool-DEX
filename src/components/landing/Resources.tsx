import { motion } from "framer-motion";
import { BookOpen, Code, Package, MessageCircle, Globe, ExternalLink } from "lucide-react";

const resources = [
  {
    icon: BookOpen,
    title: "Documentation",
    description: "Complete Fhenix developer documentation with guides, API references, and tutorials.",
    link: "https://docs.fhenix.io",
    linkText: "docs.fhenix.io",
  },
  {
    icon: Package,
    title: "SDK — @cofhe/sdk",
    description: "Client-side FHE encryption SDK for encrypting data before it touches the blockchain.",
    link: "https://cofhe-docs.fhenix.zone/fhe-library/introduction/quick-start",
    linkText: "Quick Start Guide",
  },
  {
    icon: Code,
    title: "React — @cofhe/react",
    description: "React hooks for FHE: useEncrypt, useWrite, useDecrypt. Drop-in integration for dApps.",
    link: "https://cofhe-docs.fhenix.zone/deep-dive/cofhe-components/overview",
    linkText: "Architecture Overview",
  },
  {
    icon: Globe,
    title: "Example Repositories",
    description: "Starter templates and reference implementations for building with Fhenix FHE.",
    link: "https://github.com/FhenixProtocol/awesome-fhenix",
    linkText: "awesome-fhenix",
  },
  {
    icon: MessageCircle,
    title: "Community",
    description: "Join the Fhenix community on Telegram and Discord for technical discussion and support.",
    link: "https://t.me/+rA9gI3AsW8c3YzIx",
    linkText: "Buildathon Telegram",
  },
];

const Resources = () => {
  return (
    <section id="resources" className="py-24 sm:py-32">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <p className="text-xs font-mono text-primary tracking-widest uppercase mb-3">
            Developer Resources
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4 tracking-tight">
            Build with Fhenix FHE
          </h2>
          <p className="text-sm text-muted-foreground max-w-lg mx-auto leading-relaxed">
            Everything you need to build confidential applications on the Fhenix encrypted ecosystem.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {resources.map((resource, i) => (
            <motion.a
              key={resource.title}
              href={resource.link}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 16, filter: "blur(4px)" }}
              whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ delay: i * 0.06, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="group flex flex-col p-5 rounded-xl border border-border bg-card hover:border-primary/20 transition-all duration-300 hover:shadow-glow cursor-pointer"
            >
              <div className="w-9 h-9 rounded-lg bg-primary/[0.08] flex items-center justify-center mb-4 group-hover:bg-primary/[0.12] transition-colors">
                <resource.icon className="w-4 h-4 text-primary" />
              </div>
              <h3 className="text-sm font-semibold text-foreground mb-1.5">
                {resource.title}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed mb-3 flex-1">
                {resource.description}
              </p>
              <div className="flex items-center gap-1.5 text-[11px] text-primary font-medium">
                {resource.linkText}
                <ExternalLink className="w-3 h-3" />
              </div>
            </motion.a>
          ))}
        </div>

        {/* CTA Banner */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-12 p-6 rounded-xl border border-border bg-card text-center"
        >
          <p className="text-sm text-muted-foreground mb-1 leading-relaxed">
            The next wave of protocols won't be built on transparent rails.
          </p>
          <p className="text-xs text-muted-foreground">
            They'll be built with selective disclosure, encrypted state, and privacy as a primitive — not a patch.
          </p>
          <div className="flex items-center justify-center gap-4 mt-4 text-[11px]">
            <a href="https://fhenix.io" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
              fhenix.io <ExternalLink className="w-2.5 h-2.5" />
            </a>
            <a href="https://x.com/fhenix" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
              @fhenix <ExternalLink className="w-2.5 h-2.5" />
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Resources;
