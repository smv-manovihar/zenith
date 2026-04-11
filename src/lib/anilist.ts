import axios from 'axios';

const ANILIST_URL = 'https://graphql.anilist.co';

export const queryAniList = async (
  query: string,
  variables: any = {},
  token?: string,
  retries = 3
): Promise<any> => {
  const headers: any = {
    "Content-Type": "application/json",
    Accept: "application/json",
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`
  }

  try {
    const response = await axios.post(
      ANILIST_URL,
      {
        query,
        variables,
      },
      { headers }
    )

    return response.data
  } catch (error: any) {
    // Handle AniList Rate Limits (429)
    if (error.response?.status === 429 && retries > 0) {
      const retryAfter =
        parseInt(error.response.headers["retry-after"]) * 1000 || 5000
      console.warn(`Rate limited. Retrying after ${retryAfter}ms...`)
      await new Promise((resolve) => setTimeout(resolve, retryAfter))
      return queryAniList(query, variables, token, retries - 1)
    }
    throw error
  }
}

export const SEARCH_ANIME_QUERY = `
  query ($search: String) {
    Page(page: 1, perPage: 10) {
      media(search: $search, type: ANIME) {
        id
        title {
          romaji
          english
          native
        }
        coverImage {
          large
        }
        bannerImage
        description
        format
        status
        episodes
        averageScore
        relations {
          edges {
            relationType
            node {
              id
              title {
                romaji
              }
              coverImage {
                large
              }
              format
              type
            }
          }
        }
      }
    }
  }
`;

export const SAVE_MEDIA_LIST_ENTRY = `
  mutation ($mediaId: Int, $status: MediaListStatus, $score: Float) {
    SaveMediaListEntry (mediaId: $mediaId, status: $status, score: $score) {
      id
      mediaId
      status
      score
    }
  }
`;
