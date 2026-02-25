/**
 * HD category images from Unsplash for product categories.
 * These are high-quality, freely licensed photos.
 * Format: https://images.unsplash.com/photo-{id}?w={width}&h={height}&fit=crop&auto=format&q=80
 */

export const CATEGORY_IMAGES: Record<string, string> = {
  "Construction":
    "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&h=600&fit=crop&auto=format&q=80",
  "Apparel & Accessories":
    "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=600&fit=crop&auto=format&q=80",
  "Automobiles & Motorcycles":
    "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800&h=600&fit=crop&auto=format&q=80",
  "Business Services":
    "https://images.unsplash.com/photo-1556761175-4b46a572b786?w=800&h=600&fit=crop&auto=format&q=80",
  "Chemicals":
    "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=800&h=600&fit=crop&auto=format&q=80",
  "Computer Products & Office Electronics":
    "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&h=600&fit=crop&auto=format&q=80",
  "Consumer Electronics":
    "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&h=600&fit=crop&auto=format&q=80",
  "Electrical Equipment & Supplies":
    "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800&h=600&fit=crop&auto=format&q=80",
  "Electronics Components & Supplies":
    "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&h=600&fit=crop&auto=format&q=80",
  "Energy":
    "https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800&h=600&fit=crop&auto=format&q=80",
  "Environment":
    "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&h=600&fit=crop&auto=format&q=80",
  "Food & Beverage":
    "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&h=600&fit=crop&auto=format&q=80",
  "Furniture":
    "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&h=600&fit=crop&auto=format&q=80",
  "Gifts, Sports & Toys":
    "https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=800&h=600&fit=crop&auto=format&q=80",
  "Hardware":
    "https://images.unsplash.com/photo-1581783898377-1c85bf937427?w=800&h=600&fit=crop&auto=format&q=80",
  "Health & Beauty":
    "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=800&h=600&fit=crop&auto=format&q=80",
  "Home & Garden":
    "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&h=600&fit=crop&auto=format&q=80",
  "Home Appliances":
    "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=600&fit=crop&auto=format&q=80",
  "Industry Laser Equipment":
    "https://images.unsplash.com/photo-1565793298595-6a879b1d9492?w=800&h=600&fit=crop&auto=format&q=80",
  "Lights & Lighting":
    "https://images.unsplash.com/photo-1524484485831-a92ffc0de03f?w=800&h=600&fit=crop&auto=format&q=80",
  "Luggage, Bags & Cases":
    "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&h=600&fit=crop&auto=format&q=80",
  "Machinery":
    "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&h=600&fit=crop&auto=format&q=80",
  "Measurement & Analysis Instruments":
    "https://images.unsplash.com/photo-1581093450021-4a7360e9a6b5?w=800&h=600&fit=crop&auto=format&q=80",
  "Metallurgy, Mineral & Energy":
    "https://images.unsplash.com/photo-1587293852726-70cdb56c2866?w=800&h=600&fit=crop&auto=format&q=80",
  "Packaging & Printing":
    "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=800&h=600&fit=crop&auto=format&q=80",
  "Security & Protection":
    "https://images.unsplash.com/photo-1558002038-1055907df827?w=800&h=600&fit=crop&auto=format&q=80",
  "Shoes & Accessories":
    "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&h=600&fit=crop&auto=format&q=80",
  "Textiles & Leather Products":
    "https://images.unsplash.com/photo-1558171813-4c088753af8f?w=800&h=600&fit=crop&auto=format&q=80",
  "Transportation":
    "https://images.unsplash.com/photo-1494412574643-ff11b0a5eb19?w=800&h=600&fit=crop&auto=format&q=80",
}

/**
 * Get the HD image URL for a category, with fallback
 */
export function getCategoryImage(categoryName: string): string | null {
  return CATEGORY_IMAGES[categoryName] || null
}

const u = (id: string) =>
  `https://images.unsplash.com/${id}?w=800&h=600&fit=crop&auto=format&q=80`

/**
 * HD subcategory images from Unsplash for product subcategories.
 */
