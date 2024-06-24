#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const skeletonPath = path.join(__dirname, "skeleton");

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

function checkMongoDBConfig() {
  const projectRoot = process.cwd();
  const configFilePath = path.join(projectRoot, "config", "db.js");
  return fs.existsSync(configFilePath);
}

function checkModelsExist() {
  const projectRoot = process.cwd();
  const modelsDir = path.join(projectRoot, "src", "models");
  return fs.existsSync(modelsDir) && fs.readdirSync(modelsDir).length > 0;
}

function checkRoutesDir() {
  const projectRoot = process.cwd();
  const routesDir = path.join(projectRoot, "src", "routes");
  return fs.existsSync(routesDir);
}

function validateMongoDBConfigAndModels() {
  if (!checkMongoDBConfig()) {
    console.error(
      "MongoDB is not configured. Please run 'node-app add-mongodb' first."
    );
    process.exit(1);
  }
  if (!checkModelsExist()) {
    console.error("No models found. Please create a model first.");
    process.exit(1);
  }
}

function showHelp() {
  console.log(`
Usage: node-app <command> [options]

Commands:
  init <projectName>        Create a new Node.js project with the given name.
  add-api <endpointName>    Add a new API endpoint with the given name.
  add-mongodb               Configure MongoDB for the project.
  add-socket                Add Socket.IO support to the project.
  add-websocket             Add WebSocket support to the project.
  add-mongodb-schema <schemaName>  Add a new MongoDB schema with the given name.
  add-login                 Add a login route to the project.
  add-mongodb-insert        Add an insert route for MongoDB.
  add-mongodb-update        Add an update route for MongoDB.
  add-mongodb-read          Add a read route for MongoDB.
  add-mongodb-delete        Add a delete route for MongoDB.
  
Options:
  -h, --help                Show this help message.
`);
}

const args = process.argv.slice(2);
if (args.length < 1 || args.includes("-h") || args.includes("--help")) {
  showHelp();
  process.exit(0);
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
  execSync(`node ${path.join(__dirname, "add-api.js")} ${param}`, {
    stdio: "inherit",
  });
} else if (command === "add-mongodb") {
  execSync(`node ${path.join(__dirname, "add-mongodb.js")}`, {
    stdio: "inherit",
  });
} else if (command === "add-socket") {
  execSync(`node ${path.join(__dirname, "add-socket.js")}`, {
    stdio: "inherit",
  });
} else if (command === "add-websocket") {
  execSync(`node ${path.join(__dirname, "add-websocket.js")}`, {
    stdio: "inherit",
  });
} else if (command === "add-mongodb-schema") {
  if (!checkMongoDBConfig()) {
    console.error(
      "MongoDB is not configured. Please run 'node-app add-mongodb' first."
    );
    process.exit(1);
  }
  if (!param) {
    console.error("Usage: node-app add-mongodb-schema <schemaName>");
    process.exit(1);
  }
  execSync(`node ${path.join(__dirname, "add-mongodb-schema.js")} ${param}`, {
    stdio: "inherit",
  });
} else if (command === "add-login") {
  if (!checkRoutesDir()) {
    console.error("No routes directory found in src/routes");
    process.exit(1);
  }
  validateMongoDBConfigAndModels();
  execSync(`node ${path.join(__dirname, "add-login.js")}`, {
    stdio: "inherit",
  });
} else if (command === "add-mongodb-insert") {
  if (!checkRoutesDir()) {
    console.error("No routes directory found in src/routes");
    process.exit(1);
  }
  validateMongoDBConfigAndModels();
  execSync(`node ${path.join(__dirname, "add-mongodb-insert.js")}`, {
    stdio: "inherit",
  });
} else if (command === "add-mongodb-update") {
  if (!checkRoutesDir()) {
    console.error("No routes directory found in src/routes");
    process.exit(1);
  }
  validateMongoDBConfigAndModels();
  execSync(`node ${path.join(__dirname, "add-mongodb-update.js")}`, {
    stdio: "inherit",
  });
} else if (command === "add-mongodb-read") {
  if (!checkRoutesDir()) {
    console.error("No routes directory found in src/routes");
    process.exit(1);
  }
  validateMongoDBConfigAndModels();
  execSync(`node ${path.join(__dirname, "add-mongodb-read.js")}`, {
    stdio: "inherit",
  });
} else if (command === "add-mongodb-delete") {
  if (!checkRoutesDir()) {
    console.error("No routes directory found in src/routes");
    process.exit(1);
  }
  validateMongoDBConfigAndModels();
  execSync(`node ${path.join(__dirname, "add-mongodb-delete.js")}`, {
    stdio: "inherit",
  });
} else {
  console.error("Unknown command. Use -h or --help for help.");
  process.exit(1);
}
