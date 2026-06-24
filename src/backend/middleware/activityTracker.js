import connectToDatabase from '@/backend/config/db';
import ActivityLog from '@/backend/models/ActivityLog';

/**
 * Higher-order function to wrap Next.js API route handlers with activity tracking.
 * @param {Function} handler - The original API route handler (e.g., POST, PUT, DELETE)
 * @param {string} actionType - The logical action being performed (e.g., 'update_product')
 */
export function withActivityTracker(handler, actionType) {
  return async (req, ctx) => {
    // We clone the request if we need to read the body without consuming it for the actual handler.
    // However, in Next.js, reading req.json() consumes the stream. 
    // To avoid breaking the inner handler, we let the handler run first, and if it succeeds, we log.
    
    // We will parse the URL to determine target resource from params or search params if needed.
    const url = new URL(req.url);
    const targetResource = ctx?.params?.id || url.pathname;

    let userId = 'system'; // Default mock
    let userName = 'System User';

    // In a real app with next-auth, you'd get the session here.
    // We'll try to pull from headers for mock testing.
    const headerUserId = req.headers.get('x-user-id');
    const headerUserName = req.headers.get('x-user-name');
    if (headerUserId) userId = headerUserId;
    if (headerUserName) userName = headerUserName;

    try {
      // Execute the actual handler
      const response = await handler(req, ctx);
      
      // If it's a successful mutation (2xx status), log it
      if (response.ok || (response.status >= 200 && response.status < 300)) {
        // We do this asynchronously so it doesn't block the response
        connectToDatabase().then(() => {
          ActivityLog.create({
            userId,
            userName,
            action_type: actionType,
            target_resource: targetResource,
            details: { method: req.method, url: req.url }
          }).catch(err => console.error("Failed to write Activity Log:", err));
        });
      }

      return response;
    } catch (error) {
      console.error(`ActivityTracker: Error in ${actionType}:`, error);
      throw error; // Re-throw to be handled by Next.js or outer catch
    }
  };
}
