export interface Category {
  name: string
  subcategories: string[]
}

export const CATEGORIES: Record<string, Category> = {
  "Aluminum Profiles": {
    name: "Aluminum Profiles",
    subcategories: [
      "Window & Door Profiles",
      "Curtain Wall Profiles",
      "Industrial Profiles",
      "Decorative Profiles",
    ],
  },
  "Aluminum Sheets": {
    name: "Aluminum Sheets",
    subcategories: [
      "Plain Sheets",
      "Coated Sheets",
      "Composite Panels",
      "Corrugated Sheets",
    ],
  },
  "Glass Products": {
    name: "Glass Products",
    subcategories: [
      "Tempered Glass",
      "Laminated Glass",
      "Insulated Glass",
      "Decorative Glass",
    ],
  },
  "Hardware & Accessories": {
    name: "Hardware & Accessories",
    subcategories: [
      "Handles & Locks",
      "Hinges & Pivots",
      "Seals & Gaskets",
      "Screws & Fasteners",
    ],
  },
  "Steel Products": {
    name: "Steel Products",
    subcategories: [
      "Steel Beams",
      "Steel Pipes",
      "Steel Sheets",
      "Steel Reinforcement",
    ],
  },
  "Insulation Materials": {
    name: "Insulation Materials",
    subcategories: [
      "Thermal Insulation",
      "Sound Insulation",
      "Waterproofing",
      "Fire Protection",
    ],
  },
  "Tools & Equipment": {
    name: "Tools & Equipment",
    subcategories: [
      "Cutting Tools",
      "Assembly Tools",
      "Measuring Tools",
      "Safety Equipment",
    ],
  },
  "Raw Materials": {
    name: "Raw Materials",
    subcategories: [
      "Aluminum Billets",
      "Aluminum Ingots",
      "Aluminum Coils",
      "Recycled Aluminum",
    ],
  },
}

export const MAIN_CATEGORIES = Object.keys(CATEGORIES)

export function getSubcategories(mainCategory: string): string[] {
  return CATEGORIES[mainCategory]?.subcategories || []
}
