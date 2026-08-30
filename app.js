/* =========================================================
   ONE MILLION CAT PROJECT
   CAT TRACKER
   ========================================================= */


/* =========================================================
   CONFIG
   ========================================================= */

const TOTAL_TARGET = 1_000_000;

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
   MAP
   ========================================================= */

const map =
    L.map(
        "map",
        {
            zoomControl: false,
            minZoom: 2,
            maxZoom: 13,
            worldCopyJump: true
        }
    )
    .setView(
        [25, 10],
        2
    );


L.tileLayer(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
        maxZoom: 19,
        attribution:
            "&copy; OpenStreetMap contributors"
    }
).addTo(map);


/*
 * Make sure Leaflet calculates
 * the correct map dimensions.
 */

setTimeout(
    () => {
        map.invalidateSize(true);
    },
    300
);


/* =========================================================
   PAW MARKER
   ========================================================= */

const pawIcon =
    L.icon({
        iconUrl:
            "assets/cats/paw-marker.png",

        iconSize:
            [32, 32],

        iconAnchor:
            [16, 16],

        popupAnchor:
            [0, -18]
    });


/*
 * Fallback paw.
 *
 * If the PNG cannot load,
 * the marker still appears.
 */

const fallbackPawIcon =
    L.divIcon({
        className:
            "fallback-paw-marker",

        html:
            '<div style="' +
            'font-size:28px;' +
            'line-height:32px;' +
            'width:32px;' +
            'height:32px;' +
            'text-align:center;' +
            '">🐾</div>',

        iconSize:
            [32, 32],

        iconAnchor:
            [16, 16],

        popupAnchor:
            [0, -18]
    });


const markerLayer =
    L.layerGroup().addTo(map);


/* =========================================================
   HELPERS
   ========================================================= */

function escapeHTML(value) {

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
   DATE
   ========================================================= */

function formatDate(value) {

    if (!value) {
        return "DATE UNKNOWN";
    }

    const date =
        new Date(value);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return "DATE UNKNOWN";
    }

    return date.toLocaleDateString(
        "en-GB",
        {
            day:
                "2-digit",

            month:
                "short",

            year:
                "numeric"
        }
    );
}


/* =========================================================
   PROGRESS
   ========================================================= */

function formatProgress(progress) {

    if (
        progress === 0
    ) {
        return "0.000%";
    }

    if (
        progress < 0.001
    ) {
        return "<0.001%";
    }

    return (
        progress.toFixed(3) +
        "%"
    );
}


/* =========================================================
   PRIVACY OFFSET
   ========================================================= */

function getPrivacyOffset(id) {

    const value =
        String(
            id ?? "cat"
        );

    let hash = 0;

    for (
        let i = 0;
        i < value.length;
        i++
    ) {

        hash =
            (
                hash * 31 +
                value.charCodeAt(i)
            ) >>> 0;
    }

    return {

        latitude:
            (
                (hash % 2001) -
                1000
            ) / 100000,

        longitude:
            (
                ((hash >>> 11) % 2001) -
                1000
            ) / 100000
    };
}


/* =========================================================
   LOAD CAT SIGHTINGS
   ========================================================= */

