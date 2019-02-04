'use strict'
const initSpy = require('../wSpy')
const {defaultSettings, noopSpy} = require('./wSpyDefaultData')

function getSpyParam(url) {
	return (url.match('[?&]w[sS]py=([^&]+)') || ['', ''])[1]
}

function hasWindowWithParent() {
	return typeof window !== 'undefined' && typeof window.parent !== 'undefined'
}

function getFirstLoadedSpy() {
	try {
		return hasWindowWithParent() && typeof window.parent.wSpy !== 'undefined' && window.parent.wSpy
	} catch (e) {
		return null
	}
}

function getUsedMemory(performance) {
	return performance && performance.memory && performance.memory.usedJSHeapSize
}

function init({settings}) {
	try {
		const shouldSpy = hasWindowWithParent()
		const wSpyParam = getSpyParam(window.parent.location.href)
		if (!wSpyParam || !shouldSpy) {
			return noopSpy
		}
		const wSpy = initSpy.init({
			Error: window.Error,
			memoryUsage: function() {
				return getUsedMemory(window.performance) || 0
			},
			frame: window,
			wSpyParam,
			settings: Object.assign({}, defaultSettings, settings)
		})

		const quickestSpy = getFirstLoadedSpy()
		if (quickestSpy) {
			wSpy.initStack = new Error().stack
			wSpy.logs = quickestSpy.logs || wSpy.logs
			if ((quickestSpy.ver || 0) < wSpy.ver || 0) {
				// newer version hijacks quickest
				quickestSpy.logs = wSpy.logs // to be moved after all spies have 'logs' property
				wSpy.otherSpies = [quickestSpy, ...quickestSpy.otherSpies || []]
				window.parent.wSpy = wSpy
			} else {
				quickestSpy.otherSpies.push(wSpy)
			}
			return wSpy
		}
		if (shouldSpy) {
			window.parent.wSpy = wSpy
			wSpy.initStack = new Error().stack
			return wSpy
		}
		return noopSpy
	} catch (e) {
		return noopSpy
	}
}

module.exports = {
	init
}
