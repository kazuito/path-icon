"use client";

import { Check, Copy } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";

export function InstallCommand({ cmd }: { cmd: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (copied) return;
    try {
      await navigator.clipboard.writeText(cmd);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      // ignore — clipboard may be unavailable
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={copied ? "Copied" : `Copy "${cmd}" to clipboard`}
      className="flex w-fit items-center gap-2 rounded-lg border border-border bg-card/40 ps-3 pe-2 py-1 text-foreground/90 cursor-copy"
    >
      <div className="flex items-center gap-3">
        <span className="text-muted-foreground/50 select-none">$</span>
        <code className="flex-1">{cmd}</code>
      </div>

      <div className="relative size-8 text-muted-foreground">
        <AnimatePresence mode="popLayout" initial={false}>
          {copied ? (
            <motion.span
              key="check"
              initial={{ scale: 0.9, opacity: 0, rotate: -10 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              exit={{ scale: 0.9, opacity: 0, rotate: 20 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <Check className="size-4" strokeWidth={3} />
            </motion.span>
          ) : (
            <motion.span
              key="copy"
              initial={{ scale: 0.9, opacity: 0, rotate: -10 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              exit={{ scale: 0.9, opacity: 0, rotate: 20 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <Copy className="size-3.5" strokeWidth={2.4} />
            </motion.span>
          )}
        </AnimatePresence>
      </div>
    </button>
  );
}
