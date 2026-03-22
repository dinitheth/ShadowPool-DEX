import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Wallet, Loader2, AlertCircle, Droplets } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAccount, useConnect, useDisconnect, useSwitchChain } from "wagmi";
import { sepolia } from "wagmi/chains";
import { useClaimFaucet, useFaucetCooldown } from "@/hooks/useFhenix";

const navLinks = [
  { label: "Platform", href: "/#features" },
  { label: "How It Works", href: "/#how-it-works" },
  { label: "Security", href: "/#security" },
];

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const isDashboard = location.pathname === "/dashboard";

  const { address, isConnected, chain } = useAccount();
  const { connect, connectors, isPending: isConnecting } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();

  const isWrongNetwork = isConnected && chain?.id !== sepolia.id;

  // Faucet
  const { claimFaucet, isPending: isFaucetPending, isSuccess: faucetSuccess } = useClaimFaucet(address);
  const { data: cooldownRaw, refetch: refetchCooldown } = useFaucetCooldown(address);
  const cooldownSeconds = cooldownRaw ? Number(cooldownRaw) : 0;
  const canClaim = cooldownSeconds === 0;

  const [cooldownDisplay, setCooldownDisplay] = useState("");

  // Refresh cooldown display every second
  useEffect(() => {
    if (cooldownSeconds <= 0) {
      setCooldownDisplay("");
      return;
    }
    const h = Math.floor(cooldownSeconds / 3600);
    const m = Math.floor((cooldownSeconds % 3600) / 60);
    setCooldownDisplay(`${h}h ${m}m`);
  }, [cooldownSeconds]);

  // Refetch cooldown after successful claim
  useEffect(() => {
    if (faucetSuccess) {
      setTimeout(() => refetchCooldown(), 3000);
    }
  }, [faucetSuccess, refetchCooldown]);

  const handleFaucet = async () => {
    try {
      await claimFaucet();
    } catch (err) {
      console.error("Faucet claim failed:", err);
    }
  };

  const handleConnect = async () => {
    if (isConnected) {
      disconnect();
      return;
    }
    const injectedConnector = connectors.find((c) => c.id === "injected") || connectors[0];
    if (injectedConnector) {
      connect({ connector: injectedConnector });
    }
  };

  const handleSwitchNetwork = () => {
    switchChain({ chainId: sepolia.id });
  };

  const truncatedAddress = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : "";

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-panel border-b border-border">
      <div className="max-w-[1600px] mx-auto px-3 sm:px-4">
        <div className="flex items-center justify-between h-12">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md gradient-primary flex items-center justify-center">
              <span className="text-[10px] font-bold text-primary-foreground">SP</span>
            </div>
            <span className="text-sm font-semibold text-foreground tracking-tight">
              Shadow<span className="text-primary">Pool</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-5">
            {!isDashboard &&
              navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  target={link.external ? "_blank" : undefined}
                  rel={link.external ? "noopener noreferrer" : undefined}
                  className="text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                >
                  {link.label}
                </a>
              ))}
          </div>

          <div className="hidden md:flex items-center gap-2">
            {isDashboard && (
              <>
                {isWrongNetwork ? (
                  <Button
                    size="sm"
                    onClick={handleSwitchNetwork}
                    className="text-[10px] h-7 px-3 gap-1 bg-destructive/10 text-destructive hover:bg-destructive/20 border border-destructive/20 rounded-full"
                  >
                    <AlertCircle className="w-3 h-3" />
                    Switch to Sepolia
                  </Button>
                ) : isConnected ? (
                  <div className="flex items-center gap-1.5 mr-1">
                    <div className="pulse-dot" />
                    <span className="text-[10px] font-mono text-muted-foreground">
                      Sepolia
                    </span>
                  </div>
                ) : null}

                {/* USDC Faucet Button */}
                {isConnected && !isWrongNetwork && (
                  <Button
                    size="sm"
                    onClick={handleFaucet}
                    disabled={isFaucetPending || !canClaim}
                    className="text-[10px] h-7 px-3 gap-1 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/20 rounded-full font-medium"
                    title={canClaim ? "Claim 10,000 EUSDC" : `Cooldown: ${cooldownDisplay}`}
                  >
                    {isFaucetPending ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Droplets className="w-3 h-3" />
                    )}
                    {isFaucetPending
                      ? "Claiming..."
                      : canClaim
                      ? "Faucet 10K USDC"
                      : `Wait ${cooldownDisplay}`}
                  </Button>
                )}

                <Button
                  size="sm"
                  onClick={handleConnect}
                  disabled={isConnecting}
                  variant={isConnected ? "outline" : "default"}
                  className={`text-[11px] h-7 px-3 gap-1.5 font-medium rounded-full ${
                    isConnected
                      ? "border-buy/30 text-buy hover:bg-buy/10"
                      : "gradient-primary text-primary-foreground hover:opacity-90"
                  }`}
                >
                  {isConnecting ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Wallet className="w-3 h-3" />
                  )}
                  {isConnecting
                    ? "Connecting..."
                    : isConnected
                    ? truncatedAddress
                    : "Connect Wallet"}
                </Button>
              </>
            )}

            {!isDashboard && (
              <Link to="/dashboard">
                <Button
                  size="sm"
                  className="gradient-primary text-primary-foreground font-medium text-[11px] h-7 px-4 hover:opacity-90 transition-opacity rounded-full"
                >
                  Launch App
                </Button>
              </Link>
            )}
          </div>

          <button
            className="md:hidden text-foreground"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-card">
          <div className="px-4 py-3 space-y-2">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                target={link.external ? "_blank" : undefined}
                className="block text-sm text-muted-foreground hover:text-foreground py-1.5"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <div className="pt-2 space-y-2">
              {isDashboard && isConnected && !isWrongNetwork && (
                <Button
                  size="sm"
                  onClick={handleFaucet}
                  disabled={isFaucetPending || !canClaim}
                  className="w-full text-[11px] h-8 gap-1.5 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/20 rounded-full"
                >
                  <Droplets className="w-3.5 h-3.5" />
                  {canClaim ? "Claim 10K USDC" : `Wait ${cooldownDisplay}`}
                </Button>
              )}
              {isDashboard ? (
                <Button
                  size="sm"
                  onClick={handleConnect}
                  disabled={isConnecting}
                  className="w-full gradient-primary text-primary-foreground font-medium gap-1.5 rounded-full"
                >
                  <Wallet className="w-3.5 h-3.5" />
                  {isConnected ? truncatedAddress : "Connect Wallet"}
                </Button>
              ) : (
                <Link to="/dashboard" onClick={() => setMobileOpen(false)}>
                  <Button size="sm" className="w-full gradient-primary text-primary-foreground font-medium rounded-full">
                    Launch App
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
