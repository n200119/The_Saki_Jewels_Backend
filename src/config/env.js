import dotenv from "dotenv";
dotenv.config({ path: "./.env" });

if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
  throw new Error("❌ Razorpay keys missing in .env");
}

export {};
