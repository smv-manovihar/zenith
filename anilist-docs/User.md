[Skip to content](https://docs.anilist.co/guide/graphql/queries/user#VPContent)

On this page

- [Get the currently authenticated user](https://docs.anilist.co/guide/graphql/queries/user#get-the-currently-authenticated-user "Get the currently authenticated user")

# User [​](https://docs.anilist.co/guide/graphql/queries/user\#user)

## Get the currently authenticated user [​](https://docs.anilist.co/guide/graphql/queries/user\#get-the-currently-authenticated-user)

Unlike many other queries, the `Viewer` query infers the current user from the access token. This is the simplest way to get the current user.

INFO

If you only require the user ID, you can use a JWT library to decode the access token and get the user ID from the `sub` field.

[Apollo Studio](https://studio.apollographql.com/sandbox/explorer?endpoint=https%3A%2F%2Fgraphql.anilist.co&explorerURLState=N4IgJg9gxgrgtgUwHYBcQC4QEcYIE4CeABMADp6lJFEBqAlggO74nmXXV1htUdICGiHtQC%2BPESBFA)

graphql

```
query {
  Viewer {
    id
    name
  }
}
```

Pager

[Previous pageMedia List](https://docs.anilist.co/guide/graphql/queries/media-list)

[Next pageMigrating from API v1](https://docs.anilist.co/guide/migration/version-1/)