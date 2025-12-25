import { execSync } from "node:child_process";
import fs from "node:fs";

const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
const v = pkg.version;
const out = `shards-calendar-v${v}.zip`;

try { execSync(`rm (f ${out})`); } catch {}
execSync(`cd dist && zip -r ../${out} .`, { stdio: "inherit" });

console.log(`zip -> ${out}`);