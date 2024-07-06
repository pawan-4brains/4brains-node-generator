import express from "express";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import path from "path";
import cors from "cors";
import os from "os";

const env = process.env.NODE_ENV || "development";
dotenv.config({ path: `.env.${env}` });

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "50mb" }));
app.use(cors({ origin: "*" }));

// Serve static files from the public directory
const __dirname = path.resolve();
app.use(express.static(path.join(__dirname, "public")));

// Get local network IP address
function getLocalNetworkIp() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === "IPv4" && !iface.internal) {
        return iface.address;
      }
    }
  }
  return null;
}

// Start server
app.listen(port, () => {
  const localIp = getLocalNetworkIp();
  console.log(`App is running on http://localhost:${port}`);
  if (localIp) {
    console.log(
      `App is also accessible on your local network at http://${localIp}:${port}`
    );
  }
});