async function loadCatSightings() {

    console.log(
        "================================"
    );

    console.log(
        "LOADING CAT SIGHTINGS"
    );

    console.log(
        "Supabase URL:",
        SUPABASE_URL
    );

    console.log(
        "================================"
    );


    markerLayer.clearLayers();


    /*
     * IMPORTANT
     *
     * We query ONLY the public view.
     *
     * We never expose the private
     * cat_sightings table directly.
     */

    const {
        data,
        error
    } =
        await supabaseClient
            .from(
                "public_cat_sightings"
            )
            .select(`
                id,
                cat_count,
                public_latitude,
                public_longitude,
                city,
                country,
                created_at,
                photo_url
            `);


    console.log(
        "Supabase data:",
        data
    );

    console.log(
        "Supabase error:",
        error
    );


    if (error) {

        console.error(
            "SUPABASE LOAD ERROR:",
            error
        );

        updateCounter(0);

        updateStatistics(
            [],
            0
        );

        return;
    }


    const sightings =
        Array.isArray(data)
            ? data
            : [];


    console.log(
        "NUMBER OF SIGHTINGS:",
        sightings.length
    );


    /*
     * Calculate total cats.
     */

    const totalCats =
        sightings.reduce(
            (
                total,
                sighting
            ) => {

                return (
                    total +
                    Number(
                        sighting.cat_count || 0
                    )
                );

            },
            0
        );


    console.log(
        "TOTAL CATS:",
        totalCats
    );


    updateStatistics(
        sightings,
        totalCats
    );


    updateCounter(
        totalCats
    );


    /*
     * Create markers.
     *
     * IMPORTANT:
     *
     * Marker creation does NOT
     * wait for photo loading.
     */

    sightings.forEach(
        sighting => {

            addCatMarker(
                sighting
            );

        }
    );


    console.log(
        "ALL CAT MARKERS REQUESTED."
    );
}


/* =========================================================
   STATISTICS
   ========================================================= */

function updateStatistics(
    sightings,
    totalCats
) {

    const totalSightings =
        sightings.length;


    const countries =
        new Set(
            sightings
                .map(
                    sighting =>
                        sighting.country
                )
                .filter(Boolean)
        );


    const today =
        new Date()
            .toISOString()
            .split("T")[0];


    const catsToday =
        sightings.reduce(
            (
                total,
                sighting
            ) => {

                if (
                    !sighting.created_at
                ) {
                    return total;
                }


                const date =
                    new Date(
                        sighting.created_at
                    )
                        .toISOString()
                        .split("T")[0];


                if (
                    date === today
                ) {

                    return (
                        total +
                        Number(
                            sighting.cat_count || 0
                        )
                    );
                }


                return total;

            },
            0
        );


    const progress =
        (
            totalCats /
            TOTAL_TARGET
        ) * 100;


    const setText =
        (
            id,
            value
        ) => {

            const element =
                document.getElementById(
                    id
                );

            if (
                element
            ) {

                element.textContent =
                    value;
            }
        };


    setText(
        "statCats",
        totalCats.toLocaleString()
    );


    setText(
        "statSightings",
        totalSightings.toLocaleString()
    );


    setText(
        "statCountries",
        countries.size.toLocaleString()
    );


    setText(
        "statToday",
        catsToday.toLocaleString()
    );


    setText(
        "statProgress",
        formatProgress(
            progress
        )
    );
}


/* =========================================================
   COUNTER
   ========================================================= */

function updateCounter(
    totalCats
) {

    const element =
        document.getElementById(
            "trackerCount"
        );


    if (
        element
    ) {

        element.textContent =
            `${totalCats.toLocaleString()} CATS LOGGED`;
    }
}


/* =========================================================
   PHOTO URL
   ========================================================= */

/*
 * The bucket "cat-sightings" is PUBLIC.
 *
 * Therefore:
 *
 *     getPublicUrl()
 *
 * is used instead of:
 *
 *     createSignedUrl()
 */

async function getCatPhotoURL(photoPath) {

    if (!photoPath) {
        return null;
    }

    console.log(
        "CAT PHOTO PATH:",
        photoPath
    );

    try {

        // Already a complete URL
        if (
            photoPath.startsWith("http://") ||
            photoPath.startsWith("https://")
        ) {

            return photoPath;
        }

        /*
         * cat-sightings is a PUBLIC bucket.
         *
         * Therefore we do NOT need a signed URL.
         * Supabase can give us the permanent public URL.
         */

        const {
            data
        } =
            supabaseClient
                .storage
                .from("cat-sightings")
                .getPublicUrl(photoPath);

        const publicURL =
            data?.publicUrl || null;

        console.log(
            "CAT PHOTO PUBLIC URL:",
            publicURL
        );

        return publicURL;

    } catch (error) {

        console.error(
            "CAT PHOTO URL ERROR:",
            error
        );

        return null;
    }
}
/* =========================================================
   CAT CARD
   ========================================================= */

