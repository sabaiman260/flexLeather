import app from "./app.js";
import dotenv from "dotenv";
import connectDB from "./src/core/database/index.js";
import { testEmailConnection } from "./src/shared/helpers/mail.helper.js";

dotenv.config();
const PORT = process.env.PORT || 4000;


connectDB()
  .then(async () => {
    // Test email connection before starting server
    const emailConnected = await testEmailConnection();
    
    app.listen(PORT, () => {
      console.log(`🎯 Server started successfully!`);
      console.log(`📍 Port: ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
      if (emailConnected) {
        console.log(`📧 Email service: ✅ Connected`);
      } else {
        console.warn(`📧 Email service: ⚠️ Failed to connect - emails may not send`);
      }
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB Connection Error:", err);
    process.exit(1);
  });
