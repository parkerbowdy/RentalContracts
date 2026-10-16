# J-Town Rental — GitHub Pages Test Setup

This is a deployment ADD-ON, not the complete rental application.
Combine with the prior rental/return test ZIP. The original application files
were unavailable in the current session and were NOT modified or re-tested.

## Required repository root
index.html       (from this add-on)
rental.html      (from prior test ZIP)
manager.html     (from prior test ZIP)
app.js           (from prior test ZIP)
theme.css        (from prior test ZIP)
logo.png         (from prior test ZIP)
.nojekyll        (optional; from this add-on)
.gitignore       (from this add-on)
README.md        (this file)

Do not upload ZIP archives as a substitute for extracting these files.

## Publish using GitHub's website
1. Create a repository named jtown-rental-test.
2. For GitHub Free, a public repository is required for Pages. Other plans
   may support Pages from private repositories, but a private repository
   does not by itself make the Pages website private.
3. Add file > Upload files. Upload the extracted files above into the root.
4. Commit changes to main.
5. Settings > Pages > Build and deployment > Source: Deploy from a branch.
6. Branch: main. Folder: / (root). Save.
7. Wait for deployment, then use the website link displayed on Pages.

## Safety and limitations
- Public demo only; do not use real ID photos, signatures, or customer data.
- Do not commit contracts, backups, PINs, API secrets or service-role keys.
- The manager page is NOT access-controlled. A demo PIN in browser code is
  not secure authorization. Anyone with the site URL can load the interface.
- IndexedDB is local to a browser profile and site origin, NOT cloud storage.
- Localhost/file test data does not migrate to the GitHub Pages URL.
- A different computer/tablet has separate records.
- Repository files on GitHub are not a cloud database for rental records.
- No cloud save, email, Epicor API, or camera barcode SDK has been added.
- Back up fictional test data separately if needed; browser clearing removes it.
- Before live use: implement authenticated staff roles, server-side manager PIN
  validation, private ID/document storage, cloud database and protected logs.

## Official documentation
https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site