function createCatCardHTML(
    sighting,
    photoURL
) {

    const count =
        Number(
            sighting.cat_count || 0
        );


    const city =
        sighting.city ||
        "UNKNOWN CITY";


    const country =
        sighting.country ||
        "UNKNOWN COUNTRY";


    const date =
        formatDate(
            sighting.created_at
        );


    let photoHTML;


    if (
        photoURL
    ) {

        photoHTML = `

            <div class="cat-card-photo">

                <img
                    src="${escapeHTML(photoURL)}"
                    alt="Cat sighting in ${escapeHTML(city)}"
                    loading="lazy"
                    onerror="
                        this.parentElement.innerHTML =
                        '<div class=&quot;cat-card-paw&quot;>🐾</div><span>PHOTO UNAVAILABLE</span>';
                    "
                >

            </div>

        `;

    } else {

        photoHTML = `

            <div class="cat-card-photo cat-card-no-photo">

                <div class="cat-card-paw">
                    🐾
                </div>

                <span>
                    NO PHOTO
                </span>

            </div>

        `;
    }


    return `

        <div class="cat-card">

            <button
                class="cat-card-close"
                type="button"
                aria-label="Close"
            >
                ×
            </button>


            ${photoHTML}


            <div class="cat-card-content">

                <div class="cat-card-label">
                    🐾 CAT SIGHTING
                </div>


                <div class="cat-card-title">

                    ${count}
                    ${count === 1 ? "CAT" : "CATS"}
                    RECORDED

                </div>


                <div class="cat-card-info">

                    <div class="cat-card-row">

                        <span class="cat-card-icon">
                            📍
                        </span>

                        <span>
                            ${escapeHTML(city)},
                            ${escapeHTML(country)}
                        </span>

                    </div>


                    <div class="cat-card-row">

                        <span class="cat-card-icon">
                            📅
                        </span>

                        <span>
                            ${escapeHTML(date)}
                        </span>

                    </div>

                </div>


                <div class="cat-card-footer">
                    EVERY CAT COUNTS
                </div>

            </div>

        </div>

    `;
}


/* =========================================================
   MARKER
   ========================================================= */

function addCatMarker(
    sighting
) {

    /*
     * Read public coordinates.
     */

    const latitude =
        Number(
            sighting.public_latitude
        );


    const longitude =
        Number(
            sighting.public_longitude
        );


    console.log(
        "ADDING MARKER:",
        {
            id:
                sighting.id,

            latitude:
                latitude,

            longitude:
                longitude,

            city:
                sighting.city,

            country:
                sighting.country
        }
    );


    /*
     * Validate coordinates.
     */

    if (
        !Number.isFinite(
            latitude
        ) ||
        !Number.isFinite(
            longitude
        )
    ) {

        console.error(
            "INVALID PUBLIC COORDINATES:",
            sighting
        );

        return;
    }


    /*
     * Privacy offset.
     */

    const offset =
        getPrivacyOffset(
            sighting.id
        );


    const markerLatitude =
        latitude +
        offset.latitude;


    const markerLongitude =
        longitude +
        offset.longitude;


    /*
     * Create marker.
     *
     * The marker ALWAYS gets
     * created before photo processing.
     */

    let marker;


    try {

        marker =
            L.marker(
                [
                    markerLatitude,
                    markerLongitude
                ],
                {
                    icon:
                        pawIcon
                }
            );


        marker.addTo(
            markerLayer
        );

    } catch (
        error
    ) {

        console.error(
            "CUSTOM PAW FAILED. USING FALLBACK:",
            error
        );


        marker =
            L.marker(
                [
                    markerLatitude,
                    markerLongitude
                ],
                {
                    icon:
                        fallbackPawIcon
                }
            )
            .addTo(
                markerLayer
            );
    }


    console.log(
        "MARKER ADDED:",
        sighting.id,
        marker.getLatLng()
    );


    /*
     * Initial popup.
     */

    marker.bindPopup(
        createCatCardHTML(
            sighting,
            null
        ),
        {
            className:
                "cat-card-popup",

            maxWidth:
                320,

            minWidth:
                280,

            closeButton:
                false,

            autoPan:
                true,

            autoPanPadding:
                [
                    20,
                    20
                ]
        }
    );


    /*
     * Custom close button.
     */

    marker.on(
        "popupopen",
        event => {

            const popupElement =
                event.popup.getElement();


            if (
                !popupElement
            ) {
                return;
            }


            const closeButton =
                popupElement.querySelector(
                    ".cat-card-close"
                );


            if (
                closeButton
            ) {

                closeButton.addEventListener(
                    "click",
                    () => {

                        marker.closePopup();

                    }
                );
            }
        }
    );


    /*
     * Photo loading.
     *
     * This does NOT affect
     * marker creation.
     */

    const photoURL =
        getCatPhotoURL(
            sighting.photo_url
        );


    const updatedCardHTML =
        createCatCardHTML(
            sighting,
            photoURL
        );


    marker.setPopupContent(
        updatedCardHTML
    );


    console.log(
        "CAT CARD READY:",
        sighting.id
    );
}


