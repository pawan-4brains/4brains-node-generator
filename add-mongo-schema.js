#!/usr/bin/env node

import fs from "fs";
import path from "path";
import readline from "readline";
import chalk from "chalk";

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

function convertDefaultValue(fieldType, value) {
  try {
    switch (fieldType) {
      case "Number":
        if (isNaN(value)) throw new Error("Invalid number");
        return parseFloat(value);
      case "Date":
        const date = new Date(value);
        if (isNaN(date.getTime())) throw new Error("Invalid date");
        return date;
      case "Boolean":
        if (value.toLowerCase() !== "true" && value.toLowerCase() !== "false") {
          throw new Error("Invalid boolean");
        }
        return value.toLowerCase() === "true";
      case "Array":
        return JSON.parse(value);
      case "ObjectId":
        return value; // Keep as string; Mongoose will cast it
      case "Buffer":
        return Buffer.from(value);
      default:
        return value;
    }
  } catch (e) {
    return null;
  }
}

function promptSchemaDetails(schemaName) {
  const fields = [];

  function askField() {
    rl.question(
      chalk.yellow("\nEnter field name (or press enter to finish): "),
      (fieldName) => {
        if (!fieldName.trim()) {
          generateSchemaFile(schemaName, fields);
          rl.close();
        } else {
          console.log(chalk.cyan("Choose field type:"));
          fieldTypes.forEach((type, index) => {
            console.log(chalk.cyan(`${index + 1}. ${type}`));
          });

          rl.question(
            chalk.yellow("Enter the number for the field type: "),
            (fieldTypeIndex) => {
              const fieldType = fieldTypes[parseInt(fieldTypeIndex, 10) - 1];
              if (!fieldType) {
                console.error(
                  chalk.red("Invalid selection. Please choose a valid number.")
                );
                askField();
                return;
              }

              rl.question(
                chalk.yellow("Is this field required? (y/n): "),
                (isRequired) => {
                  const required = isRequired.trim().toLowerCase();
                  if (required !== "y" && required !== "n") {
                    console.error(
                      chalk.red("Invalid selection. Please enter 'y' or 'n'.")
                    );
                    askField();
                    return;
                  }

                  rl.question(
                    chalk.yellow("Is this field unique? (y/n): "),
                    (isUnique) => {
                      const unique = isUnique.trim().toLowerCase();
                      if (unique !== "y" && unique !== "n") {
                        console.error(
                          chalk.red(
                            "Invalid selection. Please enter 'y' or 'n'."
                          )
                        );
                        askField();
                        return;
                      }

                      function askDefaultValue() {
                        rl.question(
                          chalk.yellow(
                            `Enter default value${
                              fieldType === "Boolean" ? " (true/false)" : ""
                            }${
                              fieldType === "Date"
                                ? " (e.g., 2023-01-01T00:00:00Z)"
                                : ""
                            } (or press enter to skip): `
                          ),
                          (defaultValue) => {
                            if (defaultValue.trim()) {
                              const convertedDefaultValue = convertDefaultValue(
                                fieldType,
                                defaultValue.trim()
                              );
                              if (convertedDefaultValue === null) {
                                console.error(
                                  chalk.red(
                                    "Invalid default value. Please enter a valid value."
                                  )
                                );
                                askDefaultValue();
                                return;
                              }
                              fields.push({
                                name: fieldName.trim(),
                                type: fieldType,
                                required: required === "y",
                                unique: unique === "y",
                                default: convertedDefaultValue,
                              });
                            } else {
                              fields.push({
                                name: fieldName.trim(),
                                type: fieldType,
                                required: required === "y",
                                unique: unique === "y",
                              });
                            }
                            askField();
                          }
                        );
                      }

                      askDefaultValue();
                    }
                  );
                }
              );
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
      let fieldDef = `${field.name}: { type: ${
        field.type === "ObjectId"
          ? "mongoose.Schema.Types.ObjectId"
          : field.type
      }`;
      if (field.required) {
        fieldDef += `, required: true`;
      }
      if (field.unique) {
        fieldDef += `, unique: true`;
      }
      if (field.default !== undefined) {
        fieldDef += `, default: ${JSON.stringify(field.default)}`;
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
  console.log(
    chalk.green(`MongoDB schema ${schemaName} created successfully.`)
  );
}

if (process.argv.length !== 3) {
  console.error(chalk.red("Usage: add-mongo-schema <schemaName>"));
  process.exit(0);
}

const schemaName = process.argv[2];

promptSchemaDetails(schemaName);
