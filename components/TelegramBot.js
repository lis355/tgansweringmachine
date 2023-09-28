const { Telegraf } = require("telegraf");

const TELEGRAM_OWNER_ID = parseFloat(process.env.TELEGRAM_OWNER_ID);

function isMeMiddleware(ctx, next) {
	if (ctx.chat.id !== TELEGRAM_OWNER_ID) throw new Error(`Bad user @${ctx.chat.username} (id=${ctx.chat.id})`);

	return next();
}

function commandMiddleware(ctx, next) {
	const message = ctx.message.text;
	const spaceCharIndex = message.indexOf(" ");
	const name = message.slice(1, spaceCharIndex > 0 ? spaceCharIndex : message.length).toLowerCase();
	const argumentsLine = spaceCharIndex > 0 ? message.slice(spaceCharIndex + 1).trim() : "";
	const commandArguments = argumentsLine.split(" ").filter(Boolean);

	ctx.state.command = {
		name,
		argumentsLine,
		arguments: commandArguments
	};

	return next();
}

module.exports = class TelegramBot extends ndapp.ApplicationComponent {
	async initialize() {
		await super.initialize();

		this.bot = new Telegraf(process.env.TELEGRAM_BOT_API_TOKEN);

		// if (app.isDevelop) {
		// 	this.bot.use((ctx, next) => {
		// 		app.log.info(app.tools.json.format(app.libs._.omit(ctx, "telegram")));

		// 		return next();
		// 	});
		// }

		this.bot
			.command("start",
				isMeMiddleware,
				commandMiddleware,
				async ctx => {
					if (app.telegramClient.connected) {
						await this.sendMessage(`Автоответчик работает${app.os.EOL}${app.os.EOL}Ответное сообщение${app.os.EOL}${app.os.EOL}${app.telegramClient.answerMessage}`);

						return;
					}

					if (!app.telegramClient.answerMessage) {
						await this.sendMessage("Не задано ответное сообщение");

						return;
					}

					await app.telegramClient.start();

					await this.sendMessage(`Автоответчик запущен${app.os.EOL}${app.os.EOL}Ответное сообщение${app.os.EOL}${app.os.EOL}${app.telegramClient.answerMessage}`);
				})
			.command("stop",
				isMeMiddleware,
				commandMiddleware,
				async ctx => {
					if (!app.telegramClient.connected) {
						await this.sendMessage("Автоответчик не работает");

						return;
					}

					await app.telegramClient.stop();

					await this.sendMessage("Автоответчик остановлен");
				})
			.command("status",
				isMeMiddleware,
				commandMiddleware,
				async ctx => {
					if (app.telegramClient.connected) {
						await this.sendMessage(`Автоответчик работает${app.os.EOL}${app.os.EOL}Ответное сообщение${app.os.EOL}${app.os.EOL}${app.telegramClient.answerMessage}`);
					} else {
						await this.sendMessage("Автоответчик не работает");
					}
				})
			.command("setanswer",
				isMeMiddleware,
				commandMiddleware,
				async ctx => {
					const answerMessage = ctx.state.command.argumentsLine;

					if (!answerMessage) {
						await this.sendMessage("Некорректное ответное сообщение");

						return;
					}

					app.telegramClient.answerMessage = answerMessage;

					await this.sendMessage(`Задано ответное сообщение${app.os.EOL}${app.os.EOL}${app.telegramClient.answerMessage}`);
				})
			// .on(message("text"),
			// 	isMeMiddleware,
			// 	async ctx => {
			// 	})
			.catch((error, ctx) => {
				app.log.error(`Error for ${ctx.updateType}, ${error.message}, ${error.stack}`);
			})
			.launch();
	}

	async sendMessage(message) {
		await this.bot.telegram.sendMessage(TELEGRAM_OWNER_ID, message);
	}
};
