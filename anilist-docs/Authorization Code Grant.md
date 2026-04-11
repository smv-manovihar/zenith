[Skip to content](https://docs.anilist.co/guide/auth/authorization-code#VPContent)

On this page

# Authorization Code Grant [​](https://docs.anilist.co/guide/auth/authorization-code\#authorization-code-grant)

Once you have [created an application](https://docs.anilist.co/guide/auth/#creating-an-application), you can use your client ID and client secret to request an authorization code.

## Redirecting for authorization [​](https://docs.anilist.co/guide/auth/authorization-code\#redirecting-for-authorization)

The first step is to redirect the user to the authorization URL `https://anilist.co/api/v2/oauth/authorize` with the required parameters.

htmlphp

html

```
<a href="https://anilist.co/api/v2/oauth/authorize?client_id={client_id}&redirect_uri={redirect_uri}&response_type=code">Login with AniList</a>
```

php

```
$query = [\
    'client_id' => '{client_id}',\
    'redirect_uri' => '{redirect_uri}', // http://example.com/callback\
    'response_type' => 'code'\
];

$url = 'https://anilist.co/api/v2/oauth/authorize?' . urldecode(http_build_query($query));

// ...
echo "<a href='$url'>Login with Anilist</a>";
```

- `client_id` \- The client ID of your application
- `redirect_uri` \- The redirect URI of your application.

WARNING

The redirect URI you use in your authorization request must exactly match the redirect URI you used in your application settings.

## User Approval [​](https://docs.anilist.co/guide/auth/authorization-code\#user-approval)

Once the user has been redirected, they will be shown a page asking them to approve your application. If the user is not logged in, they will be prompted to log in first.

Once the user has approved your application, they will be redirected back to the redirect URI you specified. Their redirect will contain a `code` query parameter representing the authorization code. In the next step, you will exchange this code for an access token.

## Converting codes to tokens [​](https://docs.anilist.co/guide/auth/authorization-code\#converting-codes-to-tokens)

Once you have an authorization code, you can exchange it for an access token. To do this, you will need to make a POST request to the `https://anilist.co/api/v2/oauth/token` endpoint. The request body should include the authorization code that was issued by AniList along with the client ID and client secret of your application.

JavascriptPHP

js

```
const fetch = require('node-fetch');

fetch("https://anilist.co/api/v2/oauth/token", {
	method: "POST",
	headers: {
		"Content-Type": "application/json",
		"Accept": "application/json"
	},
	body: JSON.stringify({
		"grant_type": "authorization_code",
		"client_id": "{client_id}",
		"client_secret": "{client_secret}",
		"redirect_uri": "{redirect_uri}", // http://example.com/callback
		"code": "{code}", // The Authorization Code received previously
	})
}).then(handleResponse);

function handleResponse(response) {
	if (response.statusCode == 200) {
		console.log(response.body.access_token);
	}
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

php

```
$http = new GuzzleHttp\Client;

$response = $http->post('https://anilist.co/api/v2/oauth/token', [\
    'form_params' => [\
        'grant_type' => 'authorization_code',\
        'client_id' => '{client_id}',\
        'client_secret' => '{client_secret}',\
        'redirect_uri' => '{redirect_uri}', // http://example.com/callback\
        'code' => '{code}', // The Authorization code received previously\
    ],\
    'headers' => [\
        'Accept' => 'application/json'\
    ]\
]);

return json_decode($response->getBody())->access_token;
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

- `client_id` \- The client ID of your application
- `client_secret` \- The client secret of your application
- `redirect_uri` \- The redirect URI of your application
- `code` \- The authorization code received from the user

The response will contain an `access_token` field with a JWT token. With this token, you can [make authenticated requests](https://docs.anilist.co/guide/auth/authenticated-requests) to the AniList API.