export interface Attribute { key: string; label: string; kind: 'text' | 'number' | 'choice' | 'yes_no'; unit: string; choices: string[]; isOption: boolean; filterable: boolean }
export interface Category { id: string; handle: string; name: string; description: string; subcategories: string[]; attributes: Attribute[] }
export interface Product {
  id: string; name: string; description: string; brand: string | null; brandId: string | null; categoryId: string | null; categoryHandle: string | null; subcategory: string;
  currency: string; listPriceCents: number; priceCents: number; onSale: boolean; saleBadge: string | null; saleEndsAt: string | null;
  inStock: boolean; available: number; isNew: boolean; images: string[]; rating: number | null; reviews: number; groupId: string | null;
  options: Record<string, string>; specs: Record<string, string | number | boolean>;
}
export interface Catalogue { categories: Category[]; brands: { id: string; name: string }[]; products: Product[] }
export interface HomeData {
  banners: { id: string; title: string; label: string; link: string; alt: string; imageRef: string | null }[];
  sections: { id: string; name: string; sub: string; count: number }[];
}
export interface ProductReviews { count: number; average: number; split: number[]; items: { id: string; name: string; rating: number; at: string; text: string; topic: string; reply: string | null; verified: boolean }[] }

/** What a cart or order line shows. */
export interface Slim { id: string; name: string; brand: string | null; priceCents: number; listPriceCents: number; image: string | null; inStock: boolean; available: number; options: Record<string, string> }
