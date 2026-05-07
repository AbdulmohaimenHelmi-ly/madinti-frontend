"use client";
import { useState, useEffect, use } from "react";
import { useTranslations, useLocale } from "next-intl";
import { PenLine, Star } from "lucide-react";
import ProductDetails from "@/components/products/ProductDetails";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import ErrorMessage from "@/components/common/ErrorMessage";
import type { Product, Review } from "@/lib/types";
import { productsApi } from "@/lib/api/products";
import { reviewsApi } from "@/lib/api/reviews";

function StarRating({ value, onChange, readonly, size = 20 }: { value: number | null; onChange?: (v: number) => void; readonly?: boolean; size?: number }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <button key={s} type="button" disabled={readonly} onClick={() => onChange?.(s)} className={`transition-colors ${readonly ? "cursor-default" : "cursor-pointer hover:text-amber-400"}`} style={{ color: s <= (value ?? 0) ? "#f59e0b" : "#d1d5db" }}>
          <Star size={size} fill={s <= (value ?? 0) ? "currentColor" : "none"} />
        </button>
      ))}
    </div>
  );
}

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const t = useTranslations();
  const locale = useLocale();
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadedProductId, setLoadedProductId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [newRating, setNewRating] = useState<number | null>(5);
  const [newComment, setNewComment] = useState("");
  const loading = loadedProductId !== id;

  useEffect(() => {
    let cancelled = false;
    Promise.all([productsApi.getById(id), reviewsApi.getByProduct(id).catch(() => ({ data: { data: [] } }))])
      .then(([productRes, reviewsRes]) => {
        if (cancelled) return;
        setProduct(productRes.data.data); setReviews(reviewsRes.data.data); setError(null); setLoadedProductId(id);
      }).catch(() => { if (cancelled) return; setError(t("common.error")); setLoadedProductId(id); });
    return () => { cancelled = true; };
  }, [id, t]);

  useEffect(() => { if (!id) return; productsApi.trackView(id).catch(() => {}); }, [id]);

  const handleSubmitReview = async () => {
    if (!newRating) return;
    try {
      const res = await reviewsApi.create(id, { rating: newRating, comment: newComment || undefined });
      setReviews((prev) => [res.data.data, ...prev]);
      setNewComment(""); setNewRating(5);
    } catch {}
  };

  if (loading) return <LoadingSpinner />;
  if (error || !product) return <ErrorMessage message={error || undefined} />;

  return (
    <div className="max-w-screen-lg mx-auto px-4 py-10">
      <ProductDetails product={product} />

      <div className="mt-16">
        <div className="mb-6">
          <h2 className="text-xl font-extrabold">{t("product.reviews")} ({reviews.length})</h2>
          <div className="w-12 h-1 rounded-full mt-2" style={{ background: "linear-gradient(90deg, var(--color-primary), var(--color-primary-light))" }} />
        </div>
        <hr className="border-gray-100 mb-6" />

        {/* Add review */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <PenLine size={18} style={{ color: "var(--color-primary)" }} />
            <h3 className="text-lg font-bold">{t("product.addReview")}</h3>
          </div>
          <div className="flex items-center gap-2 mb-3">
            <span className="font-medium text-sm">{t("product.rating")}:</span>
            <StarRating value={newRating} onChange={setNewRating} size={22} />
          </div>
          <textarea rows={3} placeholder={t("product.reviews")} value={newComment} onChange={(e) => setNewComment(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] mb-3 resize-none" />
          <button onClick={handleSubmitReview} className="px-8 py-2.5 rounded-xl text-white font-bold text-sm" style={{ background: "var(--color-primary)" }}>
            {t("product.addReview")}
          </button>
        </div>

        {reviews.map((review) => (
          <div key={review.id} className="bg-white rounded-2xl border border-gray-200 hover:border-gray-300 transition-colors p-5 mb-3">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold shrink-0 overflow-hidden" style={{ background: "var(--color-primary)" }}>
                {review.user?.avatar ? <img src={review.user.avatar} alt="" className="w-full h-full object-cover" /> : (review.user?.name?.[0] ?? "?")}
              </div>
              <div>
                <p className="font-bold">{review.user?.name || ""}</p>
                <StarRating value={Number(review.rating) || 0} readonly size={14} />
              </div>
              <span className="text-xs text-gray-400 ms-auto font-medium">{new Date(review.created_at).toLocaleDateString(locale === "ar" ? "ar-LY" : "en-US")}</span>
            </div>
            {review.comment && <p className="text-sm text-gray-500 leading-relaxed ps-14">{review.comment}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
