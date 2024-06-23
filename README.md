# 4Brains Node Generator - CLI tool

4Brains Node Generator is a CLI tool to generate a Node.js app, add API endpoints, integrate MongoDB, and set up Socket.io and WebSocket. This tool helps streamline the setup of a Node.js project with essential features.

## Installation

Install the CLI tool globally using npm:

```sh
npm install -g 4brains-node-generator
```

## Commands

### Initialize a New Project

Create a new Node.js project with a predefined skeleton:

```sh
node-app init <projectName>
```

**Example:**

```sh
node-app init my-new-project
```

This command will create a new project folder named `my-new-project` and set up a basic Node.js application.

### Add an API Endpoint

Add a new API endpoint to your project:

```sh
node-app add-api <endpointName>
```

**Example:**

```sh
node-app add-api users
```

This command will prompt you to choose the HTTP method for the new endpoint. It will then create a new route file under `src/routes` and update `index.js` to include the new route.

### Integrate MongoDB

Integrate MongoDB into your project:

```sh
node-app add-mongodb
```

This command will prompt you for the MongoDB database details for both development and production environments. It will set up the MongoDB connection in your project and update the necessary environment variables in both `.env.development` and `.env.production` files.

### Add a MongoDB Schema

Add a new MongoDB schema to your project:

```sh
node-app add-mongodb-schema <schemaName>
```

**Example:**

```sh
node-app add-mongodb-schema user
```

This command will prompt you to enter the fields for the new schema and create a model file under `src/models`.

### Add Data Insertion Logic

Add data insertion logic to an existing route:

```sh
node-app add-mongodb-insert
```

This command will prompt you to select a route file and a model file, then automatically add data insertion logic to the selected route.

### Add Login Logic

Add login logic to an existing route:

```sh
node-app add-login
```

This command will prompt you to select a route file and a model file, then automatically add login logic to the selected route. It will also generate a JWT secret and update your `.env` files.

### Set Up Socket.io

Set up Socket.io in your project:

```sh
node-app add-socket
```

This command will prompt you for the IP addresses (comma-separated) that should be allowed to connect to the Socket.io server. It will then integrate Socket.io into your project and handle CORS configuration for the provided IP addresses.

**Example:**

```sh
Enter the IP addresses for socket.io (comma-separated): 192.168.1.100, 192.168.1.101
```

### Using `req.io` in Routes

When you set up Socket.io, the server instance is attached to the request object as `req.io`. You can use this instance in your route endpoints to emit events.

**Example for Socket.io:**

```js
router.post("/example", (req, res) => {
  req.io.emit("message", "Hello from Socket.io");
  res.send("Message sent to all clients");
});
```

### Set Up WebSocket

Set up WebSocket in your project:

```sh
node-app add-websocket
```

This command will prompt you for the port for the WebSocket server. It will then integrate WebSocket into your project.

**Example:**

```sh
Enter the port for WebSocket server (default: 3001): 3001
```

### Using `req.wss` in Routes

When you set up WebSocket, the server instance is attached to the request object as `req.wss`. You can use this instance in your route endpoints to handle WebSocket connections.

**Example for WebSocket:**

```js
router.post("/example", (req, res) => {
  req.wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send("Hello from WebSocket");
    }
  });
  res.send("Message sent to all clients");
});
```

## License

This project is licensed under the ISC License.

## Author

4Brains Technologies Private Limited
