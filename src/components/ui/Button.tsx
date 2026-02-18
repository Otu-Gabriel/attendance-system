import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "md", ...props }, ref) => {
    return (
      <button
        className={cn(
          "inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none",
          {
            "bg-[#2563EB] text-white hover:bg-[#1E40AF] focus:ring-[#3B82F6] dark:bg-[#3B82F6] dark:hover:bg-[#2563EB] dark:focus:ring-[#60A5FA]":
              variant === "default",
            "border border-[#E2E8F0] bg-white text-[#0F172A] hover:bg-[#F8FAFC] focus:ring-[#2563EB] dark:border-[#334155] dark:bg-[#1E293B] dark:text-[#F1F5F9] dark:hover:bg-[#334155]":
              variant === "outline",
            "text-[#475569] hover:bg-[#F1F5F9] focus:ring-[#2563EB] dark:text-[#CBD5E1] dark:hover:bg-[#334155]":
              variant === "ghost",
            "bg-[#EF4444] text-white hover:bg-[#DC2626] focus:ring-[#F87171]":
              variant === "danger",
            "px-3 py-1.5 text-sm": size === "sm",
            "px-4 py-2 text-base": size === "md",
            "px-6 py-3 text-lg": size === "lg",
          },
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";

export default Button;
