import "./src/config/env.js"; // MUST be first import

import app from "./src/app.js";
import connectDB from "./src/config/db.js";
import dns from "node:dns/promises";

dns.setServers(['1.1.1.1', '8.8.8.8']);

connectDB();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
