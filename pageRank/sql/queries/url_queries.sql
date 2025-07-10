-- name: CreateUrl :one
insert into urls (id, url, lastCrawledAt) values ($1, $2, $3) returning *;

-- name: GetUrlByUrl :one
select * from urls where url=$1;

-- name: CreateCrawlEntry :one
insert into crawl_timestamps (crawledAt, secure_url) values ($1, $2) returning *;

-- name: GetRandomRow :one
select * from urls order by random() limit 1;

