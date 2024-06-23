#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const skeletonPath = path.join(
  path.dirname(new URL(import.meta.url).pathname),
  "skeleton"
);

function copyRecursiveSync(src, dest) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();
  if (isDirectory) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest);
    }
    fs.readdirSync(src).forEach((childItemName) => {
      copyRecursiveSync(
        path.join(src, childItemName),
        path.join(dest, childItemName)
      );
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

function updatePackageName(destinationPath, projectName) {
  const packageJsonPath = path.join(destinationPath, "package.json");
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
  packageJson.name = projectName;
  fs.writeFileSync(
    packageJsonPath,
    JSON.stringify(packageJson, null, 2),
    "utf8"
  );
}

function createSkeletonApp(projectName) {
  const targetPath = path.resolve(projectName);
  if (!fs.existsSync(targetPath)) {
    fs.mkdirSync(targetPath, { recursive: true });
  }
  copyRecursiveSync(skeletonPath, targetPath);
  updatePackageName(targetPath, projectName);
  console.log(`Node.js skeleton app created successfully in ${projectName}.`);

  // Install dependencies
  execSync("npm install", { stdio: "inherit", cwd: targetPath });
  console.log("Dependencies installed successfully.");
}

const args = process.argv.slice(2);
if (args.length < 1) {
  console.error(
    "Usage: node-app init <projectName> OR node-app add-api <endpointName> OR node-app add-mongodb OR node-app add-socket OR node-app add-websocket"
  );
  process.exit(1);
}

const command = args[0];
const param = args[1];

if (command === "init") {
  if (!param) {
    console.error("Usage: node-app init <projectName>");
    process.exit(1);
  }
  createSkeletonApp(param);
} else if (command === "add-api") {
  if (!param) {
    console.error("Usage: node-app add-api <endpointName>");
    process.exit(1);
  }
  execSync(
    `node ${path.join(
      path.dirname(new URL(import.meta.url).pathname),
      "add-api.js"
    )} ${param}`,
    { stdio: "inherit" }
  );
} else if (command === "add-mongodb") {
  execSync(
    `node ${path.join(
      path.dirname(new URL(import.meta.url).pathname),
      "add-mongodb.js"
    )}`,
    { stdio: "inherit" }
  );
} else if (command === "add-socket") {
  execSync(
    `node ${path.join(
      path.dirname(new URL(import.meta.url).pathname),
      "add-socket.js"
    )}`,
    { stdio: "inherit" }
  );
} else if (command === "add-websocket") {
  execSync(
    `node ${path.join(
      path.dirname(new URL(import.meta.url).pathname),
      "add-websocket.js"
    )}`,
    { stdio: "inherit" }
  );
} else if (command === "add-mongodb-schema") {
  if (!param) {
    console.error("Usage: node-app add-mongodb-schema <schemaName>");
    process.exit(1);
  }
  execSync(
    `node ${path.join(
      path.dirname(new URL(import.meta.url).pathname),
      "add-mongodb-schema.js"
    )} ${param}`,
    { stdio: "inherit" }
  );
} else if (command === "add-login") {
  execSync(
    `node ${path.join(
      path.dirname(new URL(import.meta.url).pathname),
      "add-login.js"
    )}`,
    { stdio: "inherit" }
  );
} else if (command === "add-mongodb-insert") {
  execSync(
    `node ${path.join(
      path.dirname(new URL(import.meta.url).pathname),
      "add-mongodb-insert.js"
    )}`,
    { stdio: "inherit" }
  );
} else {
  console.error("Unknown command");
  process.exit(1);
}