/* =========================================================
   MENU
   ========================================================= */

const catMenuButton =
    document.getElementById(
        "catMenuButton"
    );


const navigationPanel =
    document.getElementById(
        "navigationPanel"
    );


if (
    catMenuButton &&
    navigationPanel
) {

    catMenuButton.addEventListener(
        "click",
        event => {

            event.stopPropagation();

            navigationPanel.classList.toggle(
                "open"
            );
        }
    );
}


map.on(
    "click",
    () => {

        if (
            navigationPanel
        ) {

            navigationPanel.classList.remove(
                "open"
            );
        }
    }
);


/* =========================================================
   MAP CONTROL
   ========================================================= */

const mapControlButton =
    document.getElementById(
        "mapControlButton"
    );


if (
    mapControlButton
) {

    mapControlButton.addEventListener(
        "click",
        () => {

            map.setView(
                [
                    25,
                    10
                ],
                2,
                {
                    animate:
                        true
                }
            );
        }
    );
}


/* =========================================================
   NAVIGATION
   ========================================================= */

const navigationItems =
    document.querySelectorAll(
        ".navigation-item"
    );


navigationItems.forEach(
    item => {

        item.addEventListener(
            "click",
            () => {

                navigationItems.forEach(
                    button => {

                        button.classList.remove(
                            "active"
                        );
                    }
                );


                item.classList.add(
                    "active"
                );
            }
        );
    }
);


/* =========================================================
   SOUND
   ========================================================= */

const soundButton =
    document.getElementById(
        "soundButton"
    );


let soundEnabled =
    true;


if (
    soundButton
) {

    soundButton.addEventListener(
        "click",
        () => {

            soundEnabled =
                !soundEnabled;


            soundButton.textContent =
                soundEnabled
                    ? "◀"
                    : "■";
        }
    );
}


/* =========================================================
   CAT ANIMATIONS
   ========================================================= */

const logoFrames = [

    "assets/cats/logo-face-1.png",

    "assets/cats/logo-face-2.png",

    "assets/cats/logo-face-3.png"

];


const mascotFrames = [

    "assets/cats/mascot-full-1.png",

    "assets/cats/mascot-full-2.png",

    "assets/cats/mascot-full-3.png"

];


const menuCat =
    document.getElementById(
        "menuCat"
    );


const logoCat =
    document.getElementById(
        "logoCat"
    );


const mascotCat =
    document.getElementById(
        "mascotCat"
    );


let logoFrame =
    0;


let mascotFrame =
    0;


function animateLogoCat() {

    logoFrame =
        (
            logoFrame + 1
        ) %
        logoFrames.length;


    if (
        menuCat
    ) {

        menuCat.src =
            logoFrames[
                logoFrame
            ];
    }


    if (
        logoCat
    ) {

        logoCat.src =
            logoFrames[
                logoFrame
            ];
    }
}


function animateMascot() {

    mascotFrame =
        (
            mascotFrame + 1
        ) %
        mascotFrames.length;


    if (
        mascotCat
    ) {

        mascotCat.src =
            mascotFrames[
                mascotFrame
            ];
    }
}


