// Promise.withResolvers polyfill for compatibility with older Node.js versions
if (typeof Promise !== 'undefined' && !Promise.withResolvers) {
  try {
    if (typeof window !== 'undefined') {
      // Client-side polyfill
      // @ts-ignore: Adding polyfill for Promise.withResolvers
      window.Promise.withResolvers = function() {
        let resolve!: (value: any) => void;
        let reject!: (reason: any) => void;
        const promise = new Promise((res, rej) => {
          resolve = res;
          reject = rej;
        });
        return { promise, resolve, reject };
      };
      console.log('Added client-side Promise.withResolvers polyfill successfully');
    } else {
      // Server-side polyfill
      // @ts-ignore: Adding polyfill for Promise.withResolvers
      global.Promise.withResolvers = function() {
        let resolve!: (value: any) => void;
        let reject!: (reason: any) => void;
        const promise = new Promise((res, rej) => {
          resolve = res;
          reject = rej;
        });
        return { promise, resolve, reject };
      };
      console.log('Added server-side Promise.withResolvers polyfill successfully');
    }
  } catch (error) {
    console.error('Failed to add Promise.withResolvers polyfill:', error);
  }
}

export {}; 