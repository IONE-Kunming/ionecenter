"use client"

import { createContext, useContext, useState, useCallback, type ReactNode } from "react"

interface CategoriesSearchContextType {
  /** Current search query shared between header and categories page */
  search: string
  setSearch: (q: string) => void
  /** Whether the categories page is currently active */
  isCategoriesPage: boolean
  registerCategoriesPage: () => void
  unregisterCategoriesPage: () => void
}

const CategoriesSearchContext = createContext<CategoriesSearchContextType>({
  search: "",
  setSearch: () => {},
  isCategoriesPage: false,
  registerCategoriesPage: () => {},
  unregisterCategoriesPage: () => {},
})

export function CategoriesSearchProvider({ children }: { children: ReactNode }) {
  const [search, setSearch] = useState("")
  const [isCategoriesPage, setIsCategoriesPage] = useState(false)

  const registerCategoriesPage = useCallback(() => {
    setIsCategoriesPage(true)
  }, [])

  const unregisterCategoriesPage = useCallback(() => {
    setIsCategoriesPage(false)
    setSearch("")
  }, [])

  return (
    <CategoriesSearchContext.Provider
      value={{
        search,
        setSearch,
        isCategoriesPage,
        registerCategoriesPage,
        unregisterCategoriesPage,
      }}
    >
      {children}
    </CategoriesSearchContext.Provider>
  )
}

export function useCategoriesSearch() {
  return useContext(CategoriesSearchContext)
}
