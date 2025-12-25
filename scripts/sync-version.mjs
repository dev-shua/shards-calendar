import fs from "node:fs";

const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
const modPath = "public/module.json";
const mod = JSON.parse(fs.readFileSync(modPath, "utf8"));

const v = pkg.version;
mod.version = v;
mod.download = mod.download.replace(/v\d+\.\d+\.\d+/, `v${v}`).replace(/v\d+\.\d+\.\d+\.zip/, `v${v}.zip`);

fs.writeFileSync(modPath, JSON.stringify(mod, null, 2) + "\n");

console.log(`synced module.json -> ${v}`);