import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { customAlphabet } from "nanoid";

const generateSlug = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 6);
const PHISHING_BLOCKLIST = [
  "phishing-site.com",
  "malicious-url.org",
  "scam-link.net",
];

const RESERVED_SLUGS = ["api", "dashboard", "admin", "login", "register"];
const SLUG_REGEX = /^[a-z0-9-]{3,50}$/;

export const recordClickAndIncrement = internalMutation({
  args: {
    linkId: v.id("links"),
    device: v.string(),
    referrer: v.string(),
    country: v.string(),
  },
  handler: async (ctx, args) => {
    const link = await ctx.db.get(args.linkId);
    if (!link) return;

    await ctx.db.insert("clicks", {
      linkId: args.linkId,
      timestamp: Date.now(),
      device: args.device,
      referrer: args.referrer,
      country: args.country,
    });
  },
});

export const createShortLink = mutation({
  args: {
    longUrl: v.string(),
    customSlug: v.optional(v.string()),
    clientIp: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(args.longUrl);
    } catch {
      throw new Error(
        "Invalid URL format. Please supply a correct link address.",
      );
    }

    const hostname = parsedUrl.hostname.toLowerCase();
    if (
      PHISHING_BLOCKLIST.some(
        (bad) => hostname === bad || hostname.endsWith("." + bad),
      )
    ) {
      throw new Error("Link is blacklisted.");
    }

    const identity = await ctx.auth.getUserIdentity();
    const userId = identity?.subject;

    if (!userId) {
      if (!args.clientIp) {
        throw new Error("Missing validation context.");
      }

      const startOfToday = new Date().setHours(0, 0, 0, 0);

      const anonymousCreationsToday = await ctx.db
        .query("links")
        .filter((q) =>
          q.and(
            q.eq(q.field("userId"), undefined),
            q.gte(q.field("_creationTime"), startOfToday),
          ),
        )
        .collect();

      if (anonymousCreationsToday.length >= 5) {
        throw new Error(
          "Rate Limit Exceeded: Anonymous creations are capped at 5 links per day. Please sign up to secure unlimited transformations!",
        );
      }
    }

    let finalSlug = "";

    if (args.customSlug && args.customSlug.trim().length > 0) {
      const normalized = args.customSlug.trim().toLowerCase();

      if (RESERVED_SLUGS.includes(normalized)) {
        throw new Error(
          `The anchor code "${normalized}" is reserved for system architecture paths.`,
        );
      }

      if (!SLUG_REGEX.test(normalized)) {
        throw new Error(
          "Invalid custom slug. Must be 3–50 characters and contain only lowercase letters, numbers, and hyphens.",
        );
      }

      const existing = await ctx.db
        .query("links")
        .withIndex("by_slug", (q) => q.eq("slug", normalized))
        .unique();
      if (existing) {
        throw new Error(
          "This custom link code is already taken. Please try another one.",
        );
      }

      finalSlug = normalized;
    } else {
      let isUnique = false;
      let attempts = 0;
      while (!isUnique && attempts < 5) {
        finalSlug = generateSlug();
        const testMatch = await ctx.db
          .query("links")
          .withIndex("by_slug", (q) => q.eq("slug", finalSlug))
          .unique();
        if (!testMatch) isUnique = true;
        attempts++;
      }
      if (!isUnique)
        throw new Error("Server error while shortening a unique short link.");
    }

    await ctx.db.insert("links", {
      longUrl: args.longUrl,
      slug: finalSlug,
      userId: userId || undefined,
      isExpired: false,
      createdAt: Date.now(),
      clicks: 0,
    });

    return finalSlug;
  },
});

export const getAllLinks = query({
  handler: async (ctx) => {
    return await ctx.db.query("links").collect();
  },
});

export const checkSlugAvailable = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("links")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();

    return existing === null;
  },
});

export const getLinkBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("links")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();
  },
});

export const getUserLinks = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const userId = identity.subject;
    const links = await ctx.db.query("links").collect();

    return links
      .filter((l) => l.userId === userId)
      .sort((a, b) => b._creationTime - a._creationTime);
  },
});

export const deleteLink = mutation({
  args: { id: v.id("links") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized access.");

    const link = await ctx.db.get(args.id);
    if (!link || link.userId !== identity.subject) {
      throw new Error("Link not found or ownership mismatch.");
    }

    const associatedClicks = await ctx.db.query("clicks").collect();

    const targetClicks = associatedClicks.filter((c) => c.linkId === args.id);
    for (const click of targetClicks) {
      await ctx.db.delete(click._id);
    }

    await ctx.db.delete(args.id);
  },
});

export const getLinkClicks = query({
  args: { linkId: v.id("links") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized access.");

    const link = await ctx.db.get(args.linkId);
    if (!link || link.userId !== identity.subject) {
      throw new Error("Link details inaccessible.");
    }

    const allClicks = await ctx.db.query("clicks").collect();
    return allClicks
      .filter((c) => c.linkId === args.linkId)
      .sort((a, b) => a.timestamp - b.timestamp);
  },
});
