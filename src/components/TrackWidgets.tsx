"use client";

import { useState } from "react";
import { StarIcon, CopyIcon, CheckIcon } from "./icons";

/** Tap-to-rate stars (local state; persistence is a later step). */
export function RatingStars() {
  const [rating, setRating] = useState(0);
  return (
    <div className="flex items-center justify-center gap-1.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => setRating(n)}
          aria-label={`${n} star${n > 1 ? "s" : ""}`}
          className="transition active:scale-90"
        >
          <StarIcon
            size={32}
            className={n <= rating ? "fill-amber-400 text-amber-400" : "text-line"}
          />
        </button>
      ))}
    </div>
  );
}

/** Copy the delivery ID to clipboard. */
export function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard?.writeText(value).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        });
      }}
      aria-label="Copy delivery ID"
      className="text-white/70 transition hover:text-white"
    >
      {copied ? <CheckIcon size={16} /> : <CopyIcon size={16} />}
    </button>
  );
}
