import { RedisManager } from "./redis"

async function fetchResult(search: string): Promise<string[]> {
    console.log("fetching results for the string", search)
    const tokens = search.split(" ")
    const redis = await RedisManager.getInstance()
    const urls = await redis.getTfResultsForUrlsForTokens(tokens)
    if (!urls) {
        return []
    }
    const tfIdfDatas = await redis.getTermFrequencyAndIdfForEachTokenInEachUrl(tokens, urls)
    if (!tfIdfDatas) {
        return []
    }
    let urlWithScore: { url: string, score: number }[] = []
    let totalNumberOfDocuments = await redis.totalNumberOfDocs()
    tfIdfDatas.forEach(async (tfIdfData) => {
        let tf = tfIdfData.tfOccurence / tfIdfData.tokensInUrlCount
        let idf = Math.log((1 + totalNumberOfDocuments) / (1 + tfIdfData.tokensInUrlCount))
        const score = tf * idf
        urlWithScore.push({ url: tfIdfData.url, score })
    })
    urlWithScore.sort((a, b) => b.score - a.score)
    let toBeReturned: string[] = []
    for (let i = 0; i < 3; i++) {
        // @ts-ignore
        if (urlWithScore[i].url) {
            // @ts-ignore
            toBeReturned.push(urlWithScore[i].url)
        }
    }
    return toBeReturned
}

export {
    fetchResult
}
