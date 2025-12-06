import { createClient } from 'psf-core-node/helpers/mongo.helper.js';

const DB_NAME = 'psfNotifier';

/**
 * Seeds the notifier database (psfNotifier) with initial data,
 * specifically the default user settings.
 */
async function seedNotifierDatabase() {
    let close;
    console.log(`Starting to seed database: ${DB_NAME}...`);

    try {
        const { db, close: closeFn } = await createClient(DB_NAME);
        close = closeFn;

        const settingsCollection = db.collection('user_settings');

        const defaultSettings = {
            _id: 'DEFAULT_SETTINGS',
            description: 'Default notification settings for all users. Users can override these.',
            email: ['welcome', 'login'],
            phone: ['confirm2factor'],
            inApp: [],
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        console.log('Upserting default settings...');
        await settingsCollection.updateOne(
            { _id: defaultSettings._id },
            { $set: defaultSettings },
            { upsert: true }
        );
        console.log('Default settings seeded.');

        console.log(`Seeding for ${DB_NAME} completed successfully.`);
    } catch (error) {
        console.error(`Error during the seeding of database ${DB_NAME}:`, error);
        process.exit(1);
    } finally {
        if (close) {
            await close();
            console.log('MongoDB connection closed.');
        }
    }
}

seedNotifierDatabase();