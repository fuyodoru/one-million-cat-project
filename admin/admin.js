/*
=========================================================
ONE MILLION CAT PROJECT
ADMIN PANEL
=========================================================
*/

const SUPABASE_URL = "https://xhirgakkurhmpktvcvwe.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_9KY3n_ELqAmrNQVy9VH-nA_5Cs7U5-4";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
);

const loginScreen = document.getElementById("loginScreen");
const loginForm = document.getElementById("loginForm");
const loginMessage = document.getElementById("loginMessage");
const adminPanel = document.getElementById("adminPanel");
const adminUsername = document.getElementById("adminUsername");
const pendingCount = document.getElementById("pendingCount");
const approvedCount = document.getElementById("approvedCount");
const rejectedCount = document.getElementById("rejectedCount");
const sightingsList = document.getElementById("sightingsList");
const statusMessage = document.getElementById("statusMessage");
const refreshButton = document.getElementById("refreshButton");
const logoutButton = document.getElementById("logoutButton");
const searchInput = document.getElementById("searchInput");
const sectionDescription = document.getElementById("sectionDescription");
const tabButtons = document.querySelectorAll(".tab-button");

let currentStatus = "pending";
let allSightings = [];
let isLoading = false;

loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    loginMessage.textContent = "LOGGING IN...";
    loginMessage.className = "login-message";

    const { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password
    });

    if (error) {
        console.error("Login failed:", error);
        loginMessage.textContent = "LOGIN FAILED: " + error.message;
        loginMessage.classList.add("error");
        return;
    }

    console.log("Logged in:", data.user.id);
    await checkAdmin();
});

async function checkAdmin() {
    const {
        data: { user },
        error
    } = await supabaseClient.auth.getUser();

    if (error || !user) {
        showLogin();
        return false;
    }

    const { data: profile, error: profileError } = await supabaseClient
        .from("profiles")
        .select("username, role")
        .eq("id", user.id)
        .single();

    if (profileError) {
        console.error("Profile lookup failed:", profileError);
        await supabaseClient.auth.signOut();
        showLogin("PROFILE LOOKUP FAILED");
        return false;
    }

    if (!profile || profile.role !== "admin") {
        await supabaseClient.auth.signOut();
        showLogin("ADMIN ACCESS REQUIRED");
        return false;
    }

    adminUsername.textContent = profile.username || "ADMIN";
    loginScreen.classList.add("hidden");
    adminPanel.classList.remove("hidden");

    await loadAdminData();
    return true;
}

function showLogin(message = "") {
    adminPanel.classList.add("hidden");
    loginScreen.classList.remove("hidden");
    loginMessage.textContent = message;
    loginMessage.className = "login-message";
}

async function loadAdminData() {
    if (isLoading) return;

    isLoading = true;
    refreshButton.disabled = true;
    refreshButton.textContent = "LOADING...";

    try {
        await Promise.all([loadStatistics(), loadSightings()]);
    } finally {
        isLoading = false;
        refreshButton.disabled = false;
        refreshButton.textContent = "REFRESH";
    }
}

async function loadStatistics() {
    const { data, error } = await supabaseClient
        .from("cat_sightings")
        .select("status");

    if (error) {
        console.error("Failed to load statistics:", error);
        return;
    }

    let pending = 0;
    let approved = 0;
    let rejected = 0;

    for (const sighting of data || []) {
        if (sighting.status === "pending") pending++;
        if (sighting.status === "approved") approved++;
        if (sighting.status === "rejected") rejected++;
    }

    pendingCount.textContent = pending;
    approvedCount.textContent = approved;
    rejectedCount.textContent = rejected;
}

async function loadSightings() {
    statusMessage.textContent = "LOADING...";
    statusMessage.className = "status-message";
    sightingsList.innerHTML = "";

    const { data, error } = await supabaseClient
        .from("cat_sightings")
        .select(`
            id,
            cat_count,
            city,
            country,
            photo_url,
            status,
            created_at
        `)
        .eq("status", currentStatus)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Failed to load sightings:", error);
        statusMessage.textContent = "FAILED TO LOAD SIGHTINGS";
        statusMessage.classList.add("error");
        return;
    }

    allSightings = data || [];
    renderSightings();
}

