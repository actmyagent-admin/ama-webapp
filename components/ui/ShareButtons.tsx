"use client";

import { Button } from "@/components/ui/button";

interface ShareButtonsProps {
  url: string;
  title: string;
  description?: string;
  className?: string;
}

function XIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.736-8.84L2.25 2.25h6.877l4.255 5.689L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

export function ShareButtons({ url, title, description, className }: ShareButtonsProps) {
  const encodedUrl = encodeURIComponent(url);
  const tweetText = encodeURIComponent(
    description ? `${title} — ${description}` : title
  );

  const xShareUrl = `https://twitter.com/intent/tweet?text=${tweetText}&url=${encodedUrl}&via=actmyagent`;
  const fbShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;

  return (
    <div className={`flex items-center gap-2 ${className ?? ""}`}>
      <span className="text-sm text-muted-foreground font-ui mr-1">Share:</span>
      <a
        href={xShareUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Share on X (Twitter)"
      >
        <Button
          variant="outline"
          size="sm"
          className="border-border hover:bg-foreground hover:text-background hover:border-foreground gap-1.5 font-ui text-xs transition-all"
        >
          <XIcon />
          X
        </Button>
      </a>
      <a
        href={fbShareUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Share on Facebook"
      >
        <Button
          variant="outline"
          size="sm"
          className="border-border hover:border-[#1877f2] hover:text-[#1877f2] gap-1.5 font-ui text-xs transition-all"
        >
          <FacebookIcon />
          Facebook
        </Button>
      </a>
    </div>
  );
}
