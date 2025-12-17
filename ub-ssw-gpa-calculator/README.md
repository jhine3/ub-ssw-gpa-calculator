# UB SSW Internal GPA Calculator

## Local dev
```bash
npm install
npm run dev
```

## Deploy to Vercel (via GitHub)
1. Create a new GitHub repo (e.g., `ub-ssw-gpa-calculator`).
2. Upload the contents of this folder to the repo (or push via git).
3. In Vercel, click **Add New → Project**, select the repo, and deploy.
   - Framework preset: **Vite**
   - Build command: `npm run build`
   - Output directory: `dist`

## Notes
- Entries are saved locally in the browser via `localStorage`.
