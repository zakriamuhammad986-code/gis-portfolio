# Muhammad Zakria Nawaz — GIS Portfolio (Steps 1–7: Home, Projects, About, Skills, Experience, (optional) Services and Contact pages)

Static site: plain HTML, CSS and JavaScript. No build step, no backend, no API keys.

## Run it
Content is loaded from `content/*.json`, so opening `index.html` directly from disk will not work. Serve the folder locally:

    python3 -m http.server 8000     # then visit http://localhost:8000

## Structure
- `index.html` — Home page (complete for this step)
- `projects.html` — Projects page (complete): 13 project cards, working search, category filters, sort, and a detail view for each project
- `about.html` — About page (complete). Edit the "Add details" placeholders (start year, graduation, CGPA, coursework, current work, personal note) or delete them
- `skills.html` — Skills & Tools page (complete). Tools are grouped in five categories and each links to the projects where it was used. No scores or percentages. QGIS and ArcGIS Pro sit under "Tools to confirm later" because no supplied project mentions them; Surveying/GPS/GNSS is an empty placeholder. Move items into a category only once confirmed
- `experience.html` — Experience & Learning page. Content comes only from `content/experience.json`. Items stay hidden until you set `published: true`. With nothing published, visitors see a short "nothing to show yet" message. Academic projects stay on the Projects page
- `services.html` — **optional, off by default.** Six services are drafted in `content/services.json`, all `published: false`. Until you turn it on, there is no Services link anywhere and the page only says it is not available (and carries a `noindex` tag). No prices: each card says "Contact for scope and quote". If you don't want to offer services, ignore it or delete `services.html` and `js/services.js`
- `contact.html` — Contact page with an accessible form (Name, Email, Subject / project type, Message). **The form is switched off until you connect it** (see "Connecting the contact form" below). Direct-contact rows show "Add verified …" chips until you provide real details in `content/site.json`
- `css/styles.css` — shared design system (tokens, components). All pages use it.
- `js/main.js` — mobile menu, footer/contact links, subtle scroll reveal
- `content/projects.json` — **the data for all 13 projects. Edit this file (or use the admin panel) to update the Projects page**
- `js/projects.js` — search, filters, sort and the detail dialog
- `content/experience.json` — **edit this file to add experience, training, certificates and achievements** The Fauji Cement internship is drafted there as `published: false` until you confirm the details and wording
- `js/experience.js` — renders the published items
- `js/contact.js` — form validation and sending (form service or email app), plus the direct-contact rows
- `content/services.json` / `js/services.js` — service wording and rendering. To launch: set each confirmed service to `published: true`, set `showServicesPage` to true in `content/site.json`, and delete the `noindex` line in `services.html`
- `content/site.json` — put your **verified** email and social URLs here (empty values are not shown). Also holds the `showServicesPage` switch (default `false`).
- `assets/img/` — abstract terrain and thumbnail graphics, favicon, profile placeholder

## Things you must replace or confirm
- **Profile photo:** replace `assets/img/profile-placeholder.svg` with your real photo (keep a meaningful `alt` on the `<img>` in `index.html`).
- **Projects:** titles, dates and tools are as supplied. Every other field is wording taken from your descriptions or an **Add details** prompt. Fill in `data`, `outputs`, `role`, links and screenshots in `content/projects.json` only with verified information.
- **Project type:** each project says "Academic / course project (to be confirmed)". Change `projectType` once you confirm.
- **Categories:** each project was assigned to one of the four categories by me. Change `category` (gis, rs, web, carto) if you disagree.
- **Home page featured projects** (six cards) are written into `index.html`. If you change a title, date or summary in `content/projects.json`, update the matching card there too.
- **Contact and social links:** fill in `content/site.json` only with details you have verified.
- **Images:** all graphics are generated abstract illustrations (not real maps, imagery or project output). Swap in your own maps or properly credited/licensed imagery.

## Admin panel
See **ADMIN-SETUP.md**. `/admin` is a Git-based CMS (Decap) with GitHub login, designed for Netlify. Files: `admin/index.html`, `admin/config.yml`, `netlify.toml`, `content/*.json`. It is **not tested end to end** here (see that file). There are no passwords or secrets in the project.

## Hosting notes
The public site works on any static host. The admin panel as configured is for Netlify + GitHub. A working contact form would need a backend or a form service, which is not included.
Fonts use the visitor's system font stack, so no external requests are made.

## Connecting the contact form
A static website cannot send email by itself, so the form does nothing until you choose ONE option in `content/site.json`:

1. **Form service (recommended).** Create an account with a form service that accepts a browser POST and replies with JSON containing `"ok": true` or `"success": true`. Put the address it gives you in `contactForm.endpoint` (must be `https://`). If the service needs an extra public key, put it in `contactForm.fields`, for example `{ access_key: "..." }`. In the service's settings, allow your website's domain and set the address that receives the messages.
2. **Email app.** Set `email` only. The button then says "Open in email app" and opens the visitor's email program with the message filled in. Nothing is sent until the visitor presses send there, and the page says so.
3. **Neither.** The form stays disabled and says it is not connected.

The page shows "Thank you, your message was sent" only when the service replies with an explicit success. Any other reply (a web page, an empty reply, an error) shows "Your message was not sent".

**What was and was not tested:** the form logic was tested here against simulated service replies (success, errors, timeouts, network failure) and the email-app mode. It has NOT been tested against a real form service or a real inbox, because no endpoint or email address exists yet. After you connect it, send yourself a test message from the live site and confirm it arrives.
