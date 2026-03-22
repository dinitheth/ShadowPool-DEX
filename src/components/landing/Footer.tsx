const Footer = () => {
  return (
    <footer className="border-t border-border py-6">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded gradient-primary flex items-center justify-center">
              <span className="text-[8px] font-bold text-primary-foreground">SP</span>
            </div>
            <span className="text-xs font-semibold text-foreground tracking-tight">
              Shadow<span className="text-primary">Pool</span>
            </span>
          </div>
          <div className="flex items-center gap-5 text-[11px] text-muted-foreground">
            <a href="https://github.com/FhenixProtocol" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">
              GitHub
            </a>
            <a href="https://cofhe-docs.fhenix.zone" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">
              Docs
            </a>
            <a href="https://discord.gg/fhenix" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">
              Discord
            </a>
            <a href="https://t.me/+rA9gI3AsW8c3YzIx" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">
              Telegram
            </a>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Built with Fhenix FHE
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