setInterval(
    animateLogoCat,
    700
);


setInterval(
    animateMascot,
    350
);


/*
 * Preload animation frames.
 */

[
    ...logoFrames,
    ...mascotFrames
].forEach(
    src => {

        const image =
            new Image();

        image.src =
            src;
    }
);


/* =========================================================
   REPORT CAT ELEMENTS
   ========================================================= */

const reportCatButton =
    document.getElementById(
        "reportCatButton"
    );


const reportCatModal =
    document.getElementById(
        "reportCatModal"
    );


const closeReportModal =
    document.getElementById(
        "closeReportModal"
    );


const cancelReport =
    document.getElementById(
        "cancelReport"
    );


const reportCatForm =
    document.getElementById(
        "reportCatForm"
    );


const catCountInput =
    document.getElementById(
        "catCount"
    );


const reportCityInput =
    document.getElementById(
        "reportCity"
    );


const reportCountryInput =
    document.getElementById(
        "reportCountry"
    );


const catPhotoInput =
    document.getElementById(
        "catPhoto"
    );


const photoMessage =
    document.getElementById(
        "photoMessage"
    );


const reportLocationMessage =
    document.getElementById(
        "reportLocationMessage"
    );


const reportMessage =
    document.getElementById(
        "reportMessage"
    );


/* =========================================================
   MODAL
   ========================================================= */

function openReportModal() {

    if (
        !reportCatModal
    ) {

        console.error(
            "reportCatModal not found."
        );

        return;
    }


    reportCatModal.classList.remove(
        "hidden"
    );
}


function closeReportModalFunction() {

    if (
        !reportCatModal
    ) {
        return;
    }


    reportCatModal.classList.add(
        "hidden"
    );
}


if (
    reportCatButton
) {

    reportCatButton.addEventListener(
        "click",
        event => {

            event.preventDefault();

            event.stopPropagation();

            openReportModal();
        }
    );
}


if (
    closeReportModal
) {

    closeReportModal.addEventListener(
        "click",
        closeReportModalFunction
    );
}


if (
    cancelReport
) {

    cancelReport.addEventListener(
        "click",
        closeReportModalFunction
    );
}


if (
    reportCatModal
) {

    reportCatModal.addEventListener(
        "click",
        event => {

            if (
                event.target ===
                reportCatModal
            ) {

                closeReportModalFunction();
            }
        }
    );
}


/* =========================================================
   PHOTO VALIDATION
   ========================================================= */

if (
    catPhotoInput
) {

    catPhotoInput.addEventListener(
        "change",
        () => {

            if (
                photoMessage
            ) {

                photoMessage.textContent =
                    "";
            }


            const file =
                catPhotoInput.files?.[0];


            if (
                !file
            ) {
                return;
            }


            const allowedTypes = [

                "image/jpeg",

                "image/png",

                "image/webp"

            ];


            if (
                !allowedTypes.includes(
                    file.type
                )
            ) {

                catPhotoInput.value =
                    "";


                if (
                    photoMessage
                ) {

                    photoMessage.textContent =
                        "PLEASE USE JPG, PNG OR WEBP.";
                }


                return;
            }


            if (
                file.size >
                1 * 1024 * 1024
            ) {

                catPhotoInput.value =
                    "";


                if (
                    photoMessage
                ) {

                    photoMessage.textContent =
                        "PHOTO MUST BE 1 MB OR SMALLER.";
                }


                return;
            }


            if (
                photoMessage
            ) {

                photoMessage.textContent =
                    "PHOTO READY.";
            }
        }
    );
}


/* =========================================================
   ANONYMOUS AUTH
   ========================================================= */

async function getAuthenticatedUser() {

    const {
        data:
            sessionData
    } =
        await supabaseClient
            .auth
            .getSession();


    if (
        sessionData?.session?.user
    ) {

        return (
            sessionData.session.user
        );
    }


    const {
        data,
        error
    } =
        await supabaseClient
            .auth
            .signInAnonymously();


    if (
        error
    ) {

        console.error(
            "Anonymous auth error:",
            error
        );


        throw new Error(
            "COULD NOT CREATE A USER SESSION."
        );
    }


    if (
        !data?.user
    ) {

        throw new Error(
            "NO USER SESSION WAS CREATED."
        );
    }


    return data.user;
}


