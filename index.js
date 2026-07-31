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
    ActionRowBuilder
} = require("discord.js");

const {
    createRequest,
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
            message.channel.id !==
            process.env.ADMIN_CHANNEL_ID
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



    if (message.author.bot) return;



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


            const adminChannel = await client.channels.fetch(
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
            message.channel.id !==
            process.env.ADMIN_CHANNEL_ID
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



        await message.reply(
            "📩 Check your DMs!"
        );

    }





    // =========================
    // DM REQUEST FLOW
    // =========================


    if (!message.guild) {


        const request =
            activeRequests.get(
                message.author.id
            );



        if (!request) return;



        if (request.step === "item") {


            request.item = message.content;

            request.step = "link";


            activeRequests.set(
                message.author.id,
                request
            );


            return message.reply(
`✅ Item saved!

📦 ${request.item}

Do you have a link?

Send the link or type:
none`
            );

        }





        if (request.step === "link") {


            request.link = message.content;

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





        if (request.step === "notes") {


            request.notes = message.content;



            try {


                const requestNumber = createRequest({

                    userId: message.author.id,
                    username: message.author.tag,
                    type: request.type,
                    item: request.item,
                    link: request.link,
                    notes: request.notes

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

Type:
${request.type}

Item:
${request.item}

Link:
${request.link}

Notes:
${request.notes}

Status:
🟡 Pending`
                );



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
                type: "Find an Item"
            }
        );


        return interaction.reply(
            "🛒 What item are you looking for?"
        );

    }





    if (interaction.customId === "help_hunt") {


        activeRequests.set(
            interaction.user.id,
            {
                step: "item",
                type: "Help Me Hunt"
            }
        );


        return interaction.reply(
            "🔎 What item are you hunting for?"
        );

    }





    if (interaction.customId === "other") {


        activeRequests.set(
            interaction.user.id,
            {
                step: "item",
                type: "Other"
            }
        );


        return interaction.reply(
            "📦 Tell Mobtains how we can help."
        );

    }

});




client.login(process.env.DISCORD_TOKEN);