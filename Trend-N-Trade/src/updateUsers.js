const { MongoClient, ObjectId } = require('mongodb');
const dotenv = require('dotenv');

dotenv.config();


async function updateUsers() {

    const client = new MongoClient(process.env.DB_URI);



    try {
        await client.connect();
        db = client.db(process.env.DB_NAME);

        console.log('Connected to MongoDB');
    

        const userCollection = db.collection('user');

        /*const userId = new ObjectId('6655321a766861e645bcfd39');
        const userExists = await userCollection.findOne({ _id: userId });
        if (!userExists) {
            console.log(`No user found with _id: ${userId}`);
            return;
        }*/

        // Delete users

        // const result = await userCollection.updateMany(
        //     {},
        //     {
        //         $unset: {
        //             listings: "" // Unset the 'saves' field
        //         }
        //     }
        // );

        //Update all users to include an array of ObjectId
        const result = await userCollection.updateMany(
            {},
            {
                
                $set: {
                    card: [] // Example array of ObjectId
                }
            }
        );

        console.log(`Matched ${result.matchedCount} documents and modified ${result.modifiedCount} documents.`);
    } catch (err) {
        console.error('Failed to update users', err);
    } finally {
        await client.close();
        console.log('Closed the connection to MongoDB');
    }
}

updateUsers().catch(console.dir);