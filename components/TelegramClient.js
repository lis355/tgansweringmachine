const { TelegramClient: Client, Api } = require("telegram");
const { StoreSession } = require("telegram/sessions");
const { NewMessage } = require("telegram/events");
const { generateRandomBigInt } = require("telegram/Helpers");
const input = require("input");

module.exports = class TelegramClient extends ndapp.ApplicationComponent {
	async initialize() {
		await super.initialize();

		this.client = new Client(
			new StoreSession(".tg"),
			parseFloat(process.env.TELEGRAM_CLIENT_API_ID),
			process.env.TELEGRAM_CLIENT_API_HASH,
			{
				useWSS: false,
				connectionRetries: 5
			}
		);

		this.client.addEventHandler(async event => {
			const message = event.message;
			const sender = await message.getSender();
			if (sender.username &&
				!sender.bot) {
				await this.client.invoke(
					new Api.messages.SendMessage({
						peer: message.senderId,
						message: this.answerMessage,
						randomId: generateRandomBigInt()
					})
				);

				await this.client.invoke(
					new Api.messages.ForwardMessages({
						fromPeer: message.senderId,
						id: [message.id],
						toPeer: this.me,
						randomId: [generateRandomBigInt()]
					})
				);
			}
		}, new NewMessage({}));
	}

	get answerMessage() {
		return app.db.get("answer", "").value();
	}

	set answerMessage(value) {
		return app.db.set("answer", value).write();
	}

	get connected() {
		return this.client.connected;
	}

	// TODO сделать потом через тг-бота, пока что авторизовываться сами будем один раз в начале работы юзера
	async authorize() {
		await this.client.start({
			phoneNumber: async () => input.text("Please enter your number: "),
			password: async () => input.text("Please enter your password: "),
			phoneCode: async () => input.text("Please enter the code you received: "),
			onError: console.error
		});

		this.client.session.save();
	}

	async start() {
		await this.client.connect();

		this.me = await this.client.getMe();

		this.client.session.save();
	}

	async stop() {
		await this.client.disconnect();
	}
};
