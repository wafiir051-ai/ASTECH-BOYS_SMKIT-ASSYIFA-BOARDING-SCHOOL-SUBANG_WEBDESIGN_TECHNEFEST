import { cn } from "@/lib/utils";
import PropTypes from "prop-types"; // 1. WAJIB IMPORT INI

// 1. COMPONENT: NOOMO CARD
export function NoomoCard({ children, className, dark = false, ...props }) {
  return (
    <div
      className={cn(
        "border transition-all duration-200",
        dark 
          ? "bg-navy text-white border-lavender/20 hover:border-lavender/40" 
          : "bg-white text-foreground border-border hover:border-lavender",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

// Validasi ESLint untuk NoomoCard
NoomoCard.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string,
  dark: PropTypes.bool,
};

// 2. COMPONENT: NOOMO BADGE
export function NoomoBadge({ children, variant = "default", className, ...props }) {
  const variants = {
    default: "bg-lavender text-navy",
    accent: "bg-vibrant-blue text-white",
    success: "bg-emerald-100 text-emerald-800",
    warning: "bg-amber-100 text-amber-800",
    danger: "bg-red-100 text-red-800",
    ghost: "bg-white/10 text-white border border-white/20",
  };

  return (
    <span 
      className={cn(
        "inline-flex items-center px-3 py-1 rounded-full text-xs font-editorial",
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

// Validasi ESLint untuk NoomoBadge
NoomoBadge.propTypes = {
  children: PropTypes.node,
  variant: PropTypes.string,
  className: PropTypes.string,
};

// 3. COMPONENT: NOOMO BUTTON
export function NoomoButton({ children, variant = "primary", className, ...props }) {
  const variants = {
    primary: "bg-navy text-white hover:bg-[#0F0D15] active:scale-[0.98]",
    secondary: "bg-transparent text-vibrant-blue border border-vibrant-blue hover:bg-vibrant-blue/10",
    ghost: "bg-transparent text-foreground border-b border-foreground hover:border-vibrant-blue hover:text-vibrant-blue",
    danger: "bg-destructive text-white hover:bg-red-700",
  };

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 h-11 px-6 rounded-full text-xs font-semibold uppercase tracking-widest transition-all duration-200",
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

// Validasi ESLint untuk NoomoButton
NoomoButton.propTypes = {
  children: PropTypes.node,
  variant: PropTypes.string,
  className: PropTypes.string,
};