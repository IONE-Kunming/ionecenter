"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

type PageTitleContextType = {
  pageTitle: string | null
  setPageTitle: (title: string | null) => void
}

const PageTitleContext = createContext<PageTitleContextType>({
  pageTitle: null,
  setPageTitle: () => {},
})

export function PageTitleProvider({ children }: { children: ReactNode }) {
  const [pageTitle, setPageTitle] = useState<string | null>(null)
  return (
    <PageTitleContext.Provider value={{ pageTitle, setPageTitle }}>
      {children}
    </PageTitleContext.Provider>
  )
}

export function usePageTitle() {
  return useContext(PageTitleContext)
}

/** Drop this component into any page to override the dashboard header title. */
export function SetPageTitle({ title }: { title: string }) {
  const { setPageTitle } = usePageTitle()
  useEffect(() => {
    setPageTitle(title)
    return () => setPageTitle(null)
  }, [title, setPageTitle])
  return null
}
