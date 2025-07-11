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

    async getTfResultsForUrlsForTokens(tokens: string[]) {
        const tokenUrls = await Promise.all(
            tokens.map(async (tokenRaw) => {
                const token = tokenRaw.toLowerCase()
                const urlsOfTF = await this.redisConnection?.smembers("TOKENURLSET:" + token)
                return urlsOfTF ?? []
            })
        )
        return tokenUrls
    }

    async getTermFrequencyAndIdfForEachTokenInEachUrl(tokens: string[], urls: string[][]): Promise<{ url: string, tfOccurence: number, idfOccurence: number, tokensInUrlCount: number, totalTokens: number, token: string }[]> {
        if (!tokens || !urls) {
            return []
        }
        let res: { url: string, tfOccurence: number, idfOccurence: number, tokensInUrlCount: number, totalTokens: number, token: string }[] = []
        for (let i = 0; i < tokens.length; i++) {
            let token = tokens[i]
            if (urls[i] && token) {
                token = token.toLowerCase()
                // @ts-ignore
                for (let j = 0; j < urls[i].length; j++) {
                    // @ts-ignore
                    let url = urls[i][j]
                    if (url) {
                        const occurences = await this.redisConnection?.get("TOKENCOUNTSET:" + url + token)
                        if (occurences) {
                            let intOccurence = parseInt(occurences)
                            const idfOccurence = await this.redisConnection?.get("COUNTOFTOKENFORIDFPURPOSES:" + token)
                            if (idfOccurence) {
                                let intIdfResult = parseInt(idfOccurence)
                                const tokensInUrlCountString = await this.redisConnection?.
                                    get("COUNTOFTOKENSINADOC:" + url)
                                if (tokensInUrlCountString) {
                                    const totalTokens = await this.getTotalTokensInAUrl(url)
                                    res.push({ url, tfOccurence: intOccurence, idfOccurence: intIdfResult, tokensInUrlCount: parseInt(tokensInUrlCountString), totalTokens, token })
                                }
                            }
                        }
                    }
                }
            }
        }
        return res
    }

    async getIdfResult(token: string, url: string): Promise<number> {
        const idfResult = await this.redisConnection?.get("TOKENCOUNTSET:" + url + token)
        if (!idfResult) {
            return 0
        }
        const intIdfResult = parseInt(idfResult)
        if (!intIdfResult) {
            return 0
        }
        return intIdfResult
    }

    async getTotalTokensInAUrl(url: string): Promise<number> {
        try {
            if (!this.redisConnection) {
                return 1000
            }
            const tokensTotal = await this.redisConnection.get("COUNTOFTOKENSINADOC:" + url)
            if (!tokensTotal) {
                return 1000
            }
            return parseInt(tokensTotal)
        } catch (err) {
            console.error(err)
            return 1000
        }
    }

    async totalNumberOfDocs(): Promise<number> {
        const result = await this.redisConnection?.send("PFCOUNT", [`TOTALURLCOUNT`]);
        return typeof result === "number" ? result : parseInt(result.toString(), 10);
    }

    async totalDocsWithToken(token: string): Promise<number> {
        const count = await this.redisConnection?.scard("TOKENURLSET:" + token)
        return count || 0
    }

    async getPageRank(url: string): Promise<number> {
        const pageRank = await this.redisConnection?.get(`PAGERANK:${url}`)
        console.log({ pageRank })
        if (!pageRank) {
            return 0
        }
        return parseInt(pageRank)
    }
}

export {
    RedisManager
}
