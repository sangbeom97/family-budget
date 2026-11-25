import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/intro", "/blog", "/couple-budget", "/articles", "/notices"],
      disallow: [
        "/api/",
        "/dashboard/",
        "/auth/",
        "/admin/",
        "/support/",
        "/login/",
        "/invite/",
      ],
    },
    sitemap: "https://www.jellian.com/sitemap.xml",
    host: "https://www.jellian.com",
  };
}
