import React from "react"

interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string
  /** Accepted for API compatibility with next/link but ignored since standard anchor tags handle navigation natively */
  prefetch?: boolean
}

export default function Link({ href, prefetch: _prefetch, ...props }: LinkProps) {
  return <a href={href} {...props} />
}
