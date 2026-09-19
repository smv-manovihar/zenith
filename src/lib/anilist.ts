import axios from 'axios';

const ANILIST_URL = 'https://graphql.anilist.co/';

/**
 * Global Rate Limit Tracker
 */
export interface RateLimitInfo {
  limit: number;
  remaining: number;
  resetAt: number;
  retryAfter: number;
}

type RateLimitListener = (info: RateLimitInfo) => void;

/**
 * Global Dynamic Rate Limit Manager
 * Dynamically adapts to AniList's changing rate limits (degraded 30/min or standard 90/min),
 * calculating optimal request pacing based on real-time response headers.
 */
class RateLimitManager {
  limit: number = 30;
  remaining: number = 30;
  resetAt: number = Math.floor(Date.now() / 1000) + 60; 
  retryAfter: number = 0;
  private listeners: Set<RateLimitListener> = new Set();

  update(headers: Record<string, any> = {}) {
    this.retryAfter = 0;
    let changed = false;

    // Normalize header lookup across different casing
    const getHeader = (key: string): string | undefined => {
      const lowerKey = key.toLowerCase();
      for (const [k, v] of Object.entries(headers)) {
        if (k.toLowerCase() === lowerKey) return typeof v === "string" ? v : String(v);
      }
      return undefined;
    };

    const limitHeader = getHeader("x-ratelimit-limit");
    const remainingHeader = getHeader("x-ratelimit-remaining");
    const resetHeader = getHeader("x-ratelimit-reset");
    const retryAfterHeader = getHeader("retry-after");

    if (limitHeader) {
      const parsed = parseInt(limitHeader, 10);
      if (!isNaN(parsed) && parsed > 0 && parsed !== this.limit) {
        this.limit = parsed;
        changed = true;
      }
    }
    if (remainingHeader) {
      const parsed = parseInt(remainingHeader, 10);
      if (!isNaN(parsed) && parsed >= 0 && parsed !== this.remaining) {
        this.remaining = parsed;
        changed = true;
      }
    }
    if (resetHeader) {
      const parsed = parseInt(resetHeader, 10);
      if (!isNaN(parsed) && parsed > 0 && parsed !== this.resetAt) {
        this.resetAt = parsed;
        changed = true;
      }
    }
    if (retryAfterHeader) {
      const parsed = parseInt(retryAfterHeader, 10);
      if (!isNaN(parsed) && parsed > 0) {
        this.retryAfter = parsed;
        changed = true;
      }
    }

    if (changed) {
      this.notify();
    }
  }

  subscribe(listener: RateLimitListener): () => void {
    this.listeners.add(listener);
    listener(this.info);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    const current = this.info;
    this.listeners.forEach((listener) => {
      try {
        listener(current);
      } catch (e) {
        console.error("Rate limit listener error:", e);
      }
    });
  }

  get info(): RateLimitInfo {
    return {
      limit: this.limit,
      remaining: this.remaining,
      resetAt: this.resetAt,
      retryAfter: this.retryAfter,
    };
  }

  get isRateLimited(): boolean {
    const nowSec = Date.now() / 1000;
    return (this.remaining <= 1 || this.retryAfter > 0) && 
           (nowSec < this.resetAt || this.retryAfter > 0);
  }

  get waitTime(): number {
    if (this.retryAfter > 0) {
      return (this.retryAfter * 1000) + 1500;
    }
    if (!this.isRateLimited) return 0;
    const nowMs = Date.now();
    const resetMs = this.resetAt * 1000;
    return Math.max(0, resetMs - nowMs + 1500); // +1.5s safety buffer
  }

  /**
   * Dynamically calculates optimal delay between requests based on actual quota remaining
   * and time remaining until the rate-limit window resets.
   */
  getDynamicDelay(preferredDelay = 1500): number {
    if (this.isRateLimited) {
      return this.waitTime;
    }

    const nowMs = Date.now();
    const resetMs = this.resetAt * 1000;
    const timeRemainingMs = Math.max(0, resetMs - nowMs);
    const ratioRemaining = this.limit > 0 ? this.remaining / this.limit : 1;

    // If quota is getting low, dynamically pace requests across the window
    if (this.remaining > 0 && timeRemainingMs > 0) {
      // Minimum delay to evenly distribute remaining requests over the window
      const evenPacing = Math.ceil(timeRemainingMs / this.remaining) + 250;

      if (ratioRemaining <= 0.15 || this.remaining <= 3) {
        // Critical: under 15% quota remaining
        return Math.max(preferredDelay, evenPacing, 4000);
      } else if (ratioRemaining <= 0.35 || this.remaining <= 8) {
        // Warning: under 35% quota remaining
        return Math.max(preferredDelay, evenPacing, 2500);
      }
    }

    return preferredDelay;
  }
}

export const rateLimiter = new RateLimitManager();

export interface AniListResponse<T = any> {
  data: T;
  headers: any;
  errors?: any[];
}

export const queryAniList = async <T = any>(
  query: string,
  variables: Record<string, any> = {},
  token?: string,
  retries = 3,
  signal?: AbortSignal
): Promise<AniListResponse<T>> => {
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
  query ($search: String, $season: MediaSeason, $seasonYear: Int, $format_in: [MediaFormat], $sort: [MediaSort], $page: Int) {
    Page(page: $page, perPage: 24) {
      pageInfo {
        hasNextPage
      }
      media(search: $search, type: ANIME, season: $season, seasonYear: $seasonYear, format_in: $format_in, sort: $sort) {
        id
        idMal
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
        duration
        averageScore
        meanScore
        popularity
        season
        seasonYear
        source
        genres
        startDate { year month day }
        endDate { year month day }
        mediaListEntry {
          id
          status
          score
          progress
        }
        studios {
          nodes {
            name
            isAnimationStudio
          }
        }
        trailer {
          id
          site
        }
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

export const UPDATE_USER_SETTINGS = `
  mutation ($scoreFormat: ScoreFormat) {
    UpdateUser (scoreFormat: $scoreFormat) {
      id
      mediaListOptions {
        scoreFormat
      }
    }
  }
`;

export const DELETE_MEDIA_LIST_ENTRY = `
  mutation ($id: Int!) {
    DeleteMediaListEntry (id: $id) {
      deleted
    }
  }
`;

export const GET_MEDIA_LIST_COLLECTION = `
  query ($userId: Int!, $type: MediaType!, $status: MediaListStatus) {
    MediaListCollection(userId: $userId, type: $type, status: $status) {
      lists {
        name
        status
        entries {
          id
          score
          status
          progress
          updatedAt
          createdAt
          startedAt { year month day }
          completedAt { year month day }
          media {
            id
            idMal
            title {
              romaji
              english
            }
            coverImage {
              large
              medium
            }
            bannerImage
            description
            format
            status
            episodes
            duration
            averageScore
            popularity
            trending
            source
            genres
            startDate { year month day }
            endDate { year month day }
            season
            seasonYear
            studios {
              nodes {
                name
                isAnimationStudio
              }
            }
            trailer {
              id
              site
            }
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
      siteUrl
      mediaListOptions {
        scoreFormat
      }
    }
  }
`;