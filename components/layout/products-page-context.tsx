"use client"

import { createContext, useContext, useState, useCallback, type ReactNode } from "react"

interface SearchableProduct {
  id: string
  name: string
  model_number: string
  category: string
  description?: string | null
  image_url?: string | null
}

interface ProductsPageHeaderContextType {
  /** Current search query shared between header and products page */
  search: string
  setSearch: (q: string) => void
  /** Products for the dropdown search results */
  products: SearchableProduct[]
  /** Register products from the page component */
  registerProducts: (products: SearchableProduct[]) => void
  /** Unregister products (called on unmount) */
  unregisterProducts: () => void
  /** Callback to open the Add Product modal */
  onAddProduct: (() => void) | null
  setOnAddProduct: (fn: (() => void) | null) => void
  /** Callback to open the Bulk Import modal */
  onBulkImport: (() => void) | null
  setOnBulkImport: (fn: (() => void) | null) => void
  /** Callback when a product is clicked in the dropdown */
  onProductClick: ((productId: string) => void) | null
  setOnProductClick: (fn: ((productId: string) => void) | null) => void
  /** Whether the products page has registered (controls header rendering) */
  isProductsPage: boolean
}

const ProductsPageHeaderContext = createContext<ProductsPageHeaderContextType>({
  search: "",
  setSearch: () => {},
  products: [],
  registerProducts: () => {},
  unregisterProducts: () => {},
  onAddProduct: null,
  setOnAddProduct: () => {},
  onBulkImport: null,
  setOnBulkImport: () => {},
  onProductClick: null,
  setOnProductClick: () => {},
  isProductsPage: false,
})

export function ProductsPageHeaderProvider({ children }: { children: ReactNode }) {
  const [search, setSearch] = useState("")
  const [products, setProducts] = useState<SearchableProduct[]>([])
  const [onAddProduct, setOnAddProductState] = useState<(() => void) | null>(null)
  const [onBulkImport, setOnBulkImportState] = useState<(() => void) | null>(null)
  const [onProductClick, setOnProductClickState] = useState<((productId: string) => void) | null>(null)
  const [isProductsPage, setIsProductsPage] = useState(false)

  const registerProducts = useCallback((prods: SearchableProduct[]) => {
    setProducts(prods)
    setIsProductsPage(true)
  }, [])

  const unregisterProducts = useCallback(() => {
    setProducts([])
    setIsProductsPage(false)
    setSearch("")
  }, [])

  const setOnAddProduct = useCallback((fn: (() => void) | null) => {
    setOnAddProductState(() => fn)
  }, [])

  const setOnBulkImport = useCallback((fn: (() => void) | null) => {
    setOnBulkImportState(() => fn)
  }, [])

  const setOnProductClick = useCallback((fn: ((productId: string) => void) | null) => {
    setOnProductClickState(() => fn)
  }, [])

  return (
    <ProductsPageHeaderContext.Provider
      value={{
        search,
        setSearch,
        products,
        registerProducts,
        unregisterProducts,
        onAddProduct,
        setOnAddProduct,
        onBulkImport,
        setOnBulkImport,
        onProductClick,
        setOnProductClick,
        isProductsPage,
      }}
    >
      {children}
    </ProductsPageHeaderContext.Provider>
  )
}

export function useProductsPageHeader() {
  return useContext(ProductsPageHeaderContext)
}
