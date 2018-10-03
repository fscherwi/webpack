/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/

"use strict";

const validateOptions = require("schema-utils");
const schema = require("../../schemas/plugins/ids/OccurrenceChunkIdsPlugin.json");
const {
	compareSelect,
	compareModulesById,
	compareIterables
} = require("../util/comparators");
const assignAscendingChunkIds = require("./assignAscendingChunkIds");

/** @typedef {import("../../declarations/plugins/ids/OccurrenceChunkIdsPlugin").OccurrenceChunkIdsPluginOptions} OccurrenceChunkIdsPluginOptions */
/** @typedef {import("../Chunk")} Chunk */
/** @typedef {import("../Compiler")} Compiler */
/** @typedef {import("../Module")} Module */

class OccurrenceChunkIdsPlugin {
	/**
	 * @param {OccurrenceChunkIdsPluginOptions=} options options object
	 */
	constructor(options = {}) {
		validateOptions(schema, options, "Occurrence Order Chunk Ids Plugin");
		this.options = options;
	}

	/**
	 * @param {Compiler} compiler webpack compiler
	 * @returns {void}
	 */
	apply(compiler) {
		const prioritiseInitial = this.options.prioritiseInitial;
		compiler.hooks.compilation.tap("OccurrenceChunkIdsPlugin", compilation => {
			compilation.hooks.chunkIds.tap("OccurrenceChunkIdsPlugin", chunks => {
				const chunkGraph = compilation.chunkGraph;

				/** @type {Map<Chunk, number>} */
				const occursInInitialChunksMap = new Map();

				const cmpFn = compareModulesById(chunkGraph);
				const cmpIterableFn = compareIterables(cmpFn);
				const compareNatural = compareSelect(
					/**
					 * @param {Chunk} chunk a chunk
					 * @returns {Iterable<Module>} modules
					 */
					chunk => chunkGraph.getOrderedChunkModulesIterable(chunk, cmpFn),
					cmpIterableFn
				);

				for (const c of chunks) {
					let occurs = 0;
					for (const chunkGroup of c.groupsIterable) {
						for (const parent of chunkGroup.parentsIterable) {
							if (parent.isInitial()) occurs++;
						}
					}
					occursInInitialChunksMap.set(c, occurs);
				}

				const chunksInOccurrenceOrder = Array.from(chunks).sort((a, b) => {
					if (prioritiseInitial) {
						const aEntryOccurs = occursInInitialChunksMap.get(a);
						const bEntryOccurs = occursInInitialChunksMap.get(b);
						if (aEntryOccurs > bEntryOccurs) return -1;
						if (aEntryOccurs < bEntryOccurs) return 1;
					}
					const aOccurs = a.getNumberOfGroups();
					const bOccurs = b.getNumberOfGroups();
					if (aOccurs > bOccurs) return -1;
					if (aOccurs < bOccurs) return 1;
					return compareNatural(a, b);
				});
				assignAscendingChunkIds(chunksInOccurrenceOrder, compilation);
			});
		});
	}
}

module.exports = OccurrenceChunkIdsPlugin;
