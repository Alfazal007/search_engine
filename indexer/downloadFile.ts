import axios from "axios";
import fs from "fs"

async function downloadFromCloudinaryToFile({ url, outputPath }: {
    url: string, outputPath: string
}) {
    const response = await axios.get(url, { responseType: 'stream' });
    const writer = fs.createWriteStream(outputPath);
    response.data.pipe(writer);
    return new Promise((resolve, reject) => {
        writer.on('finish', () => {
            console.log(`File downloaded to ${outputPath}`);
            resolve(true);
        });
        writer.on('error', reject);
    });
}

export {
    downloadFromCloudinaryToFile
}
