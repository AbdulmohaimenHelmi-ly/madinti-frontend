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
  Paper,
} from "@mui/material";
import RateReviewIcon from "@mui/icons-material/RateReview";
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
  const [loadedProductId, setLoadedProductId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [newRating, setNewRating] = useState<number | null>(5);
  const [newComment, setNewComment] = useState("");
  const loading = loadedProductId !== id;

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      productsApi.getById(id),
      reviewsApi.getByProduct(id).catch(() => ({ data: { data: [] } })),
    ])
      .then(([productRes, reviewsRes]) => {
        if (cancelled) return;

        setProduct(productRes.data.data);
        setReviews(reviewsRes.data.data);
        setError(null);
        setLoadedProductId(id);
      })
      .catch(() => {
        if (cancelled) return;

        setError(t("common.error"));
        setLoadedProductId(id);
      });

    return () => {
      cancelled = true;
    };
  }, [id, t]);

  // Fire-and-forget view tracking for the recommendation engine. Runs on every
  // product detail visit (dedup handled server-side if needed).
  useEffect(() => {
    if (!id) return;
    productsApi.trackView(id).catch(() => {
      // tracking is best-effort; never block the page
    });
  }, [id]);

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
    <Container maxWidth="lg" sx={{ py: 5 }}>
      <ProductDetails product={product} />

      <Box sx={{ mt: 8 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" sx={{ fontWeight: 800 }}>
            {t("product.reviews")} ({reviews.length})
          </Typography>
          <Box
            sx={(theme) => ({
              width: 48,
              height: 4,
              borderRadius: 2,
              background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
              mt: 1,
            })}
          />
        </Box>
        <Divider sx={{ mb: 4 }} />

        <Card sx={{ mb: 4, overflow: "visible" }}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2.5 }}>
              <RateReviewIcon color="primary" />
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {t("product.addReview")}
              </Typography>
            </Box>
            <Box
              sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}
            >
              <Typography sx={{ fontWeight: 500 }}>{t("product.rating")}:</Typography>
              <Rating
                value={newRating}
                onChange={(_, val) => setNewRating(val)}
                size="large"
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
            <Button
              variant="contained"
              onClick={handleSubmitReview}
              sx={{ borderRadius: 2, px: 4 }}
            >
              {t("product.addReview")}
            </Button>
          </CardContent>
        </Card>

        {reviews.map((review) => (
          <Paper
            key={review.id}
            elevation={0}
            sx={{
              mb: 2,
              p: 3,
              borderRadius: 3,
              border: "1px solid",
              borderColor: "grey.200",
              transition: "border-color 0.2s ease",
              "&:hover": { borderColor: "grey.300" },
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 2,
                mb: 1.5,
              }}
            >
              <Avatar
                src={review.user?.avatar || undefined}
                sx={{
                  bgcolor: "primary.main",
                  width: 44,
                  height: 44,
                  fontWeight: 700,
                }}
              >
                {review.user?.name?.[0]}
              </Avatar>
              <Box>
                <Typography sx={{ fontWeight: 700 }}>
                  {review.user?.name || ""}
                </Typography>
                <Rating value={Number(review.rating) || 0} readOnly size="small" />
              </Box>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ ml: "auto", fontWeight: 500 }}
              >
                {new Date(review.created_at).toLocaleDateString(
                  locale === "ar" ? "ar-LY" : "en-US"
                )}
              </Typography>
            </Box>
            {review.comment && (
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7, pl: 7 }}>
                {review.comment}
              </Typography>
            )}
          </Paper>
        ))}
      </Box>
    </Container>
  );
}
