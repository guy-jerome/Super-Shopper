export type StorageTemplate = {
  label: string;
  icon: string;
  description: string;
  locations: {
    name: string;
    subsections?: string[];
  }[];
};

export type StoreTemplate = {
  label: string;
  icon: string;
  description: string;
  aisles: string[];
};

export const STORAGE_TEMPLATES: StorageTemplate[] = [
  {
    label: 'Basic Kitchen',
    icon: 'fridge-outline',
    description: 'Fridge, Freezer & Pantry',
    locations: [
      {
        name: 'Fridge',
        subsections: ['Upper Shelf', 'Lower Shelf', 'Door', 'Crisper'],
      },
      { name: 'Freezer' },
      { name: 'Pantry' },
    ],
  },
  {
    label: 'Full Kitchen',
    icon: 'home-outline',
    description: 'Complete kitchen + extras',
    locations: [
      {
        name: 'Fridge',
        subsections: ['Upper Shelf', 'Lower Shelf', 'Door', 'Crisper', 'Cheese Drawer', 'Deli Drawer'],
      },
      {
        name: 'Freezer',
        subsections: ['Top Shelf', 'Bottom Shelf', 'Door'],
      },
      { name: 'Pantry' },
      { name: 'Spice Rack' },
      { name: 'Counter' },
      { name: 'Cabinet' },
    ],
  },
  {
    label: 'Whole Home',
    icon: 'home-city-outline',
    description: 'Kitchen + bathroom + laundry',
    locations: [
      {
        name: 'Fridge',
        subsections: ['Upper Shelf', 'Lower Shelf', 'Door', 'Crisper', 'Cheese Drawer'],
      },
      { name: 'Freezer' },
      { name: 'Pantry' },
      { name: 'Cabinet' },
      { name: 'Spice Rack' },
      { name: 'Bathroom' },
      { name: 'Laundry' },
    ],
  },
];

export const STORE_TEMPLATES: StoreTemplate[] = [
  {
    label: 'Grocery Store',
    icon: 'storefront-outline',
    description: 'Standard supermarket layout',
    aisles: [
      'Produce',
      'Bakery',
      'Meat & Seafood',
      'Dairy & Eggs',
      'Frozen Foods',
      'Canned Goods & Soups',
      'Bread & Cereals',
      'Snacks',
      'Beverages',
      'Condiments & Sauces',
      'Personal Care',
      'Household & Cleaning',
    ],
  },
  {
    label: 'Warehouse',
    icon: 'warehouse',
    description: 'Costco / Sam\'s Club style',
    aisles: [
      'Fresh Produce',
      'Dairy & Eggs',
      'Bakery',
      'Meat & Deli',
      'Frozen',
      'Snacks & Candy',
      'Beverages',
      'Household',
      'Electronics',
      'Clothing',
      'Office',
      'Pet',
    ],
  },
  {
    label: 'Convenience Store',
    icon: 'store-outline',
    description: 'Quick-trip essentials',
    aisles: [
      'Drinks',
      'Snacks',
      'Dairy',
      'Grab & Go',
      'Personal Care',
    ],
  },
];
