/** @babel */

import { CompositeDisposable, watchPath } from "atom";
import fs from "fs-plus";
import path from "path";
import { promisify } from "promisificator";
import config from "./config.js";

export default {
	config,
	activate() {
		require("atom-package-deps").install("terminal-commands");

		this.subscriptions = new CompositeDisposable();

		this.subscriptions.add(atom.commands.add("atom-workspace", "terminal-commands:edit-config", this.editConfig.bind(this)));

		this.subscriptions.add(atom.config.observe("terminal-commands.configFile", async (value) => {
			this.configFile = fs.absolute(value);

			if (await this.configExists()) {

				// no need to await this
				this.watchConfig();
			}
		}));

		this.subscriptions.add(atom.config.observe("terminal-commands.filesPlaceholder", (value) => {
			this.filesPlaceholder = new RegExp(this.escapeRegexp(value), "g");
		}));

		this.subscriptions.add(atom.config.observe("terminal-commands.filePlaceholder", (value) => {
			this.filePlaceholder = new RegExp(this.escapeRegexp(value), "g");
		}));

		this.subscriptions.add(atom.config.observe("terminal-commands.dirPlaceholder", (value) => {
			this.dirPlaceholder = new RegExp(this.escapeRegexp(value), "g");
		}));

	},

	deactivate() {
		this.subscriptions.dispose();
		if (this.configSubscriptions) {
			this.configSubscriptions.dispose();
			this.configSubscriptions = null;
		}
		if (this.commandSubscriptions) {
			this.commandSubscriptions.dispose();
			this.commandSubscriptions = null;
		}
		this.terminal = null;
		this.configFile = null;
	},

	async createConfig() {
		try {
			const defaultConfig = await promisify(fs.readFile)(path.resolve(__dirname, "./default-config.json"));
			await promisify(fs.writeFile)(this.configFile, defaultConfig);
		} catch (err) {
			atom.notifications.addError("Cannot create config file", { description: err.message });
			throw err;
		}
	},

	async configExists() {
		try {
			await promisify(fs.access)(this.configFile);
			return true;
		} catch (err) {
			return false;
		}
	},

	async editConfig() {
		if (!(await this.configExists())) {
			await this.createConfig();

			// no need to await this
			this.watchConfig();
		}

		return atom.workspace.open(this.configFile, {searchAllPanes: true});
	},

	async watchConfig() {
		if (this.configSubscriptions) {
			this.configSubscriptions.dispose();
		}
		this.configSubscriptions = new CompositeDisposable();

		this.loadConfig();

		this.configSubscriptions.add(await watchPath(this.configFile, {}, async (events) => {
			const isModified = events.every(e => e.action === "modified");

			if (!isModified && !(await this.configExists())) {
				this.configSubscriptions.dispose();
				this.configSubscriptions = null;
			}
			this.loadConfig(this.configFile);
		}));
	},

	loadConfig() {
		if (this.commandSubscriptions) {
			this.commandSubscriptions.dispose();
		}
		this.commandSubscriptions = new CompositeDisposable();
		const json = this.requireConfigFile();

		for (const command in json) {
			const commands = json[command];
			this.commandSubscriptions.add(atom.commands.add("atom-workspace", command, this.runCommands(this, commands)));
			this.commandSubscriptions.add(atom.contextMenu.add({
				"atom-workspace": [{
					label: "Terminal Commands",
					submenu: [{label: command, command}]
				}]
			}));
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
			const notification = atom.notifications.addError(`Cannot load '${this.configFile}'`, {
				detail: err.message,
				dismissable: true,
				buttons: [{
					"onDidClick": () => {
						this.editConfig();
						notification.dismiss();
					},
					"text": "Edit Config"
				}]
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

		return function (e) {
			const files = self.getPaths(e.target);
			const dir = path.dirname(files[0]);

			const fullCommands = commandsArray.map(cmd => {
				let fullCmd = cmd;
				if (self.filesPlaceholder) {
					fullCmd = fullCmd.replace(self.filesPlaceholder, files.join(" "));
				}
				if (self.filePlaceholder) {
					fullCmd = fullCmd.replace(self.filePlaceholder, files[0]);
				}
				if (self.dirPlaceholder) {
					fullCmd = fullCmd.replace(self.dirPlaceholder, dir);
				}
				return fullCmd;
			});
			if (self.terminal) {
				self.terminal.run(fullCommands);
			} else {
				atom.notifications.addError("No terminal loaded", { description: "Please install platformio-ide-terminal" });
			}
		};
	},

	escapeRegexp(s) {
		return s.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
	},

	/**
	 * Get the paths of the context target
	 * @param  {EventTarget} target The context target
	 * @return {string[]} The selected paths for the target
	 */
	getPaths(target) {
		if (!target) {
			return atom.project.getPaths();
		}

		const treeView = target.closest(".tree-view");
		if (treeView) {
			// called from treeview
			const selected = treeView.querySelectorAll(".selected > .list-item > .name, .selected > .name");
			if (selected.length > 0) {
				return [].map.call(selected, el => el.dataset.path);
			}
			return [];
		}

		const tab = target.closest(".tab-bar > .tab");
		if (tab) {
			// called from tab
			const title = tab.querySelector(".title");
			if (title && title.dataset.path) {
				return [title.dataset.path];
			}
			return [];
		}

		const textEditor = atom.workspace.getActivePaneItem();
		if (textEditor && typeof textEditor.getPath === "function") {
			// called from active pane
			return [textEditor.getPath()];
		}

		return [];
	},

	consumeRunInTerminal(terminal) {
		if (this.configFile) {
			this.terminal = terminal;
		}
	}
};
