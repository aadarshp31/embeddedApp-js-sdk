

/**
 * @module ZOHO.CRM
 */
var ZOHO = (function() {
    var appSDK;
    var eventListenerMap = {};
    var initPromise = undefined;
    return {
        embeddedApp: {
            on: function(event, fn) {
                // eventListenerMap[event] = fn;
                if(!appSDK){
                    appSDK = self._getAppSDK();
                }
                console.log(appSDK.getContext(),"====== appSDK.getContext()");
                appSDK.getContext().Event.Listen(event, fn);
            },
            init: function() {
            	if(!__isInitTriggered)
            	{
            		__isInitTriggered = true;
                    appSDK = self._getAppSDK();
                    var promiseResolve;
                    initPromise = new Promise(function(resolve, reject) {
                        promiseResolve = resolve;
                    });
                    
                    appSDK.OnLoad(function() {
                        promiseResolve();
                    });

                    for (var key in eventListenerMap) {
                        appSDK.getContext().Event.Listen(key, eventListenerMap[key]);
                    }
            	}
                return initPromise;
            }
        },
        CRM: (function() {
            function newRequestPromise(data) {
                /*
                 * Sdk Version Maintainance
                 */
                data['sdkVersion'] = '1.5';
                return appSDK.getContext().Event.Trigger('CRM_EVENT', data, true);
            }

            function manipulateUI(data) {
                data['category'] = "UI";
                return newRequestPromise(data);
            }

            function action(type, obj) {
                var data = {
                    category: "ACTION",
                    type: type,
                    object: obj
                };
                return newRequestPromise(data);
            }
            return {
                ACTION: {
                    setConfig: function(obj) {
                        return action("CUSTOM_ACTION_SAVE_CONFIG", obj);
                    },
                    enableAccountAccess: function(obj) {
                        return action("ENABLE_ACCOUNT_ACCESS", obj);
                    }
                },
                /**
                 * @namespace ZOHO.CRM.EVENTS
                 */
                EVENTS: {
                    /**
                     * @function dispatch
                     * @description Sends an Event
                     * @memberof ZOHO.CRM.EVENTS
                     * @param {String} event_name - Event Name
                     * @param {Object} event_data - Event Data
                     * @example
                     * ZOHO.CRM.EVENTS.dispatch(event_name, event_data)
                     * .then(function(data){
                     *     console.log(data)
                     * })
                     **/
                    dispatch : function(event_name, event_data){
                        var data = {
                            category : "EVENTS_DISPATCH",//no i18n
                            event_name: event_name, event_data: event_data
                        };
                        return newRequestPromise(data);
                    }
                },
                /**
                 * @module ZOHO.CRM.UI
                 */
                UI: {
                    /**
                     * @namespace ZOHO.CRM.UI
                     */
                    /**
                     * @function Resize
                     * @description Resize Widget to the given dimensions
                     * @param {Object} dimensions - Dimension of Dialer.
                     * @param {Integer} dimensions.height - Height in px
                     * @param {Integer} dimensions.width - Width in px
                     * @returns {Promise} resolved with true | false
                     * @memberof ZOHO.CRM.UI
                     * @example
                     * ZOHO.CRM.UI.Resize({height:"200",width:"1000"}).then(function(data){
                     * 	console.log(data);
                     * });
                     * 
                     * //prints 
                     * True
                     *
                     */
                    Resize: function(data) {
                        var data = {
                            action: "RESIZE",
                            data: {
                                width: data.width,
                                height: data.height
                            }
                        };
                        return manipulateUI(data);
                    },
                    /**
                     * @namespace ZOHO.CRM.UI.Dialer
                     */
                    Dialer: {
                        /**
                         * @function maximize
                         * @description maximizes the CallCenter Window
                         * @returns {Promise} resolved with true | false
                         * @memberof ZOHO.CRM.UI.Dialer
                         */
                        maximize: function() {
                            var data = {
                                action: {
                                    telephony: "MAXIMIZE"
                                }
                            };
                            return manipulateUI(data);
                        },
                        /**
                         * @function minimize
                         * @description minimize the CallCenter Window
                         * @returns {Promise}  resolved with true | false
                         * @memberof ZOHO.CRM.UI.Dialer
                         */
                        minimize: function() {
                            var data = {
                                action: {
                                    telephony: "MINIMIZE"
                                }
                            };
                            return manipulateUI(data);
                        },
                        /**
                         * @function notify
                         * @description notify The user with an audible sound
                         * @returns {Promise} resolved with true | false
                         * @memberof ZOHO.CRM.UI.Dialer
                         */
                        notify: function() {
                            var data = {
                                action: {
                                    telephony: "NOTIFY"
                                }
                            };
                            return manipulateUI(data);
                        },
                    }

                }
            };
        })()
    }
})();


