#!/usr/bin/env node

import fs from "fs";
import path from "path";
import readline from "readline";
import { execSync } from "child_process";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function addSocketIo(ipAddresses) {
  const projectRoot = process.cwd();
  const indexPath = path.join(projectRoot, "index.js");

  const socketIoImport = `import { Server } from "socket.io";\n`;
  const httpImport = `import http from "http";\n`;
  const ipArray = ipAddresses.split(",").map((ip) => ip.trim());
  const corsOrigins = ipArray.map((ip) => `"http://${ip}"`).join(", ");
  const socketIoSetup = `
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: [${corsOrigins}],
    methods: ["GET", "POST"]
  }
});

io.on("connection", (socket) => {
  console.log("A user connected");

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

// Middleware to pass io instance to routes
app.use((req, res, next) => {
  req.io = io;
  next();
});
`;

  let indexContent = fs.readFileSync(indexPath, "utf8");

  // Add imports if they don't already exist
  if (!indexContent.includes(socketIoImport)) {
    indexContent = socketIoImport + indexContent;
  }
  if (!indexContent.includes(httpImport)) {
    indexContent = httpImport + indexContent;
  }

  // Ensure Socket.io setup is placed before routes
  const routesStart = indexContent.indexOf("app.use(");
  if (routesStart !== -1) {
    indexContent =
      indexContent.slice(0, routesStart) +
      socketIoSetup +
      indexContent.slice(routesStart);
  } else {
    indexContent += socketIoSetup;
  }

  // Replace existing app.listen if it exists
  indexContent = indexContent.replace(/app\.listen\(port,.*\);/s, "");

  // Append server.listen at the end if not already present
  if (!indexContent.includes("server.listen(port")) {
    indexContent += `
server.listen(port, () => {
  console.log(\`Server is running on http://localhost:\${port}\`);
});
`;
  }

  fs.writeFileSync(indexPath, indexContent, "utf8");

  // Install socket.io
  execSync("npm install socket.io", { stdio: "inherit" });

  console.log("Socket.io integration added successfully.");
}

rl.question(
  "Enter the IP addresses for socket.io (comma-separated): ",
  (ipAddresses) => {
    addSocketIo(ipAddresses);
    rl.close();
  }
);
