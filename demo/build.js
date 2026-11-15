// Bundles demo/ into one self-contained page for publishing: demo/publish/victoria-deneme.html
// Run after changing anything in demo/: node demo/build.js
// The page has no doctype/html/head/body tags because the hosting adds them.
const fs = require("fs");
const path = require("path");
const D = __dirname + path.sep;
const css = fs.readFileSync(D + "assets/styles.css", "utf8").replace(/@import url\([^)]*\);\s*/g, "");
const logo = "data:image/jpeg;base64," + fs.readFileSync(D + "assets/logo.jpg").toString("base64");
const js = ["data.js", "core.js", "screens-home.js", "screens-ops.js", "screens-kasa.js", "screens-admin.js"]
  .map((f) => "/* ---- " + f + " ---- */\n" + fs.readFileSync(D + "js/" + f, "utf8")).join("\n");
if (/<\/script/i.test(js)) throw new Error("JS contains </script>");
const page = `<title>Victoria Deneme</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&family=Cormorant+Garamond:wght@600&display=swap">
<style>
:root{color-scheme:light}
html,body{background:#f5f7fa}
${css}
</style>
<div id="app"><p style="padding:24px">Yükleniyor…</p></div>
<script src="https://unpkg.com/lucide@0.460.0/dist/umd/lucide.min.js"></script>
<script>window.V = { LOGO: ${JSON.stringify(logo)} };</script>
<script>
${js}
</script>
`;
fs.mkdirSync(D + "publish", { recursive: true });
fs.writeFileSync(D + "publish/victoria-deneme.html", page);
console.log("bundle written", Math.round(page.length / 1024) + " KB");
