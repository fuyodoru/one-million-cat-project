/*
=========================================================
ONE MILLION CAT PROJECT
ADMIN PASSWORD RESET
=========================================================
*/


const SUPABASE_URL =
    "https://xhirgakkurhmpktvcvwe.supabase.co";


const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_9KY3n_ELqAmrNQVy9VH-nA_5Cs7U5-4";


const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_PUBLISHABLE_KEY
    );


const resetForm =
    document.getElementById(
        "resetForm"
    );


const passwordInput =
    document.getElementById(
        "password"
    );


const confirmPasswordInput =
    document.getElementById(
        "confirmPassword"
    );


const resetButton =
    document.getElementById(
        "resetButton"
    );


const resetMessage =
    document.getElementById(
        "resetMessage"
    );


let recoverySessionReady =
    false;


/* =========================================================
   MESSAGE
========================================================= */

function showMessage(
    message,
    type = ""
) {

    resetMessage.textContent =
        message;


    resetMessage.className =
        "reset-message";


    if (type) {

        resetMessage.classList.add(
            type
        );

    }

}


/* =========================================================
   RECOVERY SESSION
========================================================= */

async function prepareRecoverySession() {

    /*
     * Supabase processes the recovery link and creates
     * a temporary authenticated recovery session.
     */

    const {
        data: {
            session
        },
        error
    } =
        await supabaseClient.auth.getSession();


    if (error) {

        console.error(
            "Recovery session error:",
            error
        );


        showMessage(
            "PASSWORD RESET LINK IS INVALID OR EXPIRED.",
            "error"
        );


        resetButton.disabled =
            true;


        return;

    }


    if (session) {

        recoverySessionReady =
            true;


        resetButton.disabled =
            false;


        showMessage(
            "ENTER YOUR NEW PASSWORD."
        );


        return;

    }


    /*
     * The recovery session can arrive shortly after
     * page load through PASSWORD_RECOVERY.
     */

    showMessage(
        "WAITING FOR PASSWORD RESET SESSION..."
    );

}


/* =========================================================
   AUTH STATE
========================================================= */

supabaseClient.auth.onAuthStateChange(
    async (
        event,
        session
    ) => {

        if (

            event ===
            "PASSWORD_RECOVERY"

            &&

            session

        ) {

            recoverySessionReady =
                true;


            resetButton.disabled =
                false;


            showMessage(
                "ENTER YOUR NEW PASSWORD."
            );

        }

    }
);


/* =========================================================
   UPDATE PASSWORD
========================================================= */

resetForm.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();


        if (
            !recoverySessionReady
        ) {

            showMessage(
                "PASSWORD RESET SESSION IS NOT READY.",
                "error"
            );


            return;

        }


        const password =
            passwordInput.value;


        const confirmPassword =
            confirmPasswordInput.value;


        if (
            password.length <
            6
        ) {

            showMessage(
                "PASSWORD MUST BE AT LEAST 6 CHARACTERS.",
                "error"
            );


            return;

        }


        if (
            password !==
            confirmPassword
        ) {

            showMessage(
                "PASSWORDS DO NOT MATCH.",
                "error"
            );


            return;

        }


        resetButton.disabled =
            true;


        resetButton.textContent =
            "UPDATING...";


        showMessage(
            "UPDATING PASSWORD..."
        );


        const {
            error
        } =
            await supabaseClient.auth.updateUser({

                password

            });


        if (error) {

            console.error(
                "Password update failed:",
                error
            );


            resetButton.disabled =
                false;


            resetButton.textContent =
                "UPDATE PASSWORD";


            showMessage(
                "PASSWORD UPDATE FAILED.",
                "error"
            );


            return;

        }


        /*
         * IMPORTANT:
         *
         * The recovery session is intentionally closed.
         *
         * This prevents the user from being automatically
         * logged into the admin panel after resetting the
         * password.
         */

        showMessage(
            "PASSWORD UPDATED. PLEASE LOG IN WITH YOUR NEW PASSWORD.",
            "success"
        );


        passwordInput.value =
            "";


        confirmPasswordInput.value =
            "";


        await supabaseClient.auth.signOut();


        setTimeout(
            () => {

                window.location.href =
                    "./";

            },
            1500
        );

    }
);


/* =========================================================
   START
========================================================= */

prepareRecoverySession();
