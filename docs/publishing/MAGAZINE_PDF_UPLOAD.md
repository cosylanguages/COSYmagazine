# Magazine PDF Publishing Guide (Zero-Console Workflows) 🌿

This guide describes how to publish PDF magazines to private Supabase Storage (`magazine-editions`) and register each edition in the `magazine_issues` table without using a terminal.

> **Never commit sold PDFs to this public repository.** `private-issues/` and `magazines/` are gitignored, and a CI test fails if a PDF is tracked. Use one of the workflows below instead.

Each edition is sold and served per language. A row is identified by `(volume_number, language)`, and the storage object is named `issues/cosymagazine-<YYYY.MM>-<language>.pdf`.

---

## Method 1: GitHub Actions (One-Click Web Interface)

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
4. Choose an **Operation Mode** (`action_mode`):
   - **`generate_and_upload`** *(default)*: Builds every requested edition from the magazine HTML sources on the runner with headless Playwright, then uploads the PDFs.
   - **`upload_existing_file`**: Uploads an existing PDF from a URL or a path on the runner.
5. Configure parameters:
   - **Volume number** (`volume_number`): e.g. `Vol. 2026.08`
   - **Edition language** (`language`): `en`, `fr`, `ru`, or `all`. `all` is only valid for `generate_and_upload`; `upload_existing_file` needs exactly one language.
   - **PDF path or URL** (`pdf_path`): required for `upload_existing_file`.
   - **Issue title** (`issue_title`): optional.
   - **Publish immediately** (`publish`): checked by default.
6. Click **Run workflow**.

The workflow will:
- Validate that the file is a genuine PDF.
- Ensure the private `magazine-editions` bucket exists.
- Upload the PDF with `x-upsert: true` so updates overwrite cleanly.
- Create or update the `magazine_issues` row for the selected `(volume_number, language)` with `pdf_storage_path` and `is_published`.

---

## Method 2: In-Browser Studio Upload (`editor.html`)

1. Open `editor.html` in your web browser.
2. Click **🔑 Founder Login** in the top-right header and log in with your Founder/Admin account.
3. Once logged in as Founder, click the **📤 Upload Magazine PDF** button in the header.
4. In the dialog:
   - Choose your PDF file from your computer using the file selector.
   - Confirm or customize the **Volume number** (e.g. `Vol. 2026.08`), choose the **Edition language** (`en`, `fr`, or `ru`), and optionally set the title.
   - Click **🚀 Upload PDF Directly to Supabase**.
5. The PDF is transferred directly into Supabase Storage (`magazine-editions`) and the `magazine_issues` row for that `(volume_number, language)` is synchronized.

---

## Access & Security
- Magazine PDFs uploaded to `magazine-editions` remain **private and protected**.
- When subscribers or issue purchasers click **Download Issue PDF** on `issues-catalog.html`, Supabase creates a time-limited signed download URL via the `get-issue-download-url` edge function. Unauthorized visitors are prompted to log in or subscribe.
- The download function resolves the edition by `(volume_number, language)`, so English, French, and Russian editions are bought and served separately.
