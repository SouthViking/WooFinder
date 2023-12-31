import * as dotenv from 'dotenv';
import { MongoClient, Document, Filter, WithId, FindOptions } from 'mongodb';

dotenv.config();

export interface StorageConfig {
    dbName: string;
    connectionString: string;
}

export enum AppCollections {
    USERS = 'users',
    PETS = 'pets',
    REPORTS = 'reports',
    SPECIES = 'species',
}

export class Storage {
    public dbName: string;
    private dbClient: MongoClient | undefined;

    constructor(config: StorageConfig) {
        this.dbName = config.dbName;
        this.connect(config.connectionString);
    }

    private async connect(connectionString: string) {
        const mongoClient = new MongoClient(connectionString);
        this.dbClient = await mongoClient.connect();
    }

    public getCollection<T extends Document>(collection: string) {
        if (!this.dbClient) {
            throw new Error('DB client not initialized');
        }

        return this.dbClient.db(this.dbName).collection<T>(collection);
    }
    
    public async findAndGetAll<T extends Document>(collectionName: string, query: Filter<T>, options?: FindOptions) {
        const collection = this.getCollection<T>(collectionName);
        const results: WithId<T>[] = [];

        for await (const document of collection.find(query, options)) {
            results.push(document);
        }

        return results;
    }

    public async findAndGetAllAsObject<T extends Document>(collectionName: string, query: Filter<T>, options?: FindOptions) {
        const results = await this.findAndGetAll<T>(collectionName, query, options);

        const resultsMap: Record<string, WithId<T>> = {};
        for (const result of results) {
            resultsMap[result._id.toString()] = result;
        }

        return resultsMap;
    }

    public async findOne<T extends Document>(collectionName: string, query: Filter<T>, options?: FindOptions): Promise<WithId<T> | null> {
        const collection = this.getCollection<T>(collectionName);
        
        return await collection.findOne(query, options);
    }
}

export const storage = new Storage({ connectionString: process.env.DB_CONNECTION_STRING as string, dbName: 'WooFinder' });