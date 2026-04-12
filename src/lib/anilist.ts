import axios from 'axios';

const ANILIST_URL = 'https://graphql.anilist.co';

/**
 * Global Rate Limit Tracker
 */
class RateLimitManager {
  limit: number = 90;
  remaining: number = 90;
  resetAt: number = 0; // Unix timestamp in seconds

  update(headers: any) {
    if (headers['x-ratelimit-limit']) {
      this.limit = parseInt(headers['x-ratelimit-limit']);
    }
    if (headers['x-ratelimit-remaining']) {
      this.remaining = parseInt(headers['x-ratelimit-remaining']);
    }
    if (headers['x-ratelimit-reset']) {
      this.resetAt = parseInt(headers['x-ratelimit-reset']);
    }
  }

  get isRateLimited(): boolean {
    return this.remaining <= 0 && Date.now() / 1000 < this.resetAt;
  }

  get waitTime(): number {
    if (!this.isRateLimited) return 0;
    return Math.max(0, (this.resetAt * 1000) - Date.now() + 1000); // +1s safety buffer
  }
}

export const rateLimiter = new RateLimitManager();

export interface AniListResponse {
  data: any;
  headers: any;
  errors?: any[];
}

export const queryAniList = async (
  query: string,
  variables: any = {},
  token?: string,
  retries = 3,
  signal?: AbortSignal
): Promise<AniListResponse> => {
  const reqHeaders: any = {
    "Content-Type": "application/json",
    Accept: "application/json",
  }

  if (token) {
    reqHeaders["Authorization"] = `Bearer ${token}`
  }

  try {
    const response = await axios.post(
      ANILIST_URL,
      {
        query,
        variables,
      },
      { 
        headers: reqHeaders,
        signal 
      }
    )

    // Return GraphQL data alongside headers
    return {
      data: response.data.data,
      errors: response.data.errors,
      headers: response.headers
    };
  } catch (error: any) {
    // If specifically aborted, throw immediately
    if (axios.isCancel(error) || error.name === 'AbortError' || signal?.aborted) {
      throw error;
    }

    const headers = error.response?.headers || {};
    rateLimiter.update(headers);

    // Handle AniList Rate Limits (429)
    if (error.response?.status === 429 && retries > 0) {
      if (signal?.aborted) throw new Error('Aborted');

      const waitTime = rateLimiter.waitTime || 5000;
      console.warn(`Rate limited. Waiting ${waitTime}ms (Reset: ${rateLimiter.resetAt})...`)
      
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(resolve, waitTime);
        signal?.addEventListener('abort', () => {
          clearTimeout(timeout);
          reject(new Error('Aborted during rate limit wait'));
        }, { once: true });
      })

      if (signal?.aborted) throw new Error('Aborted');
      return queryAniList(query, variables, token, retries - 1, signal)
    }
    throw error
  }
}

export const SEARCH_ANIME_QUERY = `
  query ($search: String, $formatList: [MediaFormat]) {
    Page(page: 1, perPage: 10) {
      media(search: $search, type: ANIME, format_in: $formatList) {
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
        siteUrl
        relations {
          edges {
            relationType
            node {
              id
              title {
                romaji
                english
                native
              }
              coverImage {
                large
              }
              siteUrl
              description
              status
              episodes
              averageScore
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
  mutation ($mediaId: Int, $status: MediaListStatus, $score: Float, $progress: Int) {
    SaveMediaListEntry (mediaId: $mediaId, status: $status, score: $score, progress: $progress) {
      id
      mediaId
      status
      score
      progress
    }
  }
`;

export const GET_VIEWER_QUERY = `
  query {
    Viewer {
      id
      name
      avatar {
        large
      }
    }
  }
`;
