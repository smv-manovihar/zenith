import axios from 'axios';

const ANILIST_URL = 'https://graphql.anilist.co/';

/**
 * Global Rate Limit Tracker
 */
class RateLimitManager {
  limit: number = 30;
  remaining: number = 30;
  resetAt: number = 0; 
  retryAfter: number = 0; // Number of seconds to wait

  update(headers: any) {
    this.retryAfter = 0; // Reset before checking fresh headers
    if (headers['x-ratelimit-limit']) {
      this.limit = parseInt(headers['x-ratelimit-limit']);
    }
    if (headers['x-ratelimit-remaining']) {
      this.remaining = parseInt(headers['x-ratelimit-remaining']);
    }
    if (headers['x-ratelimit-reset']) {
      this.resetAt = parseInt(headers['x-ratelimit-reset']);
    }
    if (headers['retry-after']) {
      this.retryAfter = parseInt(headers['retry-after']);
    }
  }

  get isRateLimited(): boolean {
    return (this.remaining <= 0 || this.retryAfter > 0) && 
           (Date.now() / 1000 < this.resetAt || this.retryAfter > 0);
  }

  get waitTime(): number {
    if (this.retryAfter > 0) {
      const wait = (this.retryAfter * 1000) + 1500;
      // We reset retryAfter once we've calculated the wait time for this request
      // so it doesn't persist forever, but note that 429 handlers should 
      // ideally rely on the response headers.
      return wait;
    }
    if (!this.isRateLimited) return 0;
    return Math.max(0, (this.resetAt * 1000) - Date.now() + 1500); // +1.5s safety buffer
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

    // AniList returns 200 OK even if there are GraphQL validation errors.
    // We MUST throw them so the UI can catch and display the specific error.
    if (response.data.errors && response.data.errors.length > 0) {
      const errorMsg = response.data.errors.map((e: any) => e.message).join(", ");
      const error: any = new Error(errorMsg);
      error.response = response; // Mimic axios structure for the catch block
      throw error;
    }

    rateLimiter.update(response.headers);

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
    const status = error.response?.status;

    // Enhanced logging for 400 errors to help debug variables/query issues
    if (status === 400 && error.response?.data?.errors) {
      const gqlErrors = error.response.data.errors;
      const errorMsg = gqlErrors.map((e: any) => e.message).join(", ");
      console.error('AniList 400 Error Response:', error.response.data);
      // Throw a more descriptive error so the UI can show it
      const enhancedError: any = new Error(errorMsg);
      enhancedError.response = error.response;
      throw enhancedError;
    }

    // Retry on Rate Limits (429) OR Server Errors (5xx) OR Network timeouts
    const isRetryable = status === 429 || (status >= 500 && status < 600) || !status;

    if (isRetryable && retries > 0) {
      if (signal?.aborted) throw new Error('Aborted');

      // Exponential backoff for 5xx, strict reset time for 429
      const waitTime = status === 429 
        ? (rateLimiter.waitTime || 5000) 
        : (4 - retries) * 2000; 
      
      console.warn(`Transient error (${status || 'Network'}). Waiting ${waitTime}ms (Reset: ${rateLimiter.resetAt})...`)
      
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(resolve, waitTime);
        signal?.addEventListener('abort', () => {
          clearTimeout(timeout);
          reject(new Error('Aborted during retry wait'));
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
      mediaListOptions {
        scoreFormat
      }
    }
  }
`;