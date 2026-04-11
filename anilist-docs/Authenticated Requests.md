[Skip to content](https://docs.anilist.co/guide/auth/authenticated-requests#VPContent)

On this page

- [JWT Tokens](https://docs.anilist.co/guide/auth/authenticated-requests#jwt-tokens "JWT Tokens")

# Authenticated Requests [​](https://docs.anilist.co/guide/auth/authenticated-requests\#authenticated-requests)

Once you have an access token, you can make authenticated requests to the AniList API on behalf of the user.

To make authenticated requests, you will need to include the access token in the `Authorization` header of your request as a "Bearer" token.

JavascriptPHP

js

```
const fetch = require('node-fetch');

var query = `
{
  Viewer {
    id
    name
  }
}
`;
const accessToken = getAccessToken();

const url = 'https://graphql.anilist.co',
	options = {
		method: 'POST',
		headers: {
			'Authorization': 'Bearer ' + accessToken,
			'Content-Type': 'application/json',
			'Accept': 'application/json',
		},
		body: JSON.stringify({
			query: query
		})
	};

fetch(url, options).then(handleResponse, handleError);

function handleResponse(response) {
	console.log(response);
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

php

```

$query = '
{
  Viewer {
    id
		name
  }
}
';
$accessToken = getAccessToken();

$http = new GuzzleHttp\Client;
$response = $http->request('POST', 'https://graphql.anilist.co', [\
    'headers' => [\
        'Authorization' => 'Bearer ' . $accessToken,\
        'Accept' => 'application/json',\
        'Content-Type' => 'application/json',\
    ],\
    'json' => [\
        'query' => $query,\
    ]\
]);

$result = json_decode($response->getBody(), true);
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

## JWT Tokens [​](https://docs.anilist.co/guide/auth/authenticated-requests\#jwt-tokens)

The access tokens provided by the authorization flows are JWT tokens. You can use a JWT library to decode the token and get the user's ID, expiration date, and other information.

You can try it out yourself on your own tokens by pasting them into [jwt.io](https://jwt.io/).

Pager

[Previous pageImplicit Grant](https://docs.anilist.co/guide/auth/implicit)

[Next pageQuery Examples](https://docs.anilist.co/guide/graphql/queries/)