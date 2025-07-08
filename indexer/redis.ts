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

    async indexToken(token: string, url: string) {
        try {
            if (!this.redisConnection) {
                process.exit("No redis connection established")
            }
            await this.redisConnection.sadd(token, url)
        } catch (err) {
            console.error(err)
        }
    }
}

export {
    RedisManager
}
