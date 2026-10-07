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

const map = L.map(
    "map",
    {
        zoomControl: false,
        minZoom: 2,
        maxZoom: 18,
        worldCopyJump: true
    }
).setView(
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


setTimeout(
    () => {
        map.invalidateSize(true);
    },
    300
);


/* =========================================================
   MARKER ICONS
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
   GLOBAL DATA
   ========================================================= */

let allSightings = [];


/* =========================================================
   DOM — FILTERS
   ========================================================= */

const filterToggle =
    document.getElementById(
        "filterToggle"
    );

const filterPanel =
    document.getElementById(
        "filterPanel"
    );

const closeFilters =
    document.getElementById(
        "closeFilters"
    );

const countryFilter =
    document.getElementById(
        "countryFilter"
    );

const cityFilter =
    document.getElementById(
        "cityFilter"
    );

const dateFilter =
    document.getElementById(
        "dateFilter"
    );

const clearFilters =
    document.getElementById(
        "clearFilters"
    );


const trackerFrame =
    document.querySelector(
        ".tracker-frame"
    );


/* =========================================================
   DOM — NAVIGATION
   ========================================================= */

const catMenuButton =
    document.getElementById(
        "catMenuButton"
    );

const navigationPanel =
    document.getElementById(
        "navigationPanel"
    );


/* =========================================================
   DOM — MAP CONTROL
   ========================================================= */

const mapControlButton =
    document.getElementById(
        "mapControlButton"
    );


/* =========================================================
   DOM — SOUND
   ========================================================= */

const soundButton =
    document.getElementById(
        "soundButton"
    );


/* =========================================================
   DOM — REPORT CAT
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


function normalizeFilterText(value) {

    return String(
        value ?? ""
    )
        .trim()
        .toLowerCase();
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
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );
}


/* =========================================================
   PROGRESS
   ========================================================= */

function formatProgress(progress) {

    if (progress === 0) {
        return "0.000%";
    }

    if (progress < 0.001) {
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
                (hash % 3001) -
                1500
            ) / 100000,

        longitude:
            (
                ((hash >>> 11) % 3001) -
                1500
            ) / 100000
    };
}


/* =========================================================
   MARKER COLLISION LAYOUT
   ========================================================= */

const markerPositions =
    new Map();

const MARKER_COLLISION_RADIUS =
    0.00065;

const MARKER_SPACING =
    0.00090;

function distanceSquared(a, b) {

    const latitudeDifference =
        a.latitude - b.latitude;

    const longitudeDifference =
        a.longitude - b.longitude;

    return (
        latitudeDifference * latitudeDifference +
        longitudeDifference * longitudeDifference
    );
}

function getMarkerPosition(
    sighting,
    occupiedPositions
) {

    const baseOffset =
        getPrivacyOffset(
            sighting.id
        );

    const basePosition = {

        latitude:
            Number(sighting.public_latitude) +
            baseOffset.latitude,

        longitude:
            Number(sighting.public_longitude) +
            baseOffset.longitude
    };

    if (!occupiedPositions.length) {
        return basePosition;
    }

    const collisionRadiusSquared =
        MARKER_COLLISION_RADIUS *
        MARKER_COLLISION_RADIUS;

    const isFree = position =>
        occupiedPositions.every(
            occupied =>
                distanceSquared(
                    position,
                    occupied
                ) > collisionRadiusSquared
        );

    if (isFree(basePosition)) {
        return basePosition;
    }

    /*
     * Existing sightings can share exactly the same
     * public coordinates. Spread colliding markers in
     * deterministic rings so their positions stay stable
     * between page loads.
     */
    for (let ring = 1; ring <= 12; ring++) {

        const pointsInRing =
            ring * 8;

        for (
            let point = 0;
            point < pointsInRing;
            point++
        ) {

            const angle =
                (
                    2 * Math.PI * point
                ) / pointsInRing;

            const radius =
                ring * MARKER_SPACING;

            const candidate = {

                latitude:
                    basePosition.latitude +
                    Math.sin(angle) * radius,

                longitude:
                    basePosition.longitude +
                    Math.cos(angle) * radius
            };

            if (isFree(candidate)) {
                return candidate;
            }
        }
    }

    return basePosition;
}

