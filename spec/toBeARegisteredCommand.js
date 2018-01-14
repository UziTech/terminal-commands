beforeEach(function () {
	jasmine.addMatchers({
		toBeARegisteredCommand: function () {
			return {
				compare: function (actual) {
					const result = {};
					result.pass = atom.commands
						.findCommands({ target: atom.views.getView(atom.workspace) })
						.map(cmd => cmd.name)
						.includes(actual);
					const toBeOrNotToBe = (result.pass ? "not to be" : "to be"); // that is the question.
					result.message = `Expected ${actual} ${toBeOrNotToBe} a registered command.`;
					return result;
				}
			};
		}
	});
});
