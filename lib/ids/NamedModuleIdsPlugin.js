/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/

"use strict";

const RequestShortener = require("../RequestShortener");
const createHash = require("../util/createHash");

/** @typedef {import("../Compiler")} Compiler */
/** @typedef {import("../Module")} Module */

const getHash = str => {
	const hash = createHash("md4");
	hash.update(str);
	return hash.digest("hex").substr(0, 4);
};

class NamedModuleIdsPlugin {
	constructor(options) {
		this.options = options || {};
	}

	/**
	 * @param {Compiler} compiler the compiler instance
	 * @returns {void}
	 */
	apply(compiler) {
		compiler.hooks.compilation.tap("NamedModuleIdsPlugin", compilation => {
			compilation.hooks.beforeModuleIds.tap("NamedModuleIdsPlugin", modules => {
				const chunkGraph = compilation.chunkGraph;
				const context = this.options.context
					? this.options.context
					: compiler.context;
				const requestShortener = this.options.context
					? new RequestShortener(this.options.context)
					: compilation.requestShortener;

				/** @type {Map<string, Module[]>} */
				const nameToModules = new Map();

				for (const module of modules) {
					if (chunkGraph.getNumberOfModuleChunks(module) === 0) continue;
					const moduleId = chunkGraph.getModuleId(module);
					if (moduleId === null) {
						const id = module.libIdent({ context }) || "";
						let array = nameToModules.get(id);
						if (array === undefined) {
							array = [];
							nameToModules.set(id, array);
						}
						array.push(module);
					}
				}

				for (const [id, modules] of nameToModules) {
					if (modules.length > 1 || !id) {
						for (const module of modules) {
							chunkGraph.setModuleId(
								module,
								`${id}?${getHash(
									requestShortener.shorten(module.identifier())
								)}`
							);
						}
					} else {
						chunkGraph.setModuleId(modules[0], id);
					}
				}
			});
		});
	}
}

module.exports = NamedModuleIdsPlugin;
