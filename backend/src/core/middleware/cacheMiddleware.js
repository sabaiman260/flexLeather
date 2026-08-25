/**
 * Cache middleware for setting HTTP cache headers
 * @param {number} duration - Cache duration in seconds (default: 300 = 5 minutes)
 */
export const cacheMiddleware = (duration = 300) => {
  return (req, res, next) => {
    // Set cache headers for public cacheable responses
    res.set('Cache-Control', `public, max-age=${duration}, s-maxage=${duration}, stale-while-revalidate=60`);
    next();
  };
};
