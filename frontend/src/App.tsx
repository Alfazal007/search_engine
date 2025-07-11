import { useState } from 'react'
import './App.css'
import axios from 'axios'

function App() {
    const [input, setInput] = useState("")
    const [urls, setUrls] = useState<{ url: string, rank: number }[]>([])

    async function searchData() {
        try {
            const data = await axios.get(`http://localhost:8000?search=${input}`)
            console.log({ data })
            console.log(data.data.pageRankedResult)
            setUrls(data.data.pageRankedResult)
        } catch (err) {
            console.log({ err })
            alert("Issue searching data")
        } finally {
            setInput("")
        }
    }

    return (
        <>
            <input
                type='text'
                placeholder='What do you want to search?'
                value={input}
                onChange={(e) => { setInput(e.target.value) }}
            />
            <button onClick={searchData}>Search</button>
            {
                urls.map((url) => {
                    return <><br />{url.url}<br /></>
                })}
        </>
    )
}

export default App