/* =========================================================
   GEOCODE CITY
   ========================================================= */

async function geocodeCity(
    city,
    country
) {

    if (
        !city ||
        !country
    ) {

        throw new Error(
            "CITY AND COUNTRY ARE REQUIRED."
        );
    }


    const params =
        new URLSearchParams({

            q:
                `${city}, ${country}`,

            format:
                "json",

            limit:
                "1",

            addressdetails:
                "1"

        });


    const response =
        await fetch(
            `https://nominatim.openstreetmap.org/search?${params.toString()}`,
            {
                headers: {
                    Accept:
                        "application/json"
                }
            }
        );


    if (
        !response.ok
    ) {

        throw new Error(
            "COULD NOT FIND THE CITY LOCATION."
        );
    }


    const results =
        await response.json();


    if (
        !Array.isArray(
            results
        ) ||
        results.length === 0
    ) {

        throw new Error(
            "CITY NOT FOUND. PLEASE CHECK CITY AND COUNTRY."
        );
    }


    const latitude =
        Number(
            results[0].lat
        );


    const longitude =
        Number(
            results[0].lon
        );


    if (
        !Number.isFinite(
            latitude
        ) ||
        !Number.isFinite(
            longitude
        )
    ) {

        throw new Error(
            "INVALID CITY COORDINATES."
        );
    }


    return {

        latitude:
            latitude,

        longitude:
            longitude
    };
}


/* =========================================================
   PHOTO UPLOAD
   ========================================================= */

async function uploadCatPhoto(
    file,
    userId
) {

    if (
        !file
    ) {

        return null;
    }


    const extensionMap = {

        "image/jpeg":
            "jpg",

        "image/png":
            "png",

        "image/webp":
            "webp"

    };


    const extension =
        extensionMap[
            file.type
        ];


    if (
        !extension
    ) {

        throw new Error(
            "INVALID PHOTO TYPE."
        );
    }


    /*
     * Each anonymous user
     * gets their own folder.
     */

    const filePath =
        `${userId}/${crypto.randomUUID()}.${extension}`;


    console.log(
        "UPLOADING PHOTO:",
        filePath
    );


    const {
        error
    } =
        await supabaseClient
            .storage
            .from(
                "cat-sightings"
            )
            .upload(
                filePath,
                file,
                {

                    cacheControl:
                        "3600",

                    upsert:
                        false,

                    contentType:
                        file.type
                }
            );


    if (
        error
    ) {

        console.error(
            "PHOTO UPLOAD ERROR:",
            error
        );


        throw new Error(
            `PHOTO UPLOAD FAILED: ${error.message}`
        );
    }


    console.log(
        "PHOTO UPLOAD SUCCESS:",
        filePath
    );


    return filePath;
}


/* =========================================================
   SUBMIT CAT SIGHTING
   ========================================================= */

