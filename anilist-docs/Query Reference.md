[Skip to content](https://docs.anilist.co/reference/query#VPContent)

Return to top

# Root Query [​](https://docs.anilist.co/reference/query\#root-query)

| Field | Argument | Type | Description |
| :-- | --: | :-- | :-- |
| **Page** | [Page](https://docs.anilist.co/reference/object/page) |  |
| page | [Int](https://docs.anilist.co/reference/scalar/int) | The page number |
| perPage | [Int](https://docs.anilist.co/reference/scalar/int) | The amount of entries per page, max 50 |
| **Media** | [Media](https://docs.anilist.co/reference/object/media) | Media query |
| id | [Int](https://docs.anilist.co/reference/scalar/int) | Filter by the media id |
| idMal | [Int](https://docs.anilist.co/reference/scalar/int) | Filter by the media's MyAnimeList id |
| startDate | [FuzzyDateInt](https://docs.anilist.co/reference/scalar/fuzzydateint) | Filter by the start date of the media |
| endDate | [FuzzyDateInt](https://docs.anilist.co/reference/scalar/fuzzydateint) | Filter by the end date of the media |
| season | [MediaSeason](https://docs.anilist.co/reference/enum/mediaseason) | Filter by the season the media was released in |
| seasonYear | [Int](https://docs.anilist.co/reference/scalar/int) | The year of the season (Winter 2017 would also include December 2016 releases). Requires season argument |
| type | [MediaType](https://docs.anilist.co/reference/enum/mediatype) | Filter by the media's type |
| format | [MediaFormat](https://docs.anilist.co/reference/enum/mediaformat) | Filter by the media's format |
| status | [MediaStatus](https://docs.anilist.co/reference/enum/mediastatus) | Filter by the media's current release status |
| episodes | [Int](https://docs.anilist.co/reference/scalar/int) | Filter by amount of episodes the media has |
| duration | [Int](https://docs.anilist.co/reference/scalar/int) | Filter by the media's episode length |
| chapters | [Int](https://docs.anilist.co/reference/scalar/int) | Filter by the media's chapter count |
| volumes | [Int](https://docs.anilist.co/reference/scalar/int) | Filter by the media's volume count |
| isAdult | [Boolean](https://docs.anilist.co/reference/scalar/boolean) | Filter by if the media's intended for 18+ adult audiences |
| genre | [String](https://docs.anilist.co/reference/scalar/string) | Filter by the media's genres |
| tag | [String](https://docs.anilist.co/reference/scalar/string) | Filter by the media's tags |
| minimumTagRank | [Int](https://docs.anilist.co/reference/scalar/int) | Only apply the tags filter argument to tags above this rank. Default: 18 |
| tagCategory | [String](https://docs.anilist.co/reference/scalar/string) | Filter by the media's tags with in a tag category |
| onList | [Boolean](https://docs.anilist.co/reference/scalar/boolean) | Filter by the media on the authenticated user's lists |
| licensedBy | [String](https://docs.anilist.co/reference/scalar/string) | Filter media by sites name with a online streaming or reading license |
| licensedById | [Int](https://docs.anilist.co/reference/scalar/int) | Filter media by sites id with a online streaming or reading license |
| averageScore | [Int](https://docs.anilist.co/reference/scalar/int) | Filter by the media's average score |
| popularity | [Int](https://docs.anilist.co/reference/scalar/int) | Filter by the number of users with this media on their list |
| source | [MediaSource](https://docs.anilist.co/reference/enum/mediasource) | Filter by the source type of the media |
| countryOfOrigin | [CountryCode](https://docs.anilist.co/reference/scalar/countrycode) | Filter by the media's country of origin |
| isLicensed | [Boolean](https://docs.anilist.co/reference/scalar/boolean) | If the media is officially licensed or a self-published doujin release |
| search | [String](https://docs.anilist.co/reference/scalar/string) | Filter by search query |
| id\_not | [Int](https://docs.anilist.co/reference/scalar/int) | Filter by the media id |
| id\_in | \[ [Int](https://docs.anilist.co/reference/scalar/int)\] | Filter by the media id |
| id\_not\_in | \[ [Int](https://docs.anilist.co/reference/scalar/int)\] | Filter by the media id |
| idMal\_not | [Int](https://docs.anilist.co/reference/scalar/int) | Filter by the media's MyAnimeList id |
| idMal\_in | \[ [Int](https://docs.anilist.co/reference/scalar/int)\] | Filter by the media's MyAnimeList id |
| idMal\_not\_in | \[ [Int](https://docs.anilist.co/reference/scalar/int)\] | Filter by the media's MyAnimeList id |
| startDate\_greater | [FuzzyDateInt](https://docs.anilist.co/reference/scalar/fuzzydateint) | Filter by the start date of the media |
| startDate\_lesser | [FuzzyDateInt](https://docs.anilist.co/reference/scalar/fuzzydateint) | Filter by the start date of the media |
| startDate\_like | [String](https://docs.anilist.co/reference/scalar/string) | Filter by the start date of the media |
| endDate\_greater | [FuzzyDateInt](https://docs.anilist.co/reference/scalar/fuzzydateint) | Filter by the end date of the media |
| endDate\_lesser | [FuzzyDateInt](https://docs.anilist.co/reference/scalar/fuzzydateint) | Filter by the end date of the media |
| endDate\_like | [String](https://docs.anilist.co/reference/scalar/string) | Filter by the end date of the media |
| format\_in | \[ [MediaFormat](https://docs.anilist.co/reference/enum/mediaformat)\] | Filter by the media's format |
| format\_not | [MediaFormat](https://docs.anilist.co/reference/enum/mediaformat) | Filter by the media's format |
| format\_not\_in | \[ [MediaFormat](https://docs.anilist.co/reference/enum/mediaformat)\] | Filter by the media's format |
| status\_in | \[ [MediaStatus](https://docs.anilist.co/reference/enum/mediastatus)\] | Filter by the media's current release status |
| status\_not | [MediaStatus](https://docs.anilist.co/reference/enum/mediastatus) | Filter by the media's current release status |
| status\_not\_in | \[ [MediaStatus](https://docs.anilist.co/reference/enum/mediastatus)\] | Filter by the media's current release status |
| episodes\_greater | [Int](https://docs.anilist.co/reference/scalar/int) | Filter by amount of episodes the media has |
| episodes\_lesser | [Int](https://docs.anilist.co/reference/scalar/int) | Filter by amount of episodes the media has |
| duration\_greater | [Int](https://docs.anilist.co/reference/scalar/int) | Filter by the media's episode length |
| duration\_lesser | [Int](https://docs.anilist.co/reference/scalar/int) | Filter by the media's episode length |
| chapters\_greater | [Int](https://docs.anilist.co/reference/scalar/int) | Filter by the media's chapter count |
| chapters\_lesser | [Int](https://docs.anilist.co/reference/scalar/int) | Filter by the media's chapter count |
| volumes\_greater | [Int](https://docs.anilist.co/reference/scalar/int) | Filter by the media's volume count |
| volumes\_lesser | [Int](https://docs.anilist.co/reference/scalar/int) | Filter by the media's volume count |
| genre\_in | \[ [String](https://docs.anilist.co/reference/scalar/string)\] | Filter by the media's genres |
| genre\_not\_in | \[ [String](https://docs.anilist.co/reference/scalar/string)\] | Filter by the media's genres |
| tag\_in | \[ [String](https://docs.anilist.co/reference/scalar/string)\] | Filter by the media's tags |
| tag\_not\_in | \[ [String](https://docs.anilist.co/reference/scalar/string)\] | Filter by the media's tags |
| tagCategory\_in | \[ [String](https://docs.anilist.co/reference/scalar/string)\] | Filter by the media's tags with in a tag category |
| tagCategory\_not\_in | \[ [String](https://docs.anilist.co/reference/scalar/string)\] | Filter by the media's tags with in a tag category |
| licensedBy\_in | \[ [String](https://docs.anilist.co/reference/scalar/string)\] | Filter media by sites name with a online streaming or reading license |
| licensedById\_in | \[ [Int](https://docs.anilist.co/reference/scalar/int)\] | Filter media by sites id with a online streaming or reading license |
| averageScore\_not | [Int](https://docs.anilist.co/reference/scalar/int) | Filter by the media's average score |
| averageScore\_greater | [Int](https://docs.anilist.co/reference/scalar/int) | Filter by the media's average score |
| averageScore\_lesser | [Int](https://docs.anilist.co/reference/scalar/int) | Filter by the media's average score |
| popularity\_not | [Int](https://docs.anilist.co/reference/scalar/int) | Filter by the number of users with this media on their list |
| popularity\_greater | [Int](https://docs.anilist.co/reference/scalar/int) | Filter by the number of users with this media on their list |
| popularity\_lesser | [Int](https://docs.anilist.co/reference/scalar/int) | Filter by the number of users with this media on their list |
| source\_in | \[ [MediaSource](https://docs.anilist.co/reference/enum/mediasource)\] | Filter by the source type of the media |
| sort | \[ [MediaSort](https://docs.anilist.co/reference/enum/mediasort)\] | The order the results will be returned in |
| **MediaTrend** | [MediaTrend](https://docs.anilist.co/reference/object/mediatrend) | Media Trend query |
| mediaId | [Int](https://docs.anilist.co/reference/scalar/int) | Filter by the media id |
| date | [Int](https://docs.anilist.co/reference/scalar/int) | Filter by date |
| trending | [Int](https://docs.anilist.co/reference/scalar/int) | Filter by trending amount |
| averageScore | [Int](https://docs.anilist.co/reference/scalar/int) | Filter by score |
| popularity | [Int](https://docs.anilist.co/reference/scalar/int) | Filter by popularity |
| episode | [Int](https://docs.anilist.co/reference/scalar/int) | Filter by episode number |
| releasing | [Boolean](https://docs.anilist.co/reference/scalar/boolean) | Filter to stats recorded while the media was releasing |
| mediaId\_not | [Int](https://docs.anilist.co/reference/scalar/int) | Filter by the media id |
| mediaId\_in | \[ [Int](https://docs.anilist.co/reference/scalar/int)\] | Filter by the media id |
| mediaId\_not\_in | \[ [Int](https://docs.anilist.co/reference/scalar/int)\] | Filter by the media id |
| date\_greater | [Int](https://docs.anilist.co/reference/scalar/int) | Filter by date |
| date\_lesser | [Int](https://docs.anilist.co/reference/scalar/int) | Filter by date |
| trending\_greater | [Int](https://docs.anilist.co/reference/scalar/int) | Filter by trending amount |
| trending\_lesser | [Int](https://docs.anilist.co/reference/scalar/int) | Filter by trending amount |
| trending\_not | [Int](https://docs.anilist.co/reference/scalar/int) | Filter by trending amount |
| averageScore\_greater | [Int](https://docs.anilist.co/reference/scalar/int) | Filter by score |
| averageScore\_lesser | [Int](https://docs.anilist.co/reference/scalar/int) | Filter by score |
| averageScore\_not | [Int](https://docs.anilist.co/reference/scalar/int) | Filter by score |
| popularity\_greater | [Int](https://docs.anilist.co/reference/scalar/int) | Filter by popularity |
| popularity\_lesser | [Int](https://docs.anilist.co/reference/scalar/int) | Filter by popularity |
| popularity\_not | [Int](https://docs.anilist.co/reference/scalar/int) | Filter by popularity |
| episode\_greater | [Int](https://docs.anilist.co/reference/scalar/int) | Filter by episode number |
| episode\_lesser | [Int](https://docs.anilist.co/reference/scalar/int) | Filter by episode number |
| episode\_not | [Int](https://docs.anilist.co/reference/scalar/int) | Filter by episode number |
| sort | \[ [MediaTrendSort](https://docs.anilist.co/reference/enum/mediatrendsort)\] | The order the results will be returned in |
| **AiringSchedule** | [AiringSchedule](https://docs.anilist.co/reference/object/airingschedule) | Airing schedule query |
| id | [Int](https://docs.anilist.co/reference/scalar/int) | Filter by the id of the airing schedule item |
| mediaId | [Int](https://docs.anilist.co/reference/scalar/int) | Filter by the id of associated media |
| episode | [Int](https://docs.anilist.co/reference/scalar/int) | Filter by the airing episode number |
| airingAt | [Int](https://docs.anilist.co/reference/scalar/int) | Filter by the time of airing |
| notYetAired | [Boolean](https://docs.anilist.co/reference/scalar/boolean) | Filter to episodes that haven't yet aired |
| id\_not | [Int](https://docs.anilist.co/reference/scalar/int) | Filter by the id of the airing schedule item |
| id\_in | \[ [Int](https://docs.anilist.co/reference/scalar/int)\] | Filter by the id of the airing schedule item |
| id\_not\_in | \[ [Int](https://docs.anilist.co/reference/scalar/int)\] | Filter by the id of the airing schedule item |
| mediaId\_not | [Int](https://docs.anilist.co/reference/scalar/int) | Filter by the id of associated media |
| mediaId\_in | \[ [Int](https://docs.anilist.co/reference/scalar/int)\] | Filter by the id of associated media |
| mediaId\_not\_in | \[ [Int](https://docs.anilist.co/reference/scalar/int)\] | Filter by the id of associated media |
| episode\_not | [Int](https://docs.anilist.co/reference/scalar/int) | Filter by the airing episode number |
| episode\_in | \[ [Int](https://docs.anilist.co/reference/scalar/int)\] | Filter by the airing episode number |
| episode\_not\_in | \[ [Int](https://docs.anilist.co/reference/scalar/int)\] | Filter by the airing episode number |
| episode\_greater | [Int](https://docs.anilist.co/reference/scalar/int) | Filter by the airing episode number |
| episode\_lesser | [Int](https://docs.anilist.co/reference/scalar/int) | Filter by the airing episode number |
| airingAt\_greater | [Int](https://docs.anilist.co/reference/scalar/int) | Filter by the time of airing |
| airingAt\_lesser | [Int](https://docs.anilist.co/reference/scalar/int) | Filter by the time of airing |
| sort | \[ [AiringSort](https://docs.anilist.co/reference/enum/airingsort)\] | The order the results will be returned in |
| **Character** | [Character](https://docs.anilist.co/reference/object/character) | Character query |
| id | [Int](https://docs.anilist.co/reference/scalar/int) | Filter by character id |
| isBirthday | [Boolean](https://docs.anilist.co/reference/scalar/boolean) | Filter by character by if its their birthday today |
| search | [String](https://docs.anilist.co/reference/scalar/string) | Filter by search query |
| id\_not | [Int](https://docs.anilist.co/reference/scalar/int) | Filter by character id |
| id\_in | \[ [Int](https://docs.anilist.co/reference/scalar/int)\] | Filter by character id |
| id\_not\_in | \[ [Int](https://docs.anilist.co/reference/scalar/int)\] | Filter by character id |
| sort | \[ [CharacterSort](https://docs.anilist.co/reference/enum/charactersort)\] | The order the results will be returned in |
| **Staff** | [Staff](https://docs.anilist.co/reference/object/staff) | Staff query |
| id | [Int](https://docs.anilist.co/reference/scalar/int) | Filter by the staff id |
| isBirthday | [Boolean](https://docs.anilist.co/reference/scalar/boolean) | Filter by staff by if its their birthday today |
| search | [String](https://docs.anilist.co/reference/scalar/string) | Filter by search query |
| id\_not | [Int](https://docs.anilist.co/reference/scalar/int) | Filter by the staff id |
| id\_in | \[ [Int](https://docs.anilist.co/reference/scalar/int)\] | Filter by the staff id |
| id\_not\_in | \[ [Int](https://docs.anilist.co/reference/scalar/int)\] | Filter by the staff id |
| sort | \[ [StaffSort](https://docs.anilist.co/reference/enum/staffsort)\] | The order the results will be returned in |
| **MediaList** | [MediaList](https://docs.anilist.co/reference/object/medialist) | Media list query |
| id | [Int](https://docs.anilist.co/reference/scalar/int) | Filter by a list entry's id |
| userId | [Int](https://docs.anilist.co/reference/scalar/int) | Filter by a user's id |
| userName | [String](https://docs.anilist.co/reference/scalar/string) | Filter by a user's name |
| type | [MediaType](https://docs.anilist.co/reference/enum/mediatype) | Filter by the list entries media type |
| status | [MediaListStatus](https://docs.anilist.co/reference/enum/medialiststatus) | Filter by the watching/reading status |
| mediaId | [Int](https://docs.anilist.co/reference/scalar/int) | Filter by the media id of the list entry |
| isFollowing | [Boolean](https://docs.anilist.co/reference/scalar/boolean) | Filter list entries to users who are being followed by the authenticated user |
| notes | [String](https://docs.anilist.co/reference/scalar/string) | Filter by note words and #tags |
| startedAt | [FuzzyDateInt](https://docs.anilist.co/reference/scalar/fuzzydateint) | Filter by the date the user started the media |
| completedAt | [FuzzyDateInt](https://docs.anilist.co/reference/scalar/fuzzydateint) | Filter by the date the user completed the media |
| compareWithAuthList | [Boolean](https://docs.anilist.co/reference/scalar/boolean) | Limit to only entries also on the auth user's list. Requires user id or name arguments. |
| userId\_in | \[ [Int](https://docs.anilist.co/reference/scalar/int)\] | Filter by a user's id |
| status\_in | \[ [MediaListStatus](https://docs.anilist.co/reference/enum/medialiststatus)\] | Filter by the watching/reading status |
| status\_not\_in | \[ [MediaListStatus](https://docs.anilist.co/reference/enum/medialiststatus)\] | Filter by the watching/reading status |
| status\_not | [MediaListStatus](https://docs.anilist.co/reference/enum/medialiststatus) | Filter by the watching/reading status |
| mediaId\_in | \[ [Int](https://docs.anilist.co/reference/scalar/int)\] | Filter by the media id of the list entry |
| mediaId\_not\_in | \[ [Int](https://docs.anilist.co/reference/scalar/int)\] | Filter by the media id of the list entry |
| notes\_like | [String](https://docs.anilist.co/reference/scalar/string) | Filter by note words and #tags |
| startedAt\_greater | [FuzzyDateInt](https://docs.anilist.co/reference/scalar/fuzzydateint) | Filter by the date the user started the media |
| startedAt\_lesser | [FuzzyDateInt](https://docs.anilist.co/reference/scalar/fuzzydateint) | Filter by the date the user started the media |
| startedAt\_like | [String](https://docs.anilist.co/reference/scalar/string) | Filter by the date the user started the media |
| completedAt\_greater | [FuzzyDateInt](https://docs.anilist.co/reference/scalar/fuzzydateint) | Filter by the date the user completed the media |
| completedAt\_lesser | [FuzzyDateInt](https://docs.anilist.co/reference/scalar/fuzzydateint) | Filter by the date the user completed the media |
| completedAt\_like | [String](https://docs.anilist.co/reference/scalar/string) | Filter by the date the user completed the media |
| sort | \[ [MediaListSort](https://docs.anilist.co/reference/enum/medialistsort)\] | The order the results will be returned in |
| **MediaListCollection** | [MediaListCollection](https://docs.anilist.co/reference/object/medialistcollection) | Media list collection query, provides list pre-grouped by status & custom lists. User ID and Media Type arguments required. |
| userId | [Int](https://docs.anilist.co/reference/scalar/int) | Filter by a user's id |
| userName | [String](https://docs.anilist.co/reference/scalar/string) | Filter by a user's name |
| type | [MediaType](https://docs.anilist.co/reference/enum/mediatype) | Filter by the list entries media type |
| status | [MediaListStatus](https://docs.anilist.co/reference/enum/medialiststatus) | Filter by the watching/reading status |
| notes | [String](https://docs.anilist.co/reference/scalar/string) | Filter by note words and #tags |
| startedAt | [FuzzyDateInt](https://docs.anilist.co/reference/scalar/fuzzydateint) | Filter by the date the user started the media |
| completedAt | [FuzzyDateInt](https://docs.anilist.co/reference/scalar/fuzzydateint) | Filter by the date the user completed the media |
| forceSingleCompletedList | [Boolean](https://docs.anilist.co/reference/scalar/boolean) | Always return completed list entries in one group, overriding the user's split completed option. |
| chunk | [Int](https://docs.anilist.co/reference/scalar/int) | Which chunk of list entries to load |
| perChunk | [Int](https://docs.anilist.co/reference/scalar/int) | The amount of entries per chunk, max 500 |
| status\_in | \[ [MediaListStatus](https://docs.anilist.co/reference/enum/medialiststatus)\] | Filter by the watching/reading status |
| status\_not\_in | \[ [MediaListStatus](https://docs.anilist.co/reference/enum/medialiststatus)\] | Filter by the watching/reading status |
| status\_not | [MediaListStatus](https://docs.anilist.co/reference/enum/medialiststatus) | Filter by the watching/reading status |
| notes\_like | [String](https://docs.anilist.co/reference/scalar/string) | Filter by note words and #tags |
| startedAt\_greater | [FuzzyDateInt](https://docs.anilist.co/reference/scalar/fuzzydateint) | Filter by the date the user started the media |
| startedAt\_lesser | [FuzzyDateInt](https://docs.anilist.co/reference/scalar/fuzzydateint) | Filter by the date the user started the media |
| startedAt\_like | [String](https://docs.anilist.co/reference/scalar/string) | Filter by the date the user started the media |
| completedAt\_greater | [FuzzyDateInt](https://docs.anilist.co/reference/scalar/fuzzydateint) | Filter by the date the user completed the media |
| completedAt\_lesser | [FuzzyDateInt](https://docs.anilist.co/reference/scalar/fuzzydateint) | Filter by the date the user completed the media |
| completedAt\_like | [String](https://docs.anilist.co/reference/scalar/string) | Filter by the date the user completed the media |
| sort | \[ [MediaListSort](https://docs.anilist.co/reference/enum/medialistsort)\] | The order the results will be returned in |
| **GenreCollection** | \[ [String](https://docs.anilist.co/reference/scalar/string)\] | Collection of all the possible media genres |
| **MediaTagCollection** | \[ [MediaTag](https://docs.anilist.co/reference/object/mediatag)\] | Collection of all the possible media tags |
| status | [Int](https://docs.anilist.co/reference/scalar/int) | Mod Only |
| **User** | [User](https://docs.anilist.co/reference/object/user) | User query |
| id | [Int](https://docs.anilist.co/reference/scalar/int) | Filter by the user id |
| name | [String](https://docs.anilist.co/reference/scalar/string) | Filter by the name of the user |
| isModerator | [Boolean](https://docs.anilist.co/reference/scalar/boolean) | Filter to moderators only if true |
| search | [String](https://docs.anilist.co/reference/scalar/string) | Filter by search query |
| sort | \[ [UserSort](https://docs.anilist.co/reference/enum/usersort)\] | The order the results will be returned in |
| **Viewer** | [User](https://docs.anilist.co/reference/object/user) | Get the currently authenticated user |
| **Notification** | [NotificationUnion](https://docs.anilist.co/reference/union/notificationunion) | Notification query |
| type | [NotificationType](https://docs.anilist.co/reference/enum/notificationtype) | Filter by the type of notifications |
| resetNotificationCount | [Boolean](https://docs.anilist.co/reference/scalar/boolean) | Reset the unread notification count to 0 on load |
| type\_in | \[ [NotificationType](https://docs.anilist.co/reference/enum/notificationtype)\] | Filter by the type of notifications |
| **Studio** | [Studio](https://docs.anilist.co/reference/object/studio) | Studio query |
| id | [Int](https://docs.anilist.co/reference/scalar/int) | Filter by the studio id |
| search | [String](https://docs.anilist.co/reference/scalar/string) | Filter by search query |
| id\_not | [Int](https://docs.anilist.co/reference/scalar/int) | Filter by the studio id |
| id\_in | \[ [Int](https://docs.anilist.co/reference/scalar/int)\] | Filter by the studio id |
| id\_not\_in | \[ [Int](https://docs.anilist.co/reference/scalar/int)\] | Filter by the studio id |
| sort | \[ [StudioSort](https://docs.anilist.co/reference/enum/studiosort)\] | The order the results will be returned in |
| **Review** | [Review](https://docs.anilist.co/reference/object/review) | Review query |
| id | [Int](https://docs.anilist.co/reference/scalar/int) | Filter by Review id |
| mediaId | [Int](https://docs.anilist.co/reference/scalar/int) | Filter by media id |
| userId | [Int](https://docs.anilist.co/reference/scalar/int) | Filter by user id |
| mediaType | [MediaType](https://docs.anilist.co/reference/enum/mediatype) | Filter by media type |
| sort | \[ [ReviewSort](https://docs.anilist.co/reference/enum/reviewsort)\] | The order the results will be returned in |
| **Activity** | [ActivityUnion](https://docs.anilist.co/reference/union/activityunion) | Activity query |
| id | [Int](https://docs.anilist.co/reference/scalar/int) | Filter by the activity id |
| userId | [Int](https://docs.anilist.co/reference/scalar/int) | Filter by the owner user id |
| messengerId | [Int](https://docs.anilist.co/reference/scalar/int) | Filter by the id of the user who sent a message |
| mediaId | [Int](https://docs.anilist.co/reference/scalar/int) | Filter by the associated media id of the activity |
| type | [ActivityType](https://docs.anilist.co/reference/enum/activitytype) | Filter by the type of activity |
| isFollowing | [Boolean](https://docs.anilist.co/reference/scalar/boolean) | Filter activity to users who are being followed by the authenticated user |
| hasReplies | [Boolean](https://docs.anilist.co/reference/scalar/boolean) | Filter activity to only activity with replies |
| hasRepliesOrTypeText | [Boolean](https://docs.anilist.co/reference/scalar/boolean) | Filter activity to only activity with replies or is of type text |
| createdAt | [Int](https://docs.anilist.co/reference/scalar/int) | Filter by the time the activity was created |
| id\_not | [Int](https://docs.anilist.co/reference/scalar/int) | Filter by the activity id |
| id\_in | \[ [Int](https://docs.anilist.co/reference/scalar/int)\] | Filter by the activity id |
| id\_not\_in | \[ [Int](https://docs.anilist.co/reference/scalar/int)\] | Filter by the activity id |
| userId\_not | [Int](https://docs.anilist.co/reference/scalar/int) | Filter by the owner user id |
| userId\_in | \[ [Int](https://docs.anilist.co/reference/scalar/int)\] | Filter by the owner user id |
| userId\_not\_in | \[ [Int](https://docs.anilist.co/reference/scalar/int)\] | Filter by the owner user id |
| messengerId\_not | [Int](https://docs.anilist.co/reference/scalar/int) | Filter by the id of the user who sent a message |
| messengerId\_in | \[ [Int](https://docs.anilist.co/reference/scalar/int)\] | Filter by the id of the user who sent a message |
| messengerId\_not\_in | \[ [Int](https://docs.anilist.co/reference/scalar/int)\] | Filter by the id of the user who sent a message |
| mediaId\_not | [Int](https://docs.anilist.co/reference/scalar/int) | Filter by the associated media id of the activity |
| mediaId\_in | \[ [Int](https://docs.anilist.co/reference/scalar/int)\] | Filter by the associated media id of the activity |
| mediaId\_not\_in | \[ [Int](https://docs.anilist.co/reference/scalar/int)\] | Filter by the associated media id of the activity |
| type\_not | [ActivityType](https://docs.anilist.co/reference/enum/activitytype) | Filter by the type of activity |
| type\_in | \[ [ActivityType](https://docs.anilist.co/reference/enum/activitytype)\] | Filter by the type of activity |
| type\_not\_in | \[ [ActivityType](https://docs.anilist.co/reference/enum/activitytype)\] | Filter by the type of activity |
| createdAt\_greater | [Int](https://docs.anilist.co/reference/scalar/int) | Filter by the time the activity was created |
| createdAt\_lesser | [Int](https://docs.anilist.co/reference/scalar/int) | Filter by the time the activity was created |
| sort | \[ [ActivitySort](https://docs.anilist.co/reference/enum/activitysort)\] | The order the results will be returned in |
| **ActivityReply** | [ActivityReply](https://docs.anilist.co/reference/object/activityreply) | Activity reply query |
| id | [Int](https://docs.anilist.co/reference/scalar/int) | Filter by the reply id |
| activityId | [Int](https://docs.anilist.co/reference/scalar/int) | Filter by the parent id |
| **Following** | [User](https://docs.anilist.co/reference/object/user) | Follow query |
| userId | [Int](https://docs.anilist.co/reference/scalar/int)! | User id of the follower/followed |
| sort | \[ [UserSort](https://docs.anilist.co/reference/enum/usersort)\] | The order the results will be returned in |
| **Follower** | [User](https://docs.anilist.co/reference/object/user) | Follow query |
| userId | [Int](https://docs.anilist.co/reference/scalar/int)! | User id of the follower/followed |
| sort | \[ [UserSort](https://docs.anilist.co/reference/enum/usersort)\] | The order the results will be returned in |
| **Thread** | [Thread](https://docs.anilist.co/reference/object/thread) | Thread query |
| id | [Int](https://docs.anilist.co/reference/scalar/int) | Filter by the thread id |
| userId | [Int](https://docs.anilist.co/reference/scalar/int) | Filter by the user id of the thread's creator |
| replyUserId | [Int](https://docs.anilist.co/reference/scalar/int) | Filter by the user id of the last user to comment on the thread |
| subscribed | [Boolean](https://docs.anilist.co/reference/scalar/boolean) | Filter by if the currently authenticated user's subscribed threads |
| categoryId | [Int](https://docs.anilist.co/reference/scalar/int) | Filter by thread category id |
| mediaCategoryId | [Int](https://docs.anilist.co/reference/scalar/int) | Filter by thread media id category |
| search | [String](https://docs.anilist.co/reference/scalar/string) | Filter by search query |
| id\_in | \[ [Int](https://docs.anilist.co/reference/scalar/int)\] | Filter by the thread id |
| sort | \[ [ThreadSort](https://docs.anilist.co/reference/enum/threadsort)\] | The order the results will be returned in |
| **ThreadComment** | \[ [ThreadComment](https://docs.anilist.co/reference/object/threadcomment)\] | Comment query |
| id | [Int](https://docs.anilist.co/reference/scalar/int) | Filter by the comment id |
| threadId | [Int](https://docs.anilist.co/reference/scalar/int) | Filter by the thread id |
| userId | [Int](https://docs.anilist.co/reference/scalar/int) | Filter by the user id of the comment's creator |
| sort | \[ [ThreadCommentSort](https://docs.anilist.co/reference/enum/threadcommentsort)\] | The order the results will be returned in |
| **Recommendation** | [Recommendation](https://docs.anilist.co/reference/object/recommendation) | Recommendation query |
| id | [Int](https://docs.anilist.co/reference/scalar/int) | Filter by recommendation id |
| mediaId | [Int](https://docs.anilist.co/reference/scalar/int) | Filter by media id |
| mediaRecommendationId | [Int](https://docs.anilist.co/reference/scalar/int) | Filter by media recommendation id |
| userId | [Int](https://docs.anilist.co/reference/scalar/int) | Filter by user who created the recommendation |
| rating | [Int](https://docs.anilist.co/reference/scalar/int) | Filter by total rating of the recommendation |
| onList | [Boolean](https://docs.anilist.co/reference/scalar/boolean) | Filter by the media on the authenticated user's lists |
| rating\_greater | [Int](https://docs.anilist.co/reference/scalar/int) | Filter by total rating of the recommendation |
| rating\_lesser | [Int](https://docs.anilist.co/reference/scalar/int) | Filter by total rating of the recommendation |
| sort | \[ [RecommendationSort](https://docs.anilist.co/reference/enum/recommendationsort)\] | The order the results will be returned in |
| **Like** | [User](https://docs.anilist.co/reference/object/user) | Like query |
| likeableId | [Int](https://docs.anilist.co/reference/scalar/int) | The id of the likeable type |
| type | [LikeableType](https://docs.anilist.co/reference/enum/likeabletype) | The type of model the id applies to |
| **Markdown** | [ParsedMarkdown](https://docs.anilist.co/reference/object/parsedmarkdown) | Provide AniList markdown to be converted to html (Requires auth) |
| markdown | [String](https://docs.anilist.co/reference/scalar/string)! | The markdown to be parsed to html |
| **AniChartUser** | [AniChartUser](https://docs.anilist.co/reference/object/anichartuser) |  |
| **SiteStatistics** | [SiteStatistics](https://docs.anilist.co/reference/object/sitestatistics) | Site statistics query |
| **ExternalLinkSourceCollection** | \[ [MediaExternalLink](https://docs.anilist.co/reference/object/mediaexternallink)\] | ExternalLinkSource collection query |
| id | [Int](https://docs.anilist.co/reference/scalar/int) | Filter by the link id |
| type | [ExternalLinkType](https://docs.anilist.co/reference/enum/externallinktype) |  |
| mediaType | [ExternalLinkMediaType](https://docs.anilist.co/reference/enum/externallinkmediatype) |  |