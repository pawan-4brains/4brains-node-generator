#!/usr/bin/env node

import fs from "fs";
import path from "path";
import readline from "readline";
import crypto from "crypto";
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

function promptSelectFields(fields, callback) {
  console.log(
    "Select the fields to include in the data insertion (space-separated list of numbers):"
  );
  fields.forEach((field, index) => {
    console.log(`${index + 1}. ${field}`);
  });

  rl.question("Enter the numbers of the fields: ", (fieldAnswer) => {
    const selectedIndexes = fieldAnswer
      .split(" ")
      .map((index) => parseInt(index.trim(), 10) - 1);
    const selectedFields = selectedIndexes
      .map((index) => fields[index])
      .filter((field) => field !== undefined);
    callback(selectedFields);
    rl.close();
  });
}

function generateJwtSecret() {
  return crypto.randomBytes(32).toString("hex");
}

function updateEnvFile(filePath, jwtSecret) {
  const jwtSecretLine = `JWT_SECRET=${jwtSecret}\n`;

  if (fs.existsSync(filePath)) {
    let envContent = fs.readFileSync(filePath, "utf8");
    if (envContent.includes("JWT_SECRET=")) {
      envContent = envContent.replace(/JWT_SECRET=.*/, jwtSecretLine.trim());
    } else {
      envContent = envContent.trim() + "\n" + jwtSecretLine;
    }
    fs.writeFileSync(filePath, envContent, "utf8");
  } else {
    fs.writeFileSync(filePath, jwtSecretLine, "utf8");
  }
}

function installDependencies() {
  console.log("Installing dependencies: jsonwebtoken, bcrypt...");
  execSync("npm install jsonwebtoken bcrypt", { stdio: "inherit" });
}

function addLoginTemplateToRoute(routeFile, fields, modelName) {
  const projectRoot = process.cwd();
  const routeFilePath = path.join(projectRoot, "src", "routes", routeFile);
  const pascalModelName =
    modelName.charAt(0).toUpperCase() + modelName.slice(1);
  const loginTemplateImport = `
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';  
import ${pascalModelName} from '../models/${modelName}.js';
`;

  const loginTemplateFunction = `
// Login logic
const { ${fields.join(", ")} } = req.body;
try {
  const user = await ${pascalModelName}.findOne({ ${fields[0]}: ${fields[0]} });
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  ${
    fields.includes("password")
      ? `
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(400).json({ message: 'Invalid credentials' });
  }`
      : ""
  }
  const payload = { id: user._id };
  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
  res.json({ token });
} catch (err) {
  console.error(err);
  res.status(500).json({ message: 'Server error' });
}
`;

  if (!fs.existsSync(routeFilePath)) {
    console.error(`The specified route file does not exist: ${routeFilePath}`);
    process.exit(1);
  }

  let routeContent = fs.readFileSync(routeFilePath, "utf8");

  if (!routeContent.includes("import bcrypt")) {
    routeContent = loginTemplateImport + routeContent;
  }

  const lastCloseIndex = routeContent.lastIndexOf("});");
  if (lastCloseIndex !== -1) {
    const updatedContent = [
      routeContent.slice(0, lastCloseIndex),
      loginTemplateFunction,
      routeContent.slice(lastCloseIndex),
    ].join("\n");

    routeContent = updatedContent;
  } else {
    routeContent += `\n${loginTemplateFunction}\n`;
  }

  fs.writeFileSync(routeFilePath, routeContent, "utf8");
  console.log(`Login template added to ${routeFile}`);
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

        promptSelectFields(schemaFields, (fields) => {
          addLoginTemplateToRoute(selectedRoute, fields, selectedModel);

          const jwtSecret = generateJwtSecret();
          const projectRoot = process.cwd();
          updateEnvFile(path.join(projectRoot, ".env.development"), jwtSecret);
          updateEnvFile(path.join(projectRoot, ".env.production"), jwtSecret);
          console.log(
            "JWT_SECRET has been added to .env.development and .env.production files."
          );

          installDependencies();
        });
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
