import type * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive cursor-pointer ",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-primary/90 text-sm",
        destructive:
          "bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60 text-sm",
        outline:
          "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 text-sm",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 text-sm",
        ghost:
          "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50 text-sm",
        link: "text-primary underline-offset-4 hover:underline text-sm",
        "gradient-dark-blue":
          "relative w-fit text-white font-jakarta overflow-hidden rounded-lg bg-[radial-gradient(114.65%_114.65%_at_9.73%_17.27%,#1e40af_0%,#1e3a8a_100%)] shadow-[0_20px_8px_rgba(30,64,175,0.08),0_10px_6px_rgba(30,64,175,0.12),0_4px_3px_rgba(30,64,175,0.1),inset_-2px_-2px_3px_rgba(59,130,246,0.2),inset_2px_2px_3px_rgba(25,51,150,0.08)] transition-all duration-100 ease-out hover:shadow-[0_20px_8px_rgba(30,64,175,0.1),0_10px_6px_rgba(30,64,175,0.14),0_4px_3px_rgba(30,64,175,0.12),inset_-2px_-2px_3px_rgba(59,130,246,0.25),inset_2px_2px_3px_rgba(25,51,150,0.1)] text-base px-6 py-3",
        "gradient-blue":
          "relative w-fit text-white font-jakarta overflow-hidden rounded-lg bg-[radial-gradient(114.65%_114.65%_at_9.73%_17.27%,#3b82f6_0%,#1e40af_100%)] shadow-[0_20px_8px_rgba(59,130,246,0.08),0_10px_6px_rgba(59,130,246,0.12),0_4px_3px_rgba(59,130,246,0.1),inset_-2px_-2px_3px_rgba(147,197,253,0.2),inset_2px_2px_3px_rgba(30,58,138,0.08)] transition-all duration-100 ease-out text-base px-6 py-3",
        "gradient-slate":
          "relative w-fit text-white font-jakarta overflow-hidden rounded-lg bg-[radial-gradient(114.65%_114.65%_at_9.73%_17.27%,#475569_0%,#1e293b_100%)] shadow-[0_20px_8px_rgba(71,85,105,0.08),0_10px_6px_rgba(71,85,105,0.12),0_4px_3px_rgba(71,85,105,0.1),inset_-2px_-2px_3px_rgba(203,213,225,0.2),inset_2px_2px_3px_rgba(15,23,42,0.08)] transition-all duration-100 ease-out text-base px-6 py-3",
      },
      size: {
        sm: "h-7 px-3 py-1.5 text-xs rounded text-xs has-[>svg]:px-2 space-x-1",
        md: "h-10 px-5 py-2.5 text-base rounded-md has-[>svg]:px-4", // added md size
        default: "h-9 px-4 py-2 text-sm rounded-md has-[>svg]:px-3",
        lg: "h-12 px-6 py-3 text-lg rounded-lg has-[>svg]:px-5",
        xl: "h-16 px-8 py-4 text-xl rounded-xl has-[>svg]:px-7",
        icon: "size-9 p-0 rounded-md justify-center items-center",
        "icon-sm": "size-7 p-0 rounded items-center justify-center",
        "icon-lg": "size-12 p-0 rounded-lg items-center justify-center",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export { Button, buttonVariants };
