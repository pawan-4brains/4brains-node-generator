#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { fileURLToPath } from "url";
import chalk from "chalk";

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

function checkMongoConfig() {
  const projectRoot = process.cwd();
  const envPath = path.join(projectRoot, ".env.development");
  return (
    fs.existsSync(envPath) &&
    fs.readFileSync(envPath, "utf8").includes("MONGO_URI")
  );
}

function showHelp() {
  console.log(
    chalk.green(`
Usage: ${chalk.bold("node-app <command> [options]")}

Commands:
  ${chalk.blue(
    "init <projectName>"
  )}        Create a new Node.js project with the given name.
  ${chalk.blue(
    "add-api <endpointName>"
  )}    Add a new API endpoint with the given name.
  ${chalk.blue("add-mongo")}               Configure MongoDB for the project.
  ${chalk.blue(
    "add-socket"
  )}                Add Socket.IO support to the project.
  ${chalk.blue(
    "add-websocket"
  )}             Add WebSocket support to the project.
  ${chalk.blue(
    "add-mongo-schema <schemaName>"
  )}  Add a new MongoDB schema with the given name.
  ${chalk.blue("add-login")}                 Add a login route to the project.
  ${chalk.blue("add-mongo-insert")}        Add an insert route for MongoDB.
  ${chalk.blue("add-mongo-update")}        Add an update route for MongoDB.
  ${chalk.blue("add-mongo-read")}          Add a read route for MongoDB.
  ${chalk.blue("add-mongo-delete")}        Add a delete route for MongoDB.
  
Options:
  ${chalk.blue("-h, --help")}                Show this help message.
`)
  );
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
    console.error(chalk.red("Usage: node-app init <projectName>"));
    process.exit(1);
  }
  createSkeletonApp(param);
} else if (command === "add-api") {
  if (!param) {
    console.error(chalk.red("Usage: node-app add-api <endpointName>"));
    process.exit(1);
  }
  execSync(`node ${path.join(__dirname, "add-api.js")} ${param}`, {
    stdio: "inherit",
  });
} else if (command === "add-mongo") {
  execSync(`node ${path.join(__dirname, "add-mongo.js")}`, {
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
} else if (command === "add-mongo-schema") {
  if (!param) {
    console.error(chalk.red("Usage: node-app add-mongo-schema <schemaName>"));
    process.exit(1);
  }
  if (!checkMongoConfig()) {
    console.error(
      chalk.red(
        "MongoDB is not configured. Please run 'node-app add-mongo' first."
      )
    );
    process.exit(1);
  }
  execSync(`node ${path.join(__dirname, "add-mongo-schema.js")} ${param}`, {
    stdio: "inherit",
  });
} else if (command === "add-login") {
  if (!checkRoutesDir()) {
    console.error(chalk.red("No routes directory found in src/routes"));
    process.exit(1);
  }
  execSync(`node ${path.join(__dirname, "add-login.js")}`, {
    stdio: "inherit",
  });
} else if (command === "add-mongo-insert") {
  if (!checkRoutesDir()) {
    console.error(chalk.red("No routes directory found in src/routes"));
    process.exit(1);
  }
  if (!checkModelsExist()) {
    console.error(chalk.red("No model files found in src/models"));
    process.exit(1);
  }
  execSync(`node ${path.join(__dirname, "add-mongo-insert.js")}`, {
    stdio: "inherit",
  });
} else if (command === "add-mongo-update") {
  if (!checkRoutesDir()) {
    console.error(chalk.red("No routes directory found in src/routes"));
    process.exit(1);
  }
  if (!checkModelsExist()) {
    console.error(chalk.red("No model files found in src/models"));
    process.exit(1);
  }
  execSync(`node ${path.join(__dirname, "add-mongo-update.js")}`, {
    stdio: "inherit",
  });
} else if (command === "add-mongo-read") {
  if (!checkRoutesDir()) {
    console.error(chalk.red("No routes directory found in src/routes"));
    process.exit(1);
  }
  if (!checkModelsExist()) {
    console.error(chalk.red("No model files found in src/models"));
    process.exit(1);
  }
  execSync(`node ${path.join(__dirname, "add-mongo-read.js")}`, {
    stdio: "inherit",
  });
} else if (command === "add-mongo-delete") {
  if (!checkRoutesDir()) {
    console.error(chalk.red("No routes directory found in src/routes"));
    process.exit(1);
  }
  if (!checkModelsExist()) {
    console.error(chalk.red("No model files found in src/models"));
    process.exit(1);
  }
  execSync(`node ${path.join(__dirname, "add-mongo-delete.js")}`, {
    stdio: "inherit",
  });
} else {
  console.error(chalk.red("Unknown command. Use -h or --help for help."));
  process.exit(1);
}
