#!/usr/bin/env node

import fs from "fs";
import path from "path";
import readline from "readline";
import { execSync } from "child_process";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function isDatabaseConfigured() {
  const projectRoot = process.cwd();

  const devEnvPath = path.join(projectRoot, ".env.development");
  const prodEnvPath = path.join(projectRoot, ".env.production");

  const isDevConfigured =
    fs.existsSync(devEnvPath) &&
    fs.readFileSync(devEnvPath, "utf8").includes("MONGO_URI=");
  const isProdConfigured =
    fs.existsSync(prodEnvPath) &&
    fs.readFileSync(prodEnvPath, "utf8").includes("MONGO_URI=");

  return isDevConfigured || isProdConfigured;
}

function updateEnvFile(filePath, uri) {
  const mongoUriLine = `MONGO_URI=${uri}\n`;

  if (fs.existsSync(filePath)) {
    let envContent = fs.readFileSync(filePath, "utf8");
    if (envContent.includes("MONGO_URI=")) {
      envContent = envContent.replace(/MONGO_URI=.*/, mongoUriLine.trim());
    } else {
      envContent = envContent.trim() + "\n" + mongoUriLine;
    }
    fs.writeFileSync(filePath, envContent, "utf8");
  } else {
    fs.writeFileSync(filePath, mongoUriLine, "utf8");
  }
}

function addMongoDB(devUri, prodUri) {
  const projectRoot = process.cwd();

  // Add MongoDB connection file
  const dbContent = `
  import mongoose from 'mongoose';

  const connectDB = async () => {
    try {
      const conn = await mongoose.connect(process.env.MONGO_URI);
      console.log(\`MongoDB connected: \${conn.connection.host}\`);
    } catch (err) {
      console.error(err);
      process.exit(1);
    }
  };

  export default connectDB;
  `;
  if (!fs.existsSync(path.join(projectRoot, "src"))) {
    fs.mkdirSync(path.join(projectRoot, "src"), { recursive: true });
  }
  fs.writeFileSync(
    path.join(projectRoot, "src", "db.js"),
    dbContent.trim(),
    "utf8"
  );

  // Update index.js to import and use MongoDB connection
  const indexPath = path.join(projectRoot, "index.js");
  const dbImport = `import connectDB from './src/db.js';\n`;
  const dbUse = `connectDB();\n`;

  let indexContent = fs.readFileSync(indexPath, "utf8");
  if (!indexContent.includes(dbImport)) {
    indexContent = dbImport + indexContent;
  }
  if (!indexContent.includes(dbUse)) {
    indexContent = indexContent.replace(
      "const app = express();",
      `${dbUse}const app = express();`
    );
  }
  fs.writeFileSync(indexPath, indexContent, "utf8");

  // Update .env files
  updateEnvFile(path.join(projectRoot, ".env.development"), devUri);
  updateEnvFile(path.join(projectRoot, ".env.production"), prodUri);

  // Add mongoose to dependencies
  execSync("npm install mongoose", { stdio: "inherit" });

  console.log(
    `MongoDB integration added with development URI: ${devUri} and production URI: ${prodUri}`
  );
}

if (isDatabaseConfigured()) {
  console.log(
    "MongoDB is already configured in your environment files. Aborting operation."
  );
  rl.close();
} else {
  function promptForDatabaseDetails(env, callback) {
    console.log(`Enter details for the ${env} database:`);

    function askDatabaseName() {
      rl.question("Enter the MongoDB database name: ", (dbName) => {
        if (!dbName.trim()) {
          console.log("Database name is required.");
          askDatabaseName();
        } else {
          callback(dbName);
        }
      });
    }

    askDatabaseName();
  }

  promptForDatabaseDetails("development", (devDbName) => {
    rl.question(
      "Enter the MongoDB IP address (default: 127.0.0.1): ",
      (devIpAddress) => {
        const devIp = devIpAddress.trim() || "127.0.0.1";
        rl.question("Enter the MongoDB port (default: 27017): ", (devPort) => {
          const devDbPort = devPort.trim() || "27017";
          rl.question(
            "Enter the MongoDB user ID (leave blank if none): ",
            (devUserId) => {
              rl.question(
                "Enter the MongoDB password (leave blank if none): ",
                (devPassword) => {
                  let devUri = `mongodb://${devIp}:${devDbPort}/${devDbName}`;
                  if (devUserId && devPassword) {
                    devUri = `mongodb://${devUserId}:${devPassword}@${devIp}:${devDbPort}/${devDbName}`;
                  } else if (devUserId || devPassword) {
                    console.error(
                      "Both user ID and password must be provided together."
                    );
                    process.exit(1);
                  }

                  promptForDatabaseDetails("production", (prodDbName) => {
                    rl.question(
                      "Enter the MongoDB IP address (default: 127.0.0.1): ",
                      (prodIpAddress) => {
                        const prodIp = prodIpAddress.trim() || "127.0.0.1";
                        rl.question(
                          "Enter the MongoDB port (default: 27017): ",
                          (prodPort) => {
                            const prodDbPort = prodPort.trim() || "27017";
                            rl.question(
                              "Enter the MongoDB user ID (leave blank if none): ",
                              (prodUserId) => {
                                rl.question(
                                  "Enter the MongoDB password (leave blank if none): ",
                                  (prodPassword) => {
                                    let prodUri = `mongodb://${prodIp}:${prodDbPort}/${prodDbName}`;
                                    if (prodUserId && prodPassword) {
                                      prodUri = `mongodb://${prodUserId}:${prodPassword}@${prodIp}:${prodDbPort}/${prodDbName}`;
                                    } else if (prodUserId || prodPassword) {
                                      console.error(
                                        "Both user ID and password must be provided together."
                                      );
                                      process.exit(1);
                                    }

                                    addMongoDB(devUri, prodUri);
                                    rl.close();
                                  }
                                );
                              }
                            );
                          }
                        );
                      }
                    );
                  });
                }
              );
            }
          );
        });
      }
    );
  });
}
