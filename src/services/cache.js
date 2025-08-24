// src/services/cache.js

import { createCacheService } from 'psf-core/services/cache.service.js';
import redisClient from '../clients/redis.client.js';

// Create the final, ready-to-use cache instance by injecting the src client.
const cache = createCacheService(redisClient);

// Export this singleton instance for use throughout the `src` project.
export default cache;