function prepareMarkerPositions(sightings) {

    markerPositions.clear();

    const occupiedPositions = [];

    sightings.forEach(
        sighting => {

            const position =
                getMarkerPosition(
                    sighting,
                    occupiedPositions
                );

            markerPositions.set(
                sighting.id,
                position
            );

            occupiedPositions.push(
                position
            );
        }
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


    function setText(
        id,
        value
    ) {

        const element =
            document.getElementById(
                id
            );

        if (element) {
            element.textContent =
                value;
        }
    }


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
        formatProgress(progress)
    );
}


/* =========================================================
   COUNTER ANIMATION
   ========================================================= */

let displayedCounterValue = 0;
let counterAnimationFrame = null;


function animateCounter(targetValue) {

    targetValue =
        Number(targetValue) || 0;


    if (counterAnimationFrame) {

        cancelAnimationFrame(
            counterAnimationFrame
        );

        counterAnimationFrame =
            null;
    }


    const startValue =
        displayedCounterValue;


    if (
        startValue ===
        targetValue
    ) {
        return;
    }


    /*
     * Short stepped animation instead
     * of counting through every number.
     */

    const values = [

        startValue,

        Math.round(
            startValue +
            (
                targetValue -
                startValue
            ) * 0.60
        ),

        Math.round(
            startValue +
            (
                targetValue -
                startValue
            ) * 0.80
        ),

        targetValue
    ];


    const uniqueValues = [
        ...new Set(values)
    ];


    let step = 0;


    const element =
        document.getElementById(
            "trackerCount"
        );


    function showNextValue() {

        if (!element) {

            counterAnimationFrame =
                null;

            return;
        }


        const value =
            uniqueValues[step];


        displayedCounterValue =
            value;


        element.textContent =
            `${value.toLocaleString()} CATS LOGGED`;


        step++;


        if (
            step <
            uniqueValues.length
        ) {

            counterAnimationFrame =
                setTimeout(
                    showNextValue,
                    120
                );

        } else {

            displayedCounterValue =
                targetValue;

            counterAnimationFrame =
                null;
        }
    }


    showNextValue();
}


function updateCounter(
    totalCats
) {

    animateCounter(
        totalCats
    );
}


/* =========================================================
   PHOTO URL
   ========================================================= */

function getCatPhotoURL(
    photoPath
) {

    if (!photoPath) {
        return null;
    }


    if (
        photoPath.startsWith(
            "http://"
        ) ||
        photoPath.startsWith(
            "https://"
        )
    ) {

        return photoPath;
    }


    try {

        const {
            data
        } =
            supabaseClient
                .storage
                .from(
                    "cat-sightings"
                )
                .getPublicUrl(
                    photoPath
                );


        return (
            data?.publicUrl ||
            null
        );

    } catch (error) {

        console.error(
            "CAT PHOTO URL ERROR:",
            error
        );

        return null;
    }
}


/* =========================================================
   CAT POPUP CARD
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


    if (photoURL) {

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
   ADD MARKER
   ========================================================= */