function renderSightings() {
    const query = searchInput.value.trim().toLowerCase();

    const filtered = allSightings.filter((sighting) => {
        if (!query) return true;

        return [
            sighting.city,
            sighting.country,
            sighting.id
        ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .includes(query);
    });

    sightingsList.innerHTML = "";

    if (filtered.length === 0) {
        statusMessage.textContent = query
            ? "NO MATCHING SIGHTINGS"
            : `NO ${currentStatus.toUpperCase()} SIGHTINGS`;
        statusMessage.className = "status-message";
        return;
    }

    statusMessage.textContent = "";
    statusMessage.className = "status-message";

    filtered.forEach(createSightingCard);
}

function createSightingCard(sighting) {
    const card = document.createElement("article");
    card.className = "sighting-card";

    const count = Number(sighting.cat_count) || 0;
    const catWord = count === 1 ? "CAT" : "CATS";

    const location = [
        sighting.city,
        sighting.country
    ].filter(Boolean).join(", ") || "LOCATION UNKNOWN";

    const date = sighting.created_at
        ? new Date(sighting.created_at).toLocaleString()
        : "UNKNOWN";

    const photoUrl = getCatPhotoURL(sighting.photo_url);
    const statusLabel = String(sighting.status || "unknown").toUpperCase();

    card.innerHTML = `
        <div class="sighting-content">
            ${photoUrl ? `
                <div class="sighting-photo">
                    <img src="${escapeHTML(photoUrl)}" alt="Cat sighting" loading="lazy">
                </div>
            ` : `
                <div class="sighting-photo no-photo"><span>NO PHOTO</span></div>
            `}

            <div class="sighting-main">
                <div class="sighting-topline">
                    <span class="status-badge status-${escapeHTML(sighting.status)}">${escapeHTML(statusLabel)}</span>
                    <span class="sighting-count">🐾 ${count} ${catWord}</span>
                </div>

                <div class="sighting-location">📍 ${escapeHTML(location)}</div>
                <div class="sighting-meta"><span>📅 ${escapeHTML(date)}</span></div>
                <div class="sighting-id">ID: ${escapeHTML(sighting.id)}</div>

                <div class="sighting-actions">
                    ${sighting.status !== "approved" ? `
                        <button class="approve-button" type="button" data-action="approved">APPROVE</button>
                    ` : ""}
                    ${sighting.status !== "rejected" ? `
                        <button class="reject-button" type="button" data-action="rejected">REJECT</button>
                    ` : ""}
                </div>
            </div>
        </div>
    `;

    const photo = card.querySelector(".sighting-photo img");

    if (photo) {
        photo.addEventListener("error", () => {
            const wrapper = photo.parentElement;
            wrapper.classList.add("no-photo");
            wrapper.innerHTML = "<span>PHOTO UNAVAILABLE</span>";
        });
    }

    card.querySelectorAll("[data-action]").forEach((button) => {
        button.addEventListener("click", async () => {
            await moderateSighting(sighting.id, button.dataset.action, button);
        });
    });

    sightingsList.appendChild(card);
}

function getCatPhotoURL(photoPath) {
    if (!photoPath) return "";

    if (photoPath.startsWith("http://") || photoPath.startsWith("https://")) {
        return photoPath;
    }

    const { data } = supabaseClient.storage
        .from("cat-sightings")
        .getPublicUrl(photoPath);

    return data?.publicUrl || "";
}

async function moderateSighting(sightingId, newStatus, clickedButton) {
    if (clickedButton) {
        clickedButton.disabled = true;
        clickedButton.textContent = "UPDATING...";
    }

    const { error } = await supabaseClient
        .from("cat_sightings")
        .update({ status: newStatus })
        .eq("id", sightingId);

    if (error) {
        console.error("Failed to moderate sighting:", error);
        alert("FAILED TO UPDATE SIGHTING");

        if (clickedButton) {
            clickedButton.disabled = false;
            clickedButton.textContent =
                newStatus === "approved" ? "APPROVE" : "REJECT";
        }
        return;
    }

    await loadAdminData();
}

tabButtons.forEach((button) => {
    button.addEventListener("click", async () => {
        const nextStatus = button.dataset.status;
        if (nextStatus === currentStatus) return;

        currentStatus = nextStatus;

        tabButtons.forEach((tab) => {
            tab.classList.toggle("active", tab.dataset.status === currentStatus);
        });

        updateSectionDescription();
        await loadSightings();
    });
});

function updateSectionDescription() {
    const descriptions = {
        pending: "PENDING SIGHTINGS WAITING FOR MODERATION.",
        approved: "SIGHTINGS CURRENTLY VISIBLE ON THE PUBLIC TRACKER.",
        rejected: "SIGHTINGS THAT HAVE BEEN REJECTED."
    };

    sectionDescription.textContent = descriptions[currentStatus] || "";
}

searchInput.addEventListener("input", renderSightings);

refreshButton.addEventListener("click", loadAdminData);

logoutButton.addEventListener("click", async () => {
    await supabaseClient.auth.signOut();
    allSightings = [];
    sightingsList.innerHTML = "";
    showLogin("LOGGED OUT");
});

function escapeHTML(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

supabaseClient.auth.onAuthStateChange((event, session) => {
    if (event === "SIGNED_OUT" || !session) {
        showLogin();
    }
});

updateSectionDescription();
checkAdmin();
