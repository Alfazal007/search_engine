-- name: CreateUrl :one
insert into urls (id, url, lastCrawledAt) values ($1, $2, $3) returning *;

-- name: GetUrlByUrl :one
select * from urls where url=$1;

