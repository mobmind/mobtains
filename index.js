require("dotenv").config();

const {
    isRequestWindowOpen,
    getWindowStatus
} = require("./utils/requestWindow");

const {
    Client,
    GatewayIntentBits,
    ButtonBuilder,
    ButtonStyle,
    ActionRowBuilder,
    Partials
} = require("discord.js");

const {
    createRequest,
    getRequest,
    updateRequest,
    cancelRequest,
    getAllRequests,
    clearRequests
} = require("./utils/requestID");

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages
    ],
    partials: [
        Partials.Channel
    ]
});


// Active DM requests
const activeRequests = new Map();



client.once("clientReady", () => {
    console.log(`🤖 Mobtains Bot is online as ${client.user.tag}`);
});





client.on("messageCreate", async (message) => {

    if (message.author.bot) return;



    // =========================
    // CHECK REQUEST WINDOW
    // =========================

    if (message.content.toLowerCase() === "!window") {

        const status = getWindowStatus();

        if (status.open) {

            return message.reply(
                "🟢 **Mobtains request window is OPEN**\n\nRequests can currently be submitted!"
            );

        } else {

            return message.reply(
                "🔴 **Mobtains request window is CLOSED**\n\nThe Side Quest window opens on the 1st of every month and closes after the 7th.\n\nUse `!window` anytime to check again."
            );

        }

    }





    // =========================
    // CLEAR REQUESTS (ADMIN ONLY)
    // =========================

    if (message.content.toLowerCase() === "!clearrequests") {

        if (
            message.channel.id !== process.env.ADMIN_CHANNEL_ID
        ) {

            return message.reply(
                "❌ This command can only be used in the Mobtains admin channel."
            );

        }


        clearRequests();


        return message.reply(
            "🧹 **Mobtains request list cleared.**\n\nAll saved requests have been removed."
        );

    }





    // =========================
    // TEST REQUEST
    // =========================

    if (message.content === "!testrequest") {

        try {

            const requestNumber = createRequest({

                userId: message.author.id,
                username: message.author.tag,
                type: "Test Request",
                item: "Test Item",
                link: "https://example.com",
                notes: "Test request"

            });


            const adminChannel =
                await client.channels.fetch(
                    process.env.ADMIN_CHANNEL_ID
                );


            await adminChannel.send(
`🚨 **NEW MOBTAINS SIDE QUEST** 🚨

Request Verification Number:
#${requestNumber}

Customer:
${message.author}

Item:
Test Item

Link:
https://example.com

Notes:
Test request

Status:
🟡 Pending`
            );


            await message.reply(
                `✅ Test request #${requestNumber} sent!`
            );


        } catch(error) {

            console.error(error);

            message.reply(
                "❌ Test request failed."
            );

        }

    }





    // =========================
    // VIEW REQUESTS (ADMIN ONLY)
    // =========================

    if (message.content === "!requests") {


        if (
            message.channel.id !== process.env.ADMIN_CHANNEL_ID
        ) {

            return message.reply(
                "❌ This command can only be used in the Mobtains admin channel."
            );

        }



        const requests = getAllRequests();



        if (requests.length === 0) {

            return message.reply(
                "📋 No Mobtains requests yet."
            );

        }



        let response =
`📋 **Mobtains Requests**

`;



        requests.forEach((request) => {

            response +=
`━━━━━━━━━━━━━━
🆔 #${request.id}

👤 Customer:
${request.username}

📦 Item:
${request.item}

📌 Status:
${request.status}

`;

        });



        if (response.length > 1900) {

            response =
            "📋 Too many requests. Check requests.json.";

        }



        await message.reply(response);

    }


// =========================
// UPDATE REQUEST
// =========================

if (message.content.startsWith("!update")) {


    const args = message.content.split(" ");

    const requestID = args[1];


    if (!requestID) {

        return message.reply(
            "❌ Example: !update 0001"
        );

    }



    const request = getRequest(requestID);



    if (!request) {

        return message.reply(
            "❌ Request not found."
        );

    }



    if (request.userId !== message.author.id) {

        return message.reply(
            "❌ You can only update your own requests."
        );

    }



    activeUpdates.set(
        message.author.id,
        {
            id: requestID,
            step: "choice"
        }
    );



    return message.reply(
`✏️ **Updating Mobtains Request #${requestID}**

What would you like to update?

1️⃣ Item
2️⃣ Link
3️⃣ Notes
4️⃣ Add Photos

Reply with:
1, 2, 3, or 4`
    );

}


    // =========================
    // CANCEL REQUEST
    // =========================

    if (message.content.startsWith("!cancel")) {


        const args = message.content.split(" ");

        const requestID = args[1];



        if (!requestID) {

            return message.reply(
                "❌ Example: !cancel 0001"
            );

        }



        const cancelled = cancelRequest(requestID);



        if (!cancelled) {

            return message.reply(
                "❌ Request not found."
            );

        }



        await message.reply(
`✅ Request #${requestID} cancelled.

Item:
${cancelled.item}`
        );



        const adminChannel =
            await client.channels.fetch(
                process.env.ADMIN_CHANNEL_ID
            );



        await adminChannel.send(
`⚠️ **REQUEST CANCELLED**

Request:
#${requestID}

Customer:
${message.author}

Item:
${cancelled.item}

Status:
❌ Cancelled`
        );

    }

        // =========================
    // START REQUEST
    // =========================

    if (message.content === "!request") {

        if (!isRequestWindowOpen()) {

            return message.reply(
`⏳ **Mobtains requests are currently CLOSED**

Our monthly Side Quest window is only open during the **first 7 days of each month**.

🟢 Opens:
12:00 AM Eastern on the 1st

🔴 Closes:
12:00 AM Eastern on the 8th

Use \`!window\` anytime to check the current status.`
            );

        }


        const findItem = new ButtonBuilder()
            .setCustomId("find_item")
            .setLabel("🛒 Find an Item")
            .setStyle(ButtonStyle.Primary);


        const helpHunt = new ButtonBuilder()
            .setCustomId("help_hunt")
            .setLabel("🔎 Help Me Hunt")
            .setStyle(ButtonStyle.Secondary);


        const other = new ButtonBuilder()
            .setCustomId("other")
            .setLabel("📦 Other")
            .setStyle(ButtonStyle.Success);



        const row = new ActionRowBuilder()
            .addComponents(
                findItem,
                helpHunt,
                other
            );



        await message.author.send({

            content:
`🤖 **Welcome to Mobtains!**

How can Mobtains help you?`,

            components: [row]

        });



        return message.reply(
            "📩 Check your DMs!"
        );

    }





    // =========================
    // DM REQUEST FLOW
    // =========================

    if (!message.guild) {


    // =========================
    // REQUEST UPDATE FLOW
    // =========================

    const update =
        activeUpdates.get(
            message.author.id
        );


    if (update) {


        const requestID = update.id;



        if (update.step === "choice") {


            if (message.content === "1") {

                update.step = "item";

                activeUpdates.set(
                    message.author.id,
                    update
                );

                return message.reply(
                    "📦 Send the new item information."
                );

            }



            if (message.content === "2") {

                update.step = "link";

                activeUpdates.set(
                    message.author.id,
                    update
                );

                return message.reply(
                    "🔗 Send the new link."
                );

            }



            if (message.content === "3") {

                update.step = "notes";

                activeUpdates.set(
                    message.author.id,
                    update
                );

                return message.reply(
                    "📝 Send the new notes."
                );

            }



            if (message.content === "4") {

                update.step = "photos";

                activeUpdates.set(
                    message.author.id,
                    update
                );

                return message.reply(
                    "📸 Send the new photos."
                );

            }


            return message.reply(
                "❌ Please reply with 1, 2, 3, or 4."
            );

        }



        if (
            update.step === "item" ||
            update.step === "link" ||
            update.step === "notes"
        ) {


            const changes = {};

            changes[update.step] =
                message.content;



            updateRequest(
                requestID,
                changes
            );


            activeUpdates.delete(
                message.author.id
            );


            return message.reply(
                `✅ Request #${requestID} updated!`
            );

        }



        if (update.step === "photos") {


            if (message.attachments.size === 0) {

                return message.reply(
                    "❌ Please attach at least one photo."
                );

            }


            const images =
                [...message.attachments.values()]
                .map(
                    attachment => attachment.url
                );



            const existing =
                getRequest(requestID);



            updateRequest(
                requestID,
                {
                    images: [
                        ...(existing.images || []),
                        ...images
                    ]
                }
            );


            const adminChannel =
                await client.channels.fetch(
                    process.env.ADMIN_CHANNEL_ID
                );


            await adminChannel.send({

                content:
`🔄 **REQUEST UPDATED**

Request:
#${requestID}

Customer:
${message.author}

Change:
📸 Added new photos`,

                files: images

            });



            activeUpdates.delete(
                message.author.id
            );


            return message.reply(
                `✅ Photos added to request #${requestID}!`
            );

        }

    }




    // =========================
    // NEW REQUEST FLOW
    // =========================

    const request =
        activeRequests.get(
            message.author.id
        );


    if (!request) return;


        // ITEM STEP

        if (request.step === "item") {


            request.item =
                message.content || "Image submission";


            if (message.attachments.size > 0) {

                request.images.push(
                    ...message.attachments.map(
                        attachment => attachment.url
                    )
                );

            }



            request.step = "link";


            activeRequests.set(
                message.author.id,
                request
            );


            return message.reply(
`✅ Item saved!

📦 ${request.item}

${request.images.length > 0 ? "📸 Images received!" : ""}

Do you have a link?

Send the link or type:
none`
            );

        }





        // LINK STEP

        if (request.step === "link") {


            request.link =
                message.content || "none";


            request.step = "notes";


            activeRequests.set(
                message.author.id,
                request
            );


            return message.reply(
`🔗 Link saved!

Any notes?

Type:
none`
            );

        }





        // NOTES STEP

        if (request.step === "notes") {


            request.notes =
                message.content || "none";



            try {


                const requestNumber =
                    createRequest({

                        userId:
                            message.author.id,

                        username:
                            message.author.tag,

                        type:
                            request.type,

                        item:
                            request.item,

                        link:
                            request.link,

                        notes:
                            request.notes,

                        images:
                            request.images

                    });



                const adminChannel =
                    await client.channels.fetch(
                        process.env.ADMIN_CHANNEL_ID
                    );



                await adminChannel.send({

content:
`🚨 **NEW MOBTAINS SIDE QUEST** 🚨

Request Verification Number:
#${requestNumber}

Customer:
${message.author}

Type:
${request.type}

Item:
${request.item}

Link:
${request.link}

Notes:
${request.notes}

Images:
${request.images.length > 0 ? "📸 Attached below" : "None"}

Status:
🟡 Pending`,

files:
    request.images || []

                });



                await message.reply(
`✅ Your Mobtains request is submitted!

Verification Number:

#${requestNumber}`
                );



                activeRequests.delete(
                    message.author.id
                );


            } catch(error) {


                console.error(
                    "REQUEST ERROR:",
                    error
                );


                await message.reply(
                    "❌ Error processing request."
                );

            }

        }

    }

});







// =========================
// BUTTON HANDLER
// =========================

client.on("interactionCreate", async (interaction) => {


    if (!interaction.isButton()) return;



    if (interaction.customId === "find_item") {


        activeRequests.set(
            interaction.user.id,
            {
                step: "item",
                type: "Find an Item",
                images: []
            }
        );


        return interaction.reply(
            "🛒 What item are you looking for?\n\nYou can send pictures too!"
        );

    }





    if (interaction.customId === "help_hunt") {


        activeRequests.set(
            interaction.user.id,
            {
                step: "item",
                type: "Help Me Hunt",
                images: []
            }
        );


        return interaction.reply(
            "🔎 What item are you hunting for?\n\nYou can send pictures too!"
        );

    }





    if (interaction.customId === "other") {


        activeRequests.set(
            interaction.user.id,
            {
                step: "item",
                type: "Other",
                images: []
            }
        );


        return interaction.reply(
            "📦 Tell Mobtains how we can help.\n\nYou can send pictures too!"
        );

    }

});





client.login(process.env.DISCORD_TOKEN);
