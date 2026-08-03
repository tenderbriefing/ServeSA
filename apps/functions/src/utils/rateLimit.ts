/**
 * ServeSA Pilot: Token Bucket Rate Limiter for Cloud Functions
 * In-memory implementation for HTTP callables (resets on function restart)
 */

interface TokenBucket {
  tokens: number;
  lastRefill: number;
  capacity: number;
  refillRate: number; // tokens per second
}

const buckets = new Map<string, TokenBucket>();

interface RateLimitConfig {
  capacity: number; // max tokens
  refillRate: number; // tokens per second
  windowMs: number; // time window in milliseconds
}

const DEFAULT_CONFIG: RateLimitConfig = {
  capacity: 10,
  refillRate: 1, // 1 token per second
  windowMs: 60000 // 1 minute
};

export class RateLimiter {
  private config: RateLimitConfig;

  constructor(config: Partial<RateLimitConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  private getBucketKey(identifier: string): string {
    return `rate-limit:${identifier}`;
  }

  private refillBucket(bucket: TokenBucket): void {
    const now = Date.now();
    const timePassed = (now - bucket.lastRefill) / 1000; // seconds
    const tokensToAdd = timePassed * bucket.refillRate;
    
    bucket.tokens = Math.min(bucket.capacity, bucket.tokens + tokensToAdd);
    bucket.lastRefill = now;
  }

  async checkRateLimit(identifier: string): Promise<{
    allowed: boolean;
    remaining: number;
    resetTime: number;
    retryAfter?: number;
  }> {
    const key = this.getBucketKey(identifier);
    let bucket = buckets.get(key);

    if (!bucket) {
      bucket = {
        tokens: this.config.capacity,
        lastRefill: Date.now(),
        capacity: this.config.capacity,
        refillRate: this.config.refillRate
      };
      buckets.set(key, bucket);
    }

    this.refillBucket(bucket);

    if (bucket.tokens >= 1) {
      bucket.tokens -= 1;
      return {
        allowed: true,
        remaining: Math.floor(bucket.tokens),
        resetTime: bucket.lastRefill + (this.config.capacity / bucket.refillRate) * 1000
      };
    } else {
      const timeToNextToken = (1 - bucket.tokens) / bucket.refillRate;
      return {
        allowed: false,
        remaining: 0,
        resetTime: bucket.lastRefill + (this.config.capacity / bucket.refillRate) * 1000,
        retryAfter: Math.ceil(timeToNextToken)
      };
    }
  }

  async consumeToken(identifier: string): Promise<boolean> {
    const result = await this.checkRateLimit(identifier);
    return result.allowed;
  }

  getRemainingTokens(identifier: string): number {
    const key = this.getBucketKey(identifier);
    const bucket = buckets.get(key);
    return bucket ? Math.floor(bucket.tokens) : this.config.capacity;
  }
}

// Pre-configured rate limiters for different endpoints
export const caseCreationLimiter = new RateLimiter({
  capacity: 5, // 5 cases per minute
  refillRate: 1/60 // 1 token per minute
});

export const apiLimiter = new RateLimiter({
  capacity: 100, // 100 requests per minute
  refillRate: 100/60 // 100 tokens per minute
});

export const authLimiter = new RateLimiter({
  capacity: 10, // 10 auth attempts per minute
  refillRate: 1/6 // 1 token per 6 seconds
});

// Middleware function for Cloud Functions
export function withRateLimit(
  limiter: RateLimiter,
  getIdentifier: (req: any) => string
) {
  return (handler: Function) => {
    return async (req: any, res: any) => {
      const identifier = getIdentifier(req);
      const result = await limiter.checkRateLimit(identifier);

      if (!result.allowed) {
        res.status(429).json({
          error: "Rate limit exceeded",
          retryAfter: result.retryAfter,
          resetTime: new Date(result.resetTime).toISOString()
        });
        return;
      }

      // Add rate limit headers
      res.set({
        'X-RateLimit-Limit': '100',
        'X-RateLimit-Remaining': result.remaining.toString(),
        'X-RateLimit-Reset': new Date(result.resetTime).toISOString()
      });

      return handler(req, res);
    };
  };
}
