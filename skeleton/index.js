import express from "express";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import path from "path";

const env = process.env.NODE_ENV || "development";
dotenv.config({ path: `.env.${env}` });

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files from the public directory
const __dirname = path.resolve();
app.use(express.static(path.join(__dirname, "public")));

// Start server
app.listen(port, () => {
  console.log(`App is running on http://localhost:${port}`);
});
