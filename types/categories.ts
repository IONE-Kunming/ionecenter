export interface Category {
  name: string
  subcategories: string[]
}

// Category Hierarchy Configuration
// Defines the structure of main categories and their subcategories
export const CATEGORIES: Record<string, Category> = {
  "Construction": {
    name: "Construction",
    subcategories: [
      "Exterior Gates",
      "Fences",
      "Balustrades",
      "Barrier Systems",
      "Fencing",
      "Handrails",
      "Gates",
      "Railings",
      "Screens",
      "Partitions",
      "Aluminum",
      "Steel",
      "Glass",
      "Concrete",
      "Tools",
      "Equipment",
      "Hardware",
      "Electrical",
      "Plumbing",
      "Paint",
      "Wood",
    ],
  },
  "Apparel & Accessories": {
    name: "Apparel & Accessories",
    subcategories: [
      "Jewelry",
      "Watches & Eyewear",
      "Bags & Wallets",
      "Scarves & Shawls",
      "Belts",
      "Headwear",
      "Gloves",
      "Footwear Accessories",
      "Ties & Bow Ties",
      "Men's Clothing",
      "Women's Clothing",
      "Children's Clothing",
      "Activewear",
      "Formal Wear",
      "Traditional Wear",
    ],
  },
  "Automobiles & Motorcycles": {
    name: "Automobiles & Motorcycles",
    subcategories: [
      "Engine Components",
      "Transmission & Drivetrain",
      "Suspension & Steering",
      "Brake Systems",
      "Electrical & Ignition",
      "Exhaust & Emissions",
      "Cooling Systems",
      "Fuel Systems",
      "Body Parts & Accessories",
      "Wheels & Tires",
      "Lighting & Lamps",
      "Interior Accessories",
      "Motorcycle Parts",
    ],
  },
  "Business Services": {
    name: "Business Services",
    subcategories: [
      "Consulting & Advisory",
      "IT Consulting",
      "Financial Advisory",
      "HR Consulting",
      "Legal Services",
      "Accounting & Auditing",
      "Marketing Services",
      "Design & Engineering",
      "Cloud Computing",
      "Cybersecurity",
      "Recruitment & Staffing",
      "Business Process Outsourcing",
      "Data Analytics",
    ],
  },
  "Chemicals": {
    name: "Chemicals",
    subcategories: [
      "Industrial Chemicals",
      "Organic Chemicals",
      "Inorganic Chemicals",
      "Petrochemicals",
      "Agricultural Chemicals",
      "Specialty Chemicals",
      "Adhesives & Sealants",
      "Paints & Coatings",
      "Cleaning Chemicals",
      "Laboratory Chemicals",
    ],
  },
  "Computer Products & Office Electronics": {
    name: "Computer Products & Office Electronics",
    subcategories: [
      "Desktop Computers",
      "Laptops",
      "Tablets",
      "Computer Accessories",
      "Monitors",
      "Printers & Scanners",
      "Keyboards & Mice",
      "External Storage",
      "Networking Equipment",
      "Office Phones",
      "Projectors",
      "Office Furniture",
    ],
  },
  "Consumer Electronics": {
    name: "Consumer Electronics",
    subcategories: [
      "Smartphones",
      "Audio Equipment",
      "Video Equipment",
      "Gaming Devices",
      "Smart Home Devices",
      "Wearables",
      "Cameras",
      "Headphones & Earbuds",
      "Speakers",
      "TVs",
      "Streaming Devices",
      "VR Headsets",
    ],
  },
  "Electrical Equipment & Supplies": {
    name: "Electrical Equipment & Supplies",
    subcategories: [
      "Wiring & Cables",
      "Circuit Breakers",
      "Switches & Sockets",
      "Transformers",
      "Motors & Generators",
      "Power Distribution",
      "Batteries",
      "Solar Equipment",
      "Electrical Tools",
      "Safety Equipment",
    ],
  },
  "Electronics Components & Supplies": {
    name: "Electronics Components & Supplies",
    subcategories: [
      "Semiconductors",
      "Integrated Circuits",
      "Capacitors",
      "Resistors",
      "Connectors",
      "Sensors",
      "PCB Boards",
      "Displays",
      "Modules",
      "Passive Components",
    ],
  },
  "Energy": {
    name: "Energy",
    subcategories: [
      "Solar Energy",
      "Wind Energy",
      "Hydroelectric",
      "Generators",
      "Power Plants",
      "Energy Storage",
      "Fuel Cells",
      "Batteries",
      "Renewable Energy",
      "Energy Management",
    ],
  },
  "Environment": {
    name: "Environment",
    subcategories: [
      "Water Treatment",
      "Air Purification",
      "Waste Management",
      "Recycling Equipment",
      "Pollution Control",
      "Environmental Testing",
      "Renewable Resources",
      "Conservation Equipment",
      "Eco-friendly Products",
      "Sustainability Solutions",
    ],
  },
  "Food & Beverage": {
    name: "Food & Beverage",
    subcategories: [
      "Fresh Food",
      "Processed Food",
      "Beverages",
      "Snacks & Confectionery",
      "Dairy Products",
      "Meat & Seafood",
      "Bakery Products",
      "Food Ingredients",
      "Food Processing Equipment",
      "Packaging",
    ],
  },
  "Furniture": {
    name: "Furniture",
    subcategories: [
      "Living Room Furniture",
      "Bedroom Furniture",
      "Dining Room Furniture",
      "Office Furniture",
      "Outdoor Furniture",
      "Kitchen Furniture",
      "Children Furniture",
      "Commercial Furniture",
      "Antique Furniture",
      "Custom Furniture",
    ],
  },
  "Gifts, Sports & Toys": {
    name: "Gifts, Sports & Toys",
    subcategories: [
      "Action Figures",
      "Educational Toys",
      "Outdoor Play Equipment",
      "Sports Equipment",
      "Fitness Equipment",
      "Board Games",
      "Puzzles",
      "Gift Items",
      "Party Supplies",
      "Crafts & Hobbies",
    ],
  },
  "Hardware": {
    name: "Hardware",
    subcategories: [
      "Hand Tools",
      "Power Tools",
      "Fasteners",
      "Locks & Keys",
      "Hinges",
      "Door Hardware",
      "Window Hardware",
      "Cabinet Hardware",
      "Building Hardware",
      "Tool Storage",
    ],
  },
  "Health & Beauty": {
    name: "Health & Beauty",
    subcategories: [
      "Skincare",
      "Hair Care",
      "Makeup & Cosmetics",
      "Fragrances",
      "Personal Care",
      "Health Supplements",
      "Medical Devices",
      "Fitness & Wellness",
      "Oral Care",
      "Beauty Tools",
    ],
  },
  "Home & Garden": {
    name: "Home & Garden",
    subcategories: [
      "Garden Furniture",
      "Outdoor Decor",
      "Gardening Tools",
      "Plants & Seeds",
      "Lawn Care",
      "Grills & Outdoor Cooking",
      "Fire Pits",
      "Sheds & Storage",
      "Pools & Spas",
      "Greenhouses",
    ],
  },
  "Home Appliances": {
    name: "Home Appliances",
    subcategories: [
      "Kitchen Appliances",
      "Laundry Appliances",
      "Refrigerators & Freezers",
      "Vacuum Cleaners",
      "Air Conditioners",
      "Heaters",
      "Water Heaters",
      "Small Appliances",
      "Built-in Appliances",
      "Smart Appliances",
    ],
  },
  "Industry Laser Equipment": {
    name: "Industry Laser Equipment",
    subcategories: [
      "Laser Cutting Machines",
      "Laser Engraving Machines",
      "Laser Welding Equipment",
      "Laser Marking Systems",
      "Laser Measuring Tools",
      "CO2 Lasers",
      "Fiber Lasers",
      "Laser Components",
      "Laser Safety Equipment",
      "Laser Accessories",
    ],
  },
  "Lights & Lighting": {
    name: "Lights & Lighting",
    subcategories: [
      "LED Lights",
      "Indoor Lighting",
      "Outdoor Lighting",
      "Commercial Lighting",
      "Decorative Lighting",
      "Street Lights",
      "Industrial Lighting",
      "Emergency Lighting",
      "Smart Lighting",
      "Lighting Accessories",
    ],
  },
  "Luggage, Bags & Cases": {
    name: "Luggage, Bags & Cases",
    subcategories: [
      "Suitcases",
      "Travel Bags",
      "Backpacks",
      "Laptop Bags",
      "Camera Cases",
      "Tool Cases",
      "Cosmetic Cases",
      "Sports Bags",
      "Briefcases",
      "Protective Cases",
    ],
  },
  "Machinery": {
    name: "Machinery",
    subcategories: [
      "Construction Machinery",
      "Mining Equipment",
      "Agricultural Machinery",
      "Manufacturing Equipment",
      "Material Handling",
      "Packaging Machinery",
      "Textile Machinery",
      "Food Processing",
      "CNC Machines",
      "Industrial Robots",
    ],
  },
  "Measurement & Analysis Instruments": {
    name: "Measurement & Analysis Instruments",
    subcategories: [
      "Testing Equipment",
      "Laboratory Instruments",
      "Analytical Instruments",
      "Flow Meters",
      "Temperature Sensors",
      "Pressure Gauges",
      "Precision Instruments",
      "Surveying Equipment",
      "Quality Control Tools",
      "Inspection Devices",
    ],
  },
  "Metallurgy, Mineral & Energy": {
    name: "Metallurgy, Mineral & Energy",
    subcategories: [
      "Metal Processing",
      "Mineral Processing",
      "Mining Equipment",
      "Smelting Equipment",
      "Casting Equipment",
      "Rolling Mills",
      "Ore Processing",
      "Metal Fabrication",
      "Metallurgy Tools",
      "Refining Equipment",
    ],
  },
  "Packaging & Printing": {
    name: "Packaging & Printing",
    subcategories: [
      "Packaging Materials",
      "Printing Machinery",
      "Labels & Tags",
      "Boxes & Containers",
      "Flexible Packaging",
      "Printing Supplies",
      "Packaging Design",
      "Protective Packaging",
      "Industrial Printing",
      "Packaging Equipment",
    ],
  },
  "Security & Protection": {
    name: "Security & Protection",
    subcategories: [
      "Security Cameras",
      "Alarm Systems",
      "Access Control",
      "Fire Protection",
      "Personal Protective Equipment",
      "Security Doors & Gates",
      "Surveillance Systems",
      "Safety Equipment",
      "Security Services",
      "Cybersecurity Products",
    ],
  },
  "Shoes & Accessories": {
    name: "Shoes & Accessories",
    subcategories: [
      "Men's Shoes",
      "Women's Shoes",
      "Children's Shoes",
      "Athletic Shoes",
      "Formal Shoes",
      "Casual Shoes",
      "Boots",
      "Sandals",
      "Shoe Care",
      "Shoe Accessories",
    ],
  },
  "Textiles & Leather Products": {
    name: "Textiles & Leather Products",
    subcategories: [
      "Fabrics",
      "Yarn",
      "Textile Materials",
      "Home Textiles",
      "Technical Textiles",
      "Leather Products",
      "Synthetic Leather",
      "Textile Machinery",
      "Dyeing & Finishing",
      "Textile Accessories",
    ],
  },
  "Transportation": {
    name: "Transportation",
    subcategories: [
      "Logistics Services",
      "Freight Services",
      "Shipping & Cargo",
      "Warehousing",
      "Vehicle Transport",
      "Air Freight",
      "Sea Freight",
      "Land Transport",
      "Express Delivery",
      "Supply Chain Solutions",
    ],
  },
}

export const MAIN_CATEGORIES = Object.keys(CATEGORIES)

export function getSubcategories(mainCategory: string): string[] {
  return CATEGORIES[mainCategory]?.subcategories || []
}

// Get main category for a subcategory (case-insensitive)
export function getMainCategoryForSubcategory(subcategory: string): string | null {
  const lower = subcategory.toLowerCase()
  for (const [mainCategory, config] of Object.entries(CATEGORIES)) {
    if (config.subcategories.some((s) => s.toLowerCase() === lower)) {
      return mainCategory
    }
  }
  return null
}

// Check if a category is a main category
export function isMainCategory(category: string): boolean {
  return category in CATEGORIES
}

// Check if a category is a subcategory
export function isSubcategory(category: string): boolean {
  return getMainCategoryForSubcategory(category) !== null
}

// Get all subcategories (flat list)
export function getAllSubcategories(): string[] {
  const allSubs: string[] = []
  for (const config of Object.values(CATEGORIES)) {
    allSubs.push(...config.subcategories)
  }
  return allSubs
}
