/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/

"use strict";

/** @typedef {import("../Compiler")} Compiler */

class AddBuildDependenciesPlugin {
	/**
	 * @param {Iterable<string>} buildDependencies list of build dependencies
	 */
	constructor(buildDependencies) {
		this.buildDependencies = new Set(buildDependencies);
	}

	/**
	 * @param {Compiler} compiler Webpack compiler
	 * @returns {void}
	 */
	apply(compiler) {
		compiler.hooks.compilation.tap(
			"AddBuildDependenciesPlugin",
			compilation => {
				compilation.buildDependencies.addAll(this.buildDependencies);
			}
		);
	}
}

module.exports = AddBuildDependenciesPlugin;
