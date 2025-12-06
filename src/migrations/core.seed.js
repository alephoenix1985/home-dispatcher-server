import { createClient } from 'psf-core-node/helpers/mongo.helper.js';
const DB_NAME = 'psfCore';

async function seedCoreDatabase() {
    console.log(`Starting to seed database: ${DB_NAME}...`);
    const { db, close } = await createClient(DB_NAME);

    try {
        console.log('Connected to MongoDB for core seeding...');

        // --- Services ---
        const servicesCollection = db.collection('services');
        const services = [
            {
                _id: 'main',
                name: 'PSF Company',
                iconUrl: '/icons/psf-logo.png',
                callbackUrl: 'http://localhost:3000/auth/callback/main',
            },
            {
                _id: 'auth',
                name: 'PSF Auth Service',
                iconUrl: '/icons/tasks-app.png',
                callbackUrl: 'http://localhost:3001/auth/callback',
            },
        ];

        console.log('Upserting services...');
        for (const service of services) {
            await servicesCollection.updateOne(
                { _id: service._id },
                { $set: service },
                { upsert: true }
            );
        }
        console.log('Services seeded.');

        // --- Translations ---
        const translationsCollection = db.collection('translations');
        const translations = [
            { namespace: 'auth', lang: 'en', key: 'login_title', value: 'Sign In' },
            { namespace: 'auth', lang: 'es', key: 'login_title', value: 'Iniciar Sesión' },
            { namespace: 'auth', lang: 'en', key: 'google_signin', value: 'Sign in with Google' },
            { namespace: 'auth', lang: 'es', key: 'google_signin', value: 'Iniciar sesión con Google' },
            { namespace: 'auth', lang: 'en', key: 'email_placeholder', value: 'Email' },
            { namespace: 'auth', lang: 'es', key: 'email_placeholder', value: 'Correo electrónico' },
            { namespace: 'auth', lang: 'en', key: 'password_placeholder', value: 'Password' },
            { namespace: 'auth', lang: 'es', key: 'password_placeholder', value: 'Contraseña' },
            { namespace: 'auth', lang: 'en', key: 'signin_button', value: 'Sign In' },
            { namespace: 'auth', lang: 'es', key: 'signin_button', value: 'Iniciar Sesión' },
            { namespace: 'auth', lang: 'en', key: 'signup_link', value: 'Don\'t have an account? Sign Up' },
            { namespace: 'auth', lang: 'es', key: 'signup_link', value: '¿No tienes cuenta? Regístrate' },
            { namespace: 'auth', lang: 'en', key: 'or_divider', value: 'OR' },
            { namespace: 'auth', lang: 'es', key: 'or_divider', value: 'O' },
        ];

        console.log('Upserting translations...');
        for (const translation of translations) {
            await translationsCollection.updateOne(
                { namespace: translation.namespace, lang: translation.lang, key: translation.key },
                { $set: translation },
                { upsert: true }
            );
        }
        console.log('Translations seeded.');

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

seedCoreDatabase();
