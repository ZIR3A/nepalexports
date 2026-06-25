import { EventEmitter } from 'events';

// Create a single application-wide EventBus instance
class EventBus extends EventEmitter {}

export const eventBus = new EventBus();

// Optional: Increase max listeners if you expect many handlers
eventBus.setMaxListeners(20);

// Basic logging and wildcard support
const originalEmit = eventBus.emit.bind(eventBus);
eventBus.emit = (eventName, ...args) => {
  // If it's an inventory event, also emit the wildcard 'inventory:*'
  if (typeof eventName === 'string' && eventName.startsWith('inventory:')) {
    originalEmit('inventory:*', { eventName, ...args[0] }); // Assuming args[0] is the data payload
  }
  return originalEmit(eventName, ...args);
};
