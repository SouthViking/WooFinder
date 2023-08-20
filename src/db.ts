import { MongoClient, Document } from 'mongodb';

export interface StorageConfig {
    dbName: string;
    connectionString: string;
}

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

export const storage = new Storage({ connectionString: 'mongodb+srv://southviking:pwd123@cluster0.6jdcmrb.mongodb.net/?retryWrites=true&w=majority', dbName: 'WooFinder' });