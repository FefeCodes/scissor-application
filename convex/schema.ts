import { v } from "convex/values";
import { defineSchema, defineTable } from "convex/server";

export default defineSchema({
  links: defineTable({
    longUrl: v.string(),
    slug: v.string(),
    userId: v.optional(v.string()),
    createdAt: v.number(),
    clicks: v.number(),
    expiresAt: v.optional(v.number()),
    isExpired: v.boolean(),
  }).index("by_slug", ["slug"]),

  clicks: defineTable({
    linkId: v.id("links"),
    timestamp: v.number(),
    country: v.string(),
    referrer: v.string(),
    device: v.string(),
  }),
});
