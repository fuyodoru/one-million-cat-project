/* =========================================================
   ONE MILLION CAT PROJECT
   ADMIN PANEL
   ========================================================= */


/* =========================================================
   SUPABASE
   ========================================================= */

const SUPABASE_URL =
    "https://xhirgakkurhmpktvcvwe.supabase.co";


const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_9KY3n_ELqAmrNQVy9VH-nA_5Cs7U5-4";


const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_PUBLISHABLE_KEY
    );


/* =========================================================
   LOGIN DOM
   ========================================================= */

const loginScreen =
    document.getElementById(
        "loginScreen"
    );


const loginForm =
    document.getElementById(
        "loginForm"
    );


const loginMessage =
    document.getElementById(
        "loginMessage"
    );


/* =========================================================
   ADMIN DOM
   ========================================================= */

const adminPanel =
    document.getElementById(
        "adminPanel"
    );


const adminUsername =
    document.getElementById(
        "adminUsername"
    );


const pendingCount =
    document.getElementById(
        "pendingCount"
    );


const approvedCount =
    document.getElementById(
        "approvedCount"
    );


const rejectedCount =
    document.getElementById(
        "rejectedCount"
    );


const sightingsList =
    document.getElementById(
        "sightingsList"
    );


const statusMessage =
    document.getElementById(
        "statusMessage"
    );


const refreshButton =
    document.getElementById(
        "refreshButton"
    );


const logoutButton =
    document.getElementById(
        "logoutButton"
    );


/* =========================================================
   LOGIN
   ========================================================= */

loginForm.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();


        const email =
            document
                .getElementById(
                    "email"
                )
                .value
                .trim();


        const password =
            document
                .getElementById(
                    "password"
                )
                .value;


        loginMessage.textContent =
            "LOGGING IN...";


        const {
            data,
            error
        } =
            await supabaseClient.auth.signInWithPassword({

                email,
                password

            });


        if (error) {

            console.error(
                "Login failed:",
                error
            );


            loginMessage.textContent =
                "LOGIN FAILED: " +
                error.message;


            return;

        }


        console.log(
            "Logged in:",
            data.user.id
        );


        await checkAdmin();

    }
);


/* =========================================================
   CHECK ADMIN
   ========================================================= */

async function checkAdmin() {

    const {
        data: {
            user
        },
        error
    } =
        await supabaseClient.auth.getUser();


    if (
        error ||
        !user
    ) {

        showLogin();

        return false;

    }


    const {
        data: profile,
        error: profileError
    } =
        await supabaseClient

            .from(
                "profiles"
            )

            .select(
                "username, role"
            )

            .eq(
                "id",
                user.id
            )

            .single();


    if (
        profileError
    ) {

        console.error(
            "Profile lookup failed:",
            profileError
        );


        await supabaseClient.auth.signOut();


        showLogin(
            "PROFILE LOOKUP FAILED"
        );


        return false;

    }


    if (
        !profile ||
        profile.role !== "admin"
    ) {

        console.warn(
            "User is not an admin."
        );


        await supabaseClient.auth.signOut();


        showLogin(
            "ADMIN ACCESS REQUIRED"
        );


        return false;

    }


    /* -----------------------------------------------------
       ADMIN VERIFIED
    ----------------------------------------------------- */

    adminUsername.textContent =
        profile.username ||
        "ADMIN";


    loginScreen.classList.add(
        "hidden"
    );


    adminPanel.classList.remove(
        "hidden"
    );


    await loadStatistics();

    await loadPendingSightings();


    return true;

}


/* =========================================================
   SHOW LOGIN
   ========================================================= */

function showLogin(
    message = ""
) {

    adminPanel.classList.add(
        "hidden"
    );


    loginScreen.classList.remove(
        "hidden"
    );


    loginMessage.textContent =
        message;

}


/* =========================================================
   LOAD STATISTICS
   ========================================================= */

async function loadStatistics() {

    const {
        data,
        error
    } =
        await supabaseClient

            .from(
                "cat_sightings"
            )

            .select(
                "status"
            );


    if (error) {

        console.error(
            "Failed to load statistics:",
            error
        );

        return;

    }


    let pending = 0;
    let approved = 0;
    let rejected = 0;


    data.forEach(
        sighting => {

            if (
                sighting.status ===
                "pending"
            ) {

                pending++;

            }


            if (
                sighting.status ===
                "approved"
            ) {

                approved++;

            }


            if (
                sighting.status ===
                "rejected"
            ) {

                rejected++;

            }

        }
    );


    pendingCount.textContent =
        pending;


    approvedCount.textContent =
        approved;


    rejectedCount.textContent =
        rejected;

}


