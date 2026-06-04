import { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { SignedIn, SignedOut, SignInButton } from "@clerk/clerk-react";
import QRCodeDisplay from "./QRCodeDisplay";
import toast from "react-hot-toast";

export default function UrlShortener() {
  const [inputUrl, setInputUrl] = useState("");
  const [customSlug, setCustomSlug] = useState("");
  const [debouncedSlug, setDebouncedSlug] = useState("");
  const [latestShortLink, setLatestShortLink] = useState<string | null>(null);

  const [isPending, setIsPending] = useState(false);

  const createLink = useMutation(api.links.createShortLink);

  //const myLinks = useQuery(api.links.getUserLinks);

  const isSlugAvailable = useQuery(
    api.links.checkSlugAvailable,
    debouncedSlug ? { slug: debouncedSlug } : "skip",
  );

  useEffect(() => {
    if (!customSlug.trim()) {
      setDebouncedSlug("");
      return;
    }
    const timer = setTimeout(() => setDebouncedSlug(customSlug.trim()), 400);
    return () => clearTimeout(timer);
  }, [customSlug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputUrl) return;

    setIsPending(true);
    setLatestShortLink(null);

    try {
      const resultSlug = await createLink({
        longUrl: inputUrl,
        customSlug: customSlug.trim() || undefined,
      });

      const finalUrl = `${window.location.origin}/${resultSlug}`;
      setLatestShortLink(finalUrl);
      setInputUrl("");
      setCustomSlug("");
      toast.success("Short shortcut link created!");
    } catch (error: any) {
      toast.error(error.message.replace("Uncaught Error: ", ""));
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="bg-gray-900 text-gray-100 flex flex-col items-center py-12 px-4 min-h-screen">
      <header className="mb-12 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight mb-2 text-blue-400">
          Scissor
        </h1>
        <p className="text-gray-400 font-light">
          Fast, minimal, analytical URL shortcut engine.
        </p>
      </header>

      <SignedIn>
        <div className="w-full max-w-md space-y-4 mb-8 flex flex-col items-center">
          <form
            onSubmit={handleSubmit}
            className="bg-gray-800 p-6 rounded-xl shadow-md border border-gray-700 space-y-4 w-full"
          >
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-300">
                Enter URL
              </label>
              <input
                type="text"
                disabled={isPending}
                placeholder="https://example.com/long-url"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                className="w-full p-3 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-300">
                Custom Slug (Optional)
              </label>
              <div className="relative">
                <input
                  type="text"
                  disabled={isPending}
                  placeholder="custom-slug"
                  value={customSlug}
                  onChange={(e) => setCustomSlug(e.target.value)}
                  className="w-full p-3 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10 disabled:opacity-50"
                />
                {customSlug.trim() && (
                  <div className="absolute right-3 top-1/2 -trangray-y-1/2 text-sm font-bold">
                    {isSlugAvailable === undefined ? (
                      <span className="text-gray-400 animate-pulse">...</span>
                    ) : isSlugAvailable ? (
                      <span className="text-green-400">✓</span>
                    ) : (
                      <span className="text-red-400">✗</span>
                    )}
                  </div>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={
                isPending || (customSlug.trim() !== "" && !isSlugAvailable)
              }
              className="w-full bg-blue-600 hover:bg-blue-500 transition-colors py-3 rounded-lg font-semibold shadow-md disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Shortening Link...
                </>
              ) : (
                "Shorten URL"
              )}
            </button>
          </form>

          {latestShortLink && (
            <>
              <div className="p-4 bg-blue-950/40 border border-blue-800 rounded-lg text-center shadow-inner w-full animate-fadeIn">
                <p className="text-xs text-gray-400 uppercase tracking-wider font-bold mb-1">
                  Shortened Link Ready
                </p>
                <a
                  href={latestShortLink}
                  target="_blank"
                  rel="noreferrer"
                  className="text-lg font-mono text-blue-400 hover:text-blue-300 underline break-all font-semibold"
                >
                  {latestShortLink}
                </a>
              </div>
              <QRCodeDisplay url={latestShortLink} />
            </>
          )}
        </div>
      </SignedIn>

      <SignedOut>
        <div className="w-full max-w-md bg-gray-800 p-8 rounded-xl shadow-md mb-8 text-center border border-gray-700">
          <h2 className="text-lg font-bold text-gray-200 mb-2">
            Create custom links
          </h2>
          <p className="text-sm text-gray-400 mb-6">
            Sign up or sign in to start shortening your links and viewing
            detailed usage analytics.
          </p>
          <SignInButton mode="modal">
            <button className="bg-blue-600 hover:bg-blue-500 transition-colors w-full py-3 rounded-lg font-semibold cursor-pointer">
              Get Started
            </button>
          </SignInButton>
        </div>
      </SignedOut>
    </div>
  );
}
