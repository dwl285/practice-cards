# Single Next.js app with Neon Postgres and access code

The production app is a single-user, mobile-first webapp optimized for cheap managed hosting and low operational overhead. We host the Next.js app on Sites, store durable practice data in Neon Postgres through Prisma, keep the metronome client-side with Web Audio, and protect the app with a simple in-app access code instead of full user accounts because that gives enough privacy for personal use without adding avoidable auth and infrastructure complexity.
