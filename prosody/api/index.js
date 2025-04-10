// Bun-compatible API server for XMPP message monitoring
import { serve } from "bun";

// Store connected clients
const clients = new Set();

// HTTP Server with API endpoints and WebSocket support
const server = serve({
  port: process.env.PORT || 3000,
  fetch(req) {
    const url = new URL(req.url);

    // WebSocket upgrade
    if (url.pathname === "/ws") {
      console.log("WebSocket connection attempt"); // Debug logging
      const upgraded = server.upgrade(req);
      if (upgraded) {
        console.log("WebSocket upgrade successful"); // Debug logging
        return undefined;
      }
      console.log("WebSocket upgrade failed"); // Debug logging
      return new Response("WebSocket upgrade failed", { status: 400 });
    }

    // API status endpoint
    if (url.pathname === "/api/status" && req.method === "GET") {
      return new Response(
        JSON.stringify({
          status: "running",
          connectedClients: clients.size,
        }),
        {
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        },
      );
    }

    // Message endpoint for Prosody
    if (url.pathname === "/api/messages" && req.method === "POST") {
      // Check authorization
      const authHeader = req.headers.get("authorization");
      const token = authHeader?.split(" ")[1];

      if (!token || token !== "your_secret_token") {
        return new Response("Unauthorized", { status: 401 });
      }

      // Process message data
      return req.json().then((messageData) => {
        console.log("Received message:", messageData);

        // Broadcast to all connected WebSocket clients
        clients.forEach((client) => {
          client.send(JSON.stringify(messageData));
        });

        return new Response(JSON.stringify({ status: "ok" }), {
          headers: { "Content-Type": "application/json" },
        });
      });
    }

    // CORS preflight
    if (req.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      });
    }

    // Not found
    return new Response("Not Found", { status: 404 });
  },
  websocket: {
    open(ws) {
      console.log("Client connected");
      clients.add(ws);
    },
    message(ws, message) {
      // Handle incoming WebSocket messages if needed
      console.log("Received WebSocket message:", message);
    },
    close(ws) {
      console.log("Client disconnected");
      clients.delete(ws);
    },
  },
});

console.log(`Server running on port ${server.port}`);
