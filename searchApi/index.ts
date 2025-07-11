import express from "express"
import cors from "cors"
import { fetchResult } from "./fetchResults"
import { getPageRankedResult } from "./pageRank"

const app = express()

app.use(cors())

app.get('/', async (req, res) => {
    const { search } = req.query
    if (!search) {
        res.status(400).json({
            error: "Nothing to search here"
        })
        return
    }
    const result = await fetchResult(search as string)
    const pageRankedResult = await getPageRankedResult(result)
    console.log({ pageRankedResult })
    res.status(200).json({
        pageRankedResult
    })
})

app.listen(8000, () => {
    console.log("App listening on port 8000")
})

