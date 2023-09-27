require("dotenv-flow").config();

const { TelegramClient, Api } = require("telegram");
const { StoreSession } = require("telegram/sessions");
const { NewMessage } = require("telegram/events");
const { generateRandomBigInt } = require("telegram/Helpers");
const input = require("input");

(async () => {
	const storeSession = new StoreSession(".tg");

	const client = new TelegramClient(storeSession, parseFloat(process.env.TELEGRAM_API_ID), process.env.TELEGRAM_API_HASH, {
		useWSS: false,
		connectionRetries: 5
	});

	await client.start({
		phoneNumber: async () => input.text("Please enter your number: "),
		password: async () => input.text("Please enter your password: "),
		phoneCode: async () => input.text("Please enter the code you received: "),
		onError: console.error
	});

	client.session.save();

	client.addEventHandler(async event => {
		const message = event.message;
		const sender = await message.getSender();
		if (sender.username &&
			!sender.bot &&
			sender.username === "malevichblackout") {
			await client.invoke(
				new Api.messages.SendMessage({
					peer: message.senderId,
					message: process.env.ANSWER,
					randomId: generateRandomBigInt()
				})
			);

			await client.invoke(
				new Api.messages.ForwardMessages({
					fromPeer: message.senderId,
					id: [message.id],
					toPeer: await client.getMe(),
					randomId: [generateRandomBigInt()]
				})
			);
		}
	}, new NewMessage({}));
})();
