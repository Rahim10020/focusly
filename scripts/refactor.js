const fs = require("fs");
const path = require("path");

const ROUTES = [
  "dashboard",
  "tasks",
  "calendar",
  "stats",
  "friends",
  "leaderboard",
  "profile",
  "settings",
  "notifications",
  "create-task",
];

const ROOT = process.cwd();
const SRC_APP = path.join(ROOT, "src", "app");
const APP_GROUP = path.join(SRC_APP, "(app)");
const SRC_COMPONENTS = path.join(ROOT, "src", "components");

console.log("--- Starting Phase 4: App Router Restructuring ---");

// 1. Create (app) group folder
if (!fs.existsSync(APP_GROUP)) {
  fs.mkdirSync(APP_GROUP, { recursive: true });
}

// 2. Move standard routes to (app)
ROUTES.forEach((route) => {
  const oldPath = path.join(SRC_APP, route);
  const newPath = path.join(APP_GROUP, route);

  if (fs.existsSync(oldPath) && !fs.existsSync(newPath)) {
    console.log(`Moving src/app/${route} to src/app/(app)/${route}`);
    fs.renameSync(oldPath, newPath);
  }
});

// 3. Colocate components
ROUTES.forEach((route) => {
  const componentSource = path.join(SRC_COMPONENTS, route);
  const routeDest = path.join(APP_GROUP, route, "_components");

  if (fs.existsSync(componentSource)) {
    if (!fs.existsSync(routeDest)) {
      fs.mkdirSync(routeDest, { recursive: true });
    }

    const files = fs.readdirSync(componentSource);
    files.forEach((file) => {
      const oldFile = path.join(componentSource, file);
      const newFile = path.join(routeDest, file);

      // Handle subdirectories (like tasks/items)
      if (fs.lstatSync(oldFile).isDirectory()) {
        if (!fs.existsSync(newFile)) fs.mkdirSync(newFile, { recursive: true });
        const subFiles = fs.readdirSync(oldFile);
        subFiles.forEach((sf) => {
          const osf = path.join(oldFile, sf);
          const nsf = path.join(newFile, sf);
          console.log(`Moving component: ${route}/${file}/${sf}`);
          fs.renameSync(osf, nsf);
        });
        fs.rmdirSync(oldFile);
      } else {
        console.log(`Moving component: ${route}/${file}`);
        fs.renameSync(oldFile, newFile);
      }
    });
    fs.rmdirSync(componentSource);
  }
});

// 4. Update imports in all files in (app)
const updateImports = (dir) => {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      updateImports(fullPath);
    } else if (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx")) {
      let content = fs.readFileSync(fullPath, "utf8");
      let changed = false;

      // Update absolute imports @/components/route to @/app/(app)/route/_components
      ROUTES.forEach((route) => {
        const regex = new RegExp(`@/components/${route}/`, "g");
        if (regex.test(content)) {
          content = content.replace(regex, `@/app/(app)/${route}/_components/`);
          changed = true;
        }
      });

      // Update relative imports fixed for _components depth
      // ../../ui/ -> @/components/ui/
      if (content.includes("../../ui/")) {
        content = content.replace(/\.\.\/\.\.\/ui\//g, "@/components/ui/");
        changed = true;
      }
      if (content.includes("../ui/")) {
        content = content.replace(/\.\.\/ui\//g, "@/components/ui/");
        changed = true;
      }
      if (content.includes("../../shared/")) {
        content = content.replace(
          /\.\.\/\.\.\/shared\//g,
          "@/components/shared/",
        );
        changed = true;
      }
      if (content.includes("../shared/")) {
        content = content.replace(/\.\.\/shared\//g, "@/components/shared/");
        changed = true;
      }

      if (changed) {
        fs.writeFileSync(fullPath, content);
      }
    }
  }
};

updateImports(APP_GROUP);
console.log("--- Phase 4 Complete ---");
