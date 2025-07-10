-- +goose Up
create table urls (
    id uuid primary key,
    url text not null,
    lastCrawledAt bigint not null
);

create table crawl_timestamps (
    crawledAt bigint not null,
    indexed boolean default false,
    secure_url text not null
);

-- +goose Down
drop table urls;
drop table crawl_timestamps;
