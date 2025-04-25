Please **analyze the project for performance bottlenecks** and suggest optimizations:

- Check for any unnecessary database or network calls (e.g., duplicate fetches or N+1 query patterns).
- Identify components that might be re-rendering too often or doing heavy work on the main thread.
- Look at our use of assets (images, scripts): are there any large bundles or unoptimized assets affecting load time?
- Suggest improvements like caching frequently used data, using React memo or lazy loading where appropriate, and any other ways to speed up the app.

Provide the analysis and recommendations in a list. Do not make code changes yet – just tell us what to improve for better performance.