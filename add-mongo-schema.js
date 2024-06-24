#!/usr/bin/env node

import fs from "fs";
import path from "path";
import readline from "readline";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const fieldTypes = [
  "String",
  "Number",
  "Date",
  "Boolean",
  "Array",
  "Buffer",
  "Mixed",
  "ObjectId",
];

function toCamelCase(str) {
  return str.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
}

function toPascalCase(str) {
  const camelCaseStr = toCamelCase(str);
  return camelCaseStr.charAt(0).toUpperCase() + camelCaseStr.slice(1);
}

function checkMongoDBConfig() {
  const projectRoot = process.cwd();
  const configFilePath = path.join(projectRoot, "config", "db.js");
  return fs.existsSync(configFilePath);
}

function promptSchemaDetails(schemaName) {
  const fields = [];

  function askField() {
    rl.question(
      "Enter field name (or press enter to finish): ",
      (fieldName) => {
        if (!fieldName.trim()) {
          generateSchemaFile(schemaName, fields);
          rl.close();
        } else {
          console.log("Choose field type:");
          fieldTypes.forEach((type, index) => {
            console.log(`${index + 1}. ${type}`);
          });

          rl.question(
            "Enter the number for the field type: ",
            (fieldTypeIndex) => {
              const fieldType = fieldTypes[parseInt(fieldTypeIndex, 10) - 1];
              if (!fieldType) {
                console.error(
                  "Invalid selection. Please choose a valid number."
                );
                askField();
                return;
              }

              rl.question("Is this field required? (y/n): ", (isRequired) => {
                const required = isRequired.trim().toLowerCase();
                if (required !== "y" && required !== "n") {
                  console.error("Invalid selection. Please enter 'y' or 'n'.");
                  askField();
                  return;
                }

                rl.question("Is this field unique? (y/n): ", (isUnique) => {
                  const unique = isUnique.trim().toLowerCase();
                  if (unique !== "y" && unique !== "n") {
                    console.error(
                      "Invalid selection. Please enter 'y' or 'n'."
                    );
                    askField();
                    return;
                  }

                  const field = {
                    name: fieldName.trim(),
                    type: fieldType,
                  };
                  if (required === "y") {
                    field.required = true;
                  }
                  if (unique === "y") {
                    field.unique = true;
                  }
                  fields.push(field);
                  askField();
                });
              });
            }
          );
        }
      }
    );
  }

  askField();
}

function generateSchemaFile(schemaName, fields) {
  const projectRoot = process.cwd();
  const modelsDir = path.join(projectRoot, "src", "models");

  if (!fs.existsSync(modelsDir)) {
    fs.mkdirSync(modelsDir, { recursive: true });
  }

  const schemaFilePath = path.join(modelsDir, `${toCamelCase(schemaName)}.js`);
  const pascalSchemaName = toPascalCase(schemaName);
  const schemaContent = `
import mongoose from 'mongoose';

const ${pascalSchemaName}Schema = new mongoose.Schema({
  ${fields
    .map((field) => {
      let fieldDef = `${field.name}: { type: ${field.type}`;
      if (field.required) {
        fieldDef += `, required: true`;
      }
      if (field.unique) {
        fieldDef += `, unique: true`;
      }
      fieldDef += ` }`;
      return fieldDef;
    })
    .join(",\n  ")}
}, { timestamps: true });

const ${pascalSchemaName} = mongoose.model('${pascalSchemaName}', ${pascalSchemaName}Schema);

export default ${pascalSchemaName};
  `;

  fs.writeFileSync(schemaFilePath, schemaContent.trim(), "utf8");
  console.log(`MongoDB schema ${schemaName} created successfully.`);
}

if (process.argv.length !== 3) {
  console.error("Usage: add-mongo-schema <schemaName>");
  process.exit(1);
}

const schemaName = process.argv[2];

if (!checkMongoDBConfig()) {
  console.error(
    "MongoDB is not configured. Please run 'node-app add-mongo' first."
  );
  process.exit(1);
}

promptSchemaDetails(schemaName);
