// siteScreenshots.spec.ts
import { test, expect } from "@playwright/test";
import { argosScreenshot } from "@argos-ci/playwright";
import * as path from "path";
import * as fs from "fs";

const siteUrl =
  process.env.SITE_URL ??
  "https://deploy-preview-8288--docusaurus-2.netlify.app";

console.log("siteUrl test", siteUrl);

/*
const pathnames: (string | [string, object])[] = [
  ["/", { maxDiffPixels: 100 }],
  "/docs",
  "/docs/advanced/",
  "/docs/advanced/architecture/",

  "/docs/markdown-features/",
  "/docs/markdown-features/admonitions/",
  // "/docs/markdown-features/assets/", // TODO re-enable after https://github.com/argos-ci/argos-playwright/issues/1
  ["/docs/markdown-features/code-blocks/", { maxDiffPixels: 1000 }],
  "/docs/markdown-features/diagrams/",
  "/docs/markdown-features/head-metadata/",
  "/docs/markdown-features/links/",
  "/docs/markdown-features/math-equations/",
  "/docs/markdown-features/plugins/",
  "/docs/markdown-features/react/",
  "/docs/markdown-features/tabs/",
  "/docs/markdown-features/toc/",

  // "/blog",  // TODO re-enable after https://github.com/argos-ci/argos-playwright/issues/1
  "/blog/2017/12/14/introducing-docusaurus/",

  "/changelog/2.2.0",
  "/search",
];

 */

const BlacklistedPathnames: string[] = [
  // TODO remove once MDX 2 PR merged
  // reports unimportant false positives, see https://app.argos-ci.com/slorber/docusaurus-visual-tests/builds/10/40206590
  "/docs/api/themes/configuration",
  // reports unimportant false positives, see https://app.argos-ci.com/slorber/docusaurus-visual-tests/builds/10/40206618
  "/docs/api/themes/@docusaurus/theme-classic",
  // reports unimportant false positives, see https://app.argos-ci.com/slorber/docusaurus-visual-tests/builds/10/40206528
  "/docs/installation",
];

const getPathnames = function (): string[] {
  const sitemap = JSON.parse(
    fs.readFileSync("./docusaurus-sitemap.json") as any
  );

  const urls: string[] = sitemap.urlset.url.map((url) => url.loc);
  const pathnames = urls
    .map((url) => url.replace("https://docusaurus.io/", "/"))
    .filter(
      (pathname) =>
        !pathname.startsWith("/changelog") &&
        !pathname.match(/^\/docs\/(\d\.\d\.\d)|(next)\//) &&
        !BlacklistedPathnames.includes(pathname)
    );

  pathnames.sort();

  console.log("Pathnames:\n", JSON.stringify(pathnames, null, 2));

  return pathnames;
};

// Hide elements that may vary between prod/preview
const stylesheet = `
iframe, 
article.yt-lite, 
.theme-last-updated,
[class*='playgroundPreview'] {
  visibility: hidden;
}
`;

function pathnameToArgosName(pathname: string): string {
  function removeTrailingSlash(str: string): string {
    return str.endsWith("/") ? str.slice(0, -1) : str;
  }
  function removeLeadingSlash(str: string): string {
    return str.startsWith("/") ? str.slice(1) : str;
  }

  pathname = removeTrailingSlash(pathname);
  pathname = removeLeadingSlash(pathname);

  if (pathname === "") {
    return "_ROOT";
  }

  return pathname;
}

test.describe("Docusaurus site screenshots", () => {
  const pathnames = getPathnames();

  for (const pathnameItem of pathnames) {
    const [pathname, options] =
      typeof pathnameItem === "string" ? [pathnameItem, {}] : pathnameItem;

    test(`pathname ${pathname}`, async ({ page }) => {
      const url = siteUrl + pathname;
      await page.goto(url);
      await page.addStyleTag({ content: stylesheet });
      // await expect(page).toHaveScreenshot({ fullPage: true, ...options });
      await argosScreenshot(page, pathnameToArgosName(pathname));
    });
  }
});
