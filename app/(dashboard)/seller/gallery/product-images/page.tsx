import { getSellerProductsWithImages } from "@/lib/actions/product-images"
import { ProductImagesClient } from "./product-images-client"

export default async function ProductImagesPage() {
  const products = await getSellerProductsWithImages()
  return <ProductImagesClient initialProducts={products} />
}
