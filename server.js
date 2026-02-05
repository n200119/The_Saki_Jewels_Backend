import dotenv from "dotenv";
dotenv.config({ path: "./.env" });
console.log("RAZORPAY KEY:", process.env.RAZORPAY_KEY_ID);
import app from "./src/app.js";
import connectDB from "./src/config/db.js";
import razorpayInstance from "./src/utils/razorpay.js";
import dns from 'node:dns/promises';
dns.setServers(['1.1.1.1', '8.8.8.8']);

connectDB();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
