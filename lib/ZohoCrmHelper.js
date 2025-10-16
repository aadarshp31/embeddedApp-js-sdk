var __isInitTriggered = false;

(() => {
    let instance;

    function getAppSDK() { // move to closure
        if(!instance){
            instance = new ZSDK({
                registrationMeta : {
                    sdkVersion : '1.5'
                }
            });
        }
        
        return instance;
    };

    self._getAppSDK = getAppSDK;
})();

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
                eventListenerMap[event] = fn;
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
            // file upload issue fie
            function createNewFileObj(file)
            {
				var oldfile = file;
				var newfile = new File([oldfile], oldfile.name, { type: oldfile.type });
	         	return newfile;
            }
            

            function constructQueryString(source) {
                var array = [];

                for (var key in source) {
                    array.push(encodeURIComponent(key) + "=" + encodeURIComponent(source[key]));
                }
                return array.join("&");
            };

            function remoteCall(method, requestData, type) {
            	if(requestData.FILE)
        		{
            		var newfileobj = createNewFileObj(requestData.FILE.file);
            		requestData.FILE.file = newfileobj;
        		}
                var reqData = undefined;
                if (!type) {
                    var url = requestData.url;
                    var params = requestData.params;
                    var headers = requestData.headers;
                    var body = requestData.body;
                    var Parts = requestData.PARTS;
                    var partBoundary = requestData.PART_BOUNDARY;
                    var ContentType = requestData.CONTENT_TYPE;
                    var responseType = requestData.RESPONSE_TYPE;
                    var file = requestData.FILE;
                    if (!url) {
                        throw { Message: "Url missing" }
                    }
                    if (params) {
                        var queryString = constructQueryString(params);
                        url += (url.indexOf("?") > -1 ? "&" : "?") + queryString;
                    }
                    reqData = {
                        url: url,
                        Header: headers,
                        Body: body,
                        CONTENT_TYPE: ContentType,
                        RESPONSE_TYPE: responseType,
                        PARTS: Parts,
                        PARTS_BOUNDARY:partBoundary,
                        FILE: file
                    }
                } else {
                    reqData = requestData;
                }

                var data = {
                    category: "CONNECTOR", //no i18n
                    nameSpace: method,
                    data: reqData,
                    type:type
                };
                return newRequestPromise(data);
            };

            function manipulateUI(data) {
                data['category'] = "UI";
                return newRequestPromise(data);
            }

            function config(type, nameSpace,requestData) {
                var data = {
                    category: "CONFIG",
                    type: type,
                    nameSpace: nameSpace,
                    APIData : requestData
                };
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

            var HTTPRequest = {
                POST: "wget.post",
                GET: "wget.get",
                PUT: "wget.put",
                PATCH: "wget.patch",
                DELETE: "wget.delete"
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
                 * @namespace ZOHO.CRM.API
                 */
                API: {
                    /**
                     * @function getOrgVariable
                     * @memberof ZOHO.CRM.API
                     * @description get plugins configuration data
                     * @returns {Promise} Resolved with Plugin Configuration
                     * @example
                     * Example - 1:
                     * ZOHO.CRM.API.getOrgVariable("variableNamespace").then(function(data){
                     * 	console.log(data);
                     * });
                     * 
                     * //prints 
                     *{
                     *  "Success": {
                     *   "Content": "12345"
                     *  }
                     *}
                     *
                     *
                     *
                     *  Example - 2:
                     *
                     * var data = {apiKeys:["key1","key2","ke3"]};
                     * ZOHO.CRM.API.getOrgVariable(data).then(function(data){
                     *      console.log(data);
                     * });
                     *
                     *
                     *{
                     *"Success":
                     *{
                     *   "content": {
                     *      "apikey": {
                     *         "value": "BNMMNBVHJ"
                     *      },
                     *      "authtoken": {
                     *         "value": "IUYTRERTYUI"
                     *      },
                     *      "apiscret": {
                     *         "value": "848ksmduo389jd"
                     *      }
                     *   }
                     *}
                     *}
                     *
                     *
                     */
                    getOrgVariable: function(nameSpace) {
                        return config("VARIABLE", nameSpace);
                    }
                },
                /**
                 * @namespace ZOHO.CRM.UI
                 */
                UI: {
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
                        }
                    }

                },
                /**
                 * @namespace ZOHO.CRM.HTTP
                 */
                HTTP: {
                    /**
                     * @function get
                     * @description Invoke  HTTP get
                     * @returns {Promise} resolved with response of the initiated request
                     * @memberof ZOHO.CRM.HTTP
                     * @param {Object} request - Request Object
                     * @param {Object} request.params - Request Params
                     * @param {Object} request.headers - Request Headers
                     * @example
                     * var request ={
                     * 	url : "https://crm.zoho.com/crm/private/xml/Users/getUsers",
                     * 	params:{
                     * 		scope:"crmapi",
                     * 		type:"AllUsers"
                     * 	},
                     * 	headers:{
                     *	 	Authorization:"******************************",
                     * 	}
                     * }
                     * ZOHO.CRM.HTTP.get(request)
                     * .then(function(data){
                     *     console.log(data)
                     * })
                     * 
                     * //Prints
                     * {
                     *   "users": {
                     *     "user": [
                     *       {
                     *         "zip": "null",
                     *         "country": "null",
                     *         "website": "null",
                     *         "role": "Acquisition Manager",
                     *         "city": "null",
                     *         "timezone": "Asia\/Calcutta",
                     *         "profile": "Administrator",
                     *         "mobile": "null",
                     *         "language": "en_US",
                     *         "content": "Patricia Boyle",
                     *         "zuid": "51857638",
                     *         "confirm": "true",
                     *         "phone": "null",
                     *         "street": "null",
                     *         "id": "1475615000000083003",
                     *         "state": "null",
                     *         "fax": "null",
                     *         "email": "naresh.babu+demo1@zylker.com",
                     *         "status": "active"
                     *       },
                     *       {
                     *         "zip": "null",
                     *         "country": "null",
                     *         "website": "null",
                     *         "role": "Standard",
                     *         "city": "null",
                     *         "timezone": "Asia\/Calcutta",
                     *         "profile": "testProfile",
                     *         "mobile": "null",
                     *         "language": "en_US",
                     *         "content": "Naresh Babu",
                     *         "zuid": "61712147",
                     *         "confirm": "true",
                     *         "phone": "null",
                     *         "street": "null",
                     *         "id": "1475615000000185001",
                     *         "state": "null",
                     *         "fax": "null",
                     *         "email": "naresh.babu+demo2@zylker.com",
                     *         "status": "active"
                     *       }
                     *     ]
                     *   }
                     * }
                     */
                    get: function(data) {
                        return remoteCall(HTTPRequest.GET, data);
                    },
                    /**
                     * @function post
                     * @description Invoke HTTP post
                     * @returns {Promise} resolved with response of the initiated request
                     * @memberof ZOHO.CRM.HTTP
                     * @param {Object} request - Request Object
                     * @param {Object} request.params - Request Params
                     * @param {Object} request.headers - Request Headers
                     * @param {Object} request.body - Request Body
                     * @example
                     * var data ='<Contacts><row no="1"><FL val="First Name">Amy</FL><FL val="Last Name">Dawson</FL><FL val="Email">testing@testing.com</FL><FL val="Title">Manager</FL><FL val="Phone">1234567890</FL><FL val="Mobile">292827622</FL><FL val="Account Name"> <![CDATA["A & A"]]> </FL></row></Contacts>';
                     * var request ={
                     * 		url : "https://crm.zoho.com/crm/private/xml/CustomModule1/insertRecords",
                     * 		params:{
                     * 			scope:"crmapi",
                     * 			xmlData:data
                     * 		},
                     * 		headers:{
                     * 	 		Authorization:"******************************",
                     * 		}
                     * }
                     * ZOHO.CRM.HTTP.post(request)
                     * .then(function(data){
                     *     console.log(data)
                     * })
                     * 
                     * //Prints
                     *<?xml version="1.0" encoding="UTF-8"?>
					 *<response uri="/crm/private/xml/Contacts/insertRecords">
					 *  <result>
					 *    <message>Record(s) added successfully</message>
					 *    <recorddetail>
				 	 *      <FL val="Id">457154000000952001</FL>
					 *      <FL val="Created Time">2018-10-24 13:55:56</FL>
					 *      <FL val="Modified Time">2018-10-24 13:55:56</FL>
					 *      <FL val="Created By"><![CDATA[NareshAutomation]]></FL>
					 *      <FL val="Modified By"><![CDATA[NareshAutomation]]></FL>
					 *    </recorddetail>
					 *  </result>
					 *</response>
                     */
                    post: function(data) {
                        return remoteCall(HTTPRequest.POST, data);
                    },
                    /**
                     * @function put
                     * @description Invoke HTTP put
                     * @returns {Promise} resolved with response of the initiated request
                     * @memberof ZOHO.CRM.HTTP
                     * @param {Object} request - Request Object
                     * @param {Object} request.params - Request Params
                     * @param {Object} request.headers - Request Headers
                     * @param {Object} request.body - Request Body
                     * @example
                     * var apidata =[
                     *{
                     *	"Last_Name":"testupdate",
                     *	id:"457154000000952001"
                     *}
                     *]
                     *
                     *
                     * var request ={
                     *      url : "https://crm.zoho.com/crm/v2/Contacts",
                     *      headers:{
                     *          Authorization:"******************************",
                     *      },
                     *      body:{data:apidata}
                     * }
                     * ZOHO.CRM.HTTP.put(request)
                     * .then(function(data){
                     *     console.log(data)
                     * })
                     * 
                     * //Prints
                     *{
					 *  "data": [
					 *    {
					 *      "code": "SUCCESS",
					 *      "details": {
					 *        "Modified_Time": "2018-10-24T14:08:57+05:30",
					 *        "Modified_By": {
					 *          "name": "NareshAutomation",
					 *          "id": "457154000000148011"
					 *        },
					 *        "Created_Time": "2018-10-24T13:55:56+05:30",
					 *        "id": "457154000000952001",
					 *        "Created_By": {
					 *          "name": "NareshAutomation",
					 *          "id": "457154000000148011"
					 *        }
					 *      },
					 *      "message": "record updated",
					 *      "status": "success"
					 *    }
					 *  ]
					 *}
                     */
                    put: function(data) {
                        return remoteCall(HTTPRequest.PUT, data);
                    },
                    /**
                     * @function patch
                     * @description Invoke HTTP patch
                     * @returns {Promise} resolved with response of the initiated request
                     * @memberof ZOHO.CRM.HTTP
                     * @param {Object} request - Request Object
                     * @param {Object} request.params - Request Params
                     * @param {Object} request.headers - Request Headers
                     * @param {Object} request.body - Request Body
                     * @example
                     * var data ={
                     * name:"name",
                     * age:"23"
                     * };
                     * var request ={
                     *      url : "https://www.example.com/patch",
                     *      params:{
                     *          scope:"apiscope",
                     *      },
                     *      headers:{
                     *          Authorization:"******************************",
                     *      },
                     *      body:data
                     * }
                     * ZOHO.CRM.HTTP.patch(request)
                     * .then(function(data){
                     *     console.log(data)
                     * })
                     * 
                     * //Prints
                     * 
                     *{
					 *  "args": {},
					 *  "data": "",
					 *  "files": {},
					 *  "form": {},
					 *  "headers": {
					 *    "Accept": "application/json",
					 *    "Accept-Language": "en-GB,en-US;q=0.9,en;q=0.8",
					 *    "Content-Length": "0"
					 *  },
					 *  "json": null,
					 *  "url": "https://www.example.com/patch"
					 *}
                     * 
                     */
                    patch: function(data) {
                        return remoteCall(HTTPRequest.PATCH, data);
                    },
                    /**
                     * @function delete
                     * @description Invoke HTTP delete
                     * @returns {Promise} resolved with response of the initiated request
                     * @memberof ZOHO.CRM.HTTP
                     * @param {Object} request - Request Object
                     * @param {Object} request.params - Request Params
                     * @param {Object} request.headers - Request Headers
                     * @param {Object} request.body - Request Body
                     * @example
                     * var request ={
                     *      url : "https://crm.zoho.com/crm/v2/Leads/111158000000045188",
                     *      headers:{
                     *          Authorization:"******************************",
                     *      }
                     * }
                     * ZOHO.CRM.HTTP.delete(request)
                     * .then(function(data){
                     *     console.log(data)
                     * })
                     * 
                     * //Prints
                     * 
                     *{
                     *  "data": [
                     *    {
                     *      "code": "SUCCESS",
                     *      "details": {
                     *        "id": "111158000000045188"
                     *      },
                     *      "message": "record deleted",
                     *      "status": "success"
                     *    }
                     *  ]
                     *}
                     * 
                     */
                    delete: function(data) {
                        return remoteCall(HTTPRequest.DELETE, data);
                    }
                },
                /**
                 * @namespace ZOHO.CRM.CONNECTOR
                 */
                CONNECTOR: {
                    /**
                     * @function invokeAPI
                     * @description Invokes Connector API 
                     * @returns {Promise} resolved with response of the Connector API
                     * @memberof ZOHO.CRM.CONNECTOR
                     * @param {String} nameSpace - NameSpace of Connector API to invoke
                     * @param {Object} data - Connector API Data
                     * @param {Object} data.VARIABLES - Dynamic Data represented by placeholders in connectorAPI
                     * @param {Object} data.CONTENT_TYPE - ContentType - multipart for multipart request
                     * @param {Array} data.PARTS - For multipart request provide parts config here
                     * @param {Object} data.FILE - To include a file in your multipart request 
                     * @example
                     * var data = {
                     *      "apikey" : "*********", 
                     *      "First_Name" : "Naresh",  
                     *      "Last_Name" : "Babu", 
                     *      "email" : "naresh.babu@zylker.com"
                     * }
                     * ZOHO.CRM.CONNECTOR.invokeAPI("MailChimp.sendSubscription",data)
                     * .then(function(data){
                     *     console.log(data)
                     * })
                     * @example
                     *  
                     * var data = {
                     *     "CONTENT_TYPE":"multipart",
                     *     "PARTS":[
                     *               {
                     *                   "headers": {  
                     *                       "Content-Type": "application/json"
                     *                   },
                     *                   "content": {"mimeType": "application/vnd.google-apps.folder", "title": "NareshFolder"
                     *                   }
                     *               }
                     *             ]
                     *   }
                     *   ZOHO.CRM.CONNECTOR.invokeAPI("ex10.testconnector.uplaodfile",data)
                     *   .then(function(data){
                     *       console.log(data)
                     *   })
                     * @example
                     * var file = document.getElementById("File").files[0];
                     * var fileType;
                     *   if (file.type === "application/pdf"){
                     *     fileType = file.type;
                     *   }
                     *   else if(file.type === "image/jpeg"){
                     *     fileType = file.type;
                     *   }
                     *   else if(file.type === "text/plain"){
                     *     fileType = "application/msword";
                     *   }
                     *   else if(file.type === ""){
                     *     fileType = "application/msword";
                     *   }
					
                     *   console.log(file);
                     *   var data = {
                     *     "VARIABLES":{
                     *       "pathFileName" : "/Zoho CRM/myFile/"+file.name
                     *     },
                     *     "CONTENT_TYPE":"multipart",
                     *     "PARTS":[
                     *               {
                     *                 "headers": {  
                     *                   "Content-Type": "application/json"
                     *                 },
                     *                 "content": {"mimeType": fileType,"description": "TestFile to upload", "title":file.name}
                     *               },{
                     *                 "headers": {
                     *                   "Content-Disposition": "file;"
                     *                 },
                     *                 "content": "__FILE__"
                     *               }
                     *             ],
                     *     "FILE":{
                     *       "fileParam":"content",
                     *       "file":file
                     *     },
                     *   }
                     *   console.log(data);
                     *   ZOHO.CRM.CONNECTOR.invokeAPI("ex10.testconnector.uplaodfile",data)
                     *   .then(function(data){
                     *       console.log(data)
                     *   })

                     */
                    invokeAPI: function(nameSpace, data) {
                        return remoteCall(nameSpace, data, "CONNECTOR_API");
                    },
                     /**
                     * @function authorize
                     * @description Prompts the Connector Authorize window  
                     * @returns {Promise} resolved with true on successful Authorization 
                     * @memberof ZOHO.CRM.CONNECTOR
                     * @param {String} nameSpace - NameSpace of Connector to authorize
                     * @example
                     * var connectorName = "zoho.authorize";
                     * ZOHO.CRM.CONNECTOR.authorize(connectorName);
                     *
                     */
                    authorize: function(nameSpace) {
                        return remoteCall(nameSpace, {}, "CONNECTOR_AUTHORIZE");
                    },
                    /**
                     * @function isConnectorAuthorized
                     * @description check the connector is authorized or not.  
                     * @returns {Promise} resolved with true or false
                     * @memberof ZOHO.CRM.CONNECTOR
                     * @param {String} nameSpace - NameSpace of Connector 
                     * @example
                     * var connectorName = "zoho.authorize";
                     * ZOHO.CRM.CONNECTOR.isConnectorAuthorized(connectorName).then(function(result){
                     *  console.log(result) 
                     *});
                     * //prints
                     * true
                     *
                     */
                     isConnectorAuthorized: function(nameSpace) {
                        return remoteCall(nameSpace,{invokeType:"ISAUTHORIZE"}, "CONNECTOR_API");
                    },
                    /**
                     * @function revokeConnector
                     * @description revoke authorized Connector  
                     * @returns {Promise} resolved with response of the Connector revoke
                     * @memberof ZOHO.CRM.CONNECTOR
                     * @param {String} nameSpace - NameSpace of Connector to revoke
                     * @example
                     *   ZOHO.CRM.CONNECTOR.revokeConnector("zoho.accounts")
                     *   .then(function(data){
                     *       console.log(data)
                     *   })
                     *
                     * //prints
                     *{
                     *    "RESULT": "success"
                     * }
                     */
                     revokeConnector: function(nameSpace) {
                         return remoteCall(nameSpace, {}, "CONNECTOR_REVOKE");
                     }
                },
                /**
                 * @namespace ZOHO.CRM.BLUEPRINT
                 */
                BLUEPRINT: {
                    /**
                     * @function proceed
                     * @description perform blueprint transition to move to next state.
                     * @returns {Promise} resolved when blueprint moved to next state
                     * @memberof ZOHO.CRM.BLUEPRINT
                     * @example
                     * ZOHO.CRM.BLUEPRINT.proceed();
                     */
                  proceed: function() {
                    var data = {
                      category : "CRM_BLUEPRINT"   //no i18n
                    };
                    return newRequestPromise(data);
                  }
                }
            };
        })()
    }
})();

