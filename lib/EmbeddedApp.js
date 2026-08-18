/**
 * @module EmbeddedApp
 * @description Provides embeddedApp.on and embeddedApp.init for event listening and SDK initialization.
 * Split out from ZohoCrmHelper for use in lightweight bundles (WApp).
 */
var embeddedApp = (function () {
    var appSDK;
    var eventListenerMap = {};
    var initPromise = undefined;

    return {
        /**
         * @function on
         * @description Register an event listener for SDK events.
         * @param {String} event - The event name to listen for.
         * @param {Function} fn - Callback function to execute when the event fires.
         * @example
         * embeddedApp.on("PageLoad", function(data) {
         *     console.log(data);
         * });
         */
        on: function (event, fn) {
            if (!appSDK) {
                if (self.__isInitTriggered) {
                    appSDK = self._getAppSDK();
                    appSDK.getContext().Event.Listen(event, fn);
                } else {
                    // Queue listeners until init is called
                    eventListenerMap[event] = fn;
                }
            } else {
                appSDK.getContext().Event.Listen(event, fn);
            }
        },

        /**
         * @function init
         * @description Initialize the SDK. Must be called once before using SDK methods.
         * @returns {Promise} Resolves when the SDK is fully loaded and ready.
         * @example
         * embeddedApp.init().then(function() {
         *     console.log("SDK Ready");
         * });
         */
        init: function () {
            if (!self.__isInitTriggered) {
                self.__isInitTriggered = true;
                appSDK = self._getAppSDK();
                var promiseResolve;
                initPromise = new Promise(function (resolve, reject) {
                    promiseResolve = resolve;
                });

                appSDK.OnLoad(function () {
                    promiseResolve();
                });

                // Replay any queued event listeners
                for (var key in eventListenerMap) {
                    appSDK.getContext().Event.Listen(key, eventListenerMap[key]);
                }
            }
            return initPromise;
        }
    };
})();

// Expose globally
if (typeof self !== 'undefined') {
    self.embeddedApp = embeddedApp;
} else if (typeof window !== 'undefined') {
    window.embeddedApp = embeddedApp;
}
