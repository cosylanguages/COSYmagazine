# Magazine PDF Publishing Guide (Zero-Console Workflows) 🌿

This guide describes how to push and publish PDF magazines directly to private Supabase Storage (`magazine-editions`) and update the `magazine_issues` database table **without typing anything into the terminal / console**.

---

## Method 1: GitHub Actions (One-Click Web Interface)

You can trigger the publication directly through your browser on GitHub without running commands.

### 1. Prerequisite: Configure GitHub Secrets (One-time setup)
In your GitHub repository:
1. Navigate to **Settings** → **Secrets and variables** → **Actions**.
2. Click **New repository secret** and add:
   - `SUPABASE_URL`: Your Supabase Project URL (e.g. `https://iajkejcmoykubthlwfra.supabase.co`).
   - `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase **service_role** key (JWT secret with administrative storage privileges).
   - `SUPABASE_BUCKET`: *(Optional)* Defaults to `magazine-editions`.

### 2. Triggering via GitHub Actions Web UI
1. Go to the **Actions** tab in GitHub.
2. Select **Generate and Upload Magazine PDF to Supabase** on the left sidebar.
3. Click the **Run workflow** dropdown on the right.
4. Choose your **Operation Mode**:
   - **`generate_and_upload`** *(Default)*: Compiles/creates the PDF directly on the GitHub runner using headless Playwright from your magazine HTML sources and pushes the result directly to Supabase storage.
   - **`upload_existing_file`**: Takes an existing pre-built PDF from a file path or URL and pushes it.
5. Configure parameters:
   - **Volume number**: e.g. `Vol. 2026.08`
   - **Source HTML**: e.g. `private-issues/august-2026.html`
   - **Issue Title**: e.g. `Get Ready for School` (optional).
   - **Publish immediately**: Checked (`true`) by default.
6. Click **Run workflow**.

The workflow will:
- Validate that the file is a genuine PDF.
- Ensure the private `magazine-editions` bucket exists.
- Upload the PDF with `x-upsert: true` so updates overwrite cleanly.
- Create or update the `magazine_issues` row with `pdf_storage_path` and `is_published: true`.

---

## Method 2: Automatic Git Push (Zero-Console via Web / Desktop)

You can simply drag-and-drop or commit your PDF to the repository without any console commands:

1. Upload your magazine PDF into either `magazines/` or `private-issues/` (e.g. using GitHub's "Upload files" button or GitHub Desktop).
   - Name it with the issue volume, e.g. `magazines/vol-2026-08.pdf` or `magazines/august-2026.pdf`.
2. Commit and push the file to `main`.
3. The GitHub Action automatically detects new/modified PDFs and securely pushes them directly to Supabase storage and registers the issue!

---

## Method 3: In-Browser Studio Upload (`editor.html`)

You can also upload magazine PDFs directly from the web browser in the COSYmagazine Studio:

1. Open `editor.html` in your web browser.
2. Click **🔑 Founder Login** in the top-right header and log in with your Founder/Admin account.
3. Once logged in as Founder, click the **📤 Upload Magazine PDF** button in the header.
4. In the dialog:
   - Choose your PDF file from your computer using the file selector.
   - Confirm or customize the Volume number (e.g. `Vol. 2026.08`) and Title.
   - Click **🚀 Upload PDF Directly to Supabase**.
5. The PDF is transferred directly into Supabase Storage (`magazine-editions`) and the `magazine_issues` catalog table is synchronized in real time.

---

## Access & Security
- Magazine PDFs uploaded to `magazine-editions` remain **private and protected**.
- When subscribers or issue purchasers click "Download Issue PDF" on `issues.html` or `index.html`, Supabase creates a time-limited signed download URL (via the `get-issue-download-url` edge function). Unauthorized visitors are prompted to log in or subscribe.
