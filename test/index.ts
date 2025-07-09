import { RedisClient } from "bun"

class RedisManager {
    private static instance: RedisManager | null = null
    private redisConnection: RedisClient | null = null

    private constructor() {
    }

    static async getInstance() {
        if (!RedisManager.instance) {
            RedisManager.instance = new RedisManager()
        }
        await RedisManager.instance.connect()
        return RedisManager.instance
    }

    private async connect() {
        if (!this.redisConnection) {
            this.redisConnection = new RedisClient()
        }
        if (!this.redisConnection.connected)
            await this.redisConnection.connect()
    }

    async indexToken(token: string, url: string, occurences: number) {
        try {
            if (!this.redisConnection) {
                process.exit("No redis connection established")
            }
            const objectToSet = { url, occurences }
            await this.redisConnection.sadd(token, JSON.stringify(objectToSet)) // TF
            await this.redisConnection.sadd(token, JSON.stringify(objectToSet)) // IDF
        } catch (err) {
            console.error(err)
        }
    }

    async getPrevValue(token: string) {
        try {
            if (!this.redisConnection) {
                process.exit("No redis connection established")
            }
            const documents = await this.redisConnection.smembers(token)
            console.log({ documents })
        } catch (err) {
            console.error(err)
        }
    }

    async getTillNowTokenValue(token: string) {
        try {
            if (!this.redisConnection) {
                process.exit("No redis connection established")
            }
            const occurencesOfToken = await this.redisConnection.get(token)
            return occurencesOfToken
        } catch (err) {
            console.error(err)
        }
    }

    async setTillNowTokenValue(token: string, occurences: number) {
        try {
            if (!this.redisConnection) {
                process.exit("No redis connection established")
            }
            await this.redisConnection.set(token, occurences.toString())
        } catch (err) {
            console.error(err)
        }
    }
}


const redis = await RedisManager.getInstance()
await redis.indexToken("hi", "https://google.com", 2)
await redis.indexToken("hi", "https://facebook.com", 3)
await redis.indexToken("hello", "https://google.com", 4)
await redis.getPrevValue("hi")
await redis.getPrevValue("dummy")
await redis.getPrevValue("hello")

