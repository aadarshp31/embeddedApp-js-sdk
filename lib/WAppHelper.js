/**
 * @module wapp
 * @description WApp handler — a lightweight SDK interface.
 * Pre-fetches user and org data at initialization time for easy property access.
 * Auto-initializes via Initialization.js — no explicit init() call required.
 * Requires: ZSDK.js, Initialization.js to be loaded first.
 *
 * @example
 * // Await the property to get the full object
 * const user = await wapp.app.user;
 * console.log(user.email);
 *
 * // Or after awaiting once, access directly
 * console.log(wapp.app.user.email);
 * console.log(wapp.app.org.name);
 */
(function (global) {
    'use strict';

    var appSDK;
    var readyResolve;
    var readyPromise = new Promise(function (resolve) {
        readyResolve = resolve;
    });

    /**
     * @namespace wapp.app
     * @description Holds pre-fetched user and org data.
     * Initially these are Promises; once resolved they become plain data objects.
     *
     * Usage:
     *   await wapp.app.user          → full user object
     *   wapp.app.user.email          → user email (after first await or after SDK ready)
     *   await wapp.app.org           → full org object
     *   wapp.app.org.name            → org name (after first await or after SDK ready)
     */
    var app = {};

    // Pre-fetch user data: chains off readyPromise → fires request → stores result
    var userDataPromise = readyPromise.then(function () {
        return appSDK.getContext().Event.Trigger('CRM_EVENT', {
            category: 'READ',
            type: 'APP_META',
            subType: 'USER',
            sdkVersion: self.SDK_VERSION
        }, true);
    }).then(function (data) {
        app.user = data; // Replace promise with actual data object
        return data;
    });

    // Pre-fetch org data: chains off readyPromise → fires request → stores result
    var orgDataPromise = readyPromise.then(function () {
        return appSDK.getContext().Event.Trigger('CRM_EVENT', {
            category: 'READ',
            type: 'APP_META',
            subType: 'ORG',
            sdkVersion: self.SDK_VERSION
        }, true);
    }).then(function (data) {
        app.org = data; // Replace promise with actual data object
        return data;
    });

    // Initially set as promises so `await wapp.app.user` works before data arrives
    app.user = userDataPromise;
    app.org = orgDataPromise;

    // ── Route-sync ─────────────────────────────────────────────────────────
    var _lastHref = null;

    async function  _onRouteChange() {
        if (location.href === _lastHref) return;
        _lastHref = location.href;
        await appSDK.getContext().Event.Trigger('CRM_EVENT', {
            category: 'ROUTE_CHANGE',
            type: 'NAVIGATION',
            data: { newUrl : location.pathname + location.search + location.hash },
            sdkVersion: self.SDK_VERSION
        }, false);
    }

    /**
     * Intercept all route changes and forward to parent.
     * - Wraps pushState/replaceState (browsers emit no event for these — wrapping is the only way).
     * - Listens for popstate (back/forward).
     * No timers, no polling, no custom events.
     */
    function _startRouteSync() {
        _lastHref = location.href; // seed — ignores current URL on startup

        var _push = history.pushState;
        var _replace = history.replaceState;
        history.pushState = function () { _push.apply(this, arguments); _onRouteChange(); };
        history.replaceState = function () { _replace.apply(this, arguments); _onRouteChange(); };
        global.addEventListener('popstate', _onRouteChange());
    }

    /**
     * Internal: get ZSDK instance and wire up OnLoad.
     * Called once at module load time.
     */
    function bootstrap() {
        appSDK = self._getAppSDK();

        appSDK.OnLoad(function () {
            readyResolve();
            _startRouteSync();
        });
    }

    /**
     * @typedef {Object} wapp
     * @description Lightweight WApp handler.
     */
    var handler = {

        app: app,

        /**
         * @function on
         * @description Register an event listener for SDK events.
         * Can be called immediately — listeners are attached to the ZSDK event system
         * which queues them internally until the parent dispatches the event.
         * @memberof wapp
         * @param {String} event - The event name to listen for (e.g., "PageLoad").
         * @param {Function} fn - Callback function invoked when the event fires.
         * @example
         * wapp.on("PageLoad", function(data) {
         *     console.log("Page loaded with data:", data);
         * });
         */
        on: function (event, fn) {
            if (typeof fn !== 'function') {
                throw new TypeError('Event handler must be a function');
            }
            // Event.Listen just pushes to the internal listener array,
            // so it works immediately without waiting for OnLoad.
            appSDK.getContext().Event.Listen(event, fn);
        },

       /**
         * @function emit
         * @description Dispatch an event to the parent window via the ZSDK message channel.
         * Returns a Promise that resolves with the parent's response.
         * Waits for SDK to be ready before sending — safe to call at any time.
         * @memberof wapp
         * @param {String} event - The event name to trigger (e.g., "CRM_EVENT").
         * @param {Object} data - Data to send with the event.
         * @returns {Promise} Resolves with the parent's response.
         * @example
         * wapp.emit("CRM_EVENT", { category: "READ", type: "APP_META", subType: "USER" })
         *     .then(function(data) { console.log(data); });
         */
        emit: function (event, data) {
            if (!event) {
                throw new TypeError('Event name is required');
            }
            return readyPromise.then(function () {
                return appSDK.getContext().Event.Trigger("CRM_EVENT", {
                    category: "APP_TRIGGER_EVENT",
                    action: event,
                    data,
                    sdkVersion: self.SDK_VERSION
                }, true);
            });
        }

    };

    // Auto-bootstrap: wire into the ZSDK instance created by Initialization.js
    bootstrap();

    // Expose as lowercase `wapp`
    global.wapp = handler;

})(typeof self !== 'undefined' ? self : window);