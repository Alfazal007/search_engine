import { RedisManager } from "./redis"

async function getPageRankedResult(urls: string[]): Promise<{ url: string, rank: number }[]> {
    const redisConn = await RedisManager.getInstance()
    const resultToReturn = await Promise.all(
        urls.map(async (url) => {
            const pageRank = await redisConn.getPageRank(url)
            return { url, rank: pageRank }
        })
    )
    console.log({ resultToReturn })
    resultToReturn.sort((a, b) => b.rank - a.rank)
    return resultToReturn
}

export {
    getPageRankedResult
}
