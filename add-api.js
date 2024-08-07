#!/usr/bin/env node

import fs from "fs";
import path from "path";
import readline from "readline";
import chalk from "chalk";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const methods = ["get", "post", "put", "delete", "patch"];

function toCamelCase(str) {
  return str.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
}

function checkDuplicateApi(endpointName) {
  const projectRoot = process.cwd();
  const apiDir = path.join(projectRoot, "src", "routes");
  const apiFile = path.join(apiDir, `${endpointName}.js`);
  return fs.existsSync(apiFile);
}

function checkDuplicateMethod(apiFile, method) {
  const apiContent = fs.readFileSync(apiFile, "utf8");
  const methodPattern = new RegExp(`router\\.${method}\\(`);
  return methodPattern.test(apiContent);
}

function createApi(endpointName, method) {
  const projectRoot = process.cwd();
  const apiDir = path.join(projectRoot, "src", "routes");
  const apiFile = path.join(apiDir, `${endpointName}.js`);
  const variableName = toCamelCase(endpointName);

  if (!fs.existsSync(apiDir)) {
    fs.mkdirSync(apiDir, { recursive: true });
  }

  if (fs.existsSync(apiFile) && checkDuplicateMethod(apiFile, method)) {
    console.error(
      chalk.red(
        `API endpoint /${endpointName} with method ${method.toUpperCase()} already exists. Choose a different method or endpoint name.`
      )
    );
    rl.close();
    return;
  }

  let apiContent;
  const methodContent = `
router.${method.toLowerCase()}('/', async (req, res) => {
  res.json({ msg: '${endpointName} ${method.toUpperCase()} endpoint works' });
});
  `;

  if (fs.existsSync(apiFile)) {
    // Read existing content and append the new method if not already present
    apiContent = fs.readFileSync(apiFile, "utf8");
    if (!apiContent.includes(methodContent.trim())) {
      const insertionIndex = apiContent.lastIndexOf("export default router;");
      apiContent =
        apiContent.slice(0, insertionIndex) +
        methodContent.trim() +
        "\n\n" +
        apiContent.slice(insertionIndex);
    }
  } else {
    // Create new content for the API file
    apiContent = `
import express from 'express';
const router = express.Router();

router.${method.toLowerCase()}('/', async (req, res) => {
  res.json({ msg: '${endpointName} ${method.toUpperCase()} endpoint works' });
});

export default router;
    `;
  }

  fs.writeFileSync(apiFile, apiContent.trim(), "utf8");

  // Update index.js to include the new route
  const indexPath = path.join(projectRoot, "index.js");
  const routeImport = `import ${variableName} from './src/routes/${endpointName}.js';\n`;
  const routeUse = `app.use('/${endpointName}', ${variableName});\n`;

  let indexContent = fs.readFileSync(indexPath, "utf8");
  if (!indexContent.includes(routeImport)) {
    indexContent = routeImport + indexContent;
  }

  // Ensure there's no duplicate app.use entry
  if (!indexContent.includes(routeUse)) {
    // Check if `app.listen` or `server.listen` exists and replace accordingly
    if (indexContent.includes("app.listen(port")) {
      indexContent = indexContent.replace(
        "app.listen(port",
        routeUse + "app.listen(port"
      );
    } else if (indexContent.includes("server.listen(port")) {
      indexContent = indexContent.replace(
        "server.listen(port",
        routeUse + "server.listen(port"
      );
    }
  }

  fs.writeFileSync(indexPath, indexContent, "utf8");

  console.log(
    chalk.green(
      `API endpoint /${endpointName} with method ${method.toUpperCase()} created/updated successfully.`
    )
  );
  rl.close();
}

function exitWithError(message) {
  console.error(chalk.red(message));
  rl.close();
}

if (process.argv.length !== 3) {
  exitWithError("Usage: add-api <endpointName>");
}

const endpointName = process.argv[2];

console.log(chalk.cyan("Choose HTTP method:"));
methods.forEach((method, index) => {
  console.log(chalk.cyan(`${index + 1}. ${method}`));
});

rl.question(
  chalk.yellow("Enter the number for the HTTP method: "),
  (answer) => {
    const methodIndex = parseInt(answer, 10) - 1;
    if (methodIndex >= 0 && methodIndex < methods.length) {
      createApi(endpointName, methods[methodIndex]);
    } else {
      exitWithError("Invalid selection. Please choose a valid number.");
    }
  }
);
