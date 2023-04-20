import { test } from "@playwright/test";
import { argosScreenshot } from "@argos-ci/playwright";
import * as fs from "fs";
import * as cheerio from "cheerio";

const siteUrl =
  process.env.SITE_URL ??
  "https://deploy-preview-8288--docusaurus-2.netlify.app";

function extractSitemapUrls() {
  const sitemapString = fs.readFileSync("./sitemap.xml") as any;
  const $ = cheerio.load(sitemapString, { xmlMode: true });
  const urls: string[] = [];
  $("loc").each(function () {
    urls.push($(this).text());
  });
  return urls;
}

const BlacklistedPathnames: string[] = [
  "/feature-requests", // Flaky because of Canny widget
  "/community/canary", // Flaky because of dynamic canary version fetched from npm

  // TODO remove once MDX 2 PR merged
  // reports unimportant false positives, see https://app.argos-ci.com/slorber/docusaurus-visual-tests/builds/10/40206590
  "/docs/api/themes/configuration",
  // reports unimportant false positives, see https://app.argos-ci.com/slorber/docusaurus-visual-tests/builds/10/40206618
  "/docs/api/themes/@docusaurus/theme-classic",

  // TODO re-enable it later, index modified for mdx v2
  "/tests/pages",

  // Legacy MDX v1 code block test page: to update or delete?
  "/tests/pages/code-block-tests",

  // those new pages only exist in the MDX v2 branch
  "/tests/pages/markdown-tests-md",
  "/tests/pages/markdown-tests-mdx",
];

function isBlacklisted(pathname: string) {
  return (
    // changelog docs
    pathname.startsWith("/changelog") ||
    // versioned docs
    pathname.match(/^\/docs\/(\d\.\d\.\d)|(next)\//) ||
    // manually excluded urls
    BlacklistedPathnames.includes(pathname)
  );
}

const getPathnames = function (): string[] {
  const urls = extractSitemapUrls();
  const pathnamesUnfiltered = urls.map((url) => new URL(url).pathname);
  const pathnames = pathnamesUnfiltered.filter(
    (pathname) => !isBlacklisted(pathname)
  );
  pathnames.sort();
  console.log("Pathnames:\n", JSON.stringify(pathnames, null, 2));
  console.log("Pathnames before filtering", pathnamesUnfiltered.length);
  console.log("Pathnames after filtering", pathnames.length);
  return pathnames;
};

// Hide elements that may vary between prod/preview
const stylesheet = `
iframe, 
article.yt-lite, 
.theme-last-updated,
.avatar__photo,
img[src$=".gif"],
h2#using-jsx-markup ~ div > div[class*='browserWindowBody']:has(b),
[class*='playgroundPreview'] {
  visibility: hidden;
}

/* Footnotes rendering has changed in MDX v1 => v2: let's ignore footnotes completely */
.footnotes {
  display: none;
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
    return "index";
  }

  return pathname;
}

function createPathnameTest(pathname: string) {
  test(`pathname ${pathname}`, async ({ page }) => {
    const url = siteUrl + pathname;
    await page.goto(url);
    await page.addStyleTag({ content: stylesheet });
    // await expect(page).toHaveScreenshot({ fullPage: true, ...options });
    await argosScreenshot(page, pathnameToArgosName(pathname));
  });
}

test.describe("Docusaurus site screenshots", () => {
  const pathnames = getPathnames();

  pathnames.forEach(createPathnameTest);
});
