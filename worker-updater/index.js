/**
 * Cloudflare Worker for WebPro Updates
 * Serves latest.json for Tauri updater
 */

const GITHUB_REPO = "reservaselrinconcito-stack/framepro-app";

export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);

        // Servir latest.json
        if (url.pathname === "/latest.json") {
            return handleLatest(request);
        }

        // Redirect to download specific platform
        if (url.pathname.startsWith("/download/")) {
            const platform = url.pathname.split("/")[2]; // macos, windows
            return handleDownloadRedirect(platform);
        }

        return new Response("WebPro Update Server", { status: 200 });
    },
};

async function handleLatest(request) {
    try {
        const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases/latest`, {
            headers: {
                "User-Agent": "WebPro-Updater-Worker",
                Accept: "application/vnd.github.v3+json",
            },
        });

        if (!res.ok) throw new Error("GitHub API Error");
        const release = await res.json();

        const version = release.tag_name.replace(/^v/, "");
        const assets = release.assets || [];

        // Tauri v2 update format
        const update = {
            version,
            notes: release.body || "Nueva versión disponible.",
            pub_date: release.published_at,
            platforms: {},
        };

        // Find artifacts and signatures
        assets.forEach((a) => {
            const name = a.name.toLowerCase();

            const ensurePlatform = (key, url) => {
                if (!update.platforms[key]) update.platforms[key] = {};
                if (url) update.platforms[key].url = url;
            };

            const setSignature = (key, sigAsset) => {
                if (!update.platforms[key]) update.platforms[key] = {};
                update.platforms[key].signature = "placeholder_will_fetch_content";
                update.platforms[key].sigAsset = sigAsset;
            };

            // macOS ARM
            if (name.includes("aarch64") && name.endsWith(".app.tar.gz")) {
                ensurePlatform("darwin-aarch64", a.browser_download_url);
            }
            if (name.includes("aarch64") && name.endsWith(".app.tar.gz.sig")) {
                setSignature("darwin-aarch64", a.browser_download_url);
            }

            // macOS x64
            if ((name.includes("x86_64") || name.includes("x64")) && name.endsWith(".app.tar.gz")) {
                ensurePlatform("darwin-x86_64", a.browser_download_url);
                ensurePlatform("darwin-x86_64-app", a.browser_download_url);
            }
            if ((name.includes("x86_64") || name.includes("x64")) && name.endsWith(".app.tar.gz.sig")) {
                setSignature("darwin-x86_64", a.browser_download_url);
                setSignature("darwin-x86_64-app", a.browser_download_url);
            }

            // Windows
            if (name.endsWith(".nsis.zip") || (name.includes("x64") && name.endsWith(".exe"))) {
                update.platforms["windows-x86_64"] = { url: a.browser_download_url };
            }
            if (name.endsWith(".nsis.zip.sig") || name.endsWith(".exe.sig")) {
                update.platforms["windows-x86_64"].signature = "placeholder_content";
                update.platforms["windows-x86_64"].sigAsset = a.browser_download_url;
            }
        });

        // Fetch signatures content
        for (const p in update.platforms) {
            if (update.platforms[p].sigAsset) {
                const sigRes = await fetch(update.platforms[p].sigAsset);
                if (sigRes.ok) {
                    update.platforms[p].signature = await sigRes.text();
                }
                delete update.platforms[p].sigAsset;
            }
        }

        return new Response(JSON.stringify(update), {
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        });
    } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
}

async function handleDownloadRedirect(platform) {
    const releasesUrl = `https://github.com/${GITHUB_REPO}/releases/latest`;
    return Response.redirect(releasesUrl, 302);
}
