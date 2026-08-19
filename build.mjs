import { cp, mkdir, rm } from "node:fs/promises";

const sourceFiles = [
  "aviso-legal.html",
  "cookie-consent.js",
  "cookies.html",
  "index.html",
  "privacidad.html",
  "robots.txt",
  "script.js",
  "sitemap.xml",
  "styles.css"
];

await rm("dist", { recursive: true, force: true });
await mkdir("dist", { recursive: true });

for (const file of sourceFiles) {
  await cp(file, `dist/${file}`);
}

await cp("public", "dist/public", { recursive: true });
