# Admin panel: how it works and how to set it up

## What this is
A **Git-based CMS** (Decap CMS) at `/admin`. You log in with your **GitHub account**. When you save, the CMS makes a change to the JSON files in `content/` in **your GitHub repository**. Netlify sees the change and republishes the site.

There is no password, token or secret anywhere in this project. Who may edit is decided by GitHub: only accounts with write access to your repository can save anything. Visitors who open `/admin` see a login button and nothing else.

## What you can edit in the panel
| Panel section | File | Controls |
|---|---|---|
| Projects | `content/projects.json` | all 13 projects: text, tools, links, screenshots |
| Experience & Learning | `content/experience.json` | experience, training, certificates, achievements (hidden until Published is on) |
| Services | `content/services.json` | the optional services (hidden until Published is on) |
| Contact & site settings | `content/site.json` | public email/phone/links, form service address, Services page on/off |

## What you can NOT edit in the panel (still plain HTML)
Home page text and featured cards (`index.html`), About (`about.html`), Skills (`skills.html`), page headings. Edit those files in GitHub or locally. Moving them into the panel is possible later.

## Set-up (one time)
You need: a GitHub account, a Netlify account, and about 20 minutes.

1. **Put the project in a GitHub repository** (branch `main`). Do not put anything secret in it.
2. **Edit `admin/config.yml`**: replace `YOUR-GITHUB-USERNAME/YOUR-REPOSITORY-NAME` and the two `YOUR-SITE-ADDRESS` lines with your real values.
3. **Create the site on Netlify**: Add new site, Import from Git, choose the repository. No build command. Publish directory `.` (already set in `netlify.toml`).
4. **Create a GitHub OAuth app** (GitHub: Settings, Developer settings, OAuth Apps, New). Homepage URL: your Netlify site address. Authorization callback URL: `https://api.netlify.com/auth/done`.
5. **Give Netlify the app's Client ID and Client Secret**: Netlify site settings, Access & security, OAuth, Install provider, GitHub. The secret is stored in Netlify only, never in your repository. (Menu names may change; Netlify's current docs for "Authentication providers" are the reference.)
6. **Open `https://YOUR-SITE/admin/`** and press Login with GitHub.

If your site uses a custom domain, Decap may need an extra `site_domain` setting. See the Decap CMS documentation on the GitHub backend.

## How editing and publishing work
`publish_mode: editorial_workflow` is on. Saving creates a **draft pull request**. The live site changes only when you move it to **Ready** and press **Publish**. This gives you a review step before anything becomes public.

## Security notes
- Do not give GitHub write access to anyone you do not trust. Turn on two-factor authentication on your GitHub account.
- Everything you save in the panel is **public** (it is shown on the website and sits in the repository if it is public). Never enter passwords, API secrets or private data in any field.
- The contact form's "extra values" must be **public** keys only.
- If you ever see a login screen asking for a password on `/admin`, that is not this system. Do not enter your details.

## What was tested, and what was not
Tested here:
- All four content files load on the pages; every page still passes the automated layout, accessibility-behaviour, projects, and contact-form test suites.
- A script checked that every key in the content files has a matching field in `admin/config.yml` and the types agree, so saving through the panel cannot silently drop data.
- No credentials appear in the repository.

**Not tested:**
- The admin panel itself, the GitHub login, and saving or publishing. The sandbox this was built in cannot reach the CMS library or GitHub, so I could not run it. Expect to fix small setup issues when you first connect it.
- The pinned CMS version in `admin/index.html` (`decap-cms@3.1.10`) was not verified against the package registry. Check it exists and update it if needed.
- A live contact form (needs your form service).
