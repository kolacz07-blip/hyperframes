// Renders the strip icons (240x240 transparent PNGs) from icons.html.
//   cp autoteile/<slug>/assets/vendor/three.min.js .claude/skills/autoteile-video/scripts/icons/  (once, not committed)
//   node .claude/skills/autoteile-video/scripts/icons/render-icons.cjs <out-dir> [name ...]
// Names are the keys of MODELS in icons.html. Add a model there for a new part.
const { chromium } = require("playwright");
const path = require("path");
const out = process.argv[2];
const names = process.argv.slice(3);
(async () => {
  const b = await chromium.launch({
    args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
  });
  const p = await b.newPage({ viewport: { width: 240, height: 240 }, deviceScaleFactor: 1 });
  p.on("pageerror", (e) => console.log("ERR", e.message));
  await p.goto("file://" + path.join(__dirname, "icons.html"));
  await p.waitForFunction("window.__ready === true");
  const list = names.length ? names : await p.evaluate(() => Object.keys(window.MODELS || {}));
  for (const n of list) {
    await p.evaluate((n) => window.renderIcon(n), n);
    await p
      .locator("canvas")
      .screenshot({ path: path.join(out, `${n}.png`), omitBackground: true });
    console.log("icon", n);
  }
  await b.close();
})();
