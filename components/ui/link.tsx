import React from "react"

interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string
  prefetch?: boolean
}

export default function Link({ href, prefetch: _prefetch, ...props }: LinkProps) {
  return <a href={href} {...props} />
}