(function (global) {
    let zsdk;

    function newRequestPromise(data) {
        data['sdkVersion'] = "1.5";
        // if (!self.__isInitTriggered) {
        //     console.error(new Error('ZDK methods called before init'));
        //     return;
        // }
        if (!zsdk) {
            zsdk = self._getAppSDK();
            // delete self._getAppSDK;
            // delete self.instance;
        }
        console.log(zsdk.getContext().Event.Trigger);
        return zsdk.getContext().Event.Trigger("ZDK_EVENT", data, true);
    }

    /**
     * @module ZDK
     */
    var ZDK = {

        /**
        * @namespace ZDK.Client
        */
        Client: (function () {

            return {
                /**
                * @description Send response to Client Script
                * @memberof ZDK.Client
                * @function
                * @param {String} request_uuid - unique id received in 'NotifyAndWait' event of the flyout widget
                * @param {Any} [data] - response to be passed
                * @example <caption>Sample</caption>
                * ZDK.Client.sendResponse('0deec96f-2d55-4349-ace9-d45499fd004c', { choice: 'mail', value: 'example@zoho.com' });
                */
                sendResponse: function (request_id, data) {
                    return newRequestPromise({ // no i18n
                        action: 'notify_response', // No i18n
                        message: {
                            data,
                            uuid: request_id
                        }
                    });
                },
                notify: function (event_name, data) {
                    return newRequestPromise({ // no i18n
                        action: 'notify', // No i18n
                        type: event_name,
                        data
                    });
                },
                /**
                 * @function
                 * @summary Show a toast message in Page with following markdown support.
                 * @description Note: The presence of an active loader restricts the availability of other pop-ups. Image Markdown not supported for showMessage.
                 * <br>&nbsp;
                 *<pre style='background-color: #f8faff'><code>Italics       - _text_
                *<br>Bold        - *text*
                *<br>Underline   - __text__
                *<br>Strikeout   - ~text~
                *<br>Code        - `text`
                *<br>Heading1    - # text
                *<br>Heading3    - ### text
                *<br>Blockquote  - !text
                *<br>Hyperlink   - [click here](https://www.zoho.com)</code></pre>
                *<br>
                * @memberof ZDK.Client
                * @param {String} message - text to be displayed
                * @param {Object=} options - message options
                * @param {('info' | 'error' | 'warning' | 'success')} [options.type=info] - type of message
                * @example <caption>Warning with bold</caption>
                * ZDK.Client.showMessage('This is an *important* warning.', { type: 'warning' });
                */
                showMessage: async function (text, options) {
                    if (typeof text === 'string' || text instanceof String) {
                        return newRequestPromise({
                            action: 'msg_band',
                            type: (options && options.type) ? options.type : 'info',
                            message: text
                        }); // No i18n
                    } else {
                        throw new TypeError('First argument must be a String'); // no i18n
                    }
                },

                 /**
                 * @function
                 * @summary Show confirmation box with markdown support and accept/reject message.
                 * @description Note: The presence of an active loader restricts the availability of other pop-ups.
                 * @memberof ZDK.Client
                 * @param {String} message - text to be displayed
                 * @param {String} [accept_message=Yes, Proceed] - accept button message
                 * @param {String} [reject_message=Cancel] - reject button message
                 * @returns {Boolean} confirmation response
                 * @example <caption>Simple Confirmation Box</caption>
                 * ZDK.Client.showConfirmation('Are you sure?');
                 *
                 * @example <caption>Customised Confirmation Box</caption>
                 * ZDK.Client.showConfirmation('Are you *sure*?', 'Yes. Got it!', 'Nope');
                 * @example <caption>Output</caption>
                 * true | false
                 */
                showConfirmation: async function (message, accept_message, reject_message) {
                    if (typeof message === 'string' || message instanceof String) {
                        return newRequestPromise({
                            action: 'confirm',
                            accept_message,
                            reject_message,
                            acceptMsg: accept_message,
                            rejectMsg: reject_message,
                            message
                        }, {
                            userInput: true
                        }); // No i18n
                    } else {
                        throw new TypeError('First argument must be a String'); // no i18n
                    }
                },

                /**
                 * @function
                 * @summary Show Alert message with markdown support.
                 * @description Note: The presence of an active loader restricts the availability of other pop-ups.
                 * @memberof ZDK.Client
                 * @param {String} message - primary text to be displayed
                 * @param {String} [heading] - heading to be displayed
                 * @param {String} [accept_message=Okay] - accept button message
                 * @example <caption>Simple Alert</caption>
                 * ZDK.Client.showAlert('First Name will be mandatory from next week');
                 * 
                 * @example <caption>Customised Alert with link, heading and button message</caption>
                 * ZDK.Client.showAlert('You can [click here](https://www.zylker.com) to visit the page.', 'Notice', 'Got it!');
                 * @example <caption>Alert with bold, break and underline</caption>
                 * ZDK.Client.showAlert('This is an __important__ message\n This is an *important* message');
                 * @example <caption>Alert with image</caption>
                 * ZDK.Client.showAlert('![alt text](https://link-to/sample.png)');
                 */
                showAlert: async function (message, heading, accept_message) {
                    if (typeof message === 'string' || message instanceof String) {
                        return newRequestPromise({
                            action: 'alert',
                            message,
                            heading,
                            accept_message
                        }, {
                            userInput: true
                        }); // No i18n
                    } else {
                        throw new TypeError('First argument must be a String'); // no i18n
                    }
                },
                
                /**
                 * @function
                 * @summary Get one or more input.
                 * @description Note: The presence of an active loader restricts the availability of other pop-ups.
                 * @memberof ZDK.Client
                 * @param {Object} options
                 * @param {Array<{ type: 'text' | 'number' | 'textarea' | 'picklist' | 'multiselectpicklist'}>} [options.type = 'text'] - Max Value Limit
                 * Input options - 7
                 * <br> `text` - 120 characters
                 * <br> `number` - 50 digits
                 * <br> `textarea` - 2000 characters
                 * <br> `picklist options` - 2000 options (each option - 120 characters)
                 * <br> `multiselectpicklist options` - 2000 options (each option - 120 characters)
                 * @param {String} [options.label] - label for input field
                 * @param {(String | Array)} [options.default_value] - multiselectpicklist accepts array of Strings, others accept String as default value
                 * @param {Array<{actual_value: string, display_value: string}>} [options.list_options] - list of options for picklist
                 * @param {String} [heading] - Heading
                 * @param {String} [accept_message=Okay] - accept button message
                 * @param {String} [reject_message=Cancel] - reject button message
                 * @returns {Object} Get input response
                 * @example <caption>Text Input</caption>
                 * ZDK.Client.getInput([{ type: 'number', label: 'Enter No. of employees' }, { type: 'text', label: 'Enter batch name' }], 'Employees', 'OK', 'Cancel');
                 * @example <caption>Output</caption>
                     * ['120', 'Batch A']
                 * @example <caption>Default value sample</caption>
                 * ZDK.Client.getInput([{ type: 'textarea', label: 'Enter batch name', default_value:'sample' }], 'Employees', 'OK', 'Cancel');
                 * @example <caption>Output</caption>
                     * ['sample']
                 * @example <caption>For picklist,</caption>
                 * ZDK.Client.getInput([{ type: 'picklist', label: 'Enter branch', list_options: [{ actual_value: "Sales", display_value: "Sales Department" }, { actual_value: "HR", display_value: "HR Department" }], default_value:"HR" }], 'Employees', 'OK', 'Cancel');
                 * @example <caption>Output</caption>
                     * ['HR']
                 * @example <caption>For multiselectpicklist,</caption>
                 * ZDK.Client.getInput([{ type: 'multiselectpicklist', label: 'Areas of Interest', list_options: [{ actual_value: "Artificial Intelligence", display_value: "Artificial Intelligence (AI)" }, { actual_value: "Data Analytics", display_value: "Data Analytics" }, { actual_value: "Cybersecurity", display_value: "Cybersecurity" }], default_value:["Artificial Intelligence", "Cybersecurity"] }], 'Interest Areas', 'OK', 'Cancel');
                 * @example <caption>Output</caption>
                     * [['Artificial Intelligence', 'Cybersecurity']]
                 */
                getInput: async function (options, heading, accept_message, reject_message) {
                    if (options) {
                        if (!Array.isArray(options)) {
                            throw new TypeError('options should be an array'); // no i18n
                        } else if (options.length > 7) {
                            throw new Error('Max input limit of 7 reached'); // no i18n
                        } else {
                            options.forEach(option => {
                                const {
                                    type,
                                    label,
                                    default_value,
                                    list_options
                                } = option;
                                if (!['text', 'number', 'textarea', 'picklist', 'multiselectpicklist'].includes(type)) {
                                    throw new TypeError(`unsupported field type : ${type}`); // no i18n
                                }
                                if (label) {
                                    if (typeof label !== 'string') {
                                        throw new TypeError(`label can only be string: ${label}`);
                                    }
                                    if (label.length > 30) {
                                        throw new Error(`label must be atmost 30 characters: ${label}`);
                                    }
                                }
                                if (['picklist', 'multiselectpicklist'].includes(type) && (!list_options || list_options.length === 0)) {
                                    throw new Error(`The ${type} does not contain any options`);
                                }
                                if ((typeof default_value === 'string' && (default_value === "" || (default_value && default_value.trim().length === 0))) ||
                                    (default_value && typeof default_value === 'Array' && default_value.length === 0)) {
                                    throw new Error(`default value cannot be empty`);
                                }
                                const type_vs_default_value_length = {
                                    text: 120,
                                    number: 50,
                                    textarea: 2000,
                                    picklist: 120,
                                    'multiselectpicklist': 120
                                };
                                const max_length = type_vs_default_value_length[type];
                                if (default_value) {
                                    if (type === 'multiselectpicklist') {
                                        if (!Array.isArray(default_value)) {
                                            throw new TypeError(`default_value can only be an Array for multiselectpicklist. Provided: '${default_value}'`);
                                        }
                                    } else if (typeof default_value !== 'string') {
                                        throw new TypeError(`default_value can only be string: ${default_value}`);
                                    }
                                    if (!['picklist', 'multiselectpicklist'].includes(type) && default_value.length > max_length) {
                                        throw new Error(`default_value must be atmost ${max_length} characters for ${type} field`);
                                    }
                                    if (type === 'picklist') {
                                        if (!list_options.some(item => item.actual_value === default_value)) {
                                            throw new Error(`provided default_value: '${default_value}' did not match with any of the actual values in the list of options`);
                                        }
                                    } else if (type === 'multiselectpicklist') {
                                        default_value.forEach(value => {
                                            if (!list_options.some(item => item.actual_value === value)) {
                                                throw new Error(`provided default_value: '${value}' did not match with any of the actual values in the list of options`);
                                            }
                                        });
                                    }
                                }
                                if (list_options) {
                                    if (!Array.isArray(list_options)) {
                                        throw new Error('list_options should be an array'); // no i18n
                                    }
                                    if (list_options.length > 2000) {
                                        throw new Error(`list_options can have atmost 2000 options`);
                                    }
                                    const actual_value_list = new Set();
                                    const display_value_list = new Set();
                                    list_options.forEach(item => {
                                        if (item.hasOwnProperty("actual_value") && item.hasOwnProperty("display_value")) {
                                            const {
                                                actual_value,
                                                display_value
                                            } = item;
                                            let invalid_option = ((actual_value.length > max_length) && actual_value) ||
                                                ((display_value.length > max_length) && display_value);
                                            if (invalid_option) {
                                                throw new Error(`Each options in list_options must be atmost '${max_length}' characters. Option: '${invalid_option}' exceeds the limit`);
                                            }
                                            if (actual_value === "" || actual_value.trim().length === 0) {
                                                throw new Error(`actual_value in list_options can't be empty`);
                                            } else if (display_value === "" || display_value.trim().length === 0) {
                                                throw new Error(`display_value in list_options can't be empty`);
                                            } else if (actual_value_list.has(actual_value)) {
                                                throw new Error(`duplicate actual_value: '${actual_value}' found in list_options`);
                                            } else if (display_value_list.has(display_value)) {
                                                throw new Error(`duplicate display_value: '${display_value}' found in list_options`);
                                            } else {
                                                actual_value_list.add(actual_value);
                                                display_value_list.add(display_value);
                                            }
                                        } else {
                                            throw new Error(`each option in list_options must contain actual_value and display_value. list_option: ${JSON.stringify(item)} is invalid`);
                                        }
                                    });
                                }
                            });
                        }
                    }
                    const is_limit_exceeded = accept_message && accept_message.length > 40;
                    if (reject_message && reject_message.length > 40 || is_limit_exceeded) {
                        throw new Error(`${is_limit_exceeded ? 'accept_message' : 'reject_message'} must be atmost 40 characters`); // no i18n
                    }
                    return newRequestPromise({
                        action: 'get_input',
                        options,
                        accept_message,
                        reject_message,
                        heading
                    }, {
                        userInput: true
                    });
                },

                /**
                 * @summary Open popup widget and await a response from the widget's <a href="https://help.zwidgets.com/help/v1.2/$Client.html#.close" target='_blank'>$Client.close()</a>. Moreover, custom data can be passed to widget's <a href="https://help.zwidgets.com/help/v1.2/index.html" target='_blank'>'PageLoad'</a> event. Supported Widget SDK version >= 1.2.
                 * @description Note: The presence of an active loader restricts the availability of other pop-ups.
                 * @memberof ZDK.Client
                 * @function
                 * @returns {object | string | number | boolean} Response from widget's <a href="https://help.zwidgets.com/help/v1.2/$Client.html#.close" target='_blank'>$Client.close()</a>
                 * @param {Object} config
                 * @param {String} config.api_name - api name of the widget(Custom Button type)
                 * @param {String} config.type - widget
                 * @param {String} [config.header=${widget name}] - header for the popup
                 * <br>&nbsp;&nbsp;`undefined` - hides the header
                 * @param {Boolean} [config.close_icon=true] - toggle close icon
                 * @param {Boolean} [config.close_on_escape=false] - toggle close on Esc key
                 * @param {(1 | 2 | 3 | 4 | 5 | 6)} [config.animation_type=1] - define the animation style of the popup
                 * <br>&nbsp;&nbsp;`1` - slides popup from top
                 * <br>&nbsp;&nbsp;`2` - slides popup from right
                 * <br>&nbsp;&nbsp;`3` - slides popup from left
                 * <br>&nbsp;&nbsp;`4` - slides popup from bottom
                 * <br>&nbsp;&nbsp;`5` - fades in and fades out the popup
                 * <br>&nbsp;&nbsp;`6` - zoom in and zoom out the popup
                 * @param {('200px' | '20vh')} [config.height='70vh'] - popup height
                 * @param {('500px' | '50vw')} [config.width='60vw'] - popup width
                 * @param {('0' | '20px' | 'center')} [config.top='0'] - popup offset > top
                 * @param {('0' | '20px' | 'center')} [config.left='center'] - popup offset > left
                 * @param {('0' | '20px' | 'center')} [config.bottom] - popup offset > bottom (overrides top property)
                 * @param {('0' | '20px' | 'center')} [config.right] - popup offset > right (overrides left property)
                 * @param {any} [data] - data to be passed as <a href="https://help.zwidgets.com/help/v1.2/index.html" target='_blank'>'PageLoad'</a> event data in Widget
                 * @example <caption>Sample</caption>
                 * ZDK.Client.openPopup({ api_name: 'sample_widget', type: 'widget', header: 'Sample Widget', animation_type: 4, height: '450px', width: '450px', left: '10px' }, { data: 'sample data to be passed to "PageLoad" event of widget' });
                 */
                openPopup: async function (config, data) {
                    const {
                        id,
                        type,
                        api_name,
                        ...conf
                    } = config;
                    if (type !== 'widget' && type !== 'crux' && type != 'slyteui') {
                        throw new Error(`unsupported popup type: ${type}`);
                    }
                    if (type === 'crux' && !['record_create', 'record_edit', 'record_detail', 'record_clone'].includes(api_name)) {
                        throw new Error(`unsupported crux type: ${api_name}`);
                    }
                    if(type === 'slyteui' && typeof data == 'object' && (Array.isArray(data.data) || typeof data.data !== 'object')) {
                        throw new TypeError('data must be a JSON object for slyteui type');
                    }
                    conf.offset = Object.assign({
                        top: '0px',
                        left: 'center'
                    }, Object.fromEntries(Object.entries(conf).filter(x => ['top', 'bottom', 'left', 'right'].includes(x[0]))));
                    if (conf.animation_type && [1, 2, 3, 4, 5, 6].indexOf(conf.animation_type) == -1) {
                        throw new TypeError('animation type should be in (1,2,3,4,5,6)'); // no i18n
                    }
                    if (conf.header && conf.header.length > 50) {
                        throw new Error('header must be atmost 50 characters');
                    }
                    return newRequestPromise({
                        action: 'open_widget_by_id',
                        id,
                        type,
                        api_name,
                        data,
                        config: conf
                    }, {
                        userInput: true
                    }); // No i18n
                },

                /**
                 * @function
                 * @summary Display the loader with message.
                 * @description Note: The presence of an active loader restricts the availability of other pop-ups.
                 * @memberof ZDK.Client
                 * @param {Object} config
                 * @param {('page')} [config.type = 'page'] - type of loader
                 * @param {('spinner' | 'vertical-bar' | 'standard')} [config.template = 'standard'] - templates of loader (Note: spinner and vertical bar can be used when invoking time consuming APIs)
                 * @param {('String')} [config.message = null] - message to be displayed 
                 * `limit` 240 characters
                 * @example <caption>Sample</caption>
                 * ZDK.Client.showLoader({type: 'page', template:'vertical-bar', message: 'Loading ...'});
                 */
                showLoader: async function (config) {
                    config = config || {
                        type: 'page',
                        template: 'standard'
                    };
                    if (config.template === '' || (config.template && config.template.trim().length === 0)) {
                        throw new Error('Invalid Loader Template'); // no i18n
                    }
                    if (config.type === '' && config.type.trim().length === 0) {
                        throw new Error('Invalid Loader Type'); // no i18n
                    }
                    config.type = config.type || (config.type = 'page');
                    config.template = config.template || (config.type === 'page' ? 'standard' : 'spinner');
                    if (!['page'].includes(config.type)) {
                        throw new TypeError('Invalid Loader Type'); // no i18n
                    }
                    if (!((config.type === 'page' && (['spinner', 'vertical-bar', 'standard', 'dot-spinner'].includes(config.template))))) {
                        throw new Error('Invalid Loader Template'); // no i18n
                    }
                    if (config.message && config.message.length > 240) {
                        throw new Error('Loader message must be atmost 240 characters'); // no i18n
                    }
                    return newRequestPromise({
                        action: 'show_loader',
                        type: config.type,
                        template: config.template,
                        message: config && config.message ? config.message : '',
                    }, {
                        loading: (config.type === 'page' && config.template !== 'standard')
                    });
                },
                /**
                 * @function
                 * @summary Hides the Loader 
                 * @memberof ZDK.Client
                 * @example <caption>Sample</caption>
                 * ZDK.Client.hideLoader();
                 */
                hideLoader: function () {
                    return newRequestPromise({
                        action: 'hide_loader', // No i18n
                    }, {
                        loading: false
                    });
                }
            }
        })()
    };

    global.ZDK = ZDK;
})(typeof self !== "undefined" ? self : window);
