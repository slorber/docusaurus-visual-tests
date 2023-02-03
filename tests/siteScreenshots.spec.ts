// siteScreenshots.spec.ts
import { test, expect } from "@playwright/test";

const siteUrl = process.env.SITE_URL ?? "https://docusaurus.io";

console.log("siteUrl", siteUrl);

const pathnames: (string | [string, object])[] = [
  ["/", { maxDiffPixels: 100 }],
  "/docs",
  "/docs/advanced/",
  "/docs/advanced/architecture/",

  "/docs/markdown-features/",
  "/docs/markdown-features/admonitions/",
  "/docs/markdown-features/assets/",
  ["/docs/markdown-features/code-blocks/", { maxDiffPixels: 1000 }],
  "/docs/markdown-features/diagrams/",
  "/docs/markdown-features/head-metadata/",
  "/docs/markdown-features/links/",
  "/docs/markdown-features/math-equations/",
  "/docs/markdown-features/plugins/",
  "/docs/markdown-features/react/",
  "/docs/markdown-features/tabs/",
  "/docs/markdown-features/toc/",

  "/blog",
  "/blog/2017/12/14/introducing-docusaurus/",

  "/changelog/2.2.0",
  "/search",
];

// Hide elements that may vary between prod/preview
const stylesheet = `
iframe, 
article.yt-lite, 
.theme-last-updated {
  visibility: hidden;
}
`;

test.describe("Docusaurus site screenshots", () => {
  for (const pathnameItem of pathnames) {
    const [pathname, options] =
      typeof pathnameItem === "string" ? [pathnameItem, {}] : pathnameItem;

    test(`pathname ${pathname}`, async ({ page }) => {
      const url = siteUrl + pathname;
      await page.goto(url);
      await page.addStyleTag({ content: stylesheet });
      await expect(page).toHaveScreenshot({ fullPage: true, ...options });
    });
  }
});