/**Add commentMore actions
 * @typedef {Object} AllowedRequestConfig
 * @property {HeadersInit} [headers]
 * @property {AbortSignal} [signal]
 * @property {"cors" | "no-cors" | "same-origin"} [mode]
 * @property {"default" | "no-store" | "reload" | "no-cache" | "force-cache" | "only-if-cached"} [cache]
 * @property {"no-referrer" | "client" | "no-referrer-when-downgrade" | "origin" | "origin-when-cross-origin" | "same-origin" | "strict-origin" | "strict-origin-when-cross-origin" | "unsafe-url"} [referrerPolicy]
 */

/**
 * Represents the configuration options for a ZRC request.
 *
 * @typedef {Object} ZrcRequestConfig
 * @property {HeadersInit} [headers] - The headers for the request.
 * @property {string} [connection]
 * @property {"json" | "text" | "blob" | "arraybuffer"} [responseType] // stream is not supported in 1.5
 * @property {string} [baseUrl] - The base URL of the request.
 * @property {Record<string, string>} [params] - Query parameters.
 * @property {AbortSignal} [signal]
 * @property {"cors" | "no-cors" | "same-origin"} [mode]
 * @property {"default" | "no-store" | "reload" | "no-cache" | "force-cache" | "only-if-cached"} [cache]
 * @property {"no-referrer" | "client" | "no-referrer-when-downgrade" | "origin" | "origin-when-cross-origin" | "same-origin" | "strict-origin" | "strict-origin-when-cross-origin" | "unsafe-url"} [referrerPolicy]
 */

