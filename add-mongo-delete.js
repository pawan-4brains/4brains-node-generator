#!/usr/bin/env node

import fs from "fs";
import path from "path";
import readline from "readline";
import chalk from "chalk";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function listRoutes() {
  const projectRoot = process.cwd();
  const routesDir = path.join(projectRoot, "src", "routes");
  if (!fs.existsSync(routesDir)) {
    console.error(chalk.red("No routes directory found in src/routes"));
    return [];
  }
  const routeFiles = fs
    .readdirSync(routesDir)
    .filter((file) => file.endsWith(".js"));
  if (routeFiles.length === 0) {
    console.error(chalk.red("No route files found in src/routes"));
    return [];
  }
  return routeFiles;
}

function listModels() {
  const projectRoot = process.cwd();
  const modelsDir = path.join(projectRoot, "src", "models");
  if (!fs.existsSync(modelsDir)) {
    console.error(chalk.red("No models directory found in src/models"));
    return [];
  }
  const modelFiles = fs
    .readdirSync(modelsDir)
    .filter((file) => file.endsWith(".js"));
  if (modelFiles.length === 0) {
    console.error(chalk.red("No model files found in src/models"));
    return [];
  }
  return modelFiles;
}

function addDeleteTemplateToRoute(routeFile, modelName) {
  const projectRoot = process.cwd();
  const routeFilePath = path.join(projectRoot, "src", "routes", routeFile);
  const pascalModelName =
    modelName.charAt(0).toUpperCase() + modelName.slice(1);
  const deleteTemplateImport = `
import ${pascalModelName} from '../models/${modelName}.js';
`;

  const deleteTemplateFunction = `
// Data deletion logic
try {
  const deletedDocument = await ${pascalModelName}.findByIdAndDelete(req.params.id);
  if (!deletedDocument) {
    return res.status(404).json({ message: "Document not found" });
  }
  res.json({ message: "Data deleted successfully", data: deletedDocument });
} catch (err) {
  console.error(err);
  res.status(500).json({ message: "Server error" });
}
`;

  if (!fs.existsSync(routeFilePath)) {
    console.error(
      chalk.red(`The specified route file does not exist: ${routeFilePath}`)
    );
    return;
  }

  let routeContent = fs.readFileSync(routeFilePath, "utf8");

  if (!routeContent.includes(`import ${pascalModelName}`)) {
    routeContent = deleteTemplateImport + routeContent;
  }

  const lastCloseIndex = routeContent.lastIndexOf("});");
  if (lastCloseIndex !== -1) {
    const updatedContent = [
      routeContent.slice(0, lastCloseIndex),
      deleteTemplateFunction,
      routeContent.slice(lastCloseIndex),
    ].join("\n");

    routeContent = updatedContent;
  } else {
    routeContent += `\n${deleteTemplateFunction}\n`;
  }

  fs.writeFileSync(routeFilePath, routeContent, "utf8");
  console.log(chalk.green(`Delete template added to ${routeFile}`));
}

const routeFiles = listRoutes();
if (routeFiles.length === 0) {
  rl.close();
  process.exit(0);
}

const modelFiles = listModels();
if (modelFiles.length === 0) {
  rl.close();
  process.exit(0);
}

console.log(chalk.cyan("Select the route file to modify:"));
routeFiles.forEach((file, index) => {
  console.log(chalk.cyan(`${index + 1}. ${file}`));
});

rl.question(
  chalk.yellow("Enter the number of the route file: "),
  (routeAnswer) => {
    const routeIndex = parseInt(routeAnswer, 10) - 1;
    if (routeIndex >= 0 && routeIndex < routeFiles.length) {
      const selectedRoute = routeFiles[routeIndex];

      console.log(chalk.cyan("Select the model file to use:"));
      modelFiles.forEach((file, index) => {
        console.log(chalk.cyan(`${index + 1}. ${file}`));
      });

      rl.question(
        chalk.yellow("Enter the number of the model file: "),
        (modelAnswer) => {
          const modelIndex = parseInt(modelAnswer, 10) - 1;
          if (modelIndex >= 0 && modelIndex < modelFiles.length) {
            const selectedModel = path.basename(modelFiles[modelIndex], ".js");

            addDeleteTemplateToRoute(selectedRoute, selectedModel);
            rl.close();
          } else {
            console.error(
              chalk.red("Invalid selection. Please choose a valid number.")
            );
            rl.close();
          }
        }
      );
    } else {
      console.error(
        chalk.red("Invalid selection. Please choose a valid number.")
      );
      rl.close();
    }
  }
);
