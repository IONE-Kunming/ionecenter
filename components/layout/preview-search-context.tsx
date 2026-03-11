"use client"

import { createContext, useContext, useState, useCallback, type ReactNode } from "react"

interface PreviewSearchContextType {
  /** Current search query shared between header and preview page */
  search: string
  setSearch: (q: string) => void
  /** Whether the preview page is currently active */
  isPreviewPage: boolean
  registerPreviewPage: () => void
  unregisterPreviewPage: () => void
}

const PreviewSearchContext = createContext<PreviewSearchContextType>({
  search: "",
  setSearch: () => {},
  isPreviewPage: false,
  registerPreviewPage: () => {},
  unregisterPreviewPage: () => {},
})

export function PreviewSearchProvider({ children }: { children: ReactNode }) {
  const [search, setSearch] = useState("")
  const [isPreviewPage, setIsPreviewPage] = useState(false)

  const registerPreviewPage = useCallback(() => {
    setIsPreviewPage(true)
  }, [])

  const unregisterPreviewPage = useCallback(() => {
    setIsPreviewPage(false)
    setSearch("")
  }, [])

  return (
    <PreviewSearchContext.Provider
      value={{
        search,
        setSearch,
        isPreviewPage,
        registerPreviewPage,
        unregisterPreviewPage,
      }}
    >
      {children}
    </PreviewSearchContext.Provider>
  )
}

export function usePreviewSearch() {
  return useContext(PreviewSearchContext)
}
