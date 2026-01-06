# Project Rules

- Frontend
  - Dev: cd LeatherFrontend && npm run dev
  - Build: cd LeatherFrontend && npm run build
  - Lint: cd LeatherFrontend && npm run lint
- Backend
  - Dev: cd backend && npm run dev
  - Start: cd backend && npm run start
- Environment
  - Frontend: NEXT_PUBLIC_API_URL, NEXT_PUBLIC_GOOGLE_CLIENT_ID
  - Backend: ACCESS_TOKEN_SECRET, REFRESH_TOKEN_SECRET, GOOGLE_CLIENT_ID, AWS S3 keys, MAILTRAP_SENDEREMAIL, BASE_URL
- Auth
  - Google Sign-In uses Google Identity Services. Frontend sends idToken to /api/v1/auth/google-login
  - Registration uses multipart form with optional profileImage
- Verification
  - Start backend, ensure /health returns 200
  - Register user with phone and address; image optional
  - Login with Google using configured client ID
