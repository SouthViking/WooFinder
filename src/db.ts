import * as dotenv from 'dotenv';
import { MongoClient, Document } from 'mongodb';

dotenv.config();

export interface StorageConfig {
    dbName: string;
    connectionString: string;
};

export class Storage {
    public dbName: string;
    private dbClient: MongoClient;

    constructor(config: StorageConfig) {
        this.dbName = config.dbName;
        this.dbClient = new MongoClient(config.connectionString);
        this.connect();
    }

    private async connect() {
        await this.dbClient.connect();
    }

    public getCollection<T extends Document>(collection: string) {
        return this.dbClient.db(this.dbName).collection<T>(collection);
    }

}

export const storage = new Storage({ connectionString: process.env.DB_CONNECTION_STRING as string, dbName: 'WooFinder' });