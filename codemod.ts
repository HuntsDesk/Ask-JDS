// Run with: deno run --allow-read --allow-write codemod.ts [--dry-run]

const aliasMap = [
  { pattern: /^(\.\.\/)+components\//, alias: "@components/" },
  { pattern: /^(\.\.\/)+lib\//, alias: "@lib/" },
  { pattern: /^(\.\.\/)+hooks\//, alias: "@hooks/" },
  { pattern: /^(\.\.\/)+app\//, alias: "@app/" },
];

const targetDir = "./src";
const dryRun = Deno.args.includes("--dry-run");
const migrationLog: string[] = [];

async function walkAndUpdate(dir: string) {
  for await (const entry of Deno.readDir(dir)) {
    const path = `${dir}/${entry.name}`;

    if (entry.isDirectory) {
      await walkAndUpdate(path);
    } else if (entry.isFile && (path.endsWith(".ts") || path.endsWith(".tsx"))) {
      let content = await Deno.readTextFile(path);
      let original = content;
      let modified = false;

      for (const { pattern, alias } of aliasMap) {
        const regex = new RegExp(`from ['"]${pattern.source}`, "g");
        if (regex.test(content)) {
          content = content.replace(regex, `from '${alias}`);
          modified = true;
        }
      }

      if (modified) {
        migrationLog.push(path);

        if (!dryRun) {
          // Optional: backup before writing
          await Deno.copyFile(path, `${path}.bak`);
          await Deno.writeTextFile(path, content);
          console.log(`✅ Updated: ${path}`);
        } else {
          console.log(`🟡 Would update: ${path}`);
        }
      }
    }
  }
}

await walkAndUpdate(targetDir);

if (migrationLog.length > 0) {
  const logContent = migrationLog.join("\n");
  await Deno.writeTextFile("codemod-migration-log.txt", logContent);
  console.log(`\n📄 Migration log written to codemod-migration-log.txt`);
} else {
  console.log("\n✅ No changes needed.");
} 