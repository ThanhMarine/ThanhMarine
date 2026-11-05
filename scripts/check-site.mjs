// Post-deploy checks for the personal site.
// Usage: node scripts/check-site.mjs https://thanhmarine.viettest.io.vn
// Exits with code 1 when a required check fails.

const base = new URL(process.argv[2] || "https://thanhmarine.viettest.io.vn");
base.hash = "";

const results = [];
const PLACEHOLDER = "REPLACE_WITH_YOUR_GOOGLE_SEARCH_CONSOLE_TOKEN";

function record(name, ok, detail = "") {
  results.push({ name, ok, detail });
}

async function get(path, options = {}) {
  const url = new URL(path, base);
  const response = await fetch(url, {
    redirect: "follow",
    signal: AbortSignal.timeout(20000),
    ...options,
  });
  return { url, response, text: options.method === "HEAD" ? "" : await response.text() };
}

async function main() {
  if (base.protocol !== "https:") {
    record("HTTPS", false, `Expected https, received ${base.protocol}`);
  } else {
    record("HTTPS", true, base.origin);
  }

  const home = await get("/");
  record("Homepage returns 200", home.response.status === 200, `HTTP ${home.response.status}`);
  record("Homepage is HTML", (home.response.headers.get("content-type") || "").includes("text/html"), home.response.headers.get("content-type") || "no content-type");

  const html = home.text;
  record("Title tag", /<title>[^<]{10,}<\/title>/i.test(html), "Non-empty <title> found");
  record("Canonical URL", html.includes(`rel="canonical"`) && html.includes(base.origin), base.origin);

  const gsc = html.match(/<meta\s+name="google-site-verification"\s+content="([^"]*)"/i);
  const token = gsc ? gsc[1] : "";
  record(
    "Google Search Console verification tag",
    Boolean(token) && token !== PLACEHOLDER && token.length > 20,
    token === PLACEHOLDER ? "Still using the placeholder token" : token ? "Token present" : "Meta tag missing"
  );

  record("Open Graph image", html.includes(`${base.origin}/assets/og-image.png`), "og:image points to the canonical origin");
  record("Privacy policy link", html.includes("privacy.html"), "privacy.html linked from homepage");
  record("Terms link", html.includes("terms.html"), "terms.html linked from homepage");

  for (const path of ["/privacy.html", "/terms.html", "/robots.txt", "/sitemap.xml", "/site.webmanifest", "/assets/og-image.png", "/assets/favicon.svg", "/assets/icon-192.png", "/assets/icon-512.png", "/assets/apple-touch-icon.png"]) {
    const result = await get(path, { method: "HEAD" });
    record(`200 ${path}`, result.response.status === 200, `HTTP ${result.response.status}`);
  }

  const robots = await get("/robots.txt");
  record("robots.txt references sitemap", robots.text.includes(`${base.origin}/sitemap.xml`), "Sitemap directive present");

  const sitemap = await get("/sitemap.xml");
  record("sitemap.xml contains homepage", sitemap.text.includes(`<loc>${base.origin}/</loc>`), "Homepage listed");

  const failed = results.filter((item) => !item.ok);
  const pad = Math.max(...results.map((item) => item.name.length));

  console.log(`\nChecking ${base.origin}\n`);
  for (const item of results) {
    console.log(`${item.ok ? "PASS" : "FAIL"}  ${item.name.padEnd(pad)}  ${item.detail}`);
  }
  console.log(`\n${results.length - failed.length}/${results.length} checks passed.`);

  if (failed.length) process.exitCode = 1;
}

main().catch((error) => {
  console.error("Check failed:", error.message);
  process.exitCode = 1;
});
