/** @babel */
/* globals snapshotResult */
import { CompositeDisposable, watchPath } from "atom";
import fs from "fs-plus";
import path from "path";

export default {
	async activate() {
		require("atom-package-deps").install("terminal-commands");

		this.subscriptions = new CompositeDisposable();
		this.configFile = fs.resolve(atom.configDirPath, "terminal-commands", ["json", "js"]);

		if (!this.configFile) {
			await this.createConfig();
		}

		if (this.configFile) {
			this.subscriptions.add(atom.commands.add("atom-workspace", "terminal-commands:edit-config", () => atom.workspace.open(this.configFile, {searchAllPanes: true})));
			this.subscriptions.add(await watchPath(this.configFile, {}, this.watchConfig.bind(this)));

			this.loadConfig();
		}
	},

	deactivate() {
		this.subscriptions.dispose();
		this.configSubscriptions.dispose();
		this.terminal = null;
		this.configFile = null;
	},

	async createConfig() {
		const { promisify } = require("promisification");
		const file = path.join(atom.configDirPath, "terminal-commands.json");
		const defaultConfig = `
{
	"test:terminal-commands": "echo \\"Terminal Commands Rules!!!\\""
}
`;// TODO:

		await promisify(fs.writeFile)(file, defaultConfig);
		this.configFile = file;
	},

	watchConfig(events) {
		const isModified = events.some(e => e.action === "modified");

		if (isModified) {
			this.loadConfig(this.configFile);
		}
	},

	loadConfig() {
		if (this.configSubscriptions) {
			this.configSubscriptions.dispose();
		}
		this.configSubscriptions = new CompositeDisposable();

		const json = this.requireConfigFile();

		for (const command in json) {
			const commands = json[command];
			this.configSubscriptions.add(atom.commands.add("atom-workspace", command, this.runCommands(this, commands)));
		}
	},

	requireConfigFile() {
		let json;
		try {
			json = require(this.configFile);
			delete require.cache[this.configFile];

			let relativeFilePath = path.relative(path.join(process.cwd(), "resources", "app", "static"), this.configFile);
			if (process.platform === "win32") {
				relativeFilePath = relativeFilePath.replace(/\\/g, "/");
			}
			delete snapshotResult.customRequire.cache[relativeFilePath];
		} catch (err) {
			atom.notifications.addError(`Cannot load '${this.configFile}'`, {
				detail: err.message,
				dismissable: true,
			});
			throw err;
		}

		return json;
	},

	runCommands(self, commands) {
		let commandsArray = commands;
		if (!Array.isArray(commands)) {
			commandsArray = [commands];
		}

		return function () {
			// TODO: replace placeholders with this.path
			if (!self.terminal) {
				self.terminal.run(commandsArray);
			} else {
				atom.notifications.addError("No terminal loaded", { description: "Please install platformio-ide-terminal" });
			}
		};
	},

	consumeRunInTerminal(terminal) {
		if (this.configFile) {
			this.terminal = terminal;
		}
	}
};
