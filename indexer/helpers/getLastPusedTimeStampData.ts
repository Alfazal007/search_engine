import { prisma } from "../prisma";

async function getLastPushedZipFileFromDatabase() {
    return await prisma.$transaction(async (tx) => {
        const [lastPushedTimestamp]: [{
            crawledat: bigint;
            indexed: boolean;
            secure_url: string;
        } | null] = await tx.$queryRaw`
        SELECT * FROM crawl_timestamps
        WHERE indexed = false
        ORDER BY crawledat ASC
        LIMIT 1
        FOR UPDATE SKIP LOCKED
    `;
        return lastPushedTimestamp ? lastPushedTimestamp : null
    });
}

export {
    getLastPushedZipFileFromDatabase
}
