const mongoose = require("mongoose");

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        // Log connection details to help debug persistence issues
        console.log("✅ MongoDB Connected");
        try {
            const host = mongoose.connection.host || conn?.connection?.host || 'unknown';
            const port = mongoose.connection.port || conn?.connection?.port || 'unknown';
            const name = mongoose.connection.name || conn?.connection?.name || conn?.connection?.db?.databaseName || process.env.MONGO_URI;
            console.log("MongoDB connection -> host: " + host + ", port: " + port + ", db: " + name);
            console.log("Mongoose readyState: " + mongoose.connection.readyState);
        } catch (e) {
            console.log('Could not read full mongoose connection details', e.message);
        }
    } catch (err) {
        console.error("❌ MongoDB Connection Error:", err);
        process.exit(1);
    }
};

module.exports = connectDB;
