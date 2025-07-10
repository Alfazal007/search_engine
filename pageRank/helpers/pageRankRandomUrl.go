package helpers

import (
	"context"
	"pageRanker/internal/database"

	"github.com/redis/go-redis/v9"
)

func PageRankRandomUrl(redis *redis.Client, DAMPING_FACTOR int32, conn *database.Queries, context context.Context) {
	url := GetRandomUrl(conn, context)
	CrawlPage(url.Url, DAMPING_FACTOR, context, redis, conn)
}
