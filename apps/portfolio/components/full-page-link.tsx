"use client";

import Link from "next/link";
import type { ComponentProps, MouseEvent } from "react";

type FullPageLinkProps = Omit<ComponentProps<typeof Link>, "href"> & { href: string };

export function FullPageLink({ href, onClick, target, ...props }: FullPageLinkProps) {
  return (
    <Link
      {...props}
      href={href}
      target={target}
      onClick={(event: MouseEvent<HTMLAnchorElement>) => {
        onClick?.(event);
        if (
          event.defaultPrevented ||
          event.button !== 0 ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey ||
          target === "_blank"
        ) {
          return;
        }
        event.preventDefault();
        window.location.assign(href);
      }}
    />
  );
}
