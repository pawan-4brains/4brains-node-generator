#!/usr/bin/env node

import fs from "fs";
import path from "path";
import readline from "readline";
import { execSync } from "child_process";
import chalk from "chalk";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function updateEnvFile(filePath, wsPort) {
  const wsPortLine = `WS_PORT=${wsPort}\n`;

  if (fs.existsSync(filePath)) {
    let envContent = fs.readFileSync(filePath, "utf8");
    if (envContent.includes("WS_PORT=")) {
      envContent = envContent.replace(/WS_PORT=.*/, wsPortLine.trim());
    } else {
      envContent = envContent.trim() + "\n" + wsPortLine;
    }
    fs.writeFileSync(filePath, envContent, "utf8");
  } else {
    fs.writeFileSync(filePath, wsPortLine, "utf8");
  }
}

function addWebSocket(wsPort) {
  const projectRoot = process.cwd();
  const indexPath = path.join(projectRoot, "index.js");

  const wsImport = `import { WebSocketServer } from 'ws';\nimport http from 'http';\n`;
  const websocketSetup = `
const wsServer = new WebSocketServer({ port: process.env.WS_PORT || ${wsPort} });

wsServer.on('connection', (ws) => {
  console.log('A client connected');

  ws.on('message', (message) => {
    console.log('Received:', message);
    // Broadcast the message to all clients
    wsServer.clients.forEach((client) => {
      if (client.readyState === ws.OPEN) {
        client.send(message);
      }
    });
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

app.use((req, res, next) => {
  req.wss = wsServer; 
  next();
});

console.log(\`WebSocket server is running on port \${process.env.WS_PORT}\`);
`;

  let indexContent = fs.readFileSync(indexPath, "utf8");

  // Add imports if they don't already exist
  if (!indexContent.includes(wsImport)) {
    indexContent = wsImport + indexContent;
  }

  // Remove existing app.listen if it exists
  if (indexContent.includes("app.listen(port")) {
    indexContent = indexContent.replace(/app\.listen\(port.*\);/s, "");
  }

  // Ensure WebSocket setup is placed before routes
  if (!indexContent.includes("const wsServer = new WebSocketServer({ port:")) {
    const routesStart = indexContent.indexOf("app.use(");
    if (routesStart !== -1) {
      indexContent =
        indexContent.slice(0, routesStart) +
        websocketSetup +
        indexContent.slice(routesStart);
    } else {
      indexContent += websocketSetup;
    }
  }

  // Append app.listen at the end if not already present
  if (!indexContent.includes("app.listen(port")) {
    indexContent += `
const server = app.listen(port, () => {
  console.log(\`App is running on http://localhost:\${port}\`);
});
`;
  }

  fs.writeFileSync(indexPath, indexContent, "utf8");

  // Update .env files
  updateEnvFile(path.join(projectRoot, ".env.development"), wsPort);
  updateEnvFile(path.join(projectRoot, ".env.production"), wsPort);

  // Install ws library
  console.log(chalk.green("Installing ws..."));
  execSync("npm install ws", { stdio: "inherit" });

  console.log(chalk.green("WebSocket integration added successfully."));
}

rl.question(
  chalk.yellow("Enter the port for WebSocket server (default: 3001): "),
  (answer) => {
    const wsPort = answer.trim() || 3001;
    addWebSocket(wsPort);
    rl.close();
  }
);