/**
 * Represents the full config for a ZRC request, including HTTP method and body.
 *
 * @typedef {ZrcRequestConfig & {
 * body?: any,
 * method: string,
 * path?: string
 * }} ZrcGenericRequestConfig
 */

/**
 * Represents the response returned by a ZRC request.
 * 
 * @typedef {Object} ZrcResponse
 * @property {number} [status] - The HTTP status code of the response.
 * @property {any} [headers] - The headers of the response.
 * @property {any} [data] - Contains the response body (automatically parsed for JSON data).
 */

/**
 * @typedef {Object} ErrorDetails
 * @property {Error} error - The error object.
 * @property {ZrcRequestConfig & {url: string}} request - The request configuration object.
 * @property {ZrcResponse} response - The response object.
 */

/** 
 * @callback zrc.get
 * @param {string} path path to make call
 * @param {ZrcRequestConfig} [requestConfig] Optional request configuration
 * @returns {Promise<ZrcResponse>}
*/

/** 
 * @callback zrc.post
 * @param {string} path path to make call
 * @param {any} [body] request body
 * @param {ZrcRequestConfig} [requestConfig] Optional request configuration
 * @returns {Promise<ZrcResponse>}
*/

/** 
 * @callback zrc.put
 * @param {string} path path to make call
 * @param {any} [body] request body
 * @param {ZrcRequestConfig} [requestConfig] Optional request configuration
 * @returns {Promise<ZrcResponse>}
*/

/** 
 * @callback zrc.patch
 * @param {string} path path to make call
 * @param {any} [body] request body
 * @param {ZrcRequestConfig} [requestConfig] Optional request configuration
 * @returns {Promise<ZrcResponse>}
*/

/** 
 * @callback zrc.delete
 * @param {string} path path to make call
 * @param {ZrcRequestConfig} [requestConfig] Optional request configuration
 * @returns {Promise<ZrcResponse>}
*/

/** 
 * @callback zrc.options
 * @param {string} path path to make call
 * @param {ZrcRequestConfig} [requestConfig] Optional request configuration
 * @returns {Promise<ZrcResponse>}
*/

/** 
 * @callback zrc.head
 * @param {string} path path to make call
 * @param {ZrcRequestConfig} [requestConfig] Optional request configuration
 * @returns {Promise<ZrcResponse>}
*/

/** 
 * @callback zrc.request
 * @param {ZrcRequestConfig} [requestConfig] Optional request configuration
 * @returns {Promise<ZrcResponse>}
*/

/** 
 * @callback zrc.createInstance
 * @param {ZrcRequestConfig} [requestConfig] Optional request configuration
 * @returns {CustomZrc}
*/

/**
 * @typedef {Object} ZRC
 * @property {zrc.get} get Makes a GET request.
 * @property {zrc.post} post Makes a POST request.
 * @property {zrc.put} put Makes a PUT request.
 * @property {zrc.patch} patch Makes a PATCH request.
 * @property {zrc.delete} delete Makes a DELETE request.
 * @property {zrc.options} options Makes an OPTIONS request.
 * @property {zrc.head} head Makes a HEAD request.
 * @property {zrc.request} request Makes a custom request.
 * @property {zrc.createInstance} createInstance Creates a new instance of ZRC with custom configuration.
 */

/**
 * @typedef {Object} CustomZrc
 * @property {zrc.get} get Makes a GET request.
 * @property {zrc.post} post Makes a POST request.
 * @property {zrc.put} put Makes a PUT request.
 * @property {zrc.patch} patch Makes a PATCH request.
 * @property {zrc.delete} delete Makes a DELETE request.
 * @property {zrc.options} options Makes an OPTIONS request.
 * @property {zrc.head} head Makes a HEAD request.
 * @property {zrc.request} request Makes a custom request.
 */

