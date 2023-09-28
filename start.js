require("dotenv-flow").config();

const ndapp = require("ndapp");
const low = require("lowdb");
const FileSync = require("lowdb/adapters/FileSync");

class AppManager extends ndapp.Application {
	constructor() {
		super();

		const errorHandler = error => {
			console.error(error.message);
		};

		this.onUncaughtException = errorHandler;
		this.onUnhandledRejection = errorHandler;
	}

	get isDevelop() {
		return process.env.DEVELOP === "true";
	}

	async initialize() {
		this.initializeDB();

		await super.initialize();
	}

	initializeDB() {
		const adapter = new FileSync(app.path.resolve("db.json"));

		this.db = low(adapter);

		this.db.defaults({}).write();
	}

	async run() {
		await super.run();

		// TODO сделать потом через тг-бота, пока что авторизовываться сами будем один раз в начале работы юзера
		if (app.arguments.auth) {
			await app.telegramClient.authorize();

			app.quit();
		}
	}
}

ndapp({
	app: new AppManager(),
	components: [
		() => new (require("./components/TelegramBot"))(),
		() => new (require("./components/TelegramClient"))()
	]
});
