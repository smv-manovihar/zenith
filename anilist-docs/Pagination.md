[Skip to content](https://docs.anilist.co/guide/graphql/pagination#VPContent)

On this page

# Pagination [​](https://docs.anilist.co/guide/graphql/pagination\#pagination)

You might have noticed that all the top level queries ( [`Media`](https://studio.apollographql.com/sandbox/schema/reference/objects/Query?query=Media), [`Character`](https://studio.apollographql.com/sandbox/schema/reference/objects/Query?query=Character), [`Staff`](https://studio.apollographql.com/sandbox/schema/reference/objects/Query?query=Staff), etc) return a single object. If you want to get multiple objects, you will need to use the [`Page`](https://studio.apollographql.com/sandbox/schema/reference/objects/Query?query=Page) top level query.

In most cases, you can simply wrap your query in a `Page` object with minimal other changes.

Example

If you want a page of characters, the normal query would be `Character`. To receive a paginated list of characters, you would wrap your `Character` query with `Page` and rename `Character` to `characters`.

## `Page` field limitations [​](https://docs.anilist.co/guide/graphql/pagination\#page-field-limitations)

The schema for `Page` shows that it has many data fields available. ie: `media`, `characters`, `staff`, etc.

Only one of these fields can be used in a single `Page` query. This means that a single `Page` query cannot return paginated data for multiple types of data.

The `pageInfo` field is exempt from this rule.

✔️ Valid

The `Page` query only has one data field along with the optional `pageInfo` field.

graphql

```
{
  Page {
    pageInfo {
      hasNextPage
    }
    media {
      id
    }
  }
}
```

❌ Invalid

The `Page` query has multiple data fields, but only one of them can be used in a single query.

graphql

```
{
  Page {
    pageInfo {
      hasNextPage
    }
    media {
      id
    }
    characters {
      id
    }
  }
}
```

## PageInfo [​](https://docs.anilist.co/guide/graphql/pagination\#pageinfo)

The `Page` query also provides the `pageInfo` field, which contains information about the current page and the total number of pages.

`PageInfo` Degredation

Currently, the `PageInfo` object is limited in functionality due to performance issues. The `total` and `lastPage` fields are not currently accurate. You should only rely on `hasNextPage` for any pagination logic.

## Making a paginated query [​](https://docs.anilist.co/guide/graphql/pagination\#making-a-paginated-query)

Let's write another query. This time, we'll make a basic search query to get a list of `Media` entries.

Example Query

Let's create a simple query to get an anime by it's unique ID.

[Apollo Studio](https://studio.apollographql.com/sandbox/explorer?endpoint=https%3A%2F%2Fgraphql.anilist.co&explorerURLState=N4IgJg9gxgrgtgUwHYBcQC4QEcYIE4CeABABQAkAlmOkQJKoA0RZADgIYDmCN9KTr%2BAAqdudRswDOCNnigALGgGUUeCkg4BKIsAA6eHUiJFhXUuy41WIpiyEjLtvCYRbd%2Bw0aLmE9AGYRtPQNPT1g8PGQUZyCPELk2CQA5BAAPKJEYkKNHaPcQgF9Mz0QwCjZSKksqJikZeUta2TlXIpCqVs8UChQAGwRAvKyjPAg4NgArCg6jQsGZotmDfJAGEAA3GTKAIz6JDBA3YKIdEEb5E5oTgDE2FAQAegAtfAgThiKT7wuiAEZ3wc%2Bdi43wAzDFlvkgA)

JavascriptPHPPythonRust

js

```
var query = `
query ($id: Int, $page: Int, $perPage: Int, $search: String) {
  Page (page: $page, perPage: $perPage) {
    pageInfo {
      currentPage
      hasNextPage
      perPage
    }
    media (id: $id, search: $search) {
      id
      title {
        romaji
      }
    }
  }
}
`;

var variables = {
	search: "Fate/Zero",
	page: 1,
	perPage: 3
};

var url = 'https://graphql.anilist.co',
	options = {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'Accept': 'application/json',
		},
		body: JSON.stringify({
			query: query,
			variables: variables
		})
	};

fetch(url, options).then(handleResponse)
	.then(handleData)
	.catch(handleError);
```

1

2

3

4

5

6

7

8

9

10

11

12

13

14

15

16

17

18

19

20

21

22

23

24

25

26

27

28

29

30

31

32

33

34

35

36

37

38

39

40

php

```
$query = '
query ($id: Int, $page: Int, $perPage: Int, $search: String) {
  Page (page: $page, perPage: $perPage) {
    pageInfo {
      currentPage
      hasNextPage
      perPage
    }
    media (id: $id, search: $search) {
      id
      title {
        romaji
      }
    }
  }
}
';

$variables = [\
    "search" => "Fate/Zero",\
    "page" => 1,\
    "perPage" => 3\
];

$http = new GuzzleHttp\Client;
$response = $http->post('https://graphql.anilist.co', [\
    'json' => [\
        'query' => $query,\
        'variables' => $variables,\
    ]\
]);
```

1

2

3

4

5

6

7

8

9

10

11

12

13

14

15

16

17

18

19

20

21

22

23

24

25

26

27

28

29

30

31

py

```
query = '''
query ($id: Int, $page: Int, $perPage: Int, $search: String) {
    Page (page: $page, perPage: $perPage) {
        pageInfo {
            currentPage
            hasNextPage
            perPage
        }
        media (id: $id, search: $search) {
            id
            title {
                romaji
            }
        }
    }
}
'''
variables = {
    'search': 'Fate/Zero',
    'page': 1,
    'perPage': 3
}
url = 'https://graphql.anilist.co'

response = requests.post(url, json={'query': query, 'variables': variables})
```

1

2

3

4

5

6

7

8

9

10

11

12

13

14

15

16

17

18

19

20

21

22

23

24

25

rs

```
// This example uses 3 crates serde_json, reqwest, tokio

use serde_json::json;
use reqwest::Client;

// Query to use in request
const QUERY: &str = "
query ($id: Int, $page: Int, $perPage: Int, $search: String) {
    Page (page: $page, perPage: $perPage) {
        pageInfo {
            currentPage
            hasNextPage
            perPage
        }
        media (id: $id, search: $search) {
            id
            title {
                romaji
            }
        }
    }
}
";

#[tokio::main]
async fn main() {
    let client = Client::new();
    // Define query and variables
    let json = json!(
        {
            "query": QUERY,
            "variables": {
                "search": "Fate/Zero",
                "page": 1,
                "perPage": 3
            }
        }
    );
    // Make HTTP post request
    let resp = client.post("https://graphql.anilist.co/")
                .header("Content-Type", "application/json")
                .header("Accept", "application/json")
                .body(json.to_string())
                .send()
                .await
                .unwrap()
                .text()
                .await;
    // Get json output
    let result: serde_json::Value = serde_json::from_str(&resp.unwrap()).unwrap();
    println!("{:#?}", result);
}
```

1

2

3

4

5

6

7

8

9

10

11

12

13

14

15

16

17

18

19

20

21

22

23

24

25

26

27

28

29

30

31

32

33

34

35

36

37

38

39

40

41

42

43

44

45

46

47

48

49

50

51

52

The request in the above example will return the following JSON response:

json

```
{
  "data": {
    "Page": {
      "pageInfo": {
        "currentPage": 1,
        "hasNextPage": true,
        "perPage": 3
      },
      "media": [\
        {\
          "id": 55191,\
          "title": {\
            "romaji": "Fate/Zero"\
          }\
        },\
        {\
          "id": 10087,\
          "title": {\
            "romaji": "Fate/Zero"\
          }\
        },\
        {\
          "id": 33649,\
          "title": {\
            "romaji": "Fate/Zero"\
          }\
        }\
      ]
    }
  }
}
```

INFO

Note how the query still uses the `$id` variable but we did not provide a value for it in the variables object. This is valid and the GraphQL server will simply ignore any variables that are not provided. This allows you to make more complex and flexible queries without the need to modify the query string directly.

TIP

For stronger type safety, you can define your variables in the query with a `!` to indicate that they are required.

ie: `($id: Int!)`

## Collections [​](https://docs.anilist.co/guide/graphql/pagination\#collections)

Some top level queries return collections of data. These collections are used when pagination does not make sense, but there is still a need to return a list of items.

Examples:

- [`GenreCollection`](https://studio.apollographql.com/sandbox/explorer?searchQuery=Query.GenreCollection)

Returns a list of all genres in use on AniList.

- [`MediaListCollection`](https://studio.apollographql.com/sandbox/explorer?searchQuery=Query.MediaListCollection)

Returns a list of all anime or manga entries on a user's list.