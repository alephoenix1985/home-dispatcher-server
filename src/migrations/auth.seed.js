import { ObjectId } from 'mongodb';
import { createClient } from 'psf-core-node/helpers/mongo.helper.js';

const DB_NAME = 'psfAuth';

/**
 * Seeds the authentication database (psfAuth) with initial data for
 * permissions, roles, and clients.
 */
async function seedAuthDatabase() {
    console.log(`Starting to seed database: ${DB_NAME}...`);
    const { db, close } = await createClient(DB_NAME);

    try {

        const permissionsCollection = db.collection('permissions');
        const permissions = [
            {_id: 'user:read', description: 'Allows reading user information'},
            {_id: 'user:write', description: 'Allows modifying user information'},
            {_id: 'user:ban', description: 'Allows banning users'},
            {_id: 'service:read', description: 'Allows reading service information'},
            {_id: 'service:write', description: 'Allows modifying service information'},
            {_id: 'admin:manage', description: 'Allows managing other administrators'},
        ];

        console.log('Upserting permissions...');
        for (const perm of permissions) {
            await permissionsCollection.updateOne(
                {_id: perm._id},
                {$set: perm},
                {upsert: true}
            );
        }
        console.log('Permissions seeded.');

        const rolesCollection = db.collection('roles');
        const roles = [
            {
                _id: 'dev',
                permissions: [
                    'user:read',
                    'user:write',
                    'user:ban',
                    'service:read',
                    'service:write',
                    'admin:manage',
                ],
                description: 'Role with maximum permissions, typically for developers.'
            },
            {
                _id: 'admin',
                permissions: [
                    'user:read',
                    'user:write',
                    'user:ban',
                    'service:read',
                ],
                description: 'Regular administrator, manages assigned clients or client sections.'
            },
            {_id: 'regular', permissions: ['user:read'], description: 'User who has only registered.'},
            {
                _id: 'collaborator',
                permissions: ['user:read', 'service:read'],
                description: 'User who has paid for a subscription.'
            },
            {_id: 'client', permissions: ['user:read'], description: 'Client for a specific application.'},
        ];

        console.log('Upserting roles...');
        for (const role of roles) {
            await rolesCollection.updateOne(
                {_id: role._id},
                {$set: role},
                {upsert: true}
            );
        }
        console.log('Roles seeded.');

        const clientsCollection = db.collection('clients');
        const ownerId = new ObjectId();
        const clients = [
            {
                identifier: 'Y8877444C',
                name: 'PSF Phoenix software factory',
                logo: new ObjectId(),
                contact: {
                    phone: '+1-555-123-4567',
                    email: 'alephoenix1985@gmail.com'
                },
                admins: [ownerId],
                owner: ownerId,
            },
        ];

        console.log('Upserting clients...');
        for (const client of clients) {
            await clientsCollection.updateOne(
                {identifier: client.identifier},
                {$set: client},
                {upsert: true}
            );
        }
        console.log('Clients seeded.');

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

seedAuthDatabase();