(() => {
    let zsdk;
    let currentPageUrl = null;

    function newRequestPromise(data) {
        /*
         * ZRC Sdk Version Maintainance
         */
        data["zrcVersion"] = "1.0";
        data['sdkVersion'] = "1.5";
        
        if(!self.__isInitTriggered){
            console.error(new ZrcError('ZRC methods called before init'));
            return;
        }

        if(!zsdk){
            zsdk = self._getAppSDK();
            // delete self._getAppSDK;
            // delete self.instance;
        }

        return zsdk.getContext().Event.Trigger("CRM_EVENT", data, true);
    }

    /**
     * 
     * @returns {Promise<URL>}
     */
    async function PageUrlResolver() {
        /**
         * @type {URL | string | null}
         */
        let url = null;

        if (currentPageUrl) {
            return currentPageUrl;
        }

        url = await newRequestPromise({ category: "GET_PARENT_URL" }); //no i18n

        if (!url)
            throw new ZrcError(
                "Failed to get current page url for your zrc request"
            );

        currentPageUrl = new URL(url);
        return currentPageUrl;
    };

    /**
     * Converts the json error object into ZRC error instance
     */
    function convertToZrcError(actualError) {
        let error;
        
        // "ZrcError" | "ZrcValidationError" | "ConnectionError" | "ApiError"
        switch (actualError.errorType) {
            case "ConnectionError":
                error = new ConnectionError(actualError.errorMessage ? actualError.errorMessage : "Connection request failed");
                break;
            case "ZrcValidationError":
                error = new ZrcValidationError(actualError.errorMessage);
                break;
            case "ZrcError":
                error = new ZrcError(actualError.errorMessage);
                break;
            case "ApiError":
                error = new ApiError(actualError.errorMessage);
                break;
            case "PermissionException": // error for widgets permissions
                error = new Error(actualError.errorMessage);
                error.code = actualError.errorCode;
                error.detail = actualError.errorDetail;
                error.type = actualError.errorType;
                break;
            default:
                error = new ZrcError(actualError.errorMessage);
                break;
        }

        return error;
    }

    /**
     * 
     * @param {string} url 
     * @param {ZrcRequestConfig & { body?: any, method?: string }} requestConfig 
     * @param {URL | undefined} currentPageUrl 
     * @returns {Promise<ZrcResponse>} API response
     */
	async function ZRCAPIResolver(url, requestConfig = {}, currentPageUrl = undefined) {
		if (!currentPageUrl) {
			currentPageUrl = await PageUrlResolver();
		}
        
        try {
            const zrcRequestData = {
                category: "ZRC_REQUEST", //no i18n
                url,
                options: {}
            };

            if(requestConfig.body && requestConfig.body instanceof FormData){
                // convert the formdata into json object
                const formDataObj = {};
                for (const [key, value] of requestConfig.body.entries()) {
                    if (value instanceof File) {
                        formDataObj[key] = value;
                    } else {
                        formDataObj[key] = value.toString();
                    }
                }

                requestConfig.body = formDataObj;
                zrcRequestData.options.bodyDataType = "formData"
            }

            zrcRequestData.requestConfig = requestConfig;

            /**
             * @type {Promise<any>}
             */
			let res = newRequestPromise(zrcRequestData);

			return res
				.then(resObj => {
                    return resObj;
				})
				.catch((err) => {
                    if (err && err.errorType && typeof err.errorType === "string"){
                        err = convertToZrcError(err);
                    }

                    if(err.error && err.error.errorType && typeof err.error.errorType === "string"){
                        err.error = convertToZrcError(err.error);
                    }
                    throw err;
				});
		} catch (err) {
			throw err;
		}
	}

	class ZRC {
        #ZRCAPIResolver = ZRCAPIResolver;
        #PageUrlResolver = PageUrlResolver;

        /**
         * @type {ZrcRequestConfig}
         */
        #requestConfig = {
            headers: {},
        };

        /**
         *
         * @param {ZrcRequestConfig | undefined} requestConfig
         */
        constructor(requestConfig) {
            if (requestConfig)
                this.#requestConfig = {
                    ...this.#requestConfig,
                    ...requestConfig,
                };
        }

        /**
         *
         * @param {"GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "HEAD" | "OPTIONS"} method
         * @param {string} path
         * @param {any} body
         * @param {ZrcRequestConfig | undefined} requestConfig
         * @returns
         */
        async #restCall(method, path, body, requestConfig) {
            // sanitise arguments
            if (requestConfig) {
                delete requestConfig.method;
                delete requestConfig.body;
            }

            // converge body with base config
            if (this.#requestConfig.body) {
                body = body ? body : this.#requestConfig.body;
            }

            // converge config with base config
            requestConfig = { ...this.#requestConfig, ...requestConfig };

            ZrcValidations.validateConfig(path, requestConfig);

            // Validate that methods like GET, OPTIONS, and HEAD do not have a body
            if (
                ["GET", "OPTIONS", "HEAD"].includes(method.toUpperCase()) &&
                body
            ) {
                body = undefined;
            }

            // handle headers type normalization
            if (requestConfig && requestConfig.headers) {
                // Normalize header names to lowercase
                /**
                 * Normalizes the headers in a request configuration object by converting all header keys to lowercase.
                 *
                 * @param {Object} headers - The headers object from the request configuration.
                 * @returns {Record<string, string>} A new object with all header keys converted to lowercase.
                 * @example
                 * const headers = {
                 *   "Content-Type": "application/json",
                 *   "Authorization": "Bearer token"
                 * };
                 * const normalizedHeaders = normalizeHeaders(headers);
                 * console.log(normalizedHeaders);
                 * Output:
                 * {
                 *   "content-type": "application/json",
                 *   "authorization": "Bearer token"
                 * }
                 */
                const normalizedHeaders = Object.keys(requestConfig.headers).reduce((acc, key) => {
                    acc[key.toLowerCase()] = requestConfig.headers[key];
                    return acc;
                }, {});

                requestConfig.headers = normalizedHeaders;
            }

            // handle falsy requestConfig
            if (!requestConfig) {
                requestConfig = {
                    headers: {},
                };
            }

            // add content-type header only for post, put, patch, and delete request automatically
            if (
                method === "POST" ||
                method === "PUT" ||
                method === "PATCH" ||
                method === "DELETE"
            ) {
                if (!requestConfig.headers) {
                    requestConfig.headers = {};
                }

                if (
                    !requestConfig.headers["content-type"] &&
                    body &&
                    (ZrcValidations.isJsonObject(body) ||
                        ZrcValidations.isJsonString(body))
                ) {
                    requestConfig.headers["content-type"] = "application/json";
                }
            }

            // automatically handle "content-type" header for body types FormData, URLSearchParams, Blob, File, ReadableStream
            if (requestConfig && requestConfig.headers) {
                requestConfig.headers = cleanHeaders(
                    requestConfig.headers,
                    body
                );
            }

            // handle JSON body
            if (
                body &&
                requestConfig?.headers &&
                requestConfig.headers["content-type"]
                    ?.trim()
                    .startsWith("application/json")
            ) {
                body = ZrcValidations.isJsonString(body)
                    ? body
                    : ZrcValidations.isJsonObject(body)
                    ? JSON.stringify(body)
                    : body;
            }

            const baseUrl = requestConfig?.baseUrl || this.#requestConfig?.baseUrl || (await this.#PageUrlResolver()).origin;
            const url = ZrcValidations.isRelativePath(path) ? createUrl(path, baseUrl) : new URL(path);

            // handle parameters
            if (
                requestConfig &&
                requestConfig.params &&
                Object.keys(requestConfig.params).length > 0
            ) {
                const searchParams = url.searchParams;
                for (const key in requestConfig.params) {
                    /**
                     * @type {any}
                     */
                    const value = requestConfig.params[key];

                    if (value === null || value === undefined) {
                        continue;
                    }

                    if (Array.isArray(value)) {
                        if (value.length === 0) {
                            continue;
                        }

                        for (const item of value) {
                            if (item !== null && item !== undefined) {
                                const arrKey = `${key}[]`;

                                if (item instanceof Date) {
                                    searchParams.append(
                                        arrKey,
                                        item.toISOString()
                                    );
                                } else if (ZrcValidations.isJsonObject(item)) {
                                    searchParams.append(
                                        arrKey,
                                        JSON.stringify(item)
                                    );
                                } else {
                                    searchParams.append(arrKey, item);
                                }
                            }
                        }
                    } else if (value instanceof Date) {
                        searchParams.append(key, value.toISOString());
                    } else if (ZrcValidations.isJsonObject(value)) {
                        searchParams.append(key, JSON.stringify(value));
                    } else {
                        searchParams.append(key, value);
                    }
                }
            }

            // prepare request config
            /**
             * @type {ZrcRequestConfig & { body?: any, method?: string }}
             */
            const config = { method, ...requestConfig };

            // handle body
            if (body) {
                config.body = body;
            }

            if (method === "GET") {
                delete config.body;
            }

            return this.#ZRCAPIResolver(
                url.toString(),
                config
            );
        }

        /**
         *
         * @param {string} path
         * @param {ZrcRequestConfig | undefined} requestConfig
         */
        get(path, requestConfig) {
            return this.#restCall("GET", path, undefined, requestConfig);
        }

        /**
         *
         * @param {string} path
         * @param {any} body
         * @param {ZrcRequestConfig | undefined} requestConfig
         */
        post(path, body, requestConfig) {
            return this.#restCall("POST", path, body, requestConfig);
        }

        /**
         *
         * @param {string} path
         * @param {any} body
         * @param {ZrcRequestConfig | undefined} requestConfig
         */
        put(path, body, requestConfig) {
            return this.#restCall("PUT", path, body, requestConfig);
        }

        /**
         *
         * @param {string} path
         * @param {any} body
         * @param {ZrcRequestConfig | undefined} requestConfig
         */
        patch(path, body, requestConfig) {
            return this.#restCall("PATCH", path, body, requestConfig);
        }

        /**
         *
         * @param {string} path
         * @param {ZrcRequestConfig | undefined} requestConfig
         */
        delete(path, requestConfig) {
            return this.#restCall("DELETE", path, undefined, requestConfig);
        }

        /**
         *
         * @param {string} path
         * @param {ZrcRequestConfig | undefined} requestConfig
         */
        options(path, requestConfig) {
            return this.#restCall("OPTIONS", path, undefined, requestConfig);
        }

        /**
         *
         * @param {string} path
         * @param {ZrcRequestConfig | undefined} requestConfig
         */
        head(path, requestConfig) {
            return this.#restCall("HEAD", path, undefined, requestConfig);
        }

        /**
         * @param {ZrcGenericRequestConfig} requestConfig
         */
        request(requestConfig) {
            if (!requestConfig || !ZrcValidations.isJsonObject(requestConfig)) {
                throw new ZrcValidationError(
                    "Invalid requestConfig provided for zrc.request method"
                );
            }

            requestConfig.method = requestConfig.method || "GET";
            let { path, body } = requestConfig;
            path = path || "/";
            delete requestConfig.path;
            delete requestConfig.body;

            return this.#restCall(
                requestConfig.method.toUpperCase(),
                path,
                body,
                requestConfig
            );
        }

        /**
         *
         * @param {ZrcRequestConfig} requestConfig
         * @returns {CustomZrc} A custom instance of ZRC
         */
        createInstance(reqConfig) {
            if (!reqConfig || !ZrcValidations.isJsonObject(reqConfig)) {
                throw new ZrcValidationError(
                    "Invalid ZrcRequestConfig provided for zrc.createInstance method"
                );
            }

            // remove method and body from requestConfig
            if (reqConfig) {
                delete reqConfig.method;
                delete reqConfig.body;
            }

            return new CustomZrc(reqConfig);
        }
    }

	class CustomZrc extends ZRC {
		// remove createInstance method from ZRC class
        /**
         * @type {never}
         */
		createInstance() {
			throw new ZrcValidationError("createInstance method is not supported in Custom ZRC object");
		}
	}

	class ZrcValidationError extends Error {
        /**
         * @type {string}
         */
		name;
        /**
         * @type {string}
         */
		message;
        /**
         * @type {string | undefined}
         */
		stack;

        /**
         * @param {string | undefined} message 
         */
		constructor(message) {
			super();
			this.name = "ZRC_VALIDATION_FAILED_ERROR";
			this.message = message ? message : "validation failed with your zrc request";
			delete this.stack;
		}
	}

	class ZrcError extends Error {
        /**
         * @type {string}
         */
		name;
        /**
         * @type {string}
         */
		message;
        /**
         * @type {string | undefined}
         */
		stack;

        /**
         * @param {string | undefined} message 
         */
		constructor(message) {
			super();
			this.name = "ZRC_ERROR";
			this.message = message ? message : `something went wrong while setting up your zrc request`;
			delete this.stack;
		}
	}
    
	class ApiError extends Error {
        /**
         * @type {string}
         */
		name;
        /**
         * @type {string}
         */
		message;
        /**
         * @type {string | undefined}
         */
		stack;

        /**
         * @param {string | undefined} message 
         */
		constructor(message) {
            super();
			this.name = "API_ERROR";
			this.message = message ? message : "Your API request has failed";
			delete this.stack;
		}
	}

    class ConnectionError extends Error {
        /**
         * @type {string}
         * 
         */
		name;
        /**
         * @type {string}
         */
		message;
        /**
         * @type {string | undefined}
         */
		stack;

        /**
         * @param {string | undefined} message 
         */
		constructor(message) {
			super();
			this.name = "CONNECTION_ERROR";
			this.message = message ? message : "Connection Error";
			delete this.stack;
		}
	}

	class ZrcValidations {
        /**
         * 
         * @param {string} path 
         * @param {ZrcRequestConfig} requestConfig 
         */
		static validateConfig(path, requestConfig = {}) {
			// <--------------------- common validations --------------------->

			// validate path
			if (!path || typeof path !== "string" || path.trim() === "") {
				throw new ZrcValidationError(`Invalid path provided for zrc request: '${path}'`);
			}

			// validate responseType
			if (requestConfig.responseType) ZrcValidations.validateResponseType(requestConfig.responseType);

			// validate allowed requestConfig properties
			ZrcValidations.validateRequestConfigProperties(requestConfig);

			// <--------------------- zrc validations --------------------->

			// validate path
			if (!ZrcValidations.isRelativePath(path)) {

				if (!ZrcValidations.isValidUrl(path)) {
					throw new ZrcValidationError(`Invalid 'path' provided, please provide a relative-path or a valid absolute url for zrc requests: ${path}`);
				}

				// validate baseUrl redundancy
				if (requestConfig.baseUrl) {
					throw new ZrcValidationError(`No need to provide 'baseUrl' when absolute url provided in path. Please remove the baseUrl: ${requestConfig.baseUrl}`);
				}
			} else {
				// baseUrl is required for connection requests
				if (requestConfig.connection && (!requestConfig.baseUrl || typeof requestConfig.baseUrl !== "string" || requestConfig.baseUrl.trim() === "")) {
					throw new ZrcValidationError(`Please provide a valid 'baseUrl' or provide absolute url in 'path' for zrc connection requests`);
				}
			}
		}

        /**
         * @param {string} responseType 
         * @returns 
         */
		static validateResponseType(responseType) {
			if (!responseType) return;

			if (!ZrcValidations.isAllowedResponseType(responseType)) {
				throw new ZrcValidationError(`Unsupported responseType: '${responseType}' provided in requestConfig`);
			}

			// validate allowed responseTypes
			switch (responseType) {
				case "blob":
					if (typeof self === 'undefined') { // only allow blob in browser and browser web workers
						throw new ZrcValidationError("ResponseType 'blob' is only supported in browsers");
					}
					break;

				default:
					break;
			}
		}

        /**
         * @param {ZrcRequestConfig} requestConfig 
         * @returns 
         */
		static validateRequestConfigProperties(requestConfig) {
			const allowedProperties = ["connection", "method", "headers", "signal", "mode", "cache", "referrerPolicy", "responseType", "baseUrl", "params", "handleUserConnectionAuth"];
			const requestConfigProperties = Object.keys(requestConfig);

			for (const property of requestConfigProperties) {
				if (!allowedProperties.includes(property)) {
					throw new ZrcValidationError(`The property '${property}' is not allowed in requestConfig.`);
				}
			}

			// validate connection property
			if(requestConfig.connection === undefined) {
				return;
			}

			if ((typeof (requestConfig.connection) !== "string" || requestConfig.connection.trim() === "")) {
				throw new ZrcValidationError(`Invalid value provided for property 'connection' in requestConfig: '${requestConfig.connection}'`);
			}

			// validate connection property for restricted headers
			if (requestConfig.connection) {
				// validate request config for connection requests
				// raise error if any restricted headers are provided
				const restrictedHeaders = new Set([
					'authorization',
					'url',
					'connection-details',
					'cookie',
					'connection',
					'waf-encryption-key',
					'waf-encryption-id',
					'zsec_user_import_url',
					'zsec_proxy_server_name',
					'zsec_proxy_server_signature',
					'zsec_proxy_request',
					'zs-systemauthorization',
					'x-http-method-override',
					'x-zcsrf-token',
					'user-agent',
					'remote_user_ip',
					'req-mi-chain',
					'host'
				]);

				const restrictedPatternsInHeaders = [
					'x-crm-',
					'x-zcsrf',
					'x-zoho',
					'x-zohocrm',
					'lb_'
				];

				for (const header in requestConfig.headers) {
					if (restrictedHeaders.has(header.toLowerCase())) {
						throw new ZrcValidationError(`Header '${header}' is not allowed for connection requests`);
					}

					for (const pattern of restrictedPatternsInHeaders) {
						if (header.toLowerCase().startsWith(pattern)) {
							throw new ZrcValidationError(`Header '${header}' is not allowed for connection requests`);
						}
					}
				}
			}
		}

        /**
         * @param {string} input 
         */
		static isRelativePath(input) {
			try {
				// Reject absolute URLs
				new URL(input);
				return false;
			} catch (error) {
				// Check for valid relative path format
				return !(input.startsWith("http://") || input.startsWith("https://") || !input.startsWith("/"));
			}
		}

        /**
         * @param {string} input 
         */
		static isValidUrl(input) {
			try {
				new URL(input);
				return true;
			} catch (error) {
				return false;
			}
		}

        /**
         * @param {string} responseType 
         */
		static isAllowedResponseType(responseType) {
            return ["json", "text", "blob", "arraybuffer"].includes(responseType); // stream is not supported in 1.5
		}

        /**
         * @param {string} input 
         */
		static isJsonString(input) {
			try {
				JSON.parse(input);
				return true;
			} catch (error) {
				return false;
			}
		}

        /**
         * @param {any} input 
         */
		static isJsonObject(input) {
			if (input === null || typeof input !== "object" || input instanceof FormData || input instanceof Blob || input instanceof ArrayBuffer || input instanceof URLSearchParams) {
				return false;
			}
			try {
				JSON.stringify(input);
				return true;
			} catch (error) {
				return false;
			}
		}

        /**
         * @param {string} path 
         */
		static validateCrmApiVersion(path) {
			// check is if path is a crm path
			if (!path.startsWith("/crm/")) {
				return;
			}

			// handle paths /crm/v7/users
			if (path.startsWith('/crm/v')) {
				const versionStr = path.split('/')[2]; // v7
				const versionNumber = parseInt(versionStr.split('v')[1]);
				if (versionNumber < 7) {
					throw new ZrcValidationError(`zrc only supports v7 and above for CRM requests. Please provide valid version in path: '${path}'`);
				}
			}

			// handle paths /crm/bulk/v7 & /crm/email/v7
			if (path.startsWith('/crm/bulk/v') || path.startsWith('/crm/email/v')) {
				const versionStr = path.split('/')[3];
				const versionNumber = parseInt(versionStr.split('v')[1]);
				if (versionNumber < 7) {
					throw new ZrcValidationError(`zrc only supports v7 and above for CRM requests. Please provide valid version for path: '${path}'`);
				}
			}
		}
	}

	/**
	 * Creates a URL object by appending the relative path to the baseUrl
	 * @param {string} relativePath relative path to be appended to baseUrl
	 * @param {string | undefined} baseUrl base url
	 * @returns {URL} URL object
	 */
	function createUrl(relativePath, baseUrl) {
		// Remove trailing slash from baseUrl if it exists
		if (baseUrl) baseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;

		// Remove leading slash from path if it exists
		relativePath = relativePath.startsWith('/') ? relativePath.slice(1) : relativePath;

		return baseUrl ? new URL(`${baseUrl}/${relativePath}`) : new URL(relativePath);
	}

	/**
	 * Removes redundant headers from the headers object for body of types FormData, URLSearchParams, Blob, File, ReadableStream
	 * 
	 * fetch will handle this automatically add content-type header for these body types
	 * @param {Record<string, string>} headers headers JSON object
	 * @param {any} body body of the request
	 * @returns cleaned headers
	 */
	function cleanHeaders(headers, body) {
		if (
			body instanceof FormData ||
			body instanceof URLSearchParams ||
			body instanceof Blob ||
			body instanceof File ||
			body instanceof ReadableStream
		) {
			const newHeaders = JSON.parse(JSON.stringify(headers)); // Clone to avoid mutation issues
			delete newHeaders["content-type"];
			return newHeaders;
		}
		return headers; // Return original headers if no modification needed
	}


	self.zrcInstance = new ZRC();
	self.ZrcValidationError = ZrcValidationError;
})();

