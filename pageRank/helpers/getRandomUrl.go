package helpers

import (
	"context"
	"log"
	"pageRanker/internal/database"
)

func GetRandomUrl(database_conn *database.Queries, context context.Context) database.Url {
	url_to_return, err := database_conn.GetRandomRow(context)
	if err != nil {
		log.Fatal("Issue fetching the url from the database")
	}
	return url_to_return
}
