#!/usr/bin/env node

import fs from "fs";
import path from "path";
import readline from "readline";
import chalk from "chalk";
import { execSync } from "child_process";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function listRoutes() {
  const projectRoot = process.cwd();
  const routesDir = path.join(projectRoot, "src", "routes");
  if (!fs.existsSync(routesDir)) {
    console.error(chalk.red("No routes directory found in src/routes"));
    return null;
  }
  const routeFiles = fs
    .readdirSync(routesDir)
    .filter((file) => file.endsWith(".js"));
  if (routeFiles.length === 0) {
    console.error(chalk.red("No route files found in src/routes"));
    return null;
  }
  return routeFiles;
}

function listModels() {
  const projectRoot = process.cwd();
  const modelsDir = path.join(projectRoot, "src", "models");
  if (!fs.existsSync(modelsDir)) {
    console.error(chalk.red("No models directory found in src/models"));
    return null;
  }
  const modelFiles = fs
    .readdirSync(modelsDir)
    .filter((file) => file.endsWith(".js"));
  if (modelFiles.length === 0) {
    console.error(chalk.red("No model files found in src/models"));
    return null;
  }
  return modelFiles;
}

function getModelSchema(modelName) {
  const projectRoot = process.cwd();
  const modelFilePath = path.join(
    projectRoot,
    "src",
    "models",
    modelName + ".js"
  );
  const modelFileContent = fs.readFileSync(modelFilePath, "utf8");

  // Improved regex to handle beautified code
  const schemaRegex = /new\s+mongoose\.Schema\s*\(\s*\{([\s\S]*?)\}\s*\)/m;
  const match = modelFileContent.match(schemaRegex);

  if (match) {
    try {
      const schemaContent = match[1];
      const fieldRegex = /(\w+):\s*\{/g;
      const schemaKeys = [];
      let fieldMatch;
      while ((fieldMatch = fieldRegex.exec(schemaContent)) !== null) {
        schemaKeys.push(fieldMatch[1]);
      }
      return schemaKeys;
    } catch (error) {
      console.error(chalk.red("Error parsing schema: "), error);
      return null;
    }
  } else {
    console.error(chalk.red("Schema not found in model file."));
    return null;
  }
}

function addUpdateTemplateToRoute(routeFile, fields, modelName) {
  const projectRoot = process.cwd();
  const routeFilePath = path.join(projectRoot, "src", "routes", routeFile);
  const pascalModelName =
    modelName.charAt(0).toUpperCase() + modelName.slice(1);
  const updateTemplateImport = `
import bcrypt from 'bcrypt';
import ${pascalModelName} from '../models/${modelName}.js';
`;

  const passwordHashingLogic = `
if (updatedData.password) {
  const salt = await bcrypt.genSalt(10);
  updatedData.password = await bcrypt.hash(updatedData.password, salt);
}
`;

  const updateTemplateFunction = `
// Data update logic
const updatedData = {
  ${fields.map((field) => `${field}: req.body.${field}`).join(",\n  ")}
};
${fields.includes("password") ? passwordHashingLogic : ""}
try {
  const updatedDocument = await ${pascalModelName}.findByIdAndUpdate(req.params.id, updatedData, { new: true });
  if (!updatedDocument) {
    return res.status(404).json({ message: "Document not found" });
  }
  res.json({ message: "Data updated successfully", data: updatedDocument });
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
    routeContent = updateTemplateImport + routeContent;
  }

  const lastCloseIndex = routeContent.lastIndexOf("});");
  if (lastCloseIndex !== -1) {
    const updatedContent = [
      routeContent.slice(0, lastCloseIndex),
      updateTemplateFunction,
      routeContent.slice(lastCloseIndex),
    ].join("\n");

    routeContent = updatedContent;
  } else {
    routeContent += `\n${updateTemplateFunction}\n`;
  }

  fs.writeFileSync(routeFilePath, routeContent, "utf8");
  console.log(chalk.green(`Update template added to ${routeFile}`));

  // Install bcrypt if not already installed
  if (fields.includes("password")) {
    execSync("npm install bcrypt", { stdio: "inherit" });
  }
}

const routeFiles = listRoutes();
const modelFiles = listModels();

if (!routeFiles || !modelFiles) {
  rl.close();
  process.exit(0);
}

console.log(chalk.blue("Select the route file to modify:"));
routeFiles.forEach((file, index) => {
  console.log(chalk.yellow(`${index + 1}. ${file}`));
});

rl.question(
  chalk.cyan("Enter the number of the route file: "),
  (routeAnswer) => {
    const routeIndex = parseInt(routeAnswer, 10) - 1;
    if (routeIndex >= 0 && routeIndex < routeFiles.length) {
      const selectedRoute = routeFiles[routeIndex];

      console.log(chalk.blue("Select the model file to use:"));
      modelFiles.forEach((file, index) => {
        console.log(chalk.yellow(`${index + 1}. ${file}`));
      });

      rl.question(
        chalk.cyan("Enter the number of the model file: "),
        (modelAnswer) => {
          const modelIndex = parseInt(modelAnswer, 10) - 1;
          if (modelIndex >= 0 && modelIndex < modelFiles.length) {
            const selectedModel = path.basename(modelFiles[modelIndex], ".js");
            const schemaFields = getModelSchema(selectedModel);

            if (!schemaFields) {
              rl.close();
              process.exit(0);
            }

            addUpdateTemplateToRoute(
              selectedRoute,
              schemaFields,
              selectedModel
            );
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
