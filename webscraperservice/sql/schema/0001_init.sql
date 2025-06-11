-- +goose Up
create table urls (
    id uuid primary key,
    url text not null,
    lastCrawledAt bigint not null
);

-- +goose Down
drop table urls;

