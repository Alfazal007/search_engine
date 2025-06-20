import { v2 as cloudinary } from "cloudinary"
import { PrismaClient } from "./generated/prisma"
import { configDotenv } from "dotenv"
import { downloadFromCloudinaryToFile } from "./downloadFile"
configDotenv()

// this is supposed to pull the data from the cloudinary unzip it and then index the data into the redisDB
async function startServer() {
    cloudinary.config({
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        secure: true
    })
    console.log(cloudinary.config().api_secret)
    const prisma = new PrismaClient()

    setInterval(async () => {
        console.log("Pulling data from cloudinary")
        try {
            const lastPushedTimestamp = await prisma.crawl_timestamps.findFirst({
                where: {
                    indexed: false
                },
                orderBy: {
                    crawledat: "asc"
                }
            })
            if (lastPushedTimestamp) {
                const resource = await cloudinary.api.resource(`scrapedPages/${lastPushedTimestamp.crawledat}.zip`, {
                    resource_type: "raw",
                })
                const url = resource.secure_url
                console.log({ url })
                await downloadFromCloudinaryToFile({ url, outputPath: `./zipFile/${lastPushedTimestamp.crawledat}.zip` })
                await prisma.crawl_timestamps.update({
                    where: {
                        crawledat: lastPushedTimestamp.crawledat
                    },
                    data: {
                        indexed: true
                    }
                })
            }
        } catch (error) {
            console.log({ error })
        }
    }, 10000)
}

startServer()