/**
 * @description A library to make HTTP requests
 * @type {ZRC}
*/
const zrc = (() => {

	const instance = self.zrcInstance;
	const ZrcValidationError = self.ZrcValidationError;

	return {

		get(path, requestConfig) {
			return instance.get.call(instance, path, requestConfig);
		},

		post(path, body, requestConfig) {
			return instance.post.call(instance, path, body, requestConfig);
		},

		put(path, body, requestConfig) {
			return instance.put.call(instance, path, body, requestConfig);
		},

		patch(path, body, requestConfig) {
			return instance.patch.call(instance, path, body, requestConfig);
		},

		delete(path, requestConfig) {
			return instance.delete.call(instance, path, requestConfig);
		},

		options(path, requestConfig) {
			return instance.options.call(instance, path, requestConfig);
		},

		head(path, requestConfig) {
			return instance.head.call(instance, path, requestConfig);
		},

		request(requestConfig) {
			return instance.request.call(instance, requestConfig);
		},

		createInstance(requestConfig) {
			if (!requestConfig) {
				throw new ZrcValidationError("requestConfig is required for zrc.createInstance method");
			}

			return instance.createInstance.call(instance, requestConfig);
		}
	}
})();

(function (global) {
    let zsdk;

    function validator(value, key, validations){
        if ((!validations.required && value !== undefined || validations.required) && !(validations.allow_null && value === null)) {
            if (typeof value !== 'string' && !(value instanceof String)) {
                throw new Error(`${key} must be a String`); // no i18n
            }
            if (!value.trim()) {
                throw new Error(`${key} cannot be blank`); // no i18n
            }
            if (validations.min_length && value.length < validations.min_length) {
                throw new Error(`${key} must be atleast ${validations.min_length} characters`); // no i18n
            }
            if (validations.max_length && value.length > validations.max_length) {
                throw new Error(`${key} must be atmost ${validations.max_length} characters`); // no i18n
            }
        }
    }

    function newRequestPromise(data) {
        data['sdkVersion'] = "1.5";
        if (!self.__isInitTriggered) {
            console.error(new Error('ZDK methods called before init'));
            return;
        }
        if (!zsdk) {
            zsdk = self._getAppSDK();
            // delete self._getAppSDK;
            // delete self.instance;
        }
        return zsdk.getContext().Event.Trigger("ZDK_EVENT", data, true);
    }

    function newCrmRequestPromise(data) {
         data['sdkVersion'] = "1.5";
        if (!self.__isInitTriggered) {
            console.error(new Error('ZDK methods called before init'));
            return;
        }
        if (!zsdk) {
            zsdk = self._getAppSDK();
            // delete self._getAppSDK;
            // delete self.instance;
        }
        return zsdk.getContext().Event.Trigger("CRM_EVENT", data, true);
    }

    function config(type, nameSpace,requestData) {
        var data = {
            category: "CONFIG",
            type: type,
            nameSpace: nameSpace,
            APIData : requestData
        };
        return newCrmRequestPromise(data);
    }

    /** Class representing a List in a Page.
     * @category Objects
     */
    class List {
        /**
         * @hideconstructor
         */
        constructor() {}
        /**
         * @summary Get Records in the List View
         * @description $selected property denoted if respective records is selected or not
         * @memberof List
         * @function
         * @listpage
         * @example <caption>Sample</caption>
         * ZDK.Page.getList().getRecords();
         */
        async getRecords() {
          return newRequestPromise({
            action: 'list_records_get' // No i18n
          });
        }
        /**
         * @summary Select Records in the List view by criteria
         * @memberof List
         * @param {String} [criteria] - criteria based on which records should be selected. Fields that are in the list are only available for criteria.
         * @function
         * @listpage
         * @example <caption>Select Records by criteria</caption>
         * ZDK.Page.getList().selectRecords("((Last_Name:equals:Burns)and(First_Name:starts_with:M))");
         */
        async selectRecords(criteria) {
          return newRequestPromise({
            action: 'list_records_select', // No i18n
            criteria
          });
        }
        /**
         * @summary Select Records in the List view by record ID
         * @memberof List
         * @param {String[]} ids - array of record ids
         * @function
         * @listpage
         * @example <caption>Select Records by record ID</caption>
         * ZDK.Page.getList().selectRecordsByID(["111111000000000812", "111111000000000834", "111111000000000845"]);
         */
        async selectRecordsByID(ids) {
          if (!Array.isArray(ids)) {
            throw new TypeError('ids should be an Array');
          }
          return newRequestPromise({
            action: 'list_records_select_id', // No i18n
            ids
          });
        }
        /**
         * @summary Clear selected Records in the List view
         * @memberof List
         * @function
         * @listpage
         * @example <caption>Clear Select records</caption>
         * ZDK.Page.getList().clearSelection();
         */
        async clearSelection() {
            return newRequestPromise({action : "list_records_clear_selected"});
        }
    }

    /** Class representing a Flyout Object. 
     * @category Objects
     */
    class Flyout {
        /**
         * @hideconstructor
         * @param {String} name - flyout name
         */
        constructor(name) {
            this.name = name;
        }

        getName(){
            return this.name;
        }
        /**
         * @summary Open a Widget in <a href="ZDK.Client.html#.createFlyout" target='_blank'>Flyout</a>. Custom data can be passed to Widget's <a href="https://help.zwidgets.com/help/v1.2/index.html" target='_blank'>'PageLoad'</a> event. Supported Widget SDK version >= 1.2.
         * @description Note: The presence of an active loader restricts the availability of other pop-ups.
         * @memberof Flyout
         * @function
         * @param {object} config - Flyout type config
         * @param {String} config.type - flyout type (widget)
         * @param {String} config.api_name - api name of the widget (Custom Button type)
         * @param {Any} [data] -data to be passed as <a href="https://help.zwidgets.com/help/v1.2/index.html" target='_blank'>'PageLoad'</a> event data in Widget
         * @example <caption>Sample</caption>
         * ZDK.Client.createFlyout('myFlyout', { header: 'Sample Flyout', animation_type: 4 });
         * ZDK.Client.getFlyout('myFlyout').open({ api_name: 'sample_widget', type: 'widget' }, { data: 'sample data to be passed to the widget' });
         */
        open(config, data) {
            if (config.type && config.type !== 'widget' && config.type !== 'kiosk' && config.type != 'slyteui') { throw new Error(`unsupported Flyout type: ${config.type}`); }
            // widgetValidator(config,"flyout"); // No i18n       
            return newRequestPromise({
                action: 'open_flyout', // No i18n
                name: this.getName(),
                id: config.id,
                type: config.type,
                api_name: config.api_name,
                data,
                config
            });
        }
        /**
        * @function 
        * @returns {Any} Response from Widget's <a href="https://help.zwidgets.com/help/v1.2/ZDK.Client.html#.sendResponse" target='_blank'>ZDK.Client.sendResponse</a> if options.wait is true
        * @description Notify Flyout and optionally await a response from the Widget. Moreover, custom data can be listened from widget through <a href="https://help.zwidgets.com/help/v1.2/index.html" target='_blank'>'Notify'</a> event. If options.wait is true, data can be listened through <a href="https://help.zwidgets.com/help/v1.2/index.html" target='_blank'>'NotifyAndWait'</a> event. <br>
        * @memberof Flyout
        * @param {Any} data - data can be listened through <a href="https://help.zwidgets.com/help/v1.2/index.html" target='_blank'>Notify / NotifyAndWait</a> event in Widget
        * @param {Object} [options]
        * @param {String} [options.wait] - true/false - wait for response from Widget
        * @example <caption>Sample</caption>
        * var response = ZDK.Client.getFlyout('myFlyout').notify({data: 'sample data'}, {wait: true});
        */
        notify(data, options) {
            return newRequestPromise({
                action: 'notify_flyout', // No i18n
                name: this.getName(),
                data: data,
                config: options
                }, { userInput: true });
            }
        /**
         * @function 
         * @summary Close Flyout
         * @memberof Flyout
         * @example <caption>Sample</caption>
         * ZDK.Client.getFlyout('myFlyout').close();
         */
        close() {
            // delete Flyout._instance;
            return newRequestPromise({
                action: 'close_flyout', // No i18n
                name: this.getName()
            });
        }
    }

    /** Class representing a Form in a Page. 
     * @category Objects
     */
    class Form {
        /**
         * @hideconstructor
         */
        constructor() {}
        /**
        * @supportedplatforms web,android,ios
        * @summary Set the form values in the Page
        * @standard_create_edit_clone
        * @canvas_create_edit_clone
        * @wizard_create_edit
        * @memberof Form
        * @function
        * @portals true
        * @param {Object} values - Field values
        * @example <caption>Sample</caption>
        * ZDK.Page.getForm().setValues( { 
        *  'Custom_Field1': 'value',
        *  'Account_Name' : { id: "5164254000000366162", name: "John Doe" },
        *  'Email_Opt_Out': true,
        *  'Subform_1' : [ { 'Email_1' : 'henry@zylker.com' , 'Website1' : 'www.henryzyker.com' } ],
        *  ...
        * } )
        */
        setValues(values) {
            return newRequestPromise({
                action : 'form_write',
                req_data : values
            })
        }
        /**
        * @supportedplatforms web,android,ios
        * @summary Get the form values as Object
        * @standard_create_edit_clone
        * @canvas_create_edit_clone
        * @wizard_create_edit
        * @canvas
        * @detailpage
        * @function
        * @portals true
        * @memberof Form
        * @returns {Object} Form values
        * @example <caption>Sample</caption>
        * ZDK.Page.getForm().getValues();
        * //prints
        * {
        *  'Last_Name' : 'Zylker Ibro',
        *  'Subform_1' : [ { 'Email_1' : 'henry@zylker.com' , 'Website1' : 'www.henryzyker.com' } ],
        *  "Email_1": "henry@zylker.com",
        *  "Email_Opt_Out": true,
        *  ...
        * }
        */
        getValues(){
            return newRequestPromise({
                action : 'form_read'
            });
        }
      };

    /**
     * @module ZDK
     */
    var ZDK = {

        /**
         * @namespace ZDK.Page
         */
        Page : (function () {
            return {
                /**
                 * @description Get the form object
                 * @function
                 * @memberof ZDK.Page
                 * @returns {Form} {@link Form} object
                 * @example <caption>Sample</caption>
                 * ZDK.Page.getForm();
                 */
                getForm : function(){
                    return new Form();
                },
                /**
                 * @summary Get the List View Object
                 * @function
                 * @listpage
                 * @memberof ZDK.Page
                 * @returns {List} {@link List} object
                 * @example <caption>Sample</caption>
                 * ZDK.Page.getList();
                 */
                getList : function(){
                    return new List();
                }
                
            }
        })(),

        /**
         * @namespace ZDK.Widget
         */
        Widget : (function(){
            return {
                /**
                * @description Send response to widget
                * @memberof ZDK.Widget
                * @function
                * @param {String} request_uuid - unique id received in 'NotifyAndWait' event of the flyout widget
                * @param {Any} [data] - response to be passed
                * @example <caption>Sample</caption>
                * ZDK.Widget.sendResponse('0deec96f-2d55-4349-ace9-d45499fd004c', { choice: 'mail', value: 'example@zoho.com' });
                */
                sendResponse: async function (request_id, data) {
                    return newRequestPromise({ // no i18n
                        action: 'notify_response', // No i18n
                        message: {
                            data,
                            uuid: request_id
                        }
                    });
                },
                /**
                 * @function resize
                 * @description Resize Widget to the given dimensions
                 * @param {Object} dimensions - Dimension of Dialer.
                 * @param {Integer} dimensions.height - Height in px
                 * @param {Integer} dimensions.width - Width in px
                 * @returns {Promise} resolved with true | false
                 * @memberof ZDK.Widget
                 * @example
                 * ZDK.Widget.resize({height:"200",width:"1000"}).then(function(data){
                 * 	console.log(data);
                 * });
                 * 
                 * //prints 
                 * True
                 *
                 */
                resize: function(data={}) {
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
                 * @function close
                 * @description Close Widget Popup 
                 * @returns {Promise} resolved with true | false
                 * @memberof ZDK.Widget
                 * @example
                 * ZDK.Widget.close()
                 * .then(function(data){
                 *     console.log(data)
                 * })
                 */
                close: function(response) {
                    return newRequestPromise({
                        action : 'close_widget',
                        response
                    })
                },
                /**
                 * @function closeReload
                 * @description Close Widget Popup and reload the View
                 * @returns {Promise} resolved with true | false
                 * @memberof ZDK.Widget
                 * @example
                 * ZDK.Widget.closeReload()
                 * .then(function(data){
                 *     console.log(data)
                 * })
                 */
                closeReload: function() {
                    /*
                        * fetch TabName from sysrefName 
                        */
                    return newRequestPromise({
                        action : 'close_widget',
                        data : {reload : true}
                    })
                }
            }
        })(),

        /**
        * @namespace ZDK.Client
        */
        Client: (function () {

            return {
                /**
                 * @description Flyout is a container to show <a href="https://www.zoho.com/crm/developer/docs/widgets/" target='_blank'>Widgets</a> with customizations like position, size, animation etc.,
                 * @memberof ZDK.Client
                 * @returns {Flyout} {@link Flyout} object
                 * @function
                 * @param {String} name - flyout name
                 * @param {Object} [config]
                 * @param {String} [config.header=${widget name}] - header for the flyout
                 * @param {Boolean} [config.close_icon=true] - toggle close icon
                 * @param {Boolean} [config.close_on_exit=true] - To keep/close flyout on page navigation
                 * @param {(1 | 2 | 3 | 4 | 5 | 6)} [config.animation_type=1] - define the animation style of the flyout
                 * <br>&nbsp;&nbsp;`1` - slides flyout from top
                 * <br>&nbsp;&nbsp;`2` - slides flyout from right
                 * <br>&nbsp;&nbsp;`3` - slides flyout from left
                 * <br>&nbsp;&nbsp;`4` - slides flyout from bottom
                 * <br>&nbsp;&nbsp;`5` - fades in and fades out the flyout
                 * <br>&nbsp;&nbsp;`6` - zoom in and zoom out the flyout
                 * @param {('200px' | '20vh')} [config.height='40vh'] - flyout height
                 * @param {('500px' | '50vw')} [config.width='20vw'] - flyout width
                 * @param {('0' | '20px' | 'center')} [config.top='20px'] - flyout offset > top
                 * @param {('0' | '20px' | 'center')} [config.left='center'] - flyout offset > left
                 * @param {('0' | '20px' | 'center')} [config.bottom] - flyout offset > bottom (overrides top property)
                 * @param {('0' | '20px' | 'center')} [config.right] - flyout offset > right (overrides left property)
                 * @example <caption>Sample</caption>
                 * ZDK.Client.createFlyout('myFlyout', { header: 'Sample Flyout', animation_type: 4 });
                 */
                createFlyout : async function(name, config){
                    if (config.animation_type && [1, 2, 3, 4, 5, 6].indexOf(config.animation_type) == -1) {
                        throw new TypeError('Animation type should be in (1,2,3,4,5,6)'); // no i18n
                    }
                    // if($Client.platform === 'mobile_application') {
                    //     flyoutConfig = config;
                    // }
                    if (config.header && config.header.length > 50) { throw new Error('header must be atmost 50 characters'); }
                    config.offset = Object.assign({ top: '0px', left: 'center' }, Object.fromEntries(Object.entries(config).filter(x => ['top','bottom','left','right'].includes(x[0]))));
                    const flyoutRes = await newRequestPromise({ action: 'create_flyout', name, config })
                    if (!flyoutRes) {
                        throw new Error("Flyout already exist")
                    }
                    return new Flyout(name);
                },
                /**
                 * @summary Get a Flyout with name
                 * @memberof ZDK.Client
                 * @returns {Flyout} {@link Flyout} object
                 * @function
                 * @param {String} name - flyout name
                 * @example <caption>Sample</caption>
                 * ZDK.Client.getFlyout('myFlyout');
                 */
                getFlyout : async function(name){
                    const flyoutRes = await newRequestPromise({ action: 'get_flyout', name});
                    if(!flyoutRes){
                        throw new Error("Invalid Flyout name")
                    }
                    return new Flyout(name);
                },
                /**
                 * @description Navigate to record's detail page, create page, list view etc.,
                 * @memberof ZDK.Client
                 * @function
                 * @param { 'setup' | 'tab' | 'record_detail' | 'record_create' | 'record_clone' | 'record_edit' | 'record_list'} page
                 * `tab` - Web Tab / Default list view page
                 * <br>`setup` - Setup page
                 * <br>`record_create` - Record create page
                 * <br>`record_edit` - Record edit page
                 * <br>`record_detail` - Record detail page
                 * <br>`record_clone` - Record clone page
                 * <br>`record_list` - Listview Page
                 * @param {object} params
                 * @param {string} params.module - api name of the module
                 * @param {string} [params.record_id] - id of the record
                 * @param {string} [params.layout_id] - id of the layout
                 * @param {string} [params.custom_view_id=${default}] - custom view id of the page
                 * @param {object} data - `Web tab`- data to be passed to the widgets and get the data from <a href="https://help.zwidgets.com/help/v1.2/index.html" target='_blank'>'PageLoad'</a> event of widgets.
                 * <br>`Other Pages` -  can pass custom data when navigating from one page to another and then access that data on the target page.
                 * <br> - To retrieve navigation data, <a href="$Page.html#navigation_data" target='_blank'>'$Page.navigation_data'</a> can be used.
                 * @param { '_blank' | '_self' } [target=_self] - `_self` - open in same tab
                 * <br> `_blank` - open in new tab 
                 * @example <caption>Widget based web tab with PageLoad data</caption>
                 * ZDK.Client.navigateTo('tab', { module: 'WebTab1' }, '_blank', { data: 'sample' })
                 * @example <caption>Leads record list page in new tab</caption>
                 * ZDK.Client.navigateTo('tab', { module: 'Leads' }, '_blank');
                 * @example <caption>Leads record list page with custom view</caption>
                 * ZDK.Client.navigateTo('record_list', { module: 'Leads', custom_view_id: '111111000000046317' });
                 * @example <caption>Leads record detail page</caption>
                 * ZDK.Client.navigateTo('record_detail', { module: 'Leads', record_id: '11111023162335' });
                 * @example <caption>Custom data to be passed and the data can be accessed from $Page.navigation_data</caption>
                 * ZDK.Client.navigateTo('record_list', { module: 'Leads', custom_view_id: '111111000000046541', custom_data: [{ key: "value"}] },'_self',);
                 * @example <caption>Leads record create page with layout</caption>
                 * ZDK.Client.navigateTo('record_create', { module: 'Leads', layout_id: "111111000000069302"});
                 */
                navigateTo : async function(page, params, target = '_self', data) {
                    return newRequestPromise({ action: 'route_navigate', page, params, data, target }); // No i18n
                },
                notify: async function (event_name, data) {
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
                    }
                    throw new TypeError('First argument must be a String'); // no i18n
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
                    validator(accept_message, 'accept_message', { max_length: 15, min_length: 1, required: false });
                    validator(reject_message, 'reject_message', { max_length: 15, min_length: 1, required: false });
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
                    }
                    throw new TypeError('First argument must be a String'); // no i18n
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
                    validator(accept_message, 'accept_message', { max_length: 15, min_length: 1, required: false });
                    validator(heading, 'heading', { max_length: 200, min_length: 1, required: false });
                    if (typeof message === 'string' || message instanceof String) {
                        return newRequestPromise({
                            action: 'alert',
                            message,
                            heading,
                            accept_message
                        }, {
                            userInput: true
                        }); // No i18n
                    }
                    throw new TypeError('First argument must be a String'); // no i18n                    
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
                 * @summary Open popup widget and await a response from the widget's <a href="/explore/widgets/v1.5/$Client#close" target='_blank'>$Client.close()</a>. Moreover, custom data can be passed to widget's <a href="/explore/widgets/v1.5/jssdk#PageLoad" target='_blank'>'PageLoad'</a> event. Supported Widget SDK version >= 1.2.
                 * @description Note: The presence of an active loader restricts the availability of other pop-ups.
                 * @memberof ZDK.Client
                 * @function
                 * @returns {object | string | number | boolean} Response from widget's <a href="/explore/widgets/v1.5/$Client#close" target='_blank'>$Client.close()</a>
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
                 * @param {any} [data] - data to be passed as <a href="/explore/widgets/v1.5/jssdk#PageLoad" target='_blank'>'PageLoad'</a> event data in Widget
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
                        message: config && config.message ? config.message : ''
                    }, {
                        loading: (config.type === 'page' && config.template !== 'standard')
                    });
                },
                /**
                 * @function
                 * @description Hides the Loader 
                 * @memberof ZDK.Client
                 * @example <caption>Sample</caption>
                 * ZDK.Client.hideLoader();
                 */
                hideLoader: async function () {
                    return newRequestPromise({
                        action: 'hide_loader' // No i18n
                    }, {
                        loading: false
                    });
                }
            }
        })()
    };

    /**
     * @namespace $Crm
     * @category Utilities
     */
    var $Crm = (function () {
        return {
            /**
            * @function
            * @description presently logged-in user information
            * @memberof $Crm
            * @instance
            * @returns {Object} user object
            * @example <caption>Sample</caption>
            * await $Crm.user;
            * 
            * //prints
            * {
            * 	"id": "5276272000000364001",
            * 	"zuid": "714939747",
            *	"full_name": "Henry",
            *	"first_name": "Henry",
            *	"email": "henry@zylker.com",
            *	"last_name": "R",
            *	"date_format": "MMM d, yyyy",
            *	"role": {id: "111111000000000706", name: "CEO"},
            * 	"profile": {id: "111111000000000423", name: "Administrator"},
            *   "type":"Regular User/Client Portal User"
            * }
            */
            get user(){
                return newRequestPromise({ action: 'variable', key: 'user' });	// No i18n
            },
            /**
             * @function
             * @description present environment (production/sandbox)
             * @memberof $Crm
             * @instance
             * @returns {string} environment 
             * @example <caption>Sample</caption>
             * await $Crm.environment;
             * 
             * //prints
             * production
             */
            get environment(){
                return newRequestPromise({ action: 'variable', key: 'environment' });	// No i18n
            },
            /**
             * @function
             * @description present deployment (US/EU/CN/JP/IN/AU)
             * @memberof $Crm
             * @instance
             * @returns {string} deployment
             * @example <caption>Sample</caption>
             * await $Crm.deployment;
             * 
             * //prints
             * US
             */
            get deployment(){
                return newRequestPromise({ action: 'variable', key: 'deployment' });	// No i18n
            },
            /**
             * @type {object}
             * @description org information
             * @memberof $Crm
             * @instance
             * @returns {Object} org object
             * @example <caption>Sample</caption>
             * await $Crm.org;
             * 
             * //prints
             * {
             * 	"type": "production",
             * 	"domain_name": "org77591XXXX",
             * 	"name": "Zoho",
             * 	 "id": "77591XXXX"
             * }
             */
            get org(){
                return newRequestPromise({ action: 'variable', key: 'org' });	// No i18n
            },
            /**
             * @function userPreference
             * @memberof $Crm
             * @description get Current user's preference
             * @returns {Promise} Resolved with current user's preference
             * @example
             * await $Crm.org;
             * 
             * //prints 
             * {
             *   "mode": "day"
             * }
             *
             */
            get userPreference() {
                return config("USER_PREFERENCE");
            }
        }
    })();

    global.ZDK = ZDK;
    global.$Crm = $Crm;
})(typeof self !== "undefined" ? self : window);