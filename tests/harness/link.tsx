import type { AnchorHTMLAttributes, ReactNode } from 'react';

// Test stand-in for next/link: a normal anchor, so the browser does real navigation.
export default function Link({ href, children, ...rest }: { href: string; children?: ReactNode } & AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <a href={href} {...rest}>
      {children}
    </a>
  );
}
