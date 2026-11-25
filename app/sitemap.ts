import type { MetadataRoute } from "next";

const SITE_URL = "https://www.jellian.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return [
    {
      url: SITE_URL,
      lastModified,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${SITE_URL}/intro`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/blog`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/couple-budget`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/articles`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    ...[
      "newlywed-budget-split",
      "couple-joint-account",
      "newlywed-fixed-expenses",
      "couple-budget-routine",
    ].map((slug) => ({
      url: `${SITE_URL}/articles/${slug}`,
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    {
      url: `${SITE_URL}/notices`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.5,
    },
  ];
}
