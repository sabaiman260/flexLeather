
const dotenv = require("dotenv");
const app = require("./app.js");
const connectDB = require("./src/core/database/index.js");

dotenv.config();

const PORT = process.env.PORT || 4000;

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log("🎯 Server started successfully!");
      console.log("📍 Port:", PORT);
      console.log("🌍 Environment:", process.env.NODE_ENV);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB Connection Error:", err);
    process.exit(1);
  });























// const app = require("./app.js");
// const dotenv = require("dotenv");
// const connectDB = require("./src/core/database/index.js");

// dotenv.config();
// const PORT = process.env.PORT || 4000;

// connectDB()
//   .then(() => {
//     app.listen(PORT, () => {
//       console.log("🎯 Server started successfully!");
//       console.log("📍 Port: " + PORT);
//       console.log("🌍 Environment: " + process.env.NODE_ENV);
//     });
//   })
//   .catch((err) => {
//     console.error("❌ MongoDB Connection Error:", err);
//     process.exit(1);
//   });