export const SUBCATEGORY_IMAGES: Record<string, string> = {
  // --- Construction ---
  "Exterior Gates": u("photo-1504307651254-35680f356dfd"),
  "Fences": u("photo-1541888946425-d81bb19240f5"),
  "Balustrades": u("photo-1590644365607-1c5a2530b21e"),
  "Barrier Systems": u("photo-1590644365607-1c5a2530b21e"),
  "Fencing": u("photo-1541888946425-d81bb19240f5"),
  "Handrails": u("photo-1504307651254-35680f356dfd"),
  "Gates": u("photo-1504307651254-35680f356dfd"),
  "Railings": u("photo-1590644365607-1c5a2530b21e"),
  "Screens": u("photo-1541888946425-d81bb19240f5"),
  "Partitions": u("photo-1590644365607-1c5a2530b21e"),
  "Aluminum": u("photo-1504307651254-35680f356dfd"),
  "Steel": u("photo-1541888946425-d81bb19240f5"),
  "Glass": u("photo-1590644365607-1c5a2530b21e"),
  "Concrete": u("photo-1541888946425-d81bb19240f5"),
  "Tools": u("photo-1581783898377-1c85bf937427"),
  "Equipment": u("photo-1504307651254-35680f356dfd"),
  "Hardware": u("photo-1581783898377-1c85bf937427"),
  "Electrical": u("photo-1558618666-fcd25c85f82e"),
  "Plumbing": u("photo-1504307651254-35680f356dfd"),
  "Paint": u("photo-1541888946425-d81bb19240f5"),
  "Wood": u("photo-1590644365607-1c5a2530b21e"),

  // --- Apparel & Accessories ---
  "Jewelry": u("photo-1445205170230-053b83016050"),
  "Watches & Eyewear": u("photo-1523381210434-271e8be1f52b"),
  "Bags & Wallets": u("photo-1553062407-98eeb64c6a62"),
  "Scarves & Shawls": u("photo-1558171813-4c088753af8f"),
  "Belts": u("photo-1445205170230-053b83016050"),
  "Headwear": u("photo-1523381210434-271e8be1f52b"),
  "Gloves": u("photo-1558171813-4c088753af8f"),
  "Footwear Accessories": u("photo-1542291026-7eec264c27ff"),
  "Ties & Bow Ties": u("photo-1445205170230-053b83016050"),
  "Men's Clothing": u("photo-1523381210434-271e8be1f52b"),
  "Women's Clothing": u("photo-1445205170230-053b83016050"),
  "Children's Clothing": u("photo-1523381210434-271e8be1f52b"),
  "Activewear": u("photo-1558171813-4c088753af8f"),
  "Formal Wear": u("photo-1445205170230-053b83016050"),
  "Traditional Wear": u("photo-1523381210434-271e8be1f52b"),

  // --- Automobiles & Motorcycles ---
  "Engine Components": u("photo-1558618666-fcd25c85f82e"),
  "Transmission & Drivetrain": u("photo-1568605117036-5fe5e7bab0b7"),
  "Suspension & Steering": u("photo-1492144534655-ae79c964c9d7"),
  "Brake Systems": u("photo-1568605117036-5fe5e7bab0b7"),
  "Electrical & Ignition": u("photo-1558618666-fcd25c85f82e"),
  "Exhaust & Emissions": u("photo-1568605117036-5fe5e7bab0b7"),
  "Cooling Systems": u("photo-1558618666-fcd25c85f82e"),
  "Fuel Systems": u("photo-1568605117036-5fe5e7bab0b7"),
  "Body Parts & Accessories": u("photo-1492144534655-ae79c964c9d7"),
  "Wheels & Tires": u("photo-1568605117036-5fe5e7bab0b7"),
  "Lighting & Lamps": u("photo-1492144534655-ae79c964c9d7"),
  "Interior Accessories": u("photo-1492144534655-ae79c964c9d7"),
  "Motorcycle Parts": u("photo-1558618666-fcd25c85f82e"),

  // --- Business Services ---
  "Consulting & Advisory": u("photo-1556761175-4b46a572b786"),
  "IT Consulting": u("photo-1556761175-4b46a572b786"),
  "Financial Advisory": u("photo-1556761175-4b46a572b786"),
  "HR Consulting": u("photo-1556761175-4b46a572b786"),
  "Legal Services": u("photo-1556761175-4b46a572b786"),
  "Accounting & Auditing": u("photo-1556761175-4b46a572b786"),
  "Marketing Services": u("photo-1556761175-4b46a572b786"),
  "Design & Engineering": u("photo-1556761175-4b46a572b786"),
  "Cloud Computing": u("photo-1556761175-4b46a572b786"),
  "Cybersecurity": u("photo-1558002038-1055907df827"),
  "Recruitment & Staffing": u("photo-1556761175-4b46a572b786"),
  "Business Process Outsourcing": u("photo-1556761175-4b46a572b786"),
  "Data Analytics": u("photo-1556761175-4b46a572b786"),

  // --- Chemicals ---
  "Industrial Chemicals": u("photo-1532187863486-abf9dbad1b69"),
  "Organic Chemicals": u("photo-1532187863486-abf9dbad1b69"),
  "Inorganic Chemicals": u("photo-1532187863486-abf9dbad1b69"),
  "Petrochemicals": u("photo-1532187863486-abf9dbad1b69"),
  "Agricultural Chemicals": u("photo-1532187863486-abf9dbad1b69"),
  "Specialty Chemicals": u("photo-1532187863486-abf9dbad1b69"),
  "Adhesives & Sealants": u("photo-1532187863486-abf9dbad1b69"),
  "Paints & Coatings": u("photo-1532187863486-abf9dbad1b69"),
  "Cleaning Chemicals": u("photo-1532187863486-abf9dbad1b69"),
  "Laboratory Chemicals": u("photo-1532187863486-abf9dbad1b69"),

  // --- Computer Products & Office Electronics ---
  "Desktop Computers": u("photo-1518770660439-4636190af475"),
  "Laptops": u("photo-1496181133206-80ce9b88a853"),
  "Tablets": u("photo-1550009158-9ebf69173e03"),
  "Computer Accessories": u("photo-1518770660439-4636190af475"),
  "Monitors": u("photo-1550009158-9ebf69173e03"),
  "Printers & Scanners": u("photo-1496181133206-80ce9b88a853"),
  "Keyboards & Mice": u("photo-1518770660439-4636190af475"),
  "External Storage": u("photo-1550009158-9ebf69173e03"),
  "Networking Equipment": u("photo-1518770660439-4636190af475"),
  "Office Phones": u("photo-1496181133206-80ce9b88a853"),
  "Projectors": u("photo-1550009158-9ebf69173e03"),
  "Office Furniture": u("photo-1524758631624-e2822e304c36"),

  // --- Consumer Electronics ---
  "Smartphones": u("photo-1518770660439-4636190af475"),
  "Audio Equipment": u("photo-1550009158-9ebf69173e03"),
  "Video Equipment": u("photo-1518770660439-4636190af475"),
  "Gaming Devices": u("photo-1550009158-9ebf69173e03"),
  "Smart Home Devices": u("photo-1518770660439-4636190af475"),
  "Wearables": u("photo-1550009158-9ebf69173e03"),
  "Cameras": u("photo-1518770660439-4636190af475"),
  "Headphones & Earbuds": u("photo-1550009158-9ebf69173e03"),
  "Speakers": u("photo-1518770660439-4636190af475"),
  "TVs": u("photo-1550009158-9ebf69173e03"),
  "Streaming Devices": u("photo-1518770660439-4636190af475"),
  "VR Headsets": u("photo-1550009158-9ebf69173e03"),

  // --- Electrical Equipment & Supplies ---
  "Wiring & Cables": u("photo-1558618666-fcd25c85f82e"),
  "Circuit Breakers": u("photo-1558618666-fcd25c85f82e"),
  "Switches & Sockets": u("photo-1558618666-fcd25c85f82e"),
  "Transformers": u("photo-1558618666-fcd25c85f82e"),
  "Motors & Generators": u("photo-1558618666-fcd25c85f82e"),
  "Power Distribution": u("photo-1558618666-fcd25c85f82e"),
  "Batteries": u("photo-1558618666-fcd25c85f82e"),
  "Solar Equipment": u("photo-1509391366360-2e959784a276"),
  "Electrical Tools": u("photo-1581783898377-1c85bf937427"),
  "Safety Equipment": u("photo-1558002038-1055907df827"),

  // --- Electronics Components & Supplies ---
  "Semiconductors": u("photo-1518770660439-4636190af475"),
  "Integrated Circuits": u("photo-1518770660439-4636190af475"),
  "Capacitors": u("photo-1550009158-9ebf69173e03"),
  "Resistors": u("photo-1550009158-9ebf69173e03"),
  "Connectors": u("photo-1518770660439-4636190af475"),
  "Sensors": u("photo-1550009158-9ebf69173e03"),
  "PCB Boards": u("photo-1518770660439-4636190af475"),
  "Displays": u("photo-1550009158-9ebf69173e03"),
  "Modules": u("photo-1518770660439-4636190af475"),
  "Passive Components": u("photo-1550009158-9ebf69173e03"),

  // --- Energy ---
  "Solar Energy": u("photo-1509391366360-2e959784a276"),
  "Wind Energy": u("photo-1509391366360-2e959784a276"),
  "Hydroelectric": u("photo-1509391366360-2e959784a276"),
  "Generators": u("photo-1509391366360-2e959784a276"),
  "Power Plants": u("photo-1509391366360-2e959784a276"),
  "Energy Storage": u("photo-1509391366360-2e959784a276"),
  "Fuel Cells": u("photo-1509391366360-2e959784a276"),
  // Note: "Batteries" already defined under Electrical Equipment
  "Renewable Energy": u("photo-1509391366360-2e959784a276"),
  "Energy Management": u("photo-1509391366360-2e959784a276"),

  // --- Environment ---
  "Water Treatment": u("photo-1542601906990-b4d3fb778b09"),
  "Air Purification": u("photo-1542601906990-b4d3fb778b09"),
  "Waste Management": u("photo-1542601906990-b4d3fb778b09"),
  "Recycling Equipment": u("photo-1542601906990-b4d3fb778b09"),
  "Pollution Control": u("photo-1542601906990-b4d3fb778b09"),
  "Environmental Testing": u("photo-1542601906990-b4d3fb778b09"),
  "Renewable Resources": u("photo-1542601906990-b4d3fb778b09"),
  "Conservation Equipment": u("photo-1542601906990-b4d3fb778b09"),
  "Eco-friendly Products": u("photo-1542601906990-b4d3fb778b09"),
  "Sustainability Solutions": u("photo-1542601906990-b4d3fb778b09"),

  // --- Food & Beverage ---
  "Fresh Food": u("photo-1504674900247-0877df9cc836"),
  "Processed Food": u("photo-1606787366850-de6330128bfc"),
  "Beverages": u("photo-1567620905732-2d1ec7ab7445"),
  "Snacks & Confectionery": u("photo-1606787366850-de6330128bfc"),
  "Dairy Products": u("photo-1504674900247-0877df9cc836"),
  "Meat & Seafood": u("photo-1504674900247-0877df9cc836"),
  "Bakery Products": u("photo-1567620905732-2d1ec7ab7445"),
  "Food Ingredients": u("photo-1606787366850-de6330128bfc"),
  "Food Processing Equipment": u("photo-1504674900247-0877df9cc836"),
  "Packaging": u("photo-1589939705384-5185137a7f0f"),

  // --- Furniture ---
  "Living Room Furniture": u("photo-1555041469-a586c61ea9bc"),
  "Bedroom Furniture": u("photo-1524758631624-e2822e304c36"),
  "Dining Room Furniture": u("photo-1556228453-efd6c1ff04f6"),
  "Office Furniture": u("photo-1524758631624-e2822e304c36"),
  "Outdoor Furniture": u("photo-1555041469-a586c61ea9bc"),
  "Kitchen Furniture": u("photo-1556228453-efd6c1ff04f6"),
  "Children Furniture": u("photo-1524758631624-e2822e304c36"),
  "Commercial Furniture": u("photo-1556228453-efd6c1ff04f6"),
  "Antique Furniture": u("photo-1555041469-a586c61ea9bc"),
  "Custom Furniture": u("photo-1524758631624-e2822e304c36"),

  // --- Gifts, Sports & Toys ---
  "Action Figures": u("photo-1596461404969-9ae70f2830c1"),
  "Educational Toys": u("photo-1596461404969-9ae70f2830c1"),
  "Outdoor Play Equipment": u("photo-1596461404969-9ae70f2830c1"),
  "Sports Equipment": u("photo-1596461404969-9ae70f2830c1"),
  "Fitness Equipment": u("photo-1596461404969-9ae70f2830c1"),
  "Board Games": u("photo-1596461404969-9ae70f2830c1"),
  "Puzzles": u("photo-1596461404969-9ae70f2830c1"),
  "Gift Items": u("photo-1596461404969-9ae70f2830c1"),
  "Party Supplies": u("photo-1596461404969-9ae70f2830c1"),
  "Crafts & Hobbies": u("photo-1596461404969-9ae70f2830c1"),

  // --- Hardware ---
  "Hand Tools": u("photo-1581783898377-1c85bf937427"),
  "Power Tools": u("photo-1581783898377-1c85bf937427"),
  "Fasteners": u("photo-1581783898377-1c85bf937427"),
  "Locks & Keys": u("photo-1581783898377-1c85bf937427"),
  "Hinges": u("photo-1581783898377-1c85bf937427"),
  "Door Hardware": u("photo-1581783898377-1c85bf937427"),
  "Window Hardware": u("photo-1581783898377-1c85bf937427"),
  "Cabinet Hardware": u("photo-1581783898377-1c85bf937427"),
  "Building Hardware": u("photo-1581783898377-1c85bf937427"),
  "Tool Storage": u("photo-1581783898377-1c85bf937427"),

  // --- Health & Beauty ---
  "Skincare": u("photo-1571781926291-c477ebfd024b"),
  "Hair Care": u("photo-1576426863848-c21f53c60b19"),
  "Makeup & Cosmetics": u("photo-1512290923902-8a9f81dc236c"),
  "Fragrances": u("photo-1571781926291-c477ebfd024b"),
  "Personal Care": u("photo-1576426863848-c21f53c60b19"),
  "Health Supplements": u("photo-1512290923902-8a9f81dc236c"),
  "Medical Devices": u("photo-1571781926291-c477ebfd024b"),
  "Fitness & Wellness": u("photo-1576426863848-c21f53c60b19"),
  "Oral Care": u("photo-1512290923902-8a9f81dc236c"),
  "Beauty Tools": u("photo-1571781926291-c477ebfd024b"),

  // --- Home & Garden ---
  "Garden Furniture": u("photo-1416879595882-3373a0480b5b"),
  "Outdoor Decor": u("photo-1416879595882-3373a0480b5b"),
  "Gardening Tools": u("photo-1416879595882-3373a0480b5b"),
  "Plants & Seeds": u("photo-1416879595882-3373a0480b5b"),
  "Lawn Care": u("photo-1416879595882-3373a0480b5b"),
  "Grills & Outdoor Cooking": u("photo-1416879595882-3373a0480b5b"),
  "Fire Pits": u("photo-1416879595882-3373a0480b5b"),
  "Sheds & Storage": u("photo-1416879595882-3373a0480b5b"),
  "Pools & Spas": u("photo-1416879595882-3373a0480b5b"),
  "Greenhouses": u("photo-1416879595882-3373a0480b5b"),

  // --- Home Appliances ---
  "Kitchen Appliances": u("photo-1556909114-f6e7ad7d3136"),
  "Laundry Appliances": u("photo-1556909114-f6e7ad7d3136"),
  "Refrigerators & Freezers": u("photo-1556909114-f6e7ad7d3136"),
  "Vacuum Cleaners": u("photo-1556909114-f6e7ad7d3136"),
  "Air Conditioners": u("photo-1556909114-f6e7ad7d3136"),
  "Heaters": u("photo-1556909114-f6e7ad7d3136"),
  "Water Heaters": u("photo-1556909114-f6e7ad7d3136"),
  "Small Appliances": u("photo-1556909114-f6e7ad7d3136"),
  "Built-in Appliances": u("photo-1556909114-f6e7ad7d3136"),
  "Smart Appliances": u("photo-1556909114-f6e7ad7d3136"),

  // --- Industry Laser Equipment ---
  "Laser Cutting Machines": u("photo-1565793298595-6a879b1d9492"),
  "Laser Engraving Machines": u("photo-1565793298595-6a879b1d9492"),
  "Laser Welding Equipment": u("photo-1565793298595-6a879b1d9492"),
  "Laser Marking Systems": u("photo-1565793298595-6a879b1d9492"),
  "Laser Measuring Tools": u("photo-1565793298595-6a879b1d9492"),
  "CO2 Lasers": u("photo-1565793298595-6a879b1d9492"),
  "Fiber Lasers": u("photo-1565793298595-6a879b1d9492"),
  "Laser Components": u("photo-1565793298595-6a879b1d9492"),
  "Laser Safety Equipment": u("photo-1565793298595-6a879b1d9492"),
  "Laser Accessories": u("photo-1565793298595-6a879b1d9492"),

  // --- Lights & Lighting ---
  "LED Lights": u("photo-1524484485831-a92ffc0de03f"),
  "Indoor Lighting": u("photo-1524484485831-a92ffc0de03f"),
  "Outdoor Lighting": u("photo-1524484485831-a92ffc0de03f"),
  "Commercial Lighting": u("photo-1524484485831-a92ffc0de03f"),
  "Decorative Lighting": u("photo-1524484485831-a92ffc0de03f"),
  "Street Lights": u("photo-1524484485831-a92ffc0de03f"),
  "Industrial Lighting": u("photo-1524484485831-a92ffc0de03f"),
  "Emergency Lighting": u("photo-1524484485831-a92ffc0de03f"),
  "Smart Lighting": u("photo-1524484485831-a92ffc0de03f"),
  "Lighting Accessories": u("photo-1524484485831-a92ffc0de03f"),

  // --- Luggage, Bags & Cases ---
  "Suitcases": u("photo-1553062407-98eeb64c6a62"),
  "Travel Bags": u("photo-1553062407-98eeb64c6a62"),
  "Backpacks": u("photo-1553062407-98eeb64c6a62"),
  "Laptop Bags": u("photo-1553062407-98eeb64c6a62"),
  "Camera Cases": u("photo-1553062407-98eeb64c6a62"),
  "Tool Cases": u("photo-1553062407-98eeb64c6a62"),
  "Cosmetic Cases": u("photo-1553062407-98eeb64c6a62"),
  "Sports Bags": u("photo-1553062407-98eeb64c6a62"),
  "Briefcases": u("photo-1553062407-98eeb64c6a62"),
  "Protective Cases": u("photo-1553062407-98eeb64c6a62"),

  // --- Machinery ---
  "Construction Machinery": u("photo-1581091226825-a6a2a5aee158"),
  "Mining Equipment": u("photo-1587293852726-70cdb56c2866"),
  "Agricultural Machinery": u("photo-1581091226825-a6a2a5aee158"),
  "Manufacturing Equipment": u("photo-1581091226825-a6a2a5aee158"),
  "Material Handling": u("photo-1581091226825-a6a2a5aee158"),
  "Packaging Machinery": u("photo-1589939705384-5185137a7f0f"),
  "Textile Machinery": u("photo-1581091226825-a6a2a5aee158"),
  "Food Processing": u("photo-1504674900247-0877df9cc836"),
  "CNC Machines": u("photo-1581091226825-a6a2a5aee158"),
  "Industrial Robots": u("photo-1581091226825-a6a2a5aee158"),

  // --- Measurement & Analysis Instruments ---
  "Testing Equipment": u("photo-1581093450021-4a7360e9a6b5"),
  "Laboratory Instruments": u("photo-1581093450021-4a7360e9a6b5"),
  "Analytical Instruments": u("photo-1581093450021-4a7360e9a6b5"),
  "Flow Meters": u("photo-1581093450021-4a7360e9a6b5"),
  "Temperature Sensors": u("photo-1581093450021-4a7360e9a6b5"),
  "Pressure Gauges": u("photo-1581093450021-4a7360e9a6b5"),
  "Precision Instruments": u("photo-1581093450021-4a7360e9a6b5"),
  "Surveying Equipment": u("photo-1581093450021-4a7360e9a6b5"),
  "Quality Control Tools": u("photo-1581093450021-4a7360e9a6b5"),
  "Inspection Devices": u("photo-1581093450021-4a7360e9a6b5"),

  // --- Metallurgy, Mineral & Energy ---
  "Metal Processing": u("photo-1587293852726-70cdb56c2866"),
  "Mineral Processing": u("photo-1587293852726-70cdb56c2866"),
  "Mining Equipment": u("photo-1587293852726-70cdb56c2866"),
  "Smelting Equipment": u("photo-1587293852726-70cdb56c2866"),
  "Casting Equipment": u("photo-1587293852726-70cdb56c2866"),
  "Rolling Mills": u("photo-1587293852726-70cdb56c2866"),
  "Ore Processing": u("photo-1587293852726-70cdb56c2866"),
  "Metal Fabrication": u("photo-1587293852726-70cdb56c2866"),
  "Metallurgy Tools": u("photo-1587293852726-70cdb56c2866"),
  "Refining Equipment": u("photo-1587293852726-70cdb56c2866"),

  // --- Packaging & Printing ---
  "Packaging Materials": u("photo-1589939705384-5185137a7f0f"),
  "Printing Machinery": u("photo-1589939705384-5185137a7f0f"),
  "Labels & Tags": u("photo-1589939705384-5185137a7f0f"),
  "Boxes & Containers": u("photo-1589939705384-5185137a7f0f"),
  "Flexible Packaging": u("photo-1589939705384-5185137a7f0f"),
  "Printing Supplies": u("photo-1589939705384-5185137a7f0f"),
  "Packaging Design": u("photo-1589939705384-5185137a7f0f"),
  "Protective Packaging": u("photo-1589939705384-5185137a7f0f"),
  "Industrial Printing": u("photo-1589939705384-5185137a7f0f"),
  "Packaging Equipment": u("photo-1589939705384-5185137a7f0f"),

  // --- Security & Protection ---
  "Security Cameras": u("photo-1558002038-1055907df827"),
  "Alarm Systems": u("photo-1558002038-1055907df827"),
  "Access Control": u("photo-1558002038-1055907df827"),
  "Fire Protection": u("photo-1558002038-1055907df827"),
  "Personal Protective Equipment": u("photo-1558002038-1055907df827"),
  "Security Doors & Gates": u("photo-1558002038-1055907df827"),
  "Surveillance Systems": u("photo-1558002038-1055907df827"),
  // Note: "Safety Equipment" already defined under Electrical Equipment
  "Security Services": u("photo-1558002038-1055907df827"),
  "Cybersecurity Products": u("photo-1558002038-1055907df827"),

  // --- Shoes & Accessories ---
  "Men's Shoes": u("photo-1542291026-7eec264c27ff"),
  "Women's Shoes": u("photo-1542291026-7eec264c27ff"),
  "Children's Shoes": u("photo-1542291026-7eec264c27ff"),
  "Athletic Shoes": u("photo-1542291026-7eec264c27ff"),
  "Formal Shoes": u("photo-1542291026-7eec264c27ff"),
  "Casual Shoes": u("photo-1542291026-7eec264c27ff"),
  "Boots": u("photo-1542291026-7eec264c27ff"),
  "Sandals": u("photo-1542291026-7eec264c27ff"),
  "Shoe Care": u("photo-1542291026-7eec264c27ff"),
  "Shoe Accessories": u("photo-1542291026-7eec264c27ff"),

  // --- Textiles & Leather Products ---
  "Fabrics": u("photo-1558171813-4c088753af8f"),
  "Yarn": u("photo-1558171813-4c088753af8f"),
  "Textile Materials": u("photo-1558171813-4c088753af8f"),
  "Home Textiles": u("photo-1558171813-4c088753af8f"),
  "Technical Textiles": u("photo-1558171813-4c088753af8f"),
  "Leather Products": u("photo-1558171813-4c088753af8f"),
  "Synthetic Leather": u("photo-1558171813-4c088753af8f"),
  "Textile Machinery": u("photo-1558171813-4c088753af8f"),
  "Dyeing & Finishing": u("photo-1558171813-4c088753af8f"),
  "Textile Accessories": u("photo-1558171813-4c088753af8f"),

  // --- Transportation ---
  "Logistics Services": u("photo-1494412574643-ff11b0a5eb19"),
  "Freight Services": u("photo-1494412574643-ff11b0a5eb19"),
  "Shipping & Cargo": u("photo-1494412574643-ff11b0a5eb19"),
  "Warehousing": u("photo-1494412574643-ff11b0a5eb19"),
  "Vehicle Transport": u("photo-1494412574643-ff11b0a5eb19"),
  "Air Freight": u("photo-1494412574643-ff11b0a5eb19"),
  "Sea Freight": u("photo-1494412574643-ff11b0a5eb19"),
  "Land Transport": u("photo-1494412574643-ff11b0a5eb19"),
  "Express Delivery": u("photo-1494412574643-ff11b0a5eb19"),
  "Supply Chain Solutions": u("photo-1494412574643-ff11b0a5eb19"),
}

/**
 * Get the HD image URL for a subcategory, with fallback
 */
export function getSubcategoryImage(subcategoryName: string): string | null {
  return SUBCATEGORY_IMAGES[subcategoryName] || null
}
