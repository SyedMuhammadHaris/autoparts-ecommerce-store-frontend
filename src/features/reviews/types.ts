export type ProductReview = { id: number; display_name: string; rating: number; title: string; body: string; created_at: string };
export type OwnReview = ProductReview & { status: string; revision: number; moderation_note: string };
