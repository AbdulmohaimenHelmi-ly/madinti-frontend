"use client";

import { useState, useEffect, use } from "react";
import { useTranslations, useLocale } from "next-intl";
import {
  Container,
  Typography,
  Box,
  Divider,
  Rating,
  TextField,
  Button,
  Card,
  CardContent,
  Avatar,
} from "@mui/material";
import ProductDetails from "@/components/products/ProductDetails";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import ErrorMessage from "@/components/common/ErrorMessage";
import type { Product, Review } from "@/lib/types";
import { productsApi } from "@/lib/api/products";
import { reviewsApi } from "@/lib/api/reviews";

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const t = useTranslations();
  const locale = useLocale();
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newRating, setNewRating] = useState<number | null>(5);
  const [newComment, setNewComment] = useState("");

  useEffect(() => {
    setLoading(true);
    Promise.all([
      productsApi.getById(id),
      reviewsApi.getByProduct(id).catch(() => ({ data: { data: [] } })),
    ])
      .then(([productRes, reviewsRes]) => {
        setProduct(productRes.data.data);
        setReviews(reviewsRes.data.data);
      })
      .catch(() => setError(t("common.error")))
      .finally(() => setLoading(false));
  }, [id, t]);

  const handleSubmitReview = async () => {
    if (!newRating) return;
    try {
      const res = await reviewsApi.create(id, {
        rating: newRating,
        comment: newComment || undefined,
      });
      setReviews((prev) => [res.data.data, ...prev]);
      setNewComment("");
      setNewRating(5);
    } catch {
      // silently handle
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error || !product) return <ErrorMessage message={error || undefined} />;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <ProductDetails product={product} />

      <Box sx={{ mt: 6 }}>
        <Typography variant="h5" fontWeight={700} gutterBottom>
          {t("product.reviews")} ({reviews.length})
        </Typography>
        <Divider sx={{ mb: 3 }} />

        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              {t("product.addReview")}
            </Typography>
            <Box
              sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}
            >
              <Typography>{t("product.rating")}:</Typography>
              <Rating
                value={newRating}
                onChange={(_, val) => setNewRating(val)}
              />
            </Box>
            <TextField
              fullWidth
              multiline
              rows={3}
              placeholder={t("product.reviews")}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              sx={{ mb: 2 }}
            />
            <Button variant="contained" onClick={handleSubmitReview}>
              {t("product.addReview")}
            </Button>
          </CardContent>
        </Card>

        {reviews.map((review) => (
          <Card key={review.id} sx={{ mb: 2 }}>
            <CardContent>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  mb: 1,
                }}
              >
                <Avatar src={review.user?.avatar || undefined}>
                  {review.user?.name?.[0]}
                </Avatar>
                <Box>
                  <Typography fontWeight={600}>
                    {review.user?.name || ""}
                  </Typography>
                  <Rating value={review.rating} readOnly size="small" />
                </Box>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ ml: "auto" }}
                >
                  {new Date(review.created_at).toLocaleDateString(
                    locale === "ar" ? "ar-LY" : "en-US"
                  )}
                </Typography>
              </Box>
              {review.comment && (
                <Typography variant="body2" color="text.secondary">
                  {review.comment}
                </Typography>
              )}
            </CardContent>
          </Card>
        ))}
      </Box>
    </Container>
  );
}
