const { test, expect } = require("@playwright/test");

test("admin panel manages the category playlist video hierarchy", async ({ page }) => {
  await page.goto("/playlists.html");
  await page.evaluate(() => {
    localStorage.removeItem("visionhub-v2-library");
    localStorage.removeItem("visionhub-v2-admin");
    localStorage.removeItem("visionhub-v2-active");
  });
  await page.reload();

  await expect(page.getByRole("heading", { name: "Playlists dynamiques." })).toBeVisible();
  const openAdmin = async () => {
    await page.getByRole("button", { name: "Administration" }).click();
    await expect(page.locator("#adminDrawer")).toBeVisible();
  };

  await openAdmin();

  let categoryForm = page.locator("#categoryAdminForm");
  await categoryForm.locator("select[name='id']").selectOption("__new__");
  await categoryForm.locator("input[name='title']").fill("Automatisation Test");
  await categoryForm.locator("input[name='icon']").fill("AT");
  await categoryForm.locator("input[name='color']").fill("green");
  await categoryForm.locator("textarea[name='description']").fill("Catégorie créée par le test navigateur.");
  await categoryForm.getByRole("button", { name: "Enregistrer" }).click();
  await expect(page.locator("#adminDrawer")).toBeHidden();
  await openAdmin();
  await expect(page.locator("[data-admin-row='category']").filter({ hasText: "Automatisation Test" })).toBeVisible();

  let playlistForm = page.locator("#playlistAdminForm");
  await playlistForm.locator("select[name='id']").selectOption("__new__");
  await playlistForm.locator("input[name='title']").fill("Playlist B Test");
  await playlistForm.locator("select[name='category']").selectOption("automatisation-test");
  await playlistForm.locator("input[name='level']").fill("Débutant");
  await playlistForm.locator("input[name='tags']").fill("test, automation");
  await playlistForm.locator("textarea[name='description']").fill("Deuxième playlist pour tester le déplacement.");
  await playlistForm.getByRole("button", { name: "Enregistrer" }).click();
  await expect(page.locator("#adminDrawer")).toBeHidden();
  await openAdmin();
  await expect(page.locator("[data-admin-row='playlist']").filter({ hasText: "Playlist B Test" })).toBeVisible();

  playlistForm = page.locator("#playlistAdminForm");
  await playlistForm.locator("select[name='id']").selectOption("__new__");
  await playlistForm.locator("input[name='title']").fill("Playlist A Test");
  await playlistForm.locator("select[name='category']").selectOption("automatisation-test");
  await playlistForm.locator("input[name='level']").fill("Intermédiaire");
  await playlistForm.locator("input[name='tags']").fill("test, drag");
  await playlistForm.locator("textarea[name='description']").fill("Première playlist pour tester le glisser-déposer.");
  await playlistForm.getByRole("button", { name: "Enregistrer" }).click();
  await expect(page.locator("#adminDrawer")).toBeHidden();
  await openAdmin();
  await expect(page.locator("[data-admin-row='playlist']").filter({ hasText: "Playlist A Test" })).toBeVisible();

  await page.locator("[data-admin-row='playlist']").filter({ hasText: "Playlist A Test" }).dragTo(
    page.locator("[data-admin-row='playlist']").filter({ hasText: "Playlist B Test" })
  );
  await expect(page.locator("#adminDrawer")).toBeHidden();
  await expect.poll(async () => page.evaluate(() => {
    const library = JSON.parse(localStorage.getItem("visionhub-v2-library"));
    const ids = library.playlists.map((playlist) => playlist.id);
    return ids.indexOf("playlist-a-test") < ids.indexOf("playlist-b-test");
  })).toBe(true);

  await openAdmin();
  let videoForm = page.locator("#videoAdminForm");
  await videoForm.locator("select[name='playlistId']").selectOption("playlist-a-test");
  await videoForm.locator("select[name='id']").selectOption("__new__");
  await videoForm.locator("input[name='title']").fill("Vidéo A Test");
  await videoForm.locator("input[name='youtube']").fill("UB1O30fR-EE");
  await videoForm.locator("select[name='targetPlaylistId']").selectOption("playlist-a-test");
  await videoForm.locator("input[name='duration']").fill("1:00:42");
  await videoForm.locator("input[name='level']").fill("Débutant");
  await videoForm.locator("input[name='tags']").fill("html, test");
  await videoForm.locator("textarea[name='description']").fill("Vidéo de test pour l'administration.");
  await videoForm.getByRole("button", { name: "Enregistrer" }).click();
  await expect(page.locator("#adminDrawer")).toBeHidden();
  await openAdmin();
  await expect(page.locator("[data-admin-row='video']").filter({ hasText: "Vidéo A Test" })).toBeVisible();

  videoForm = page.locator("#videoAdminForm");
  await videoForm.locator("select[name='id']").selectOption("__new__");
  await videoForm.locator("input[name='title']").fill("Vidéo B Test");
  await videoForm.locator("input[name='youtube']").fill("W6NZfCO5SIk");
  await videoForm.locator("select[name='targetPlaylistId']").selectOption("playlist-a-test");
  await videoForm.locator("input[name='duration']").fill("48:17");
  await videoForm.locator("input[name='level']").fill("Débutant");
  await videoForm.locator("input[name='tags']").fill("javascript, test");
  await videoForm.locator("textarea[name='description']").fill("Deuxième vidéo de test.");
  await videoForm.getByRole("button", { name: "Enregistrer" }).click();
  await expect(page.locator("#adminDrawer")).toBeHidden();
  await openAdmin();
  await expect(page.locator("[data-admin-row='video']").filter({ hasText: "Vidéo B Test" })).toBeVisible();

  await page.locator("[data-admin-row='video']").filter({ hasText: "Vidéo B Test" }).dragTo(
    page.locator("[data-admin-row='video']").filter({ hasText: "Vidéo A Test" })
  );
  await expect(page.locator("#adminDrawer")).toBeHidden();
  await expect.poll(async () => page.evaluate(() => {
    const library = JSON.parse(localStorage.getItem("visionhub-v2-library"));
    const playlist = library.playlists.find((item) => item.id === "playlist-a-test");
    return playlist.videos[0].id;
  })).toBe("video-b-test");

  await openAdmin();
  videoForm = page.locator("#videoAdminForm");
  await page.locator("[data-admin-edit='video'][data-id='video-b-test']").click();
  await videoForm.locator("select[name='targetPlaylistId']").selectOption("playlist-b-test");
  await videoForm.getByRole("button", { name: "Enregistrer" }).click();
  await expect(page.locator("#adminDrawer")).toBeHidden();
  await expect.poll(async () => page.evaluate(() => {
    const library = JSON.parse(localStorage.getItem("visionhub-v2-library"));
    return library.playlists.find((item) => item.id === "playlist-b-test").videos.some((video) => video.id === "video-b-test");
  })).toBe(true);

  await page.getByRole("button", { name: "Exporter XML" }).click();
  await expect(page.locator("#playlistXmlOutput")).toContainText("Playlist A Test");
  await expect(page.locator("#playlistXmlOutput")).toContainText("Vidéo B Test");
});

