import Navbar from "@/components/layout/Navbar";
import Hero from "@/components/landing/Hero";
import Features from "@/components/landing/Features";
import HowItWorks from "@/components/landing/HowItWorks";
import Security from "@/components/landing/Security";
import Footer from "@/components/landing/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Hero />
      <div className="glow-line" />
      <Features />
      <div className="glow-line" />
      <HowItWorks />
      <div className="glow-line" />
      <Security />
      <Footer />
    </div>
  );
};

export default Index;