/* =========================================================
   LOAD PENDING SIGHTINGS
   ========================================================= */

async function loadPendingSightings() {

    statusMessage.textContent =
        "LOADING...";


    sightingsList.innerHTML =
        "";


    const {
        data,
        error
    } =
        await supabaseClient

            .from(
                "cat_sightings"
            )

            .select(`
                id,
                cat_count,
                city,
                country,
                status,
                created_at
            `)

            .eq(
                "status",
                "pending"
            )

            .order(
                "created_at",
                {
                    ascending:
                        false
                }
            );


    if (error) {

        console.error(
            "Failed to load sightings:",
            error
        );


        statusMessage.textContent =
            "FAILED TO LOAD SIGHTINGS";


        return;

    }


    if (
        data.length === 0
    ) {

        statusMessage.textContent =
            "NO PENDING SIGHTINGS";


        return;

    }


    statusMessage.textContent =
        "";


    data.forEach(
        sighting => {

            createSightingCard(
                sighting
            );

        }
    );

}


/* =========================================================
   CREATE SIGHTING CARD
   ========================================================= */

/* =========================================================
   CREATE SIGHTING CARD
   ========================================================= */

function createSightingCard(sighting) {

    const card =
        document.createElement("article");

    card.className =
        "sighting-card";


    const count =
        Number(sighting.cat_count);


    const catWord =
        count === 1
            ? "CAT"
            : "CATS";


    const location =
        [
            sighting.city,
            sighting.country
        ]
            .filter(Boolean)
            .join(", ");


    const date =
        sighting.created_at
            ? new Date(
                sighting.created_at
            ).toLocaleString()
            : "UNKNOWN";


    card.innerHTML = `

        <div class="sighting-main">

            <span class="pending-badge">
                PENDING
            </span>


            <div class="sighting-title">
                🐾 ${count} ${catWord}
            </div>


            <div class="sighting-location">
                📍 ${escapeHTML(
                    location ||
                    "LOCATION UNKNOWN"
                )}
            </div>


            <div class="sighting-meta">

                <span>
                    📅 ${escapeHTML(date)}
                </span>

            </div>


            <div class="sighting-id">
                ID: ${escapeHTML(
                    sighting.id
                )}
            </div>


            <div class="sighting-actions">

                <button
                    class="approve-button"
                    data-id="${escapeHTML(sighting.id)}"
                >
                    APPROVE
                </button>


                <button
                    class="reject-button"
                    data-id="${escapeHTML(sighting.id)}"
                >
                    REJECT
                </button>

            </div>

        </div>

    `;


    /* -----------------------------------------------------
       APPROVE
    ----------------------------------------------------- */

    const approveButton =
        card.querySelector(
            ".approve-button"
        );


    approveButton.addEventListener(
        "click",
        async () => {

            await moderateSighting(
                sighting.id,
                "approved"
            );

        }
    );


    /* -----------------------------------------------------
       REJECT
    ----------------------------------------------------- */

    const rejectButton =
        card.querySelector(
            ".reject-button"
        );


    rejectButton.addEventListener(
        "click",
        async () => {

            await moderateSighting(
                sighting.id,
                "rejected"
            );

        }
    );


    sightingsList.appendChild(
        card
    );

}
/* =========================================================
   MODERATE SIGHTING
   ========================================================= */

async function moderateSighting(
    sightingId,
    newStatus
) {

    const {
        error
    } =
        await supabaseClient

            .from("cat_sightings")

            .update({
                status: newStatus
            })

            .eq(
                "id",
                sightingId
            );


    if (error) {

        console.error(
            "Failed to moderate sighting:",
            error
        );

        alert(
            "FAILED TO UPDATE SIGHTING"
        );

        return;

    }


    console.log(
        `Sighting ${sightingId} → ${newStatus}`
    );


    /* Refresh admin panel */

    await loadStatistics();

    await loadPendingSightings();

}
/* =========================================================
   HTML ESCAPE
   ========================================================= */

function escapeHTML(
    value
) {

    return String(
        value ?? ""
    )

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );

}


/* =========================================================
   REFRESH
   ========================================================= */

refreshButton.addEventListener(
    "click",
    async () => {

        await loadStatistics();

        await loadPendingSightings();

    }
);


/* =========================================================
   LOGOUT
   ========================================================= */

logoutButton.addEventListener(
    "click",
    async () => {

        await supabaseClient.auth.signOut();

        showLogin(
            "LOGGED OUT"
        );

    }
);


/* =========================================================
   START
   ========================================================= */

checkAdmin();