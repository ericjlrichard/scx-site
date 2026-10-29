// Ships the site to swingconnexion.com. Run as `npm run deploy` (see the
// README's Deploy section). Four steps, and it stops at the first that fails:
//
// 1. Every VITE_* setting the code reads (import.meta.env.VITE_... anywhere
//    in src/) has to be set in .env / .env.local / .env.production. Vite
//    builds a missing one in as empty without a word -- that's how a deploy
//    once shipped a signup page with no reCAPTCHA key. The env files aren't
//    in git; copy them from /srv/scx-site/ on the server if they're missing.
// 2. Build.
// 3. Check each of those values actually landed in the built JavaScript.
// 4. Copy dist/ into a fresh temp folder on the server, then into Caddy's
//    root (/srv/scx-site/dist, owned by www-data, hence sudo) -- everything
//    except `uploads`, which on the server is a link to the real uploads
//    folder outside dist and must not be replaced by the build's empty one.
import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { loadEnv } from "vite";

const HOST = "debian@51.79.65.31";
const TMP = "/tmp/scx-site-dist";
const ROOT = "/srv/scx-site/dist";
// Settings the code has its own fallback for, so they may be left unset.
const OPTIONAL = new Set(["VITE_SITE_ORIGIN"]);

const run = (cmd, args) => execFileSync(cmd, args, { stdio: "inherit" });
const filesUnder = (dir, ext) =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return filesUnder(path, ext);
    return ext.some((e) => name.endsWith(e)) ? [path] : [];
  });
const fail = (message) => {
  console.error(`\nDeploy stopped: ${message}`);
  process.exit(1);
};

// 1. Settings
const env = loadEnv("production", process.cwd(), "VITE_");
const used = new Set();
for (const file of filesUnder("src", [".js", ".jsx"])) {
  for (const [, name] of readFileSync(file, "utf8").matchAll(/import\.meta\.env\.(VITE_\w+)/g)) used.add(name);
}
const required = [...used].filter((name) => !OPTIONAL.has(name)).sort();
const missing = required.filter((name) => !env[name]?.trim());
if (missing.length > 0) {
  fail(`not set in .env / .env.local / .env.production: ${missing.join(", ")}.\nCopy the env files from ${HOST}:/srv/scx-site/ if they're missing.`);
}
console.log(`Settings OK: ${required.join(", ")}`);

// 2. Build
run(process.execPath, [join("node_modules", "vite", "bin", "vite.js"), "build"]);

// 3. Baked in?
const bundle = filesUnder(join("dist", "assets"), [".js"]).map((f) => readFileSync(f, "utf8")).join("\n");
const notBaked = required.filter((name) => !bundle.includes(env[name].trim()));
if (notBaked.length > 0) fail(`built, but these values aren't in the bundle: ${notBaked.join(", ")}`);
console.log("Bundle OK: every setting is in the build.");

// 4. Upload
run("ssh", [HOST, `rm -rf ${TMP}`]);
run("scp", ["-q", "-r", "dist", `${HOST}:${TMP}`]); // TMP doesn't exist, so dist's contents land in it
run("ssh", [
  HOST,
  `cd ${TMP} && for f in $(ls -A | grep -vx uploads); do ` +
    `sudo cp -r "$f" ${ROOT}/ && sudo chown -R www-data:www-data "${ROOT}/$f" && sudo chmod -R u+rwX,go+rX "${ROOT}/$f"; ` +
    `done && rm -rf ${TMP}`,
]);
console.log("Deployed to https://swingconnexion.com");
