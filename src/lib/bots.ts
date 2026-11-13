// Crawlers that collect pages to train or feed AI models, plus bulk scrapers.
// robots.txt asks them to stay out; the proxy refuses the ones that announce themselves.
// Search engines (Googlebot, Bingbot) and link previews (WhatsApp, X, Facebook) are not on this list.
export const AI_BOTS = [
  "GPTBot", "ChatGPT-User", "OAI-SearchBot", "ClaudeBot", "Claude-Web", "Claude-User", "Claude-SearchBot", "anthropic-ai",
  "CCBot", "Google-Extended", "GoogleOther", "Applebot-Extended", "PerplexityBot", "Perplexity-User", "Bytespider",
  "Amazonbot", "meta-externalagent", "meta-externalfetcher", "FacebookBot", "Diffbot", "cohere-ai", "cohere-training-data-crawler",
  "ImagesiftBot", "Omgilibot", "omgili", "YouBot", "AI2Bot", "Ai2Bot-Dolma", "PetalBot", "Scrapy", "DuckAssistBot",
  "MistralAI-User", "Timpibot", "Webzio-Extended", "img2dataset", "FirecrawlAgent", "Kangaroo Bot", "Sidetrade indexer bot",
]

const PATTERN = new RegExp(AI_BOTS.map((b) => b.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|"), "i")

export function isAiBot(ua: string | null) {
  return !!ua && PATTERN.test(ua)
}
