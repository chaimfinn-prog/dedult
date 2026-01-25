'use client';

import { motion } from 'framer-motion';
import { ShoppingCart, Sun, Moon, Menu, X, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { useBasket } from '@/context/BasketContext';

export function Header() {
  const { theme, toggleTheme } = useTheme();
  const { totalItems } = useBasket();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 100, damping: 20 }}
      className="sticky top-0 z-40 glass-card-strong mx-4 mt-4 px-4 py-3 md:px-6"
    >
      <div className="flex items-center justify-between">
        {/* Logo */}
        <motion.div
          className="flex items-center gap-2"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="relative">
            <motion.div
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-accent-dark flex items-center justify-center"
              whileHover={{ rotate: [0, -10, 10, 0] }}
              transition={{ duration: 0.5 }}
            >
              <Sparkles className="w-5 h-5 text-white" />
            </motion.div>
            <motion.div
              className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-success"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
            />
          </div>
          <div className="flex flex-col">
            <h1 className="text-xl font-bold bg-gradient-to-l from-accent to-accent-light bg-clip-text text-transparent">
              סלי AI
            </h1>
            <span className="text-[10px] text-foreground-secondary -mt-1">
              חוסכים בחכמה
            </span>
          </div>
        </motion.div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <NavLink href="#" active>
            סל קניות
          </NavLink>
          <NavLink href="#dashboard">לוח בקרה</NavLink>
          <NavLink href="#warroom">חדר מבצעים</NavLink>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {/* Theme Toggle */}
          <motion.button
            onClick={toggleTheme}
            className="w-10 h-10 rounded-xl glass-button flex items-center justify-center"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            aria-label={theme === 'dark' ? 'עבור למצב בהיר' : 'עבור למצב כהה'}
          >
            <motion.div
              initial={false}
              animate={{ rotate: theme === 'dark' ? 0 : 180 }}
              transition={{ duration: 0.3 }}
            >
              {theme === 'dark' ? (
                <Sun className="w-5 h-5 text-warning" />
              ) : (
                <Moon className="w-5 h-5 text-accent" />
              )}
            </motion.div>
          </motion.button>

          {/* Cart Button */}
          <motion.button
            className="relative w-10 h-10 rounded-xl glass-button flex items-center justify-center"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            aria-label="סל קניות"
          >
            <ShoppingCart className="w-5 h-5" />
            {totalItems > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -left-1 w-5 h-5 rounded-full bg-accent text-white text-xs font-bold flex items-center justify-center"
              >
                {totalItems}
              </motion.span>
            )}
          </motion.button>

          {/* Mobile Menu Toggle */}
          <motion.button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden w-10 h-10 rounded-xl glass-button flex items-center justify-center"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            aria-label="תפריט"
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </motion.button>
        </div>
      </div>

      {/* Mobile Navigation */}
      <motion.nav
        initial={false}
        animate={{
          height: menuOpen ? 'auto' : 0,
          opacity: menuOpen ? 1 : 0,
        }}
        className="md:hidden overflow-hidden"
      >
        <div className="flex flex-col gap-2 pt-4 border-t border-border mt-4">
          <MobileNavLink href="#" onClick={() => setMenuOpen(false)}>
            סל קניות
          </MobileNavLink>
          <MobileNavLink href="#dashboard" onClick={() => setMenuOpen(false)}>
            לוח בקרה
          </MobileNavLink>
          <MobileNavLink href="#warroom" onClick={() => setMenuOpen(false)}>
            חדר מבצעים
          </MobileNavLink>
        </div>
      </motion.nav>
    </motion.header>
  );
}

function NavLink({
  href,
  children,
  active = false,
}: {
  href: string;
  children: React.ReactNode;
  active?: boolean;
}) {
  return (
    <motion.a
      href={href}
      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
        active
          ? 'text-accent'
          : 'text-foreground-secondary hover:text-foreground'
      }`}
      whileHover={{ y: -2 }}
      whileTap={{ y: 0 }}
    >
      {children}
    </motion.a>
  );
}

function MobileNavLink({
  href,
  children,
  onClick,
}: {
  href: string;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <motion.a
      href={href}
      onClick={onClick}
      className="px-4 py-3 rounded-lg font-medium text-foreground-secondary hover:text-foreground hover:bg-border/50 transition-colors"
      whileTap={{ scale: 0.98 }}
    >
      {children}
    </motion.a>
  );
}
