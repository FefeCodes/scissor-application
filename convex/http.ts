import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api, internal } from "./_generated/api";

const http = httpRouter();

http.route({
  pathPrefix: "/",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const slug = url.pathname.split("/")[1]?.toLowerCase();

    if (!slug || slug === "") {
      return new Response("Missing Anchor", { status: 400 });
    }

    const linkRecord = await ctx.runQuery(api.links.getLinkBySlug, { slug });
    if (!linkRecord) {
      return new Response("Short Link Not Found", { status: 404 });
    }

    const now = Date.now();
    const dynamicExpired = linkRecord.expiresAt
      ? now > linkRecord.expiresAt
      : false;
    if (linkRecord.isExpired || dynamicExpired) {
      return new Response(
        `<html>
          <body style="background:#0f172a;color:#f1f5f9;font-family:sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;margin:0">
            <h1 style="color:#f43f5e;font-size:3rem;margin-bottom:0.5rem">410 • Gone</h1>
            <p style="color:#94a3b8;font-size:1.2rem">This Scissor tracking link has expired and is no longer available.</p>
          </body>
        </html>`,
        { status: 410, headers: { "Content-Type": "text/html" } },
      );
    }

    const userAgent = request.headers.get("User-Agent") || "";
    const device = /Mobile|Android|iPhone|iPad/i.test(userAgent)
      ? "mobile"
      : "desktop";

    const rawReferrer = request.headers.get("Referer") || "";
    let referrer = "direct";
    if (rawReferrer) {
      try {
        referrer = new URL(rawReferrer).hostname.replace("www.", "");
      } catch {
        referrer = "unknown";
      }
    }

    const country =
      request.headers.get("CF-IPCountry") ||
      request.headers.get("X-Vercel-IP-Country") ||
      "unknown";

    await ctx.runMutation(internal.links.recordClickAndIncrement, {
      linkId: linkRecord._id,
      device,
      referrer,
      country: country.toUpperCase(),
    });

    return new Response(null, {
      status: 302,
      headers: { Location: linkRecord.longUrl },
    });
  }),
});

export default http;
