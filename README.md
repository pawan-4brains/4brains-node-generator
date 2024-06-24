# 4Brains Node Generator

A comprehensive CLI tool to streamline the generation and management of Node.js applications by 4Brains Technologies.

## Installation

To install the 4Brains Node Generator globally, use the following command:

```sh
npm install -g 4brains-node-generator
```

## Available Commands

### `node-app init <projectName>`

Initialize a new Node.js project with the specified name.

```sh
node-app init my-project
```

### `node-app add-api <endpointName>`

Add a new API endpoint to your project.

```sh
node-app add-api users
```

### `node-app add-mongo`

Integrate MongoDB into your project. This command sets up the necessary MongoDB configuration.

```sh
node-app add-mongo
```

### `node-app add-mongo-schema <schemaName>`

Create a new MongoDB schema. You will be prompted to enter field details for the schema.

```sh
node-app add-mongo-schema User
```

### `node-app add-login`

Add a login template to an existing route in your project. You will be prompted to select a route and a model, and then enter the login fields.

```sh
node-app add-login
```

### `node-app add-mongo-insert`

Add a template for inserting data into a MongoDB collection. This command allows you to easily create routes for data insertion.

```sh
node-app add-mongo-insert
```

### `node-app add-mongo-update`

Add a template for updating data in a MongoDB collection. This facilitates creating routes for updating documents.

```sh
node-app add-mongo-update
```

### `node-app add-mongo-read`

Add a template for reading data from a MongoDB collection, helping you to quickly set up read operations.

```sh
node-app add-mongo-read
```

### `node-app add-mongo-delete`

Add a template for deleting data from a MongoDB collection, making it easy to handle deletion operations.

```sh
node-app add-mongo-delete
```

### `node-app add-socket`

Integrate Socket.io into your project for real-time communication capabilities.

```sh
node-app add-socket
```

### `node-app add-websocket`

Add native WebSocket support to your project.

```sh
node-app add-websocket
```

## Examples

### Adding MongoDB Schema

When you run the command to add a MongoDB schema, you will be prompted to enter the field details.

```sh
node-app add-mongo-schema User
```

### Adding a Login Template

When you run the command to add a login template, you will be prompted to select a route and a model, and then enter the login fields.

```sh
node-app add-login
```

## Real-time Communication Integration

### WebSocket Integration

When you add WebSocket integration, it will automatically be added to your project.

```sh
node-app add-websocket
```

To use `req.wss` in your route endpoints, you can access the WebSocket server as follows:

```js
router.get("/some-endpoint", (req, res) => {
  req.wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send("Hello, client!");
    }
  });
  res.send("Message sent to all WebSocket clients.");
});
```

### Socket.io Integration

When you add Socket.io integration, it will automatically be added to your project.

```sh
node-app add-socket
```

To use `req.io` in your route endpoints, you can access the Socket.io server as follows:

```js
router.get("/some-endpoint", (req, res) => {
  req.io.emit("message", "Hello, Socket.io clients!");
  res.send("Message sent to all Socket.io clients.");
});
```

## Help

If you enter an invalid command, you will see the following message:

```sh
Unknown command. Use -h or --help for help.
```

You can also use `-h` or `--help` to get help information.

```sh
node-app -h
node-app --help
```

## License

This project is licensed under the ISC License.
