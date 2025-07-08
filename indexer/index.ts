import { v2 as cloudinary } from "cloudinary"
import { configDotenv } from "dotenv"
import { downloadFromCloudinaryToFile } from "./downloadFile"
import { readZipFileAndIndex } from "./readZipFile"
import { getLastPushedZipFileFromDatabase } from "./helpers/getLastPusedTimeStampData"
import fs from "fs"
import path from "path"
import { prisma } from "./prisma"

configDotenv()

async function startServer() {
    cloudinary.config({
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    })

    let completed = true
    setInterval(async () => {
        if (!completed) {
            return
        }
        console.log("Pulling data from cloudinary")
        try {
            const lastPushedTimestamp = await getLastPushedZipFileFromDatabase()
            if (lastPushedTimestamp) {
                const resource = await cloudinary.api.resource(`scrapedPages/${lastPushedTimestamp.crawledat}`, {
                    resource_type: "raw",
                })
                const url = resource.secure_url
                console.log({ url })
                await downloadFromCloudinaryToFile({ url, outputPath: `./zipFile/${lastPushedTimestamp.crawledat}.zip` })
                await readZipFileAndIndex(`./zipFile/${lastPushedTimestamp.crawledat}.zip`)
                fs.unlinkSync(path.join(__dirname, `zipFile`, `${lastPushedTimestamp.crawledat}.zip`))
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
        } finally {
            completed = true
        }
    }, 10000)
}

startServer()
