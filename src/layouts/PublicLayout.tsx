import React from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';
import { Package, Menu, X, ChevronRight, Globe, Github, Twitter, Linkedin, ArrowLeft, Facebook, Instagram } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useSettings } from '@/src/context/SettingsContext';
import { BrandLogo } from '@/src/components/brand/BrandLogo';

interface NavLinkProps {
  to: string;
  children: React.ReactNode;
}

const PublicNavLink = ({ to, children }: NavLinkProps) => (
  <NavLink
    to={to}
    className={({ isActive }) => cn(
      "text-sm font-semibold transition-colors duration-200",
      isActive
        ? "text-primary-600 dark:text-primary-400"
        : "text-slate-600 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400"
    )}
  >
    {children}
  </NavLink>
);

export const PublicLayout = ({ children }: { children: React.ReactNode }) => {
  const { settings } = useSettings();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const brandName = settings?.platformName || 'WeSabiHub';
  const logoUrl = settings?.branding?.logoUrl;
  const countryName = settings?.countryConfig?.defaultCountry || 'Nigeria';

  const footerLinksByCategory = (category: string) => {
    return settings?.footer?.links
      ?.filter(link => link.category === category && link.enabled)
      ?.sort((a, b) => a.order - b.order) || [];
  };

  // Close menu on route change
  React.useEffect(() => {
    setIsMenuOpen(false);
  }, [location]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <BrandLogo size={40} />
            <span className="text-xl font-bold font-display tracking-tight text-slate-900 dark:text-white">{brandName}</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-8">
            <PublicNavLink to="/how-it-works">How It Works</PublicNavLink>
            <PublicNavLink to="/safepay">SafePay</PublicNavLink>
            <PublicNavLink to="/find-center">Find Center</PublicNavLink>
            <PublicNavLink to="/merchants">Merchants</PublicNavLink>
            <PublicNavLink to="/centers">Become a Hub</PublicNavLink>
            {/* PAUSED: dispatch/rider self-signup. Restore by uncommenting.
            <PublicNavLink to="/become-dispatch-partner">Become a Rider</PublicNavLink>
            */}
            <PublicNavLink to="/pricing">Pricing</PublicNavLink>
            <PublicNavLink to="/contact">Contact</PublicNavLink>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 pr-4 border-r border-slate-200 dark:border-slate-800">
              <Button variant="text" size="sm" asChild>
                <Link to="/login">Sign In</Link>
              </Button>
            </div>
            <Button size="sm" className="hidden sm:inline-flex" asChild>
              <Link to="/register">Get Started</Link>
            </Button>

            <button
              className="lg:hidden p-2 text-slate-600 dark:text-slate-400"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 overflow-hidden"
          >
            <div className="px-4 py-8 space-y-6">
              <div className="grid gap-4">
                <Link to="/how-it-works" className="text-lg font-bold text-slate-900 dark:text-white">How It Works</Link>
                <Link to="/safepay" className="text-lg font-bold text-slate-900 dark:text-white">SafePay</Link>
                <Link to="/find-center" className="text-lg font-bold text-slate-900 dark:text-white">Find Center</Link>
                <Link to="/merchants" className="text-lg font-bold text-slate-900 dark:text-white">Merchant Solutions</Link>
                <Link to="/centers" className="text-lg font-bold text-slate-900 dark:text-white">Become a Hub</Link>
                {/* PAUSED: <Link to="/become-dispatch-partner" className="text-lg font-bold text-slate-900 dark:text-white">Become a Rider</Link> */}
                <Link to="/pricing" className="text-lg font-bold text-slate-900 dark:text-white">Pricing</Link>
                <Link to="/contact" className="text-lg font-bold text-slate-900 dark:text-white">Contact</Link>
              </div>
              <div className="pt-6 border-t border-slate-100 dark:border-slate-900 flex flex-col gap-4">
                <Button variant="outline" className="w-full" asChild>
                  <Link to="/login">Sign In</Link>
                </Button>
                <Button className="w-full" asChild>
                  <Link to="/register">Get Started</Link>
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1">
        {location.pathname !== '/' && (
          <div className="max-w-7xl mx-auto px-4 pt-6 -mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 rounded-xl text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
          </div>
        )}
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 pt-20 pb-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <BrandLogo size={32} />
                <span className="text-2xl font-bold font-display dark:text-white tracking-tight">{brandName}</span>
              </div>
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                {settings?.footer?.aboutText || `${countryName}'s trusted Pick-Up & Drop-Off (PUDO) network connecting millions across the nation through verified neighborhood centers.`}
              </p>
              <div className="flex items-center gap-4">
                {settings?.socialLinks?.twitter && (
                  <a href={settings.socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-400 hover:text-primary-600 transition-colors">
                    <Twitter className="w-5 h-5" />
                  </a>
                )}
                {settings?.socialLinks?.linkedin && (
                  <a href={settings.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-400 hover:text-primary-600 transition-colors">
                    <Linkedin className="w-5 h-5" />
                  </a>
                )}
                {settings?.socialLinks?.facebook && (
                  <a href={settings.socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-400 hover:text-primary-600 transition-colors">
                    <Facebook className="w-5 h-5" />
                  </a>
                )}
                {settings?.socialLinks?.instagram && (
                  <a href={settings.socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-400 hover:text-primary-600 transition-colors">
                    <Instagram className="w-5 h-5" />
                  </a>
                )}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-widest mb-6">Company</h4>
              <ul className="space-y-4">
                {footerLinksByCategory('COMPANY').map(link => (
                  <li key={link.id}>
                    <Link to={link.href} className="text-slate-500 hover:text-primary-600 transition-colors">{link.label}</Link>
                  </li>
                ))}
                {footerLinksByCategory('COMPANY').length === 0 && (
                  <>
                    <li><Link to="/about" className="text-slate-500 hover:text-primary-600 transition-colors">About Us</Link></li>
                    <li><Link to="/how-it-works" className="text-slate-500 hover:text-primary-600 transition-colors">How It Works</Link></li>
                  </>
                )}
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-widest mb-6">Solutions</h4>
              <ul className="space-y-4">
                {footerLinksByCategory('SOLUTIONS').map(link => (
                  <li key={link.id}>
                    <Link to={link.href} className="text-slate-500 hover:text-primary-600 transition-colors">{link.label}</Link>
                  </li>
                ))}
                {footerLinksByCategory('SOLUTIONS').length === 0 && (
                  <>
                    <li><Link to="/merchants" className="text-slate-500 hover:text-primary-600 transition-colors">For Merchants</Link></li>
                    <li><Link to="/safepay" className="text-slate-500 hover:text-primary-600 transition-colors">SafePay</Link></li>
                    <li><Link to="/centers" className="text-slate-500 hover:text-primary-600 transition-colors">Become a Hub</Link></li>
                    {/* PAUSED: WeSabiDispatch / dispatch partner recruiting links */}
                  </>
                )}
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-widest mb-6">Support & Legal</h4>
              <ul className="space-y-4">
                {[...footerLinksByCategory('SUPPORT'), ...footerLinksByCategory('LEGAL')].map(link => (
                  <li key={link.id}>
                    <Link to={link.href} className="text-slate-500 hover:text-primary-600 transition-colors">{link.label}</Link>
                  </li>
                ))}
                {[...footerLinksByCategory('SUPPORT'), ...footerLinksByCategory('LEGAL')].length === 0 && (
                  <>
                    <li><Link to="/contact" className="text-slate-500 hover:text-primary-600 transition-colors">Contact Us</Link></li>
                    <li><Link to="/privacy" className="text-slate-500 hover:text-primary-600 transition-colors">Privacy Policy</Link></li>
                    <li><Link to="/faq?category=dispatch" className="text-slate-500 hover:text-primary-600 transition-colors">Dispatch FAQ</Link></li>
                    <li><Link to="/contact?subject=dispatch" className="text-slate-500 hover:text-primary-600 transition-colors">Dispatch Support</Link></li>
                  </>
                )}
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2">
              <p className="text-sm text-slate-500">
                {settings?.footer?.copyrightNotice || `© ${new Date().getFullYear()} ${brandName}. All rights reserved.`}
              </p>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400">
                <img src="/assets/brand/omorfi-logo.png" onError={(e) => { e.currentTarget.style.display = 'none'; }} alt="Omorfi Logo" className="h-4 w-4 object-contain inline-block" />
                <span>WeSabiHub is a product of Omorfi Limited</span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-slate-500 text-sm">
              <Globe className="w-4 h-4" />
              <span>Available in {countryName}</span>
              <span className="w-1 h-1 bg-slate-300 rounded-full mx-1" />
              <span className="text-slate-400">Expanding globally</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
