/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/

"use strict";

const Factory = require("enhanced-resolve").ResolverFactory;
const { HookMap, SyncHook, SyncWaterfallHook } = require("tapable");

module.exports = class ResolverFactory {
	constructor() {
		this.hooks = Object.freeze({
			resolveOptions: new HookMap(
				() => new SyncWaterfallHook(["resolveOptions"])
			),
			resolver: new HookMap(() => new SyncHook(["resolver", "resolveOptions"]))
		});
		this.cache1 = new WeakMap();
		this.cache2 = new Map();
	}

	get(type, resolveOptions) {
		const cachedResolver = this.cache1.get(resolveOptions);
		if (cachedResolver) return cachedResolver();
		const ident = `${type}|${JSON.stringify(resolveOptions)}`;
		const resolver = this.cache2.get(ident);
		if (resolver) return resolver;
		const newResolver = this._create(type, resolveOptions);
		this.cache2.set(ident, newResolver);
		return newResolver;
	}

	_create(type, resolveOptions) {
		resolveOptions = this.hooks.resolveOptions.for(type).call(resolveOptions);
		const resolver = Factory.createResolver(resolveOptions);
		if (!resolver) {
			throw new Error("No resolver created");
		}
		this.hooks.resolver.for(type).call(resolver, resolveOptions);
		return resolver;
	}
};
