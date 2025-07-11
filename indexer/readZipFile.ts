import unzipper from "unzipper"
import * as cheerio from "cheerio"
import { RedisManager } from "./redis"

async function readZipFileAndIndex(path: string) {
    let files = await unzipper.Open.file(path)
    for (const file of files.files) {
        const content = await file.buffer()
        const htmlContent = content.toString('utf-8')
        const lines = htmlContent.split('\n')
        const urlOfSite = lines[lines.length - 1].trim()
        const $ = cheerio.load(htmlContent)
        const bodyContent = $('body').text().trim()
        const tokens = extractTokens(bodyContent)
        const totalTokensInDoc = tokens.length
        const newTokenMap = new Map<string, number>()
        tokens.forEach((token) => {
            let prev = newTokenMap.get(token) || 0
            newTokenMap.set(token, prev + 1)
        })
        // ideally here there would be more of redis stuff and based on domain it should go to that shard or just use dynamoDB
        const redisConnection = await RedisManager.getInstance()
        await redisConnection.setTotalTokensInAUrl(urlOfSite, totalTokensInDoc)
        newTokenMap.forEach(async (occurences, token) => {
            const preScanned = await redisConnection.checkTokenPreExistsInUrlScannedEarlier(token, urlOfSite)
            if (preScanned) {
                await redisConnection.deleteTokenUrlData(token, urlOfSite)
            }
            await redisConnection.indexToken(token, urlOfSite, occurences) // TF
            await redisConnection.setTillNowTokenValue(token, occurences) // IDF
        })
    }
}

function extractTokens(text: string) {
    const stopwords = new Set([
        "a", "an", "the", "and", "or", "but", "if", "while", "at", "by", "for", "with",
        "about", "against", "between", "into", "through", "during", "before", "after",
        "to", "from", "in", "out", "on", "off", "over", "under",
        "again", "further", "then", "once", "here", "there", "when", "where", "why", "how",
        "all", "any", "both", "each", "few", "more", "most", "other", "some", "such",
        "no", "nor", "not", "only", "own", "same", "so", "than", "too", "very",
        "can", "will", "just", "don", "should", "now",
        "is", "am", "are", "was", "were", "be", "been", "being",
        "have", "has", "had", "having",
        "do", "does", "did", "doing",
        "i", "me", "my", "myself", "we", "our", "ours", "ourselves",
        "you", "your", "yours", "yourself", "yourselves",
        "he", "him", "his", "himself", "she", "her", "hers", "herself",
        "it", "its", "itself", "they", "them", "their", "theirs", "themselves",
        "what", "which", "who", "whom", "this", "that", "these", "those"
    ])
    return text
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .split(/\s+/)
        .filter(token => token.length > 3 && !stopwords.has(token))
}

export {
    readZipFileAndIndex
}
