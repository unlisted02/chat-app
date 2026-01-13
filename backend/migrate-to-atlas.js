import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();
const LOCAL_DB_URI = process.env.LOCAL_DB_URI;
const ATLAS_DB_URI = process.env.ATLAS_DB_URI;

if (!LOCAL_DB_URI || !ATLAS_DB_URI) {
    console.error("❌ Missing LOCAL_DB_URI or ATLAS_DB_URI in .env");
    process.exit(1);
}

// Debug: Show connection string (with password masked)
const maskedAtlasUri = ATLAS_DB_URI.replace(/:\/\/([^:]+):([^@]+)@/, "://$1:****@");
console.log("🔗 Using Atlas URI:", maskedAtlasUri);

// Optional: avoid Mongoose deprecation warnings
mongoose.set("strictQuery", false);

// Create independent connections (don’t reuse global connection)
const connectLocal = async () => {
    try {
        const localConnection = await mongoose.createConnection(LOCAL_DB_URI).asPromise();
        console.log("✅ Connected to LOCAL database");
        return localConnection;
    } catch (error) {
        console.error("❌ Local connection error:", error.message);
        process.exit(1);
    }
};

const connectAtlas = async () => {
    try {
        // Add connection options to help with SRV DNS resolution
        const atlasConnection = mongoose.createConnection(ATLAS_DB_URI, {
            serverSelectionTimeoutMS: 30000, // 30 seconds timeout
            socketTimeoutMS: 45000,
            connectTimeoutMS: 30000,
            retryWrites: true,
            w: 'majority',
        });
        
        await atlasConnection.asPromise();
        console.log("✅ Connected to ATLAS database");
        return atlasConnection;
    } catch (error) {
        console.error("❌ Atlas connection error:", error.message);
        console.error("\n💡 Troubleshooting tips:");
        console.error("   1. Check your IP is whitelisted in Atlas Network Access");
        console.error("   2. Verify your connection string includes the database name");
        console.error("   3. Try using the standard (non-SRV) connection string from Atlas");
        console.error("   4. Check your network/firewall settings");
        process.exit(1);
    }
};

const migrateCollection = async (localConnection, atlasConnection, collectionName) => {
    try {
        const localCollection = localConnection.db.collection(collectionName);
        const atlasCollection = atlasConnection.db.collection(collectionName);

        const localCount = await localCollection.countDocuments();
        console.log(`\n📦 ${collectionName}: Found ${localCount} documents in local database`);

        if (localCount === 0) {
            console.log(`⏭️  Skipping ${collectionName} (empty collection)`);
            return;
        }

        const documents = await localCollection.find({}).toArray();
        console.log(`📥 Fetched ${documents.length} documents from local`);

        if (documents.length === 0) return;

        try {
            const result = await atlasCollection.insertMany(documents, {
                ordered: false, // continue on duplicates
            });
            console.log(`✅ Successfully migrated ${result.insertedCount} documents to Atlas`);
        } catch (error) {
            if (error.code === 11000) {
                console.log("⚠️  Duplicate key errors detected. Inserting documents one by one...");
                let successCount = 0;
                let skippedCount = 0;

                for (const doc of documents) {
                    try {
                        await atlasCollection.insertOne(doc);
                        successCount++;
                    } catch (err) {
                        if (err.code === 11000) {
                            skippedCount++;
                        } else {
                            console.error("❌ Error inserting document:", err.message);
                        }
                    }
                }

                console.log(
                    `✅ Migrated ${successCount} new documents (${skippedCount} already existed)`
                );
            } else {
                throw error;
            }
        }
    } catch (error) {
        console.error(`❌ Error migrating ${collectionName}:`, error.message);
    }
};

const migrate = async () => {
    console.log("🚀 Starting database migration from LOCAL to ATLAS\n");

    const localConnection = await connectLocal();
    const atlasConnection = await connectAtlas();

    // TODO: update this list to match your app’s collections
    const collections = ["users", "messages"];

    console.log("\n📋 Collections to migrate:", collections.join(", "));

    for (const collectionName of collections) {
        await migrateCollection(localConnection, atlasConnection, collectionName);
    }

    console.log("\n✅ Migration completed!");
    console.log("\n📊 Verifying migration...");

    for (const collectionName of collections) {
        try {
            const atlasCollection = atlasConnection.db.collection(collectionName);
            const count = await atlasCollection.countDocuments();
            console.log(`   ${collectionName}: ${count} documents in Atlas`);
        } catch (error) {
            console.log(`   ${collectionName}: Collection doesn't exist yet`);
        }
    }

    // Close both connections
    await localConnection.close();
    await atlasConnection.close();

    console.log("\n🎉 All done! Check your MongoDB Atlas database.");
    process.exit(0);
};

migrate().catch((error) => {
    console.error("❌ Migration failed:", error);
    process.exit(1);
});