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
        maxZoom: 13,
        worldCopyJump: true
    }
).setView(
    [25, 10],
    2
);


L.tileLayer(
    "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    {
        attribution:
            "&copy; OpenStreetMap &copy; CARTO",

        subdomains:
            "abcd",

        maxZoom:
            20
    }
).addTo(map);


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


function formatProgress(
    progress
) {

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

function getPrivacyOffset(
    id
) {

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
        "Loading cat sightings..."
    );

    markerLayer.clearLayers();


    const {
        data,
        error
    } = await supabaseClient
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
            created_at
        `);


    if (
        error
    ) {

        console.error(
            "Supabase error:",
            error
        );

        updateCounter(0);

        return;
    }


    const sightings =
        data || [];


    const totalCats =
        sightings.reduce(
            (
                total,
                sighting
            ) => {

                return (
                    total +
                    Number(
                        sighting.cat_count ||
                        0
                    )
                );

            },
            0
        );


    updateStatistics(
        sightings,
        totalCats
    );


    updateCounter(
        totalCats
    );


    sightings.forEach(
        addCatMarker
    );


    console.log(
        "Cat sightings loaded:",
        sightings
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
                            sighting.cat_count ||
                            0
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
   MARKERS
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

        console.warn(
            "Invalid public coordinates:",
            sighting
        );

        return;
    }


    const offset =
        getPrivacyOffset(
            sighting.id
        );


    const marker =
        L.marker(
            [
                latitude +
                    offset.latitude,

                longitude +
                    offset.longitude
            ],
            {
                icon:
                    pawIcon
            }
        ).addTo(
            markerLayer
        );


    const count =
        Number(
            sighting.cat_count ||
            0
        );


    const location =
        sighting.city &&
        sighting.country

            ? `${escapeHTML(
                    sighting.city
              )}, ${escapeHTML(
                    sighting.country
              )}`

            : "LOCATION UNKNOWN";


    marker.bindPopup(`
        <div class="cat-popup">

            <strong>
                🐾 CAT SIGHTING
            </strong>

            <br><br>

            ${count}
            ${count === 1 ? "CAT" : "CATS"}
            RECORDED

            <br><br>

            ${location}

        </div>
    `);
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
   NAVIGATION BUTTONS
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


setInterval(
    () => {

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

    },
    700
);


setInterval(
    () => {

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

    },
    350
);


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
        data: sessionData
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
   CITY GEOCODING
========================================================= */

/*
   CITY + COUNTRY
        ↓
   OpenStreetMap Nominatim
        ↓
   Coordinates

   Browser GPS is NOT used.
*/

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


    if (
        error
    ) {

        console.error(
            "Photo upload error:",
            error
        );


        throw new Error(
            `PHOTO UPLOAD FAILED: ${error.message}`
        );
    }


    /*
       If the bucket is private, the URL stored here
       is only a file path in practice. Admin can later
       use createSignedUrl().
    */

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
       1. Anonymous user.
    */

    const user =
        await getAuthenticatedUser();


    /*
       2. Convert city + country
          into coordinates.
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
       3. Upload optional photo.
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
       4. Save sighting.

       latitude / longitude:
       city coordinates

       public_latitude / public_longitude:
       same city coordinates

       The marker gets a small privacy
       offset in addCatMarker().
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
            "Cat sighting insert error:",
            error
        );


        throw new Error(
            `SUBMISSION FAILED: ${error.message}`
        );
    }
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
    "Location source: City + Country"
);

console.log(
    "================================"
);


loadCatSightings();