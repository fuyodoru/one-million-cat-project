/*
=========================================================
ONE MILLION CAT PROJECT
ADMIN FORGOT PASSWORD
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


const forgotForm =
    document.getElementById(
        "forgotForm"
    );


const emailInput =
    document.getElementById(
        "email"
    );


const sendButton =
    document.getElementById(
        "sendButton"
    );


const forgotMessage =
    document.getElementById(
        "forgotMessage"
    );


function showMessage(
    message,
    type = ""
) {

    forgotMessage.textContent =
        message;


    forgotMessage.className =
        "forgot-message";


    if (type) {

        forgotMessage.classList.add(
            type
        );

    }

}


forgotForm.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();


        const email =
            emailInput
                .value
                .trim();


        if (!email) {

            return;

        }


        sendButton.disabled =
            true;


        sendButton.textContent =
            "SENDING...";


        showMessage(
            "SENDING RESET LINK..."
        );


        const redirectTo =
            `${window.location.origin}/admin/reset-password.html`;


        const {
            error
        } =
            await supabaseClient.auth
                .resetPasswordForEmail(
                    email,
                    {
                        redirectTo
                    }
                );


        if (error) {

            console.error(
                "Password reset request failed:",
                error
            );


            sendButton.disabled =
                false;


            sendButton.textContent =
                "SEND RESET LINK";


            showMessage(
                "COULD NOT SEND RESET LINK. PLEASE TRY AGAIN.",
                "error"
            );


            return;

        }


        /*
         * We intentionally use a generic message.
         * This avoids revealing whether an email belongs
         * to an account.
         */

        sendButton.disabled =
            false;


        sendButton.textContent =
            "SEND AGAIN";


        showMessage(
            "IF THIS EMAIL BELONGS TO AN ADMIN ACCOUNT, A RESET LINK HAS BEEN SENT.",
            "success"
        );

    }
);
