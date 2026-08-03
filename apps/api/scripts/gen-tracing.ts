// Génère src/_tracing.ts.
//
// Vercel décide quels fichiers embarquer dans la Function en traçant les
// imports, et son traceur ne suit que les chemins relatifs et les paquets de
// node_modules — jamais un alias. Les modules importés via `#...` seraient donc
// absents du lambda.
//
// Ce manifeste les réimporte en relatif pour que le traceur les voie. Il est
// généré à chaque build : ajouter un fichier sous src/ suffit, rien à tenir à
// jour à la main.
import { Glob } from "bun";

const ENTRIES = new Set(["app.ts", "index.ts", "_tracing.ts"]);

const modules = [...new Glob("**/*.ts").scanSync("src")]
  .filter((f) => !ENTRIES.has(f))
  .map((f) => `./${f.replace(/\.ts$/, "")}`)
  .sort();

const content = `// Fichier généré par scripts/gen-tracing.ts — ne pas éditer.
//
// Réimporte en relatif les modules atteints par alias, pour que le traceur de
// Vercel les embarque dans la Function.
${modules.map((m) => `import ${JSON.stringify(m)};`).join("\n")}
`;

await Bun.write("src/_tracing.ts", content);
console.log(`_tracing.ts : ${modules.length} module(s) référencé(s)`);