function addCatMarker(
    sighting
) {

    const latitude =
        Number(
            sighting.public_latitude
        );

    const longitude =
        Number(
            sighting.public_longitude
        );


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


    const preparedPosition =
        markerPositions.get(
            sighting.id
        );

    const markerLatitude =
        preparedPosition?.latitude ??
        (latitude + getPrivacyOffset(sighting.id).latitude);

    const markerLongitude =
        preparedPosition?.longitude ??
        (longitude + getPrivacyOffset(sighting.id).longitude);


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
            )
            .addTo(
                markerLayer
            );

    } catch (error) {

        console.error(
            "CUSTOM PAW FAILED:",
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


    const photoURL =
        getCatPhotoURL(
            sighting.photo_url
        );


    marker.bindPopup(
        createCatCardHTML(
            sighting,
            photoURL
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


    marker.on(
        "popupopen",
        event => {

            const popupElement =
                event.popup.getElement();


            if (!popupElement) {
                return;
            }


            const closeButton =
                popupElement.querySelector(
                    ".cat-card-close"
                );


            if (closeButton) {

                closeButton.addEventListener(
                    "click",
                    () => {

                        marker.closePopup();

                    }
                );
            }
        }
    );
}


/* =========================================================
   LOAD CAT SIGHTINGS
   ========================================================= */

let loadingSightings = false;


async function loadCatSightings() {

    if (loadingSightings) {
        return;
    }


    loadingSightings = true;


    console.log(
        "================================"
    );

    console.log(
        "LOADING CAT SIGHTINGS"
    );

    console.log(
        "================================"
    );


    try {

        const {
            data,
            error
        } =
            await supabaseClient
                .from(
                    "public_cat_sightings"
                )
                .select("*");


        if (error) {

            console.error(
                "SUPABASE LOAD ERROR:",
                error
            );

            return;
        }


        allSightings =
            Array.isArray(data)
                ? data
                : [];


        console.log(
            "NUMBER OF PUBLIC SIGHTINGS:",
            allSightings.length
        );


        populateCountryFilter();

        populateCityFilter();

        applyFilters();


        console.log(
            "CAT SIGHTINGS READY."
        );

    } catch (error) {

        console.error(
            "LOAD CAT SIGHTINGS ERROR:",
            error
        );

    } finally {

        loadingSightings =
            false;
    }
}


/* =========================================================
   FILTER PANEL
   ========================================================= */

function positionReportButton() {

    if (!trackerFrame || !reportCatButton) {
        return;
    }

    /*
     * The + button NEVER moves when the filter opens.
     * It stays directly below the filter paw and is painted
     * above the filter panel, like the navigation overlay.
     */
    trackerFrame.style.setProperty("--report-button-top", "147px");
    trackerFrame.classList.toggle(
        "filters-open",
        !!filterPanel && filterPanel.classList.contains("open")
    );
}

function openFilters() {

    if (!filterPanel) {
        return;
    }


    /*
     * Only one large overlay menu should be open
     * at a time. This prevents navigation from
     * covering the filter controls.
     */

    if (navigationPanel) {

        navigationPanel.classList.remove(
            "open"
        );

    }

    if (trackerFrame) {

        trackerFrame.classList.remove(
            "navigation-open"
        );

    }


    filterPanel.classList.add("open");

    if (filterToggle) {

        filterToggle.setAttribute(
            "aria-expanded",
            "true"
        );

    }


    positionReportButton();
}


function closeFiltersPanel() {

    if (!filterPanel) {
        return;
    }

    filterPanel.classList.remove("open");

    if (filterToggle) {

        filterToggle.setAttribute(
            "aria-expanded",
            "false"
        );

    }

    positionReportButton();
}


if (filterToggle) {

    filterToggle.addEventListener(
        "click",
        function (event) {

            event.preventDefault();
            event.stopPropagation();

            if (
                filterPanel &&
                filterPanel.classList.contains("open")
            ) {
                closeFiltersPanel();
            } else {
                openFilters();
            }

        }
    );
}


if (closeFilters) {

    closeFilters.addEventListener(
        "click",
        function (event) {

            event.preventDefault();
            event.stopPropagation();

            closeFiltersPanel();

        }
    );
}
/* =========================================================
   COUNTRY FILTER
   ========================================================= */

function populateCountryFilter() {

    if (!countryFilter) {
        return;
    }


    const currentValue =
        countryFilter.value;


    countryFilter.innerHTML =
        "";


    const allOption =
        document.createElement(
            "option"
        );


    allOption.value =
        "";

    allOption.textContent =
        "ALL COUNTRIES";


    countryFilter.appendChild(
        allOption
    );


    const countries =
        [
            ...new Set(
                allSightings
                    .map(
                        sighting =>
                            sighting.country
                    )
                    .filter(Boolean)
            )
        ]
        .sort(
            (a, b) =>
                String(a).localeCompare(
                    String(b)
                )
        );


    countries.forEach(
        country => {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                country;

            option.textContent =
                country;


            countryFilter.appendChild(
                option
            );
        }
    );


    if (
        countries.some(
            country =>
                normalizeFilterText(
                    country
                ) ===
                normalizeFilterText(
                    currentValue
                )
        )
    ) {

        countryFilter.value =
            currentValue;

    } else {

        countryFilter.value =
            "";
    }
}


/* =========================================================
   CITY FILTER
   ========================================================= */

function populateCityFilter() {

    if (!cityFilter) {
        return;
    }


    const selectedCountry =
        countryFilter
            ? countryFilter.value
            : "";


    const currentValue =
        cityFilter.value;


    cityFilter.innerHTML =
        "";


    const allOption =
        document.createElement(
            "option"
        );


    allOption.value =
        "";

    allOption.textContent =
        "ALL CITIES";


    cityFilter.appendChild(
        allOption
    );


    let availableSightings =
        allSightings;


    if (selectedCountry) {

        availableSightings =
            availableSightings.filter(
                sighting =>
                    normalizeFilterText(
                        sighting.country
                    ) ===
                    normalizeFilterText(
                        selectedCountry
                    )
            );
    }


    const cities =
        [
            ...new Set(
                availableSightings
                    .map(
                        sighting =>
                            sighting.city
                    )
                    .filter(Boolean)
            )
        ]
        .sort(
            (a, b) =>
                String(a).localeCompare(
                    String(b)
                )
        );


    cities.forEach(
        city => {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                city;

            option.textContent =
                city;


            cityFilter.appendChild(
                option
            );
        }
    );


    if (
        cities.some(
            city =>
                normalizeFilterText(
                    city
                ) ===
                normalizeFilterText(
                    currentValue
                )
        )
    ) {

        cityFilter.value =
            currentValue;

    } else {

        cityFilter.value =
            "";
    }
}


/* =========================================================
   DATE FILTER
   ========================================================= */

function matchesSelectedMonth(
    sighting,
    selectedMonth
) {

    if (!selectedMonth) {
        return true;
    }


    if (!sighting.created_at) {
        return false;
    }


    const date =
        new Date(
            sighting.created_at
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return false;
    }


    const year =
        date.getFullYear();


    const month =
        String(
            date.getMonth() + 1
        ).padStart(
            2,
            "0"
        );


    return (
        `${year}-${month}` ===
        selectedMonth
    );
}


/* =========================================================
   GET FILTERED SIGHTINGS
   ========================================================= */

function getFilteredSightings() {

    const selectedCountry =
        countryFilter
            ? countryFilter.value
            : "";


    const selectedCity =
        cityFilter
            ? cityFilter.value
            : "";


    const selectedMonth =
        dateFilter
            ? dateFilter.value
            : "";


    return allSightings.filter(
        sighting => {

            if (
                selectedCountry &&
                normalizeFilterText(
                    sighting.country
                ) !==
                normalizeFilterText(
                    selectedCountry
                )
            ) {

                return false;
            }


            if (
                selectedCity &&
                normalizeFilterText(
                    sighting.city
                ) !==
                normalizeFilterText(
                    selectedCity
                )
            ) {

                return false;
            }


            if (
                !matchesSelectedMonth(
                    sighting,
                    selectedMonth
                )
            ) {

                return false;
            }


            return true;
        }
    );
}


/* =========================================================
   RENDER FILTERED SIGHTINGS
   ========================================================= */

function renderFilteredSightings(
    sightings
) {

    markerLayer.clearLayers();

    prepareMarkerPositions(
        sightings
    );

    sightings.forEach(
        sighting => {

            addCatMarker(
                sighting
            );
        }
    );
}


/* =========================================================
   APPLY FILTERS
   ========================================================= */

function applyFilters() {

    const filteredSightings =
        getFilteredSightings();


    const totalCats =
        filteredSightings.reduce(
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


    renderFilteredSightings(
        filteredSightings
    );


    updateStatistics(
        filteredSightings,
        totalCats
    );


    updateCounter(
        totalCats
    );


    console.log(
        `Showing ${filteredSightings.length} of ${allSightings.length} sightings`
    );
}


/* =========================================================
   FILTER EVENTS
   ========================================================= */

if (countryFilter) {

    countryFilter.addEventListener(
        "change",
        () => {

            populateCityFilter();

            applyFilters();

        }
    );
}


if (cityFilter) {

    cityFilter.addEventListener(
        "change",
        () => {

            applyFilters();

        }
    );
}


if (dateFilter) {

    dateFilter.addEventListener(
        "change",
        () => {

            applyFilters();

        }
    );
}


if (clearFilters) {

    clearFilters.addEventListener(
        "click",
        () => {

            if (countryFilter) {

                countryFilter.value =
                    "";

            }


            if (cityFilter) {

                cityFilter.value =
                    "";

            }


            if (dateFilter) {

                dateFilter.value =
                    "";

            }


            populateCountryFilter();

            populateCityFilter();

            applyFilters();

        }
    );
}


/* =========================================================
   NAVIGATION
   ========================================================= */

if (
    catMenuButton &&
    navigationPanel
) {

    catMenuButton.addEventListener(
        "click",
        event => {

            event.preventDefault();

            event.stopPropagation();


            const willOpen =
                !navigationPanel.classList.contains(
                    "open"
                );


            /*
             * Navigation and Filters are mutually
             * exclusive so neither panel can cover
             * the other's controls.
             */

            if (willOpen) {

                closeFiltersPanel();

                navigationPanel.classList.add(
                    "open"
                );

                if (trackerFrame) {

                    trackerFrame.classList.add(
                        "navigation-open"
                    );

                }

            } else {

                navigationPanel.classList.remove(
                    "open"
                );

                if (trackerFrame) {

                    trackerFrame.classList.remove(
                        "navigation-open"
                    );

                }

            }

        }
    );
}


map.on(
    "click",
    () => {

        if (navigationPanel) {

            navigationPanel.classList.remove(
                "open"
            );

        }

        if (trackerFrame) {

            trackerFrame.classList.remove(
                "navigation-open"
            );

        }

    }
);


/* =========================================================
   MAP CONTROL
   ========================================================= */

if (mapControlButton) {

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
   TICKER CONTROL
   ========================================================= */

const tickerTrack =
    document.querySelector(
        ".ticker-track"
    );

let tickerPaused = false;


function updateTickerButton() {

    if (!soundButton) {
        return;
    }


    soundButton.textContent =
        tickerPaused
            ? "▶"
            : "⏹";


    soundButton.setAttribute(
        "aria-label",
        tickerPaused
            ? "Resume ticker"
            : "Pause ticker"
    );
}


if (
    soundButton &&
    tickerTrack
) {

    soundButton.addEventListener(
        "click",
        () => {

            tickerPaused =
                !tickerPaused;


            tickerTrack.style.animationPlayState =
                tickerPaused
                    ? "paused"
                    : "running";


            updateTickerButton();

        }
    );


    updateTickerButton();
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


    if (menuCat) {

        menuCat.src =
            logoFrames[
                logoFrame
            ];

    }


    if (logoCat) {

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


    if (mascotCat) {

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


/* =========================================================
   PRELOAD CAT FRAMES
   ========================================================= */

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
   REPORT CAT — MODAL
   ========================================================= */

function openReportModal() {

    if (!reportCatModal) {
        return;
    }


    reportCatModal.classList.remove(
        "hidden"
    );
}


function closeReportModalFunction() {

    if (!reportCatModal) {
        return;
    }


    reportCatModal.classList.add(
        "hidden"
    );
}


if (reportCatButton) {

    reportCatButton.addEventListener(
        "click",
        event => {

            event.preventDefault();

            event.stopPropagation();

            openReportModal();

        }
    );
}


if (closeReportModal) {

    closeReportModal.addEventListener(
        "click",
        closeReportModalFunction
    );
}


if (cancelReport) {

    cancelReport.addEventListener(
        "click",
        closeReportModalFunction
    );
}


if (reportCatModal) {

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

if (catPhotoInput) {

    catPhotoInput.addEventListener(
        "change",
        () => {

            if (photoMessage) {

                photoMessage.textContent =
                    "";

            }


            const file =
                catPhotoInput.files?.[0];


            if (!file) {
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


                if (photoMessage) {

                    photoMessage.textContent =
                        "PLEASE USE JPG, PNG OR WEBP.";

                }

                return;
            }


            if (photoMessage) {

                photoMessage.textContent =
                    file.size > 1 * 1024 * 1024
                        ? "LARGE PHOTO — WILL BE COMPRESSED AUTOMATICALLY."
                        : "PHOTO READY.";

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


    if (error) {

        console.error(
            "Anonymous auth error:",
            error
        );


        throw new Error(
            "COULD NOT CREATE A USER SESSION."
        );
    }


    if (!data?.user) {

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


    if (!response.ok) {

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
   PHOTO COMPRESSION
   ========================================================= */

const MAX_PHOTO_SIZE =
    1 * 1024 * 1024;

const MAX_PHOTO_DIMENSION =
    1600;

function loadImageFromFile(file) {

    return new Promise(
        (resolve, reject) => {

            const image =
                new Image();

            const objectURL =
                URL.createObjectURL(file);

            image.onload = () => {

                URL.revokeObjectURL(
                    objectURL
                );

                resolve(image);
            };

            image.onerror = () => {

                URL.revokeObjectURL(
                    objectURL
                );

                reject(
                    new Error(
                        "COULD NOT READ PHOTO."
                    )
                );
            };

            image.src = objectURL;
        }
    );
}

async function compressPhotoIfNeeded(file) {

    if (file.size <= MAX_PHOTO_SIZE) {
        return file;
    }

    if (photoMessage) {
        photoMessage.textContent =
            "COMPRESSING PHOTO.";
    }

    const image =
        await loadImageFromFile(file);

    const scale =
        Math.min(
            1,
            MAX_PHOTO_DIMENSION /
            Math.max(
                image.naturalWidth,
                image.naturalHeight
            )
        );

    const canvas =
        document.createElement("canvas");

    canvas.width =
        Math.max(1, Math.round(image.naturalWidth * scale));

    canvas.height =
        Math.max(1, Math.round(image.naturalHeight * scale));

    const context =
        canvas.getContext("2d");

    if (!context) {
        throw new Error(
            "COULD NOT PREPARE PHOTO FOR UPLOAD."
        );
    }

    context.drawImage(
        image,
        0,
        0,
        canvas.width,
        canvas.height
    );

    let quality = 0.82;
    let blob =
        await new Promise(resolve =>
            canvas.toBlob(
                resolve,
                "image/jpeg",
                quality
            )
        );

    while (
        blob &&
        blob.size > MAX_PHOTO_SIZE &&
        quality > 0.45
    ) {

        quality -= 0.07;

        blob =
            await new Promise(resolve =>
                canvas.toBlob(
                    resolve,
                    "image/jpeg",
                    quality
                )
            );
    }

    if (!blob || blob.size > MAX_PHOTO_SIZE) {
        throw new Error(
            "PHOTO IS TOO LARGE TO COMPRESS. PLEASE CHOOSE A SMALLER PHOTO."
        );
    }

    const compressedFile =
        new File(
            [blob],
            "cat-photo.jpg",
            {
                type: "image/jpeg",
                lastModified: Date.now()
            }
        );

    if (photoMessage) {
        photoMessage.textContent =
            `PHOTO COMPRESSED TO ${Math.round(compressedFile.size / 1024)} KB.`;
    }

    return compressedFile;
}


/* =========================================================
   PHOTO UPLOAD
   ========================================================= */

async function uploadCatPhoto(
    file,
    userId
) {

    if (!file) {
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


    if (!extension) {

        throw new Error(
            "INVALID PHOTO TYPE."
        );
    }


    const filePath =
        `${userId}/${crypto.randomUUID()}.${extension}`;


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


    if (error) {

        console.error(
            "PHOTO UPLOAD ERROR:",
            error
        );


        throw new Error(
            `PHOTO UPLOAD FAILED: ${error.message}`
        );
    }


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


    const user =
        await getAuthenticatedUser();


    if (reportLocationMessage) {

        reportLocationMessage.textContent =
            "FINDING CITY LOCATION.";

    }


    const cityLocation =
        await geocodeCity(
            city,
            country
        );


    if (reportLocationMessage) {

        reportLocationMessage.textContent =
            "CITY LOCATION FOUND.";

    }


    let photoPath =
        null;


    if (photoFile) {

        const uploadFile =
            await compressPhotoIfNeeded(
                photoFile
            );

        if (photoMessage) {

            photoMessage.textContent =
                "UPLOADING PHOTO.";

        }


        photoPath =
            await uploadCatPhoto(
                uploadFile,
                user.id
            );


        if (photoMessage) {

            photoMessage.textContent =
                "PHOTO UPLOADED.";

        }
    }


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


    if (error) {

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

if (reportCatForm) {

    reportCatForm.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            if (reportMessage) {

                reportMessage.textContent =
                    "SUBMITTING.";

            }


            const submitButton =
                reportCatForm.querySelector(
                    'button[type="submit"]'
                );


            if (submitButton) {

                submitButton.disabled =
                    true;

                submitButton.textContent =
                    "SUBMITTING.";

            }


            try {

                await submitCatSighting();


                if (reportMessage) {

                    reportMessage.textContent =
                        "CAT SIGHTING SUBMITTED FOR REVIEW.";

                }


                reportCatForm.reset();


                if (catCountInput) {

                    catCountInput.value =
                        "1";

                }


                if (photoMessage) {

                    photoMessage.textContent =
                        "";

                }


                if (reportLocationMessage) {

                    reportLocationMessage.textContent =
                        "LOCATION WILL BE DETERMINED FROM CITY AND COUNTRY";

                }


                setTimeout(
                    () => {

                        closeReportModalFunction();


                        if (reportMessage) {

                            reportMessage.textContent =
                                "";

                        }

                    },
                    1400
                );


            } catch (error) {

                console.error(
                    "REPORT CAT ERROR:",
                    error
                );


                if (reportMessage) {

                    reportMessage.textContent =
                        error?.message ||
                        "SUBMISSION FAILED.";

                }


            } finally {

                if (submitButton) {

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
   SUPABASE REALTIME
   ========================================================= */

let realtimeReloadTimer =
    null;


function scheduleRealtimeReload() {

    /*
     * Several database events can arrive
     * almost simultaneously.
     *
     * Wait a little and reload only once.
     */

    if (realtimeReloadTimer) {

        clearTimeout(
            realtimeReloadTimer
        );
    }


    realtimeReloadTimer =
        setTimeout(
            () => {

                realtimeReloadTimer =
                    null;

                loadCatSightings();

            },
            400
        );
}


const realtimeChannel =
    supabaseClient
        .channel(
            "cat-sightings-live"
        )
        .on(
            "postgres_changes",
            {
                event:
                    "INSERT",

                schema:
                    "public",

                table:
                    "cat_sightings"

            },
            payload => {

                console.log(
                    "LIVE CAT INSERT:",
                    payload
                );

                scheduleRealtimeReload();

            }
        )
        .on(
            "postgres_changes",
            {
                event:
                    "UPDATE",

                schema:
                    "public",

                table:
                    "cat_sightings"

            },
            payload => {

                console.log(
                    "LIVE CAT UPDATE:",
                    payload
                );

                /*
                 * A pending sighting can become
                 * approved here.
                 *
                 * Reload public_cat_sightings
                 * so only approved/public data
                 * affects the counter.
                 */

                scheduleRealtimeReload();

            }
        )
        .on(
            "postgres_changes",
            {
                event:
                    "DELETE",

                schema:
                    "public",

                table:
                    "cat_sightings"

            },
            payload => {

                console.log(
                    "LIVE CAT DELETE:",
                    payload
                );

                scheduleRealtimeReload();

            }
        )
        .subscribe(
            status => {

                console.log(
                    "REALTIME STATUS:",
                    status
                );

            }
        );


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
    "Filters: ENABLED"
);

console.log(
    "Live counter: ENABLED"
);

console.log(
    "Supabase Realtime: ENABLED"
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


loadCatSightings();

/* =========================================================
   FIRST-LAUNCH TUTORIAL
   ========================================================= */



/* =========================================================
   HOW IT WORKS — REOPEN TUTORIAL FROM NAVIGATION
   ========================================================= */

const howItWorksNav = document.getElementById("howItWorksNav");

if (howItWorksNav) {
    howItWorksNav.addEventListener("click", event => {
        event.preventDefault();

        if (navigationPanel) {
            navigationPanel.classList.remove("open");
        }

        if (trackerFrame) {
            trackerFrame.classList.remove("navigation-open");
        }

        // The tutorial initializer is defined later in this file.
        if (typeof window.openCatTrackerTutorial === "function") {
            window.openCatTrackerTutorial();
        }
    });
}

(function initFirstLaunchTutorial() {
    const overlay = document.getElementById("tutorialOverlay");
    const spotlight = document.getElementById("tutorialSpotlight");
    const card = document.getElementById("tutorialCard");
    const stepLabel = document.getElementById("tutorialStepLabel");
    const title = document.getElementById("tutorialTitle");
    const text = document.getElementById("tutorialText");
    const nextButton = document.getElementById("tutorialNext");
    const reportMedia = document.getElementById("tutorialReportMedia");
    const reportVideo = document.getElementById("tutorialReportVideo");

    if (!overlay || !spotlight || !card || !nextButton) return;

    const steps = [
        {
            target: ".map-wrapper",
            title: "EXPLORE",
            text: "Explore cat sightings from around the world."
        },
        {
            target: "#filterToggle",
            title: "FILTER SIGHTINGS",
            text: "Use filters to find sightings by country, city, or date."
        },
        {
            target: "#reportCatButton",
            title: "SPOT A CAT?",
            text: "Tap + to report a new cat sighting.",
            reportVideo: false
        },
        {
            target: ".map-wrapper",
            title: "EVERY CAT COUNTS",
            text: "Every sighting brings us closer to one million cats."
        }
    ];

    let currentStep = 0;
    let resizeObserver = null;

    function positionSpotlight() {
        const target = document.querySelector(steps[currentStep].target);
        if (!target) return;

        const rect = target.getBoundingClientRect();
        const pad = currentStep === 0 || currentStep === 3 ? 5 : 7;

        spotlight.style.left = `${Math.max(2, rect.left - pad)}px`;
        spotlight.style.top = `${Math.max(2, rect.top - pad)}px`;
        spotlight.style.width = `${rect.width + pad * 2}px`;
        spotlight.style.height = `${rect.height + pad * 2}px`;
    }

    function updateCardPosition() {
        // Keep the card out of the way of the compact mobile controls.
        // It remains a fixed bottom panel so the actual app stays visible.
        card.style.left = "50%";
        card.style.transform = "translateX(-50%)";
    }

    function showStep(index) {
        currentStep = index;
        const step = steps[index];

        stepLabel.textContent = `0${index + 1} / 04`;
        title.textContent = step.title;
        text.textContent = step.text;
        nextButton.textContent = index === steps.length - 1 ? "START EXPLORING" : "NEXT";

        if (reportMedia) reportMedia.hidden = true;
        if (reportVideo) {
            reportVideo.pause();
            reportVideo.removeAttribute("src");
            reportVideo.load();
        }

        // Optional report animation:
        // Put tutorial-report.mp4 beside index.html, then set reportVideo.src below.
        if (index === 2 && step.reportVideo) {
            reportMedia.hidden = false;
            reportVideo.src = "tutorial-report.mp4";
            reportVideo.play().catch(() => {});
        }

        requestAnimationFrame(() => {
            positionSpotlight();
            updateCardPosition();
        });
    }

    function openTutorial() {
        window.openCatTrackerTutorial = openTutorial;
        overlay.classList.add("open");
        overlay.setAttribute("aria-hidden", "false");
        document.body.classList.add("tutorial-active");
        showStep(0);

        if (typeof ResizeObserver !== "undefined") {
            resizeObserver = new ResizeObserver(positionSpotlight);
            const target = document.querySelector(steps[0].target);
            if (target) resizeObserver.observe(target);
        }

        window.addEventListener("resize", positionSpotlight);
        window.addEventListener("orientationchange", positionSpotlight);
    }

    // Expose the same tutorial for the NAVIGATION > HOW IT WORKS entry.
    window.openCatTrackerTutorial = openTutorial;

    function closeTutorial() {
        overlay.classList.remove("open");
        overlay.setAttribute("aria-hidden", "true");
        document.body.classList.remove("tutorial-active");
        localStorage.setItem("catTrackerTutorialCompleted", "true");

        if (reportVideo) {
            reportVideo.pause();
            reportVideo.removeAttribute("src");
            reportVideo.load();
        }

        if (resizeObserver) {
            resizeObserver.disconnect();
            resizeObserver = null;
        }

        window.removeEventListener("resize", positionSpotlight);
        window.removeEventListener("orientationchange", positionSpotlight);
    }

    nextButton.addEventListener("click", () => {
        if (currentStep >= steps.length - 1) {
            closeTutorial();
        } else {
            showStep(currentStep + 1);
        }
    });

    // Don't close when the user taps outside: the tutorial is meant to be completed.
    overlay.addEventListener("click", event => {
        if (event.target === overlay) event.preventDefault();
    });

    // Show only once on first launch.
    if (localStorage.getItem("catTrackerTutorialCompleted") !== "true") {
        window.addEventListener("load", () => {
            setTimeout(openTutorial, 450);
        }, { once: true });
    }
})();