async function submitCatSighting() {

    const catCount =
        Number(
            catCountInput?.value
        );


    const city =
        reportCityInput
            ?.value
            .trim() ||
        "";


    const country =
        reportCountryInput
            ?.value
            .trim() ||
        "";


    const photoFile =
        catPhotoInput
            ?.files?.[0] ||
        null;


    if (
        !Number.isInteger(
            catCount
        ) ||
        catCount < 1 ||
        catCount > 50
    ) {

        throw new Error(
            "CAT COUNT MUST BE BETWEEN 1 AND 50."
        );
    }


    if (
        !city ||
        !country
    ) {

        throw new Error(
            "CITY AND COUNTRY ARE REQUIRED."
        );
    }


    if (
        photoFile &&
        photoFile.size >
        1 * 1024 * 1024
    ) {

        throw new Error(
            "PHOTO MUST BE 1 MB OR SMALLER."
        );
    }


    /*
     * Anonymous user.
     */

    const user =
        await getAuthenticatedUser();


    /*
     * City → coordinates.
     */

    if (
        reportLocationMessage
    ) {

        reportLocationMessage.textContent =
            "FINDING CITY LOCATION...";
    }


    const cityLocation =
        await geocodeCity(
            city,
            country
        );


    if (
        reportLocationMessage
    ) {

        reportLocationMessage.textContent =
            "CITY LOCATION FOUND.";
    }


    /*
     * Optional photo.
     */

    let photoPath =
        null;


    if (
        photoFile
    ) {

        if (
            photoMessage
        ) {

            photoMessage.textContent =
                "UPLOADING PHOTO...";
        }


        photoPath =
            await uploadCatPhoto(
                photoFile,
                user.id
            );


        if (
            photoMessage
        ) {

            photoMessage.textContent =
                "PHOTO UPLOADED.";
        }
    }


    /*
     * Database insert.
     */

    const {
        error
    } =
        await supabaseClient
            .from(
                "cat_sightings"
            )
            .insert({

                submitted_by:
                    user.id,

                cat_count:
                    catCount,

                latitude:
                    cityLocation.latitude,

                longitude:
                    cityLocation.longitude,

                public_latitude:
                    cityLocation.latitude,

                public_longitude:
                    cityLocation.longitude,

                city:
                    city,

                country:
                    country,

                photo_url:
                    photoPath,

                status:
                    "pending"

            });


    if (
        error
    ) {

        console.error(
            "CAT SIGHTING INSERT ERROR:",
            error
        );


        throw new Error(
            `SUBMISSION FAILED: ${error.message}`
        );
    }


    console.log(
        "CAT SIGHTING SUBMITTED SUCCESSFULLY."
    );
}


/* =========================================================
   REPORT FORM
   ========================================================= */

if (
    reportCatForm
) {

    reportCatForm.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            if (
                reportMessage
            ) {

                reportMessage.textContent =
                    "SUBMITTING...";
            }


            const submitButton =
                reportCatForm.querySelector(
                    'button[type="submit"]'
                );


            if (
                submitButton
            ) {

                submitButton.disabled =
                    true;

                submitButton.textContent =
                    "SUBMITTING...";
            }


            try {

                await submitCatSighting();


                if (
                    reportMessage
                ) {

                    reportMessage.textContent =
                        "CAT SIGHTING SUBMITTED FOR REVIEW.";
                }


                reportCatForm.reset();


                if (
                    catCountInput
                ) {

                    catCountInput.value =
                        "1";
                }


                if (
                    photoMessage
                ) {

                    photoMessage.textContent =
                        "";
                }


                if (
                    reportLocationMessage
                ) {

                    reportLocationMessage.textContent =
                        "LOCATION WILL BE DETERMINED FROM CITY AND COUNTRY";
                }


                setTimeout(
                    () => {

                        closeReportModalFunction();


                        if (
                            reportMessage
                        ) {

                            reportMessage.textContent =
                                "";
                        }

                    },
                    1400
                );

            } catch (
                error
            ) {

                console.error(
                    "REPORT CAT ERROR:",
                    error
                );


                if (
                    reportMessage
                ) {

                    reportMessage.textContent =
                        error?.message ||
                        "SUBMISSION FAILED.";
                }

            } finally {

                if (
                    submitButton
                ) {

                    submitButton.disabled =
                        false;

                    submitButton.textContent =
                        "SUBMIT";
                }
            }
        }
    );
}


/* =========================================================
   START
   ========================================================= */

console.log(
    "================================"
);

console.log(
    "ONE MILLION CAT PROJECT"
);

console.log(
    `Target: ${TOTAL_TARGET.toLocaleString()} cats`
);

console.log(
    "Data source: Supabase"
);

console.log(
    "Public source: public_cat_sightings"
);

console.log(
    "Public storage: ENABLED"
);

console.log(
    "Marker fallback: ENABLED"
);

console.log(
    "================================"
);


/*
 * Start tracker.
 */

loadCatSightings();
