#!/usr/bin/env node

import fs from "fs";
import path from "path";
import readline from "readline";
import { execSync } from "child_process";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function listRoutes() {
  const projectRoot = process.cwd();
  const routesDir = path.join(projectRoot, "src", "routes");
  if (!fs.existsSync(routesDir)) {
    console.error("No routes directory found in src/routes");
    process.exit(1);
  }
  const routeFiles = fs
    .readdirSync(routesDir)
    .filter((file) => file.endsWith(".js"));
  if (routeFiles.length === 0) {
    console.error("No route files found in src/routes");
    process.exit(1);
  }
  return routeFiles;
}

function listModels() {
  const projectRoot = process.cwd();
  const modelsDir = path.join(projectRoot, "src", "models");
  if (!fs.existsSync(modelsDir)) {
    console.error("No models directory found in src/models");
    process.exit(1);
  }
  const modelFiles = fs
    .readdirSync(modelsDir)
    .filter((file) => file.endsWith(".js"));
  if (modelFiles.length === 0) {
    console.error("No model files found in src/models");
    process.exit(1);
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
  const schemaRegex = /new mongoose\.Schema\((\{[\s\S]*?\})\)/;
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
      console.error("Error parsing schema: ", error);
      process.exit(1);
    }
  } else {
    console.error("Schema not found in model file.");
    process.exit(1);
  }
}

function addInsertTemplateToRoute(routeFile, fields, modelName) {
  const projectRoot = process.cwd();
  const routeFilePath = path.join(projectRoot, "src", "routes", routeFile);
  const pascalModelName =
    modelName.charAt(0).toUpperCase() + modelName.slice(1);
  const insertTemplateImport = `
import bcrypt from 'bcrypt';
import ${pascalModelName} from '../models/${modelName}.js';
`;

  const passwordHashingLogic = `
if (newData.password) {
  const salt = await bcrypt.genSalt(10);
  newData.password = await bcrypt.hash(newData.password, salt);
}
`;

  const insertTemplateFunction = `
// Data insertion logic
const newData = {
  ${fields.map((field) => `${field}: req.body.${field}`).join(",\n  ")}
};
${fields.includes("password") ? passwordHashingLogic : ""}
try {
  const newDocument = new ${pascalModelName}(newData);
  await newDocument.save();
  res.json({ message: "Data inserted successfully", data: newDocument });
} catch (err) {
  console.error(err);
  res.status(500).json({ message: "Server error" });
}
`;

  if (!fs.existsSync(routeFilePath)) {
    console.error(`The specified route file does not exist: ${routeFilePath}`);
    process.exit(1);
  }

  let routeContent = fs.readFileSync(routeFilePath, "utf8");

  if (!routeContent.includes(`import ${pascalModelName}`)) {
    routeContent = insertTemplateImport + routeContent;
  }

  const lastCloseIndex = routeContent.lastIndexOf("});");
  if (lastCloseIndex !== -1) {
    const updatedContent = [
      routeContent.slice(0, lastCloseIndex),
      insertTemplateFunction,
      routeContent.slice(lastCloseIndex),
    ].join("\n");

    routeContent = updatedContent;
  } else {
    routeContent += `\n${insertTemplateFunction}\n`;
  }

  fs.writeFileSync(routeFilePath, routeContent, "utf8");
  console.log(`Insert template added to ${routeFile}`);

  // Install bcrypt if not already installed
  if (fields.includes("password")) {
    execSync("npm install bcrypt", { stdio: "inherit" });
  }
}

const routeFiles = listRoutes();
const modelFiles = listModels();

console.log("Select the route file to modify:");
routeFiles.forEach((file, index) => {
  console.log(`${index + 1}. ${file}`);
});

rl.question("Enter the number of the route file: ", (routeAnswer) => {
  const routeIndex = parseInt(routeAnswer, 10) - 1;
  if (routeIndex >= 0 && routeIndex < routeFiles.length) {
    const selectedRoute = routeFiles[routeIndex];

    console.log("Select the model file to use:");
    modelFiles.forEach((file, index) => {
      console.log(`${index + 1}. ${file}`);
    });

    rl.question("Enter the number of the model file: ", (modelAnswer) => {
      const modelIndex = parseInt(modelAnswer, 10) - 1;
      if (modelIndex >= 0 && modelIndex < modelFiles.length) {
        const selectedModel = path.basename(modelFiles[modelIndex], ".js");
        const schemaFields = getModelSchema(selectedModel);

        addInsertTemplateToRoute(selectedRoute, schemaFields, selectedModel);
        rl.close();
      } else {
        console.error("Invalid selection. Please choose a valid number.");
        rl.close();
      }
    });
  } else {
    console.error("Invalid selection. Please choose a valid number.");
    rl.close();
  }
});
