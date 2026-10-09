# Caspia V14.5 — GitHub Pages deployment

The homepage and game are static and use local relative links. This archive is ready to extract into the ROOT of a GitHub repository.

## Changes since V14.4
- Caspia now holds every pose for **4.5 seconds** before switching to the next pose (wave → smile → yawn → comb hair → smile → repeat).
- Homepage navigation, Explore Website and the playable game are otherwise unchanged.

## Publish from GitHub website
1. Create a public GitHub repository (e.g. `caspia-digital-kingdom`).
2. Upload all unzipped files and folders **directly into the repository root**, so `index.html` is in the root (not inside another subfolder).
3. Commit changes.
4. Open **Settings → Pages** and under **Build and deployment**, select **Deploy from a branch**, **main** and **/(root)**; save.
5. Open the displayed `https://YOUR-USERNAME.github.io/REPOSITORY-NAME/` once Pages publishes. The site may take a few minutes to update.
6. Test **Explore Our Website**, **Play: Save Princess Caspia**, **Home**, animation pause, boss demo, and mobile layout using the public URL.

## Updating an existing repository via PowerShell
From the cloned repo folder, copy these site's contents into the repository root, then run:

```powershell
git status
git add .
git commit -m "Caspia homepage: 4.5-second character poses"
git push origin main
```

Run the commands only after verifying your target repository and `git diff`. Do not overwrite unrelated work.

## Limitations
The 4.5-second loop is a sequence of images with transitions, not a frame-by-frame video. Browsers may defer animation when a tab is hidden. Browser/physical-phone acceptance is still recommended.
