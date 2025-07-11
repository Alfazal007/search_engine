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
            token = token.toLowerCase()
            if (!this.redisConnection) {
                process.exit("No redis connection established")
            }
            await this.redisConnection.sadd("TOKENURLSET:" + token, url)
            await this.redisConnection.set("TOKENCOUNTSET:" + url + token, occurences.toString())
        } catch (err) {
            console.error(err)
        }
    }

    async deleteTokenUrlData(token: string, url: string) {
        try {
            token = token.toLowerCase()
            if (!this.redisConnection) {
                process.exit("No redis connection established")
            }
            await this.redisConnection.srem("TOKENURLSET:" + token, url)
            const countToDecrement = await this.redisConnection.get("TOKENCOUNTSET:" + url + token)
            if (countToDecrement) {
                await this.decrementTotalIDFCount(token, parseInt(countToDecrement))
            }
        } catch (err) {
            console.error(err)
            process.exit("Issue talking to redis")
        }
    }

    private async decrementTotalIDFCount(token: string, count: number) {
        try {
            token = token.toLowerCase()
            if (!this.redisConnection) {
                process.exit("No redis connection established")
            }
            const prevValue = await this.getTillNowTokenValue(token)
            const occurences = prevValue - count
            await this.redisConnection.set("COUNTOFTOKENFORIDFPURPOSES:" + token, occurences.toString())
        } catch (err) {
            console.error(err)
        }
    }

    async checkTokenPreExistsInUrlScannedEarlier(token: string, url: string): Promise<boolean> {
        try {
            token = token.toLowerCase()
            if (!this.redisConnection) {
                process.exit("No redis connection established")
            }
            const membersUrl = await this.redisConnection.smembers("TOKENURLSET:" + token)
            return membersUrl.includes(url)
        } catch (err) {
            console.error(err)
            process.exit("Issue talking to redis")
        }
    }

    private async getTillNowTokenValue(token: string): Promise<number> {
        try {
            token = token.toLowerCase()
            if (!this.redisConnection) {
                process.exit("No redis connection established")
            }
            const occurencesOfToken = await this.redisConnection.get("COUNTOFTOKENFORIDFPURPOSES:" + token)
            return occurencesOfToken ? parseInt(occurencesOfToken) : 0
        } catch (err) {
            console.error(err)
            return 0
        }
    }

    async setTillNowTokenValue(token: string, newOccurences: number) {
        try {
            token = token.toLowerCase()
            if (!this.redisConnection) {
                process.exit("No redis connection established")
            }
            const prevValue = await this.getTillNowTokenValue(token)
            const occurences = prevValue + newOccurences
            await this.redisConnection.set("COUNTOFTOKENFORIDFPURPOSES:" + token, occurences.toString())
        } catch (err) {
            console.error(err)
        }
    }

    async setTotalTokensInAUrl(url: string, tokenCount: number): Promise<void> {
        try {
            if (!this.redisConnection) {
                process.exit("No redis connection established")
            }
            await this.redisConnection.set("COUNTOFTOKENSINADOC:" + url, tokenCount.toString())
        } catch (err) {
            console.error(err)
        }
    }
}

export {
    RedisManager
}