test("video intelligence enriches titles descriptions tags and levels", async ({ page }) => {
  await page.goto("/videos.html?playlist=frontend-foundations&video=js-course");
  await expect(page.locator("#playerInfo h2")).toHaveText("Bases modernes de JavaScript");
  await expect(page.locator("#playerInfo")).toContainText("Objectif éditorial");
  await expect(page.locator("#playerInfo")).toContainText("JavaScript");
  await expect(page.locator("#videoList")).toContainText("JavaScript");
});

test("imported YouTube resources are visible searchable and organizable", async ({ page }) => {
  await page.goto("/videos.html");
  await page.evaluate(() => {
    localStorage.removeItem("visionhub-v2-library");
    localStorage.removeItem("visionhub-v2-admin");
    localStorage.removeItem("visionhub-v2-active");
  });
  await page.reload();

  await expect(page.getByRole("heading", { name: "Ressources YouTube importées." })).toBeVisible();
  await expect(page.locator("[data-imported-video]")).toHaveCount(174);
  await expect(page.locator("#playlistSelect")).toContainText("Ressources importées");

  const firstTitle = await page.locator("#playerInfo h2").textContent();
  await page.locator("[data-video-row]").nth(1).click();
  await expect(page.locator("#playerInfo h2")).not.toHaveText(firstTitle || "");

  await page.locator("#importedSearch").fill("Python");
  await expect(page.locator("[data-imported-video]:visible").first()).toBeVisible();
  const pythonCount = await page.locator("[data-imported-video]:visible").count();
  expect(pythonCount).toBeGreaterThan(0);
  expect(pythonCount).toBeLessThan(174);

  await page.goto("/playlists.html?admin=imports");
  await expect(page.locator("#adminDrawer")).toBeVisible();
  await expect(page.locator("#organizeImportedForm select[name='videoKey'] option")).toHaveCount(174);
  await page.locator("#organizeImportedForm input[name='newPlaylistTitle']").fill("Importées Test");
  await page.locator("#organizeImportedForm").getByRole("button", { name: "Ajouter à la playlist" }).click();
  await expect.poll(async () => page.evaluate(() => {
    const library = JSON.parse(localStorage.getItem("visionhub-v2-library"));
    return library.playlists.find((playlist) => playlist.id === "importees-test")?.videos.length || 0;
  })).toBe(1);

  await page.goto("/files.html");
  await expect(page.locator("[data-file-card]").filter({ hasText: "Développement, IA, programmation" }).first()).toBeVisible();
  await expect(page.locator("[data-file-card]").filter({ hasText: "Cet outil IA permet de créer des apps" })).toBeVisible();
});
