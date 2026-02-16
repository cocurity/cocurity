import { ButtonHTMLAttributes, ReactNode } from "react";

type NeonButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: "primary" | "ghost";
};

export default function NeonButton({
  children,
  variant = "primary",
  className = "",
  ...props
}: NeonButtonProps) {
  const variantClass = variant === "primary" ? "lp-button-primary" : "lp-button-ghost";
  return (
    <button className={`lp-button ${variantClass} ${className}`.trim()} {...props}>
      {children}
    </button>
  );
}
