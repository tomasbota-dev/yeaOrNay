import { build } from "esbuild";
import { mkdir, readFile, writeFile, unlink } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const { outputFiles } = await build({
  entryPoints: [fileURLToPath(new URL("../frontend/public-render.tsx", import.meta.url))],
  bundle: true, write: false, platform: "node", format: "esm", jsx: "automatic",
  // React's Node renderer uses CommonJS internals; leave installed packages external.
  packages: "external",
});
const renderer = new URL("../.wrangler-out/seo-render.mjs", import.meta.url);
await mkdir(new URL("../.wrangler-out/", import.meta.url), { recursive: true });
await writeFile(renderer, outputFiles[0].contents);
const { renderPublicPage, languages, pageIds } = await import(renderer.href);
const template = await readFile(new URL("../dist/client/public.html", import.meta.url), "utf8");
for (const language of languages) {
  for (const page of pageIds) {
    const directory = new URL(`../dist/client/${language}/${page === "home" ? "" : `${page}/`}`, import.meta.url);
    await mkdir(directory, { recursive: true });
    await writeFile(new URL("index.html", directory), renderPublicPage(template, language, page));
  }
}
// The template is not a public page and must never be served as one.
await unlink(new URL("../dist/client/public.html", import.meta.url));
console.log("Prerendered 10 English/Portuguese public pages.");
