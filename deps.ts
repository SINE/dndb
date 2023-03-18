/**
 * deps.ts
 *
 * This module re-exports the required methods
 */
export * as fs from "https://deno.land/std@0.179.0/fs/mod.ts";
//export * as path from "https://deno.land/std@0.179.0/path/mod.ts";
export { resolve } from "https://deno.land/std@0.179.0/path/mod.ts";
export { default as mongobj } from "https://gist.githubusercontent.com/SINE/de5afcd25d8b8af2ed69a39df8f5726c/raw/c6ff9f4a520c2b54528e9a0b7762060f67cecf1c/mongobj.js";
//export * as safefilter from "https://raw.githubusercontent.com/SINE/dndb-safe-filter/9166edde2be3dbbf519af3ac0ac33af43e7b619b/dist/index.js";
export { matches } from "https://raw.githubusercontent.com/SINE/dndb-safe-filter/9166edde2be3dbbf519af3ac0ac33af43e7b619b/dist/index.js";
export { default as mongoproject } from "https://raw.githubusercontent.com/SINE/dndb-mongo-project/35264536b10defe47bfce6d4b5693776f05b39e5/dist/bundle.js";
