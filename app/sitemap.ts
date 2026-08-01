import type { MetadataRoute } from "next";
import { createServiceClient } from "@/lib/supabase/service";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://unipodium.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const svc = createServiceClient();

  const [{ data: orgs }, { data: posts }] = await Promise.all([
    svc.from("orgs").select("slug, created_at").eq("status", "approved"),
    svc.from("bulletin_posts").select("id, created_at").eq("status", "approved"),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: APP_URL, priority: 1, changeFrequency: "weekly" },
    { url: `${APP_URL}/dashboard`, priority: 0.9, changeFrequency: "daily" },
    { url: `${APP_URL}/orgs`, priority: 0.8, changeFrequency: "daily" },
    { url: `${APP_URL}/bulletin`, priority: 0.8, changeFrequency: "daily" },
    { url: `${APP_URL}/map`, priority: 0.6, changeFrequency: "weekly" },
    { url: `${APP_URL}/calendar`, priority: 0.6, changeFrequency: "daily" },
    { url: `${APP_URL}/contact`, priority: 0.4, changeFrequency: "monthly" },
    { url: `${APP_URL}/help`, priority: 0.4, changeFrequency: "monthly" },
    { url: `${APP_URL}/ambassador`, priority: 0.5, changeFrequency: "monthly" },
  ];

  const orgRoutes: MetadataRoute.Sitemap = (orgs ?? []).map((o) => ({
    url: `${APP_URL}/orgs/${o.slug}`,
    lastModified: o.created_at ? new Date(o.created_at) : undefined,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const postRoutes: MetadataRoute.Sitemap = (posts ?? []).map((p) => ({
    url: `${APP_URL}/bulletin/${p.id}`,
    lastModified: p.created_at ? new Date(p.created_at) : undefined,
    changeFrequency: "never",
    priority: 0.5,
  }));

  return [...staticRoutes, ...orgRoutes, ...postRoutes];
}
