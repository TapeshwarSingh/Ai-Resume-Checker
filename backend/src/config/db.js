const dns = require("node:dns");
const mongoose = require("mongoose");
const env = require("./env");

try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch {
  // Ignore if not permitted
}

mongoose.set("strictQuery", true);


async function connectDB() {
  const conn = await mongoose.connect(env.mongoUri, {
    serverSelectionTimeoutMS: 10_000,
  });

  console.log(
    `MongoDB connected: ${conn.connection.host}/${conn.connection.name}`
  );

  mongoose.connection.on("error", (err) => {
    console.error("MongoDB error:", err.message);
  });

  mongoose.connection.on("disconnected", () => {
    console.warn("MongoDB disconnected");
  });
}

module.exports = { connectDB };