System.registerDynamic("signalr/signalr", [], false, function($__require, $__exports, $__module) {
  var _retrieveGlobal = System.get("@@global-helpers").prepareGlobal($__module.id, null, null);
  (function() {
    (function($, window, undefined) {
      var resources = {
        nojQuery: "jQuery was not found. Please ensure jQuery is referenced before the SignalR client JavaScript file.",
        noTransportOnInit: "No transport could be initialized successfully. Try specifying a different transport or none at all for auto initialization.",
        errorOnNegotiate: "Error during negotiation request.",
        stoppedWhileLoading: "The connection was stopped during page load.",
        stoppedWhileNegotiating: "The connection was stopped during the negotiate request.",
        errorParsingNegotiateResponse: "Error parsing negotiate response.",
        errorDuringStartRequest: "Error during start request. Stopping the connection.",
        stoppedDuringStartRequest: "The connection was stopped during the start request.",
        errorParsingStartResponse: "Error parsing start response: '{0}'. Stopping the connection.",
        invalidStartResponse: "Invalid start response: '{0}'. Stopping the connection.",
        protocolIncompatible: "You are using a version of the client that isn't compatible with the server. Client version {0}, server version {1}.",
        sendFailed: "Send failed.",
        parseFailed: "Failed at parsing response: {0}",
        longPollFailed: "Long polling request failed.",
        eventSourceFailedToConnect: "EventSource failed to connect.",
        eventSourceError: "Error raised by EventSource",
        webSocketClosed: "WebSocket closed.",
        pingServerFailedInvalidResponse: "Invalid ping response when pinging server: '{0}'.",
        pingServerFailed: "Failed to ping server.",
        pingServerFailedStatusCode: "Failed to ping server.  Server responded with status code {0}, stopping the connection.",
        pingServerFailedParse: "Failed to parse ping server response, stopping the connection.",
        noConnectionTransport: "Connection is in an invalid state, there is no transport active.",
        webSocketsInvalidState: "The Web Socket transport is in an invalid state, transitioning into reconnecting.",
        reconnectTimeout: "Couldn't reconnect within the configured timeout of {0} ms, disconnecting.",
        reconnectWindowTimeout: "The client has been inactive since {0} and it has exceeded the inactivity timeout of {1} ms. Stopping the connection."
      };
      if (typeof($) !== "function") {
        throw new Error(resources.nojQuery);
      }
      var signalR,
          _connection,
          _pageLoaded = (window.document.readyState === "complete"),
          _pageWindow = $(window),
          _negotiateAbortText = "__Negotiate Aborted__",
          events = {
            onStart: "onStart",
            onStarting: "onStarting",
            onReceived: "onReceived",
            onError: "onError",
            onConnectionSlow: "onConnectionSlow",
            onReconnecting: "onReconnecting",
            onReconnect: "onReconnect",
            onStateChanged: "onStateChanged",
            onDisconnect: "onDisconnect"
          },
          ajaxDefaults = {
            processData: true,
            timeout: null,
            async: true,
            global: false,
            cache: false
          },
          log = function(msg, logging) {
            if (logging === false) {
              return;
            }
            var m;
            if (typeof(window.console) === "undefined") {
              return;
            }
            m = "[" + new Date().toTimeString() + "] SignalR: " + msg;
            if (window.console.debug) {
              window.console.debug(m);
            } else if (window.console.log) {
              window.console.log(m);
            }
          },
          changeState = function(connection, expectedState, newState) {
            if (expectedState === connection.state) {
              connection.state = newState;
              $(connection).triggerHandler(events.onStateChanged, [{
                oldState: expectedState,
                newState: newState
              }]);
              return true;
            }
            return false;
          },
          isDisconnecting = function(connection) {
            return connection.state === signalR.connectionState.disconnected;
          },
          supportsKeepAlive = function(connection) {
            return connection._.keepAliveData.activated && connection.transport.supportsKeepAlive(connection);
          },
          configureStopReconnectingTimeout = function(connection) {
            var stopReconnectingTimeout,
                onReconnectTimeout;
            if (!connection._.configuredStopReconnectingTimeout) {
              onReconnectTimeout = function(connection) {
                var message = signalR._.format(signalR.resources.reconnectTimeout, connection.disconnectTimeout);
                connection.log(message);
                $(connection).triggerHandler(events.onError, [signalR._.error(message, "TimeoutException")]);
                connection.stop(false, false);
              };
              connection.reconnecting(function() {
                var connection = this;
                if (connection.state === signalR.connectionState.reconnecting) {
                  stopReconnectingTimeout = window.setTimeout(function() {
                    onReconnectTimeout(connection);
                  }, connection.disconnectTimeout);
                }
              });
              connection.stateChanged(function(data) {
                if (data.oldState === signalR.connectionState.reconnecting) {
                  window.clearTimeout(stopReconnectingTimeout);
                }
              });
              connection._.configuredStopReconnectingTimeout = true;
            }
          };
      signalR = function(url, qs, logging) {
        return new signalR.fn.init(url, qs, logging);
      };
      signalR._ = {
        defaultContentType: "application/x-www-form-urlencoded; charset=UTF-8",
        ieVersion: (function() {
          var version,
              matches;
          if (window.navigator.appName === 'Microsoft Internet Explorer') {
            matches = /MSIE ([0-9]+\.[0-9]+)/.exec(window.navigator.userAgent);
            if (matches) {
              version = window.parseFloat(matches[1]);
            }
          }
          return version;
        })(),
        error: function(message, source, context) {
          var e = new Error(message);
          e.source = source;
          if (typeof context !== "undefined") {
            e.context = context;
          }
          return e;
        },
        transportError: function(message, transport, source, context) {
          var e = this.error(message, source, context);
          e.transport = transport ? transport.name : undefined;
          return e;
        },
        format: function() {
          var s = arguments[0];
          for (var i = 0; i < arguments.length - 1; i++) {
            s = s.replace("{" + i + "}", arguments[i + 1]);
          }
          return s;
        },
        firefoxMajorVersion: function(userAgent) {
          var matches = userAgent.match(/Firefox\/(\d+)/);
          if (!matches || !matches.length || matches.length < 2) {
            return 0;
          }
          return parseInt(matches[1], 10);
        },
        configurePingInterval: function(connection) {
          var config = connection._.config,
              onFail = function(error) {
                $(connection).triggerHandler(events.onError, [error]);
              };
          if (config && !connection._.pingIntervalId && config.pingInterval) {
            connection._.pingIntervalId = window.setInterval(function() {
              signalR.transports._logic.pingServer(connection).fail(onFail);
            }, config.pingInterval);
          }
        }
      };
      signalR.events = events;
      signalR.resources = resources;
      signalR.ajaxDefaults = ajaxDefaults;
      signalR.changeState = changeState;
      signalR.isDisconnecting = isDisconnecting;
      signalR.connectionState = {
        connecting: 0,
        connected: 1,
        reconnecting: 2,
        disconnected: 4
      };
      signalR.hub = {start: function() {
          throw new Error("SignalR: Error loading hubs. Ensure your hubs reference is correct, e.g. <script src='/signalr/js'></script>.");
        }};
      _pageWindow.load(function() {
        _pageLoaded = true;
      });
      function validateTransport(requestedTransport, connection) {
        if ($.isArray(requestedTransport)) {
          for (var i = requestedTransport.length - 1; i >= 0; i--) {
            var transport = requestedTransport[i];
            if ($.type(transport) !== "string" || !signalR.transports[transport]) {
              connection.log("Invalid transport: " + transport + ", removing it from the transports list.");
              requestedTransport.splice(i, 1);
            }
          }
          if (requestedTransport.length === 0) {
            connection.log("No transports remain within the specified transport array.");
            requestedTransport = null;
          }
        } else if (!signalR.transports[requestedTransport] && requestedTransport !== "auto") {
          connection.log("Invalid transport: " + requestedTransport.toString() + ".");
          requestedTransport = null;
        } else if (requestedTransport === "auto" && signalR._.ieVersion <= 8) {
          return ["longPolling"];
        }
        return requestedTransport;
      }
      function getDefaultPort(protocol) {
        if (protocol === "http:") {
          return 80;
        } else if (protocol === "https:") {
          return 443;
        }
      }
      function addDefaultPort(protocol, url) {
        if (url.match(/:\d+$/)) {
          return url;
        } else {
          return url + ":" + getDefaultPort(protocol);
        }
      }
      function ConnectingMessageBuffer(connection, drainCallback) {
        var that = this,
            buffer = [];
        that.tryBuffer = function(message) {
          if (connection.state === $.signalR.connectionState.connecting) {
            buffer.push(message);
            return true;
          }
          return false;
        };
        that.drain = function() {
          if (connection.state === $.signalR.connectionState.connected) {
            while (buffer.length > 0) {
              drainCallback(buffer.shift());
            }
          }
        };
        that.clear = function() {
          buffer = [];
        };
      }
      signalR.fn = signalR.prototype = {
        init: function(url, qs, logging) {
          var $connection = $(this);
          this.url = url;
          this.qs = qs;
          this.lastError = null;
          this._ = {
            keepAliveData: {},
            connectingMessageBuffer: new ConnectingMessageBuffer(this, function(message) {
              $connection.triggerHandler(events.onReceived, [message]);
            }),
            lastMessageAt: new Date().getTime(),
            lastActiveAt: new Date().getTime(),
            beatInterval: 5000,
            beatHandle: null,
            totalTransportConnectTimeout: 0
          };
          if (typeof(logging) === "boolean") {
            this.logging = logging;
          }
        },
        _parseResponse: function(response) {
          var that = this;
          if (!response) {
            return response;
          } else if (typeof response === "string") {
            return that.json.parse(response);
          } else {
            return response;
          }
        },
        _originalJson: window.JSON,
        json: window.JSON,
        isCrossDomain: function(url, against) {
          var link;
          url = $.trim(url);
          against = against || window.location;
          if (url.indexOf("http") !== 0) {
            return false;
          }
          link = window.document.createElement("a");
          link.href = url;
          return link.protocol + addDefaultPort(link.protocol, link.host) !== against.protocol + addDefaultPort(against.protocol, against.host);
        },
        ajaxDataType: "text",
        contentType: "application/json; charset=UTF-8",
        logging: false,
        state: signalR.connectionState.disconnected,
        clientProtocol: "1.5",
        reconnectDelay: 2000,
        transportConnectTimeout: 0,
        disconnectTimeout: 30000,
        reconnectWindow: 30000,
        keepAliveWarnAt: 2 / 3,
        start: function(options, callback) {
          var connection = this,
              config = {
                pingInterval: 300000,
                waitForPageLoad: true,
                transport: "auto",
                jsonp: false
              },
              initialize,
              deferred = connection._deferral || $.Deferred(),
              parser = window.document.createElement("a");
          connection.lastError = null;
          connection._deferral = deferred;
          if (!connection.json) {
            throw new Error("SignalR: No JSON parser found. Please ensure json2.js is referenced before the SignalR.js file if you need to support clients without native JSON parsing support, e.g. IE<8.");
          }
          if ($.type(options) === "function") {
            callback = options;
          } else if ($.type(options) === "object") {
            $.extend(config, options);
            if ($.type(config.callback) === "function") {
              callback = config.callback;
            }
          }
          config.transport = validateTransport(config.transport, connection);
          if (!config.transport) {
            throw new Error("SignalR: Invalid transport(s) specified, aborting start.");
          }
          connection._.config = config;
          if (!_pageLoaded && config.waitForPageLoad === true) {
            connection._.deferredStartHandler = function() {
              connection.start(options, callback);
            };
            _pageWindow.bind("load", connection._.deferredStartHandler);
            return deferred.promise();
          }
          if (connection.state === signalR.connectionState.connecting) {
            return deferred.promise();
          } else if (changeState(connection, signalR.connectionState.disconnected, signalR.connectionState.connecting) === false) {
            deferred.resolve(connection);
            return deferred.promise();
          }
          configureStopReconnectingTimeout(connection);
          parser.href = connection.url;
          if (!parser.protocol || parser.protocol === ":") {
            connection.protocol = window.document.location.protocol;
            connection.host = parser.host || window.document.location.host;
          } else {
            connection.protocol = parser.protocol;
            connection.host = parser.host;
          }
          connection.baseUrl = connection.protocol + "//" + connection.host;
          connection.wsProtocol = connection.protocol === "https:" ? "wss://" : "ws://";
          if (config.transport === "auto" && config.jsonp === true) {
            config.transport = "longPolling";
          }
          if (connection.url.indexOf("//") === 0) {
            connection.url = window.location.protocol + connection.url;
            connection.log("Protocol relative URL detected, normalizing it to '" + connection.url + "'.");
          }
          if (this.isCrossDomain(connection.url)) {
            connection.log("Auto detected cross domain url.");
            if (config.transport === "auto") {
              config.transport = ["webSockets", "serverSentEvents", "longPolling"];
            }
            if (typeof(config.withCredentials) === "undefined") {
              config.withCredentials = true;
            }
            if (!config.jsonp) {
              config.jsonp = !$.support.cors;
              if (config.jsonp) {
                connection.log("Using jsonp because this browser doesn't support CORS.");
              }
            }
            connection.contentType = signalR._.defaultContentType;
          }
          connection.withCredentials = config.withCredentials;
          connection.ajaxDataType = config.jsonp ? "jsonp" : "text";
          $(connection).bind(events.onStart, function(e, data) {
            if ($.type(callback) === "function") {
              callback.call(connection);
            }
            deferred.resolve(connection);
          });
          connection._.initHandler = signalR.transports._logic.initHandler(connection);
          initialize = function(transports, index) {
            var noTransportError = signalR._.error(resources.noTransportOnInit);
            index = index || 0;
            if (index >= transports.length) {
              if (index === 0) {
                connection.log("No transports supported by the server were selected.");
              } else if (index === 1) {
                connection.log("No fallback transports were selected.");
              } else {
                connection.log("Fallback transports exhausted.");
              }
              $(connection).triggerHandler(events.onError, [noTransportError]);
              deferred.reject(noTransportError);
              connection.stop();
              return;
            }
            if (connection.state === signalR.connectionState.disconnected) {
              return;
            }
            var transportName = transports[index],
                transport = signalR.transports[transportName],
                onFallback = function() {
                  initialize(transports, index + 1);
                };
            connection.transport = transport;
            try {
              connection._.initHandler.start(transport, function() {
                var isFirefox11OrGreater = signalR._.firefoxMajorVersion(window.navigator.userAgent) >= 11,
                    asyncAbort = !!connection.withCredentials && isFirefox11OrGreater;
                connection.log("The start request succeeded. Transitioning to the connected state.");
                if (supportsKeepAlive(connection)) {
                  signalR.transports._logic.monitorKeepAlive(connection);
                }
                signalR.transports._logic.startHeartbeat(connection);
                signalR._.configurePingInterval(connection);
                if (!changeState(connection, signalR.connectionState.connecting, signalR.connectionState.connected)) {
                  connection.log("WARNING! The connection was not in the connecting state.");
                }
                connection._.connectingMessageBuffer.drain();
                $(connection).triggerHandler(events.onStart);
                _pageWindow.bind("unload", function() {
                  connection.log("Window unloading, stopping the connection.");
                  connection.stop(asyncAbort);
                });
                if (isFirefox11OrGreater) {
                  _pageWindow.bind("beforeunload", function() {
                    window.setTimeout(function() {
                      connection.stop(asyncAbort);
                    }, 0);
                  });
                }
              }, onFallback);
            } catch (error) {
              connection.log(transport.name + " transport threw '" + error.message + "' when attempting to start.");
              onFallback();
            }
          };
          var url = connection.url + "/negotiate",
              onFailed = function(error, connection) {
                var err = signalR._.error(resources.errorOnNegotiate, error, connection._.negotiateRequest);
                $(connection).triggerHandler(events.onError, err);
                deferred.reject(err);
                connection.stop();
              };
          $(connection).triggerHandler(events.onStarting);
          url = signalR.transports._logic.prepareQueryString(connection, url);
          connection.log("Negotiating with '" + url + "'.");
          connection._.negotiateRequest = signalR.transports._logic.ajax(connection, {
            url: url,
            error: function(error, statusText) {
              if (statusText !== _negotiateAbortText) {
                onFailed(error, connection);
              } else {
                deferred.reject(signalR._.error(resources.stoppedWhileNegotiating, null, connection._.negotiateRequest));
              }
            },
            success: function(result) {
              var res,
                  keepAliveData,
                  protocolError,
                  transports = [],
                  supportedTransports = [];
              try {
                res = connection._parseResponse(result);
              } catch (error) {
                onFailed(signalR._.error(resources.errorParsingNegotiateResponse, error), connection);
                return;
              }
              keepAliveData = connection._.keepAliveData;
              connection.appRelativeUrl = res.Url;
              connection.id = res.ConnectionId;
              connection.token = res.ConnectionToken;
              connection.webSocketServerUrl = res.WebSocketServerUrl;
              connection._.pollTimeout = res.ConnectionTimeout * 1000 + 10000;
              connection.disconnectTimeout = res.DisconnectTimeout * 1000;
              connection._.totalTransportConnectTimeout = connection.transportConnectTimeout + res.TransportConnectTimeout * 1000;
              if (res.KeepAliveTimeout) {
                keepAliveData.activated = true;
                keepAliveData.timeout = res.KeepAliveTimeout * 1000;
                keepAliveData.timeoutWarning = keepAliveData.timeout * connection.keepAliveWarnAt;
                connection._.beatInterval = (keepAliveData.timeout - keepAliveData.timeoutWarning) / 3;
              } else {
                keepAliveData.activated = false;
              }
              connection.reconnectWindow = connection.disconnectTimeout + (keepAliveData.timeout || 0);
              if (!res.ProtocolVersion || res.ProtocolVersion !== connection.clientProtocol) {
                protocolError = signalR._.error(signalR._.format(resources.protocolIncompatible, connection.clientProtocol, res.ProtocolVersion));
                $(connection).triggerHandler(events.onError, [protocolError]);
                deferred.reject(protocolError);
                return;
              }
              $.each(signalR.transports, function(key) {
                if ((key.indexOf("_") === 0) || (key === "webSockets" && !res.TryWebSockets)) {
                  return true;
                }
                supportedTransports.push(key);
              });
              if ($.isArray(config.transport)) {
                $.each(config.transport, function(_, transport) {
                  if ($.inArray(transport, supportedTransports) >= 0) {
                    transports.push(transport);
                  }
                });
              } else if (config.transport === "auto") {
                transports = supportedTransports;
              } else if ($.inArray(config.transport, supportedTransports) >= 0) {
                transports.push(config.transport);
              }
              initialize(transports);
            }
          });
          return deferred.promise();
        },
        starting: function(callback) {
          var connection = this;
          $(connection).bind(events.onStarting, function(e, data) {
            callback.call(connection);
          });
          return connection;
        },
        send: function(data) {
          var connection = this;
          if (connection.state === signalR.connectionState.disconnected) {
            throw new Error("SignalR: Connection must be started before data can be sent. Call .start() before .send()");
          }
          if (connection.state === signalR.connectionState.connecting) {
            throw new Error("SignalR: Connection has not been fully initialized. Use .start().done() or .start().fail() to run logic after the connection has started.");
          }
          connection.transport.send(connection, data);
          return connection;
        },
        received: function(callback) {
          var connection = this;
          $(connection).bind(events.onReceived, function(e, data) {
            callback.call(connection, data);
          });
          return connection;
        },
        stateChanged: function(callback) {
          var connection = this;
          $(connection).bind(events.onStateChanged, function(e, data) {
            callback.call(connection, data);
          });
          return connection;
        },
        error: function(callback) {
          var connection = this;
          $(connection).bind(events.onError, function(e, errorData, sendData) {
            connection.lastError = errorData;
            callback.call(connection, errorData, sendData);
          });
          return connection;
        },
        disconnected: function(callback) {
          var connection = this;
          $(connection).bind(events.onDisconnect, function(e, data) {
            callback.call(connection);
          });
          return connection;
        },
        connectionSlow: function(callback) {
          var connection = this;
          $(connection).bind(events.onConnectionSlow, function(e, data) {
            callback.call(connection);
          });
          return connection;
        },
        reconnecting: function(callback) {
          var connection = this;
          $(connection).bind(events.onReconnecting, function(e, data) {
            callback.call(connection);
          });
          return connection;
        },
        reconnected: function(callback) {
          var connection = this;
          $(connection).bind(events.onReconnect, function(e, data) {
            callback.call(connection);
          });
          return connection;
        },
        stop: function(async, notifyServer) {
          var connection = this,
              deferral = connection._deferral;
          if (connection._.deferredStartHandler) {
            _pageWindow.unbind("load", connection._.deferredStartHandler);
          }
          delete connection._.config;
          delete connection._.deferredStartHandler;
          if (!_pageLoaded && (!connection._.config || connection._.config.waitForPageLoad === true)) {
            connection.log("Stopping connection prior to negotiate.");
            if (deferral) {
              deferral.reject(signalR._.error(resources.stoppedWhileLoading));
            }
            return;
          }
          if (connection.state === signalR.connectionState.disconnected) {
            return;
          }
          connection.log("Stopping connection.");
          changeState(connection, connection.state, signalR.connectionState.disconnected);
          window.clearTimeout(connection._.beatHandle);
          window.clearInterval(connection._.pingIntervalId);
          if (connection.transport) {
            connection.transport.stop(connection);
            if (notifyServer !== false) {
              connection.transport.abort(connection, async);
            }
            if (supportsKeepAlive(connection)) {
              signalR.transports._logic.stopMonitoringKeepAlive(connection);
            }
            connection.transport = null;
          }
          if (connection._.negotiateRequest) {
            connection._.negotiateRequest.abort(_negotiateAbortText);
            delete connection._.negotiateRequest;
          }
          if (connection._.initHandler) {
            connection._.initHandler.stop();
          }
          $(connection).triggerHandler(events.onDisconnect);
          delete connection._deferral;
          delete connection.messageId;
          delete connection.groupsToken;
          delete connection.id;
          delete connection._.pingIntervalId;
          delete connection._.lastMessageAt;
          delete connection._.lastActiveAt;
          connection._.connectingMessageBuffer.clear();
          return connection;
        },
        log: function(msg) {
          log(msg, this.logging);
        }
      };
      signalR.fn.init.prototype = signalR.fn;
      signalR.noConflict = function() {
        if ($.connection === signalR) {
          $.connection = _connection;
        }
        return signalR;
      };
      if ($.connection) {
        _connection = $.connection;
      }
      $.connection = $.signalR = signalR;
    }(window.jQuery, window));
    (function($, window, undefined) {
      var signalR = $.signalR,
          events = $.signalR.events,
          changeState = $.signalR.changeState,
          startAbortText = "__Start Aborted__",
          transportLogic;
      signalR.transports = {};
      function beat(connection) {
        if (connection._.keepAliveData.monitoring) {
          checkIfAlive(connection);
        }
        if (transportLogic.markActive(connection)) {
          connection._.beatHandle = window.setTimeout(function() {
            beat(connection);
          }, connection._.beatInterval);
        }
      }
      function checkIfAlive(connection) {
        var keepAliveData = connection._.keepAliveData,
            timeElapsed;
        if (connection.state === signalR.connectionState.connected) {
          timeElapsed = new Date().getTime() - connection._.lastMessageAt;
          if (timeElapsed >= keepAliveData.timeout) {
            connection.log("Keep alive timed out.  Notifying transport that connection has been lost.");
            connection.transport.lostConnection(connection);
          } else if (timeElapsed >= keepAliveData.timeoutWarning) {
            if (!keepAliveData.userNotified) {
              connection.log("Keep alive has been missed, connection may be dead/slow.");
              $(connection).triggerHandler(events.onConnectionSlow);
              keepAliveData.userNotified = true;
            }
          } else {
            keepAliveData.userNotified = false;
          }
        }
      }
      function getAjaxUrl(connection, path) {
        var url = connection.url + path;
        if (connection.transport) {
          url += "?transport=" + connection.transport.name;
        }
        return transportLogic.prepareQueryString(connection, url);
      }
      function InitHandler(connection) {
        this.connection = connection;
        this.startRequested = false;
        this.startCompleted = false;
        this.connectionStopped = false;
      }
      InitHandler.prototype = {
        start: function(transport, onSuccess, onFallback) {
          var that = this,
              connection = that.connection,
              failCalled = false;
          if (that.startRequested || that.connectionStopped) {
            connection.log("WARNING! " + transport.name + " transport cannot be started. Initialization ongoing or completed.");
            return;
          }
          connection.log(transport.name + " transport starting.");
          that.transportTimeoutHandle = window.setTimeout(function() {
            if (!failCalled) {
              failCalled = true;
              connection.log(transport.name + " transport timed out when trying to connect.");
              that.transportFailed(transport, undefined, onFallback);
            }
          }, connection._.totalTransportConnectTimeout);
          transport.start(connection, function() {
            if (!failCalled) {
              that.initReceived(transport, onSuccess);
            }
          }, function(error) {
            if (!failCalled) {
              failCalled = true;
              that.transportFailed(transport, error, onFallback);
            }
            return !that.startCompleted || that.connectionStopped;
          });
        },
        stop: function() {
          this.connectionStopped = true;
          window.clearTimeout(this.transportTimeoutHandle);
          signalR.transports._logic.tryAbortStartRequest(this.connection);
        },
        initReceived: function(transport, onSuccess) {
          var that = this,
              connection = that.connection;
          if (that.startRequested) {
            connection.log("WARNING! The client received multiple init messages.");
            return;
          }
          if (that.connectionStopped) {
            return;
          }
          that.startRequested = true;
          window.clearTimeout(that.transportTimeoutHandle);
          connection.log(transport.name + " transport connected. Initiating start request.");
          signalR.transports._logic.ajaxStart(connection, function() {
            that.startCompleted = true;
            onSuccess();
          });
        },
        transportFailed: function(transport, error, onFallback) {
          var connection = this.connection,
              deferred = connection._deferral,
              wrappedError;
          if (this.connectionStopped) {
            return;
          }
          window.clearTimeout(this.transportTimeoutHandle);
          if (!this.startRequested) {
            transport.stop(connection);
            connection.log(transport.name + " transport failed to connect. Attempting to fall back.");
            onFallback();
          } else if (!this.startCompleted) {
            wrappedError = signalR._.error(signalR.resources.errorDuringStartRequest, error);
            connection.log(transport.name + " transport failed during the start request. Stopping the connection.");
            $(connection).triggerHandler(events.onError, [wrappedError]);
            if (deferred) {
              deferred.reject(wrappedError);
            }
            connection.stop();
          } else {}
        }
      };
      transportLogic = signalR.transports._logic = {
        ajax: function(connection, options) {
          return $.ajax($.extend(true, {}, $.signalR.ajaxDefaults, {
            type: "GET",
            data: {},
            xhrFields: {withCredentials: connection.withCredentials},
            contentType: connection.contentType,
            dataType: connection.ajaxDataType
          }, options));
        },
        pingServer: function(connection) {
          var url,
              xhr,
              deferral = $.Deferred();
          if (connection.transport) {
            url = connection.url + "/ping";
            url = transportLogic.addQs(url, connection.qs);
            xhr = transportLogic.ajax(connection, {
              url: url,
              success: function(result) {
                var data;
                try {
                  data = connection._parseResponse(result);
                } catch (error) {
                  deferral.reject(signalR._.transportError(signalR.resources.pingServerFailedParse, connection.transport, error, xhr));
                  connection.stop();
                  return;
                }
                if (data.Response === "pong") {
                  deferral.resolve();
                } else {
                  deferral.reject(signalR._.transportError(signalR._.format(signalR.resources.pingServerFailedInvalidResponse, result), connection.transport, null, xhr));
                }
              },
              error: function(error) {
                if (error.status === 401 || error.status === 403) {
                  deferral.reject(signalR._.transportError(signalR._.format(signalR.resources.pingServerFailedStatusCode, error.status), connection.transport, error, xhr));
                  connection.stop();
                } else {
                  deferral.reject(signalR._.transportError(signalR.resources.pingServerFailed, connection.transport, error, xhr));
                }
              }
            });
          } else {
            deferral.reject(signalR._.transportError(signalR.resources.noConnectionTransport, connection.transport));
          }
          return deferral.promise();
        },
        prepareQueryString: function(connection, url) {
          var preparedUrl;
          preparedUrl = transportLogic.addQs(url, "clientProtocol=" + connection.clientProtocol);
          preparedUrl = transportLogic.addQs(preparedUrl, connection.qs);
          if (connection.token) {
            preparedUrl += "&connectionToken=" + window.encodeURIComponent(connection.token);
          }
          if (connection.data) {
            preparedUrl += "&connectionData=" + window.encodeURIComponent(connection.data);
          }
          return preparedUrl;
        },
        addQs: function(url, qs) {
          var appender = url.indexOf("?") !== -1 ? "&" : "?",
              firstChar;
          if (!qs) {
            return url;
          }
          if (typeof(qs) === "object") {
            return url + appender + $.param(qs);
          }
          if (typeof(qs) === "string") {
            firstChar = qs.charAt(0);
            if (firstChar === "?" || firstChar === "&") {
              appender = "";
            }
            return url + appender + qs;
          }
          throw new Error("Query string property must be either a string or object.");
        },
        getUrl: function(connection, transport, reconnecting, poll, ajaxPost) {
          var baseUrl = transport === "webSockets" ? "" : connection.baseUrl,
              url = baseUrl + connection.appRelativeUrl,
              qs = "transport=" + transport;
          if (!ajaxPost && connection.groupsToken) {
            qs += "&groupsToken=" + window.encodeURIComponent(connection.groupsToken);
          }
          if (!reconnecting) {
            url += "/connect";
          } else {
            if (poll) {
              url += "/poll";
            } else {
              url += "/reconnect";
            }
            if (!ajaxPost && connection.messageId) {
              qs += "&messageId=" + window.encodeURIComponent(connection.messageId);
            }
          }
          url += "?" + qs;
          url = transportLogic.prepareQueryString(connection, url);
          if (!ajaxPost) {
            url += "&tid=" + Math.floor(Math.random() * 11);
          }
          return url;
        },
        maximizePersistentResponse: function(minPersistentResponse) {
          return {
            MessageId: minPersistentResponse.C,
            Messages: minPersistentResponse.M,
            Initialized: typeof(minPersistentResponse.S) !== "undefined" ? true : false,
            ShouldReconnect: typeof(minPersistentResponse.T) !== "undefined" ? true : false,
            LongPollDelay: minPersistentResponse.L,
            GroupsToken: minPersistentResponse.G
          };
        },
        updateGroups: function(connection, groupsToken) {
          if (groupsToken) {
            connection.groupsToken = groupsToken;
          }
        },
        stringifySend: function(connection, message) {
          if (typeof(message) === "string" || typeof(message) === "undefined" || message === null) {
            return message;
          }
          return connection.json.stringify(message);
        },
        ajaxSend: function(connection, data) {
          var payload = transportLogic.stringifySend(connection, data),
              url = getAjaxUrl(connection, "/send"),
              xhr,
              onFail = function(error, connection) {
                $(connection).triggerHandler(events.onError, [signalR._.transportError(signalR.resources.sendFailed, connection.transport, error, xhr), data]);
              };
          xhr = transportLogic.ajax(connection, {
            url: url,
            type: connection.ajaxDataType === "jsonp" ? "GET" : "POST",
            contentType: signalR._.defaultContentType,
            data: {data: payload},
            success: function(result) {
              var res;
              if (result) {
                try {
                  res = connection._parseResponse(result);
                } catch (error) {
                  onFail(error, connection);
                  connection.stop();
                  return;
                }
                transportLogic.triggerReceived(connection, res);
              }
            },
            error: function(error, textStatus) {
              if (textStatus === "abort" || textStatus === "parsererror") {
                return;
              }
              onFail(error, connection);
            }
          });
          return xhr;
        },
        ajaxAbort: function(connection, async) {
          if (typeof(connection.transport) === "undefined") {
            return;
          }
          async = typeof async === "undefined" ? true : async;
          var url = getAjaxUrl(connection, "/abort");
          transportLogic.ajax(connection, {
            url: url,
            async: async,
            timeout: 1000,
            type: "POST"
          });
          connection.log("Fired ajax abort async = " + async + ".");
        },
        ajaxStart: function(connection, onSuccess) {
          var rejectDeferred = function(error) {
            var deferred = connection._deferral;
            if (deferred) {
              deferred.reject(error);
            }
          },
              triggerStartError = function(error) {
                connection.log("The start request failed. Stopping the connection.");
                $(connection).triggerHandler(events.onError, [error]);
                rejectDeferred(error);
                connection.stop();
              };
          connection._.startRequest = transportLogic.ajax(connection, {
            url: getAjaxUrl(connection, "/start"),
            success: function(result, statusText, xhr) {
              var data;
              try {
                data = connection._parseResponse(result);
              } catch (error) {
                triggerStartError(signalR._.error(signalR._.format(signalR.resources.errorParsingStartResponse, result), error, xhr));
                return;
              }
              if (data.Response === "started") {
                onSuccess();
              } else {
                triggerStartError(signalR._.error(signalR._.format(signalR.resources.invalidStartResponse, result), null, xhr));
              }
            },
            error: function(xhr, statusText, error) {
              if (statusText !== startAbortText) {
                triggerStartError(signalR._.error(signalR.resources.errorDuringStartRequest, error, xhr));
              } else {
                connection.log("The start request aborted because connection.stop() was called.");
                rejectDeferred(signalR._.error(signalR.resources.stoppedDuringStartRequest, null, xhr));
              }
            }
          });
        },
        tryAbortStartRequest: function(connection) {
          if (connection._.startRequest) {
            connection._.startRequest.abort(startAbortText);
            delete connection._.startRequest;
          }
        },
        tryInitialize: function(persistentResponse, onInitialized) {
          if (persistentResponse.Initialized) {
            onInitialized();
          }
        },
        triggerReceived: function(connection, data) {
          if (!connection._.connectingMessageBuffer.tryBuffer(data)) {
            $(connection).triggerHandler(events.onReceived, [data]);
          }
        },
        processMessages: function(connection, minData, onInitialized) {
          var data;
          transportLogic.markLastMessage(connection);
          if (minData) {
            data = transportLogic.maximizePersistentResponse(minData);
            transportLogic.updateGroups(connection, data.GroupsToken);
            if (data.MessageId) {
              connection.messageId = data.MessageId;
            }
            if (data.Messages) {
              $.each(data.Messages, function(index, message) {
                transportLogic.triggerReceived(connection, message);
              });
              transportLogic.tryInitialize(data, onInitialized);
            }
          }
        },
        monitorKeepAlive: function(connection) {
          var keepAliveData = connection._.keepAliveData;
          if (!keepAliveData.monitoring) {
            keepAliveData.monitoring = true;
            transportLogic.markLastMessage(connection);
            connection._.keepAliveData.reconnectKeepAliveUpdate = function() {
              transportLogic.markLastMessage(connection);
            };
            $(connection).bind(events.onReconnect, connection._.keepAliveData.reconnectKeepAliveUpdate);
            connection.log("Now monitoring keep alive with a warning timeout of " + keepAliveData.timeoutWarning + ", keep alive timeout of " + keepAliveData.timeout + " and disconnecting timeout of " + connection.disconnectTimeout);
          } else {
            connection.log("Tried to monitor keep alive but it's already being monitored.");
          }
        },
        stopMonitoringKeepAlive: function(connection) {
          var keepAliveData = connection._.keepAliveData;
          if (keepAliveData.monitoring) {
            keepAliveData.monitoring = false;
            $(connection).unbind(events.onReconnect, connection._.keepAliveData.reconnectKeepAliveUpdate);
            connection._.keepAliveData = {};
            connection.log("Stopping the monitoring of the keep alive.");
          }
        },
        startHeartbeat: function(connection) {
          connection._.lastActiveAt = new Date().getTime();
          beat(connection);
        },
        markLastMessage: function(connection) {
          connection._.lastMessageAt = new Date().getTime();
        },
        markActive: function(connection) {
          if (transportLogic.verifyLastActive(connection)) {
            connection._.lastActiveAt = new Date().getTime();
            return true;
          }
          return false;
        },
        isConnectedOrReconnecting: function(connection) {
          return connection.state === signalR.connectionState.connected || connection.state === signalR.connectionState.reconnecting;
        },
        ensureReconnectingState: function(connection) {
          if (changeState(connection, signalR.connectionState.connected, signalR.connectionState.reconnecting) === true) {
            $(connection).triggerHandler(events.onReconnecting);
          }
          return connection.state === signalR.connectionState.reconnecting;
        },
        clearReconnectTimeout: function(connection) {
          if (connection && connection._.reconnectTimeout) {
            window.clearTimeout(connection._.reconnectTimeout);
            delete connection._.reconnectTimeout;
          }
        },
        verifyLastActive: function(connection) {
          if (new Date().getTime() - connection._.lastActiveAt >= connection.reconnectWindow) {
            var message = signalR._.format(signalR.resources.reconnectWindowTimeout, new Date(connection._.lastActiveAt), connection.reconnectWindow);
            connection.log(message);
            $(connection).triggerHandler(events.onError, [signalR._.error(message, "TimeoutException")]);
            connection.stop(false, false);
            return false;
          }
          return true;
        },
        reconnect: function(connection, transportName) {
          var transport = signalR.transports[transportName];
          if (transportLogic.isConnectedOrReconnecting(connection) && !connection._.reconnectTimeout) {
            if (!transportLogic.verifyLastActive(connection)) {
              return;
            }
            connection._.reconnectTimeout = window.setTimeout(function() {
              if (!transportLogic.verifyLastActive(connection)) {
                return;
              }
              transport.stop(connection);
              if (transportLogic.ensureReconnectingState(connection)) {
                connection.log(transportName + " reconnecting.");
                transport.start(connection);
              }
            }, connection.reconnectDelay);
          }
        },
        handleParseFailure: function(connection, result, error, onFailed, context) {
          var wrappedError = signalR._.transportError(signalR._.format(signalR.resources.parseFailed, result), connection.transport, error, context);
          if (onFailed && onFailed(wrappedError)) {
            connection.log("Failed to parse server response while attempting to connect.");
          } else {
            $(connection).triggerHandler(events.onError, [wrappedError]);
            connection.stop();
          }
        },
        initHandler: function(connection) {
          return new InitHandler(connection);
        },
        foreverFrame: {
          count: 0,
          connections: {}
        }
      };
    }(window.jQuery, window));
    (function($, window, undefined) {
      var signalR = $.signalR,
          events = $.signalR.events,
          changeState = $.signalR.changeState,
          transportLogic = signalR.transports._logic;
      signalR.transports.webSockets = {
        name: "webSockets",
        supportsKeepAlive: function() {
          return true;
        },
        send: function(connection, data) {
          var payload = transportLogic.stringifySend(connection, data);
          try {
            connection.socket.send(payload);
          } catch (ex) {
            $(connection).triggerHandler(events.onError, [signalR._.transportError(signalR.resources.webSocketsInvalidState, connection.transport, ex, connection.socket), data]);
          }
        },
        start: function(connection, onSuccess, onFailed) {
          var url,
              opened = false,
              that = this,
              reconnecting = !onSuccess,
              $connection = $(connection);
          if (!window.WebSocket) {
            onFailed();
            return;
          }
          if (!connection.socket) {
            if (connection.webSocketServerUrl) {
              url = connection.webSocketServerUrl;
            } else {
              url = connection.wsProtocol + connection.host;
            }
            url += transportLogic.getUrl(connection, this.name, reconnecting);
            connection.log("Connecting to websocket endpoint '" + url + "'.");
            connection.socket = new window.WebSocket(url);
            connection.socket.onopen = function() {
              opened = true;
              connection.log("Websocket opened.");
              transportLogic.clearReconnectTimeout(connection);
              if (changeState(connection, signalR.connectionState.reconnecting, signalR.connectionState.connected) === true) {
                $connection.triggerHandler(events.onReconnect);
              }
            };
            connection.socket.onclose = function(event) {
              var error;
              if (this === connection.socket) {
                if (opened && typeof event.wasClean !== "undefined" && event.wasClean === false) {
                  error = signalR._.transportError(signalR.resources.webSocketClosed, connection.transport, event);
                  connection.log("Unclean disconnect from websocket: " + (event.reason || "[no reason given]."));
                } else {
                  connection.log("Websocket closed.");
                }
                if (!onFailed || !onFailed(error)) {
                  if (error) {
                    $(connection).triggerHandler(events.onError, [error]);
                  }
                  that.reconnect(connection);
                }
              }
            };
            connection.socket.onmessage = function(event) {
              var data;
              try {
                data = connection._parseResponse(event.data);
              } catch (error) {
                transportLogic.handleParseFailure(connection, event.data, error, onFailed, event);
                return;
              }
              if (data) {
                if ($.isEmptyObject(data) || data.M) {
                  transportLogic.processMessages(connection, data, onSuccess);
                } else {
                  transportLogic.triggerReceived(connection, data);
                }
              }
            };
          }
        },
        reconnect: function(connection) {
          transportLogic.reconnect(connection, this.name);
        },
        lostConnection: function(connection) {
          this.reconnect(connection);
        },
        stop: function(connection) {
          transportLogic.clearReconnectTimeout(connection);
          if (connection.socket) {
            connection.log("Closing the Websocket.");
            connection.socket.close();
            connection.socket = null;
          }
        },
        abort: function(connection, async) {
          transportLogic.ajaxAbort(connection, async);
        }
      };
    }(window.jQuery, window));
    (function($, window, undefined) {
      var signalR = $.signalR,
          events = $.signalR.events,
          changeState = $.signalR.changeState,
          transportLogic = signalR.transports._logic,
          clearReconnectAttemptTimeout = function(connection) {
            window.clearTimeout(connection._.reconnectAttemptTimeoutHandle);
            delete connection._.reconnectAttemptTimeoutHandle;
          };
      signalR.transports.serverSentEvents = {
        name: "serverSentEvents",
        supportsKeepAlive: function() {
          return true;
        },
        timeOut: 3000,
        start: function(connection, onSuccess, onFailed) {
          var that = this,
              opened = false,
              $connection = $(connection),
              reconnecting = !onSuccess,
              url;
          if (connection.eventSource) {
            connection.log("The connection already has an event source. Stopping it.");
            connection.stop();
          }
          if (!window.EventSource) {
            if (onFailed) {
              connection.log("This browser doesn't support SSE.");
              onFailed();
            }
            return;
          }
          url = transportLogic.getUrl(connection, this.name, reconnecting);
          try {
            connection.log("Attempting to connect to SSE endpoint '" + url + "'.");
            connection.eventSource = new window.EventSource(url, {withCredentials: connection.withCredentials});
          } catch (e) {
            connection.log("EventSource failed trying to connect with error " + e.Message + ".");
            if (onFailed) {
              onFailed();
            } else {
              $connection.triggerHandler(events.onError, [signalR._.transportError(signalR.resources.eventSourceFailedToConnect, connection.transport, e)]);
              if (reconnecting) {
                that.reconnect(connection);
              }
            }
            return;
          }
          if (reconnecting) {
            connection._.reconnectAttemptTimeoutHandle = window.setTimeout(function() {
              if (opened === false) {
                if (connection.eventSource.readyState !== window.EventSource.OPEN) {
                  that.reconnect(connection);
                }
              }
            }, that.timeOut);
          }
          connection.eventSource.addEventListener("open", function(e) {
            connection.log("EventSource connected.");
            clearReconnectAttemptTimeout(connection);
            transportLogic.clearReconnectTimeout(connection);
            if (opened === false) {
              opened = true;
              if (changeState(connection, signalR.connectionState.reconnecting, signalR.connectionState.connected) === true) {
                $connection.triggerHandler(events.onReconnect);
              }
            }
          }, false);
          connection.eventSource.addEventListener("message", function(e) {
            var res;
            if (e.data === "initialized") {
              return;
            }
            try {
              res = connection._parseResponse(e.data);
            } catch (error) {
              transportLogic.handleParseFailure(connection, e.data, error, onFailed, e);
              return;
            }
            transportLogic.processMessages(connection, res, onSuccess);
          }, false);
          connection.eventSource.addEventListener("error", function(e) {
            var error = signalR._.transportError(signalR.resources.eventSourceError, connection.transport, e);
            if (this !== connection.eventSource) {
              return;
            }
            if (onFailed && onFailed(error)) {
              return;
            }
            connection.log("EventSource readyState: " + connection.eventSource.readyState + ".");
            if (e.eventPhase === window.EventSource.CLOSED) {
              connection.log("EventSource reconnecting due to the server connection ending.");
              that.reconnect(connection);
            } else {
              connection.log("EventSource error.");
              $connection.triggerHandler(events.onError, [error]);
            }
          }, false);
        },
        reconnect: function(connection) {
          transportLogic.reconnect(connection, this.name);
        },
        lostConnection: function(connection) {
          this.reconnect(connection);
        },
        send: function(connection, data) {
          transportLogic.ajaxSend(connection, data);
        },
        stop: function(connection) {
          clearReconnectAttemptTimeout(connection);
          transportLogic.clearReconnectTimeout(connection);
          if (connection && connection.eventSource) {
            connection.log("EventSource calling close().");
            connection.eventSource.close();
            connection.eventSource = null;
            delete connection.eventSource;
          }
        },
        abort: function(connection, async) {
          transportLogic.ajaxAbort(connection, async);
        }
      };
    }(window.jQuery, window));
    (function($, window, undefined) {
      var signalR = $.signalR,
          events = $.signalR.events,
          changeState = $.signalR.changeState,
          transportLogic = signalR.transports._logic,
          createFrame = function() {
            var frame = window.document.createElement("iframe");
            frame.setAttribute("style", "position:absolute;top:0;left:0;width:0;height:0;visibility:hidden;");
            return frame;
          },
          loadPreventer = (function() {
            var loadingFixIntervalId = null,
                loadingFixInterval = 1000,
                attachedTo = 0;
            return {
              prevent: function() {
                if (signalR._.ieVersion <= 8) {
                  if (attachedTo === 0) {
                    loadingFixIntervalId = window.setInterval(function() {
                      var tempFrame = createFrame();
                      window.document.body.appendChild(tempFrame);
                      window.document.body.removeChild(tempFrame);
                      tempFrame = null;
                    }, loadingFixInterval);
                  }
                  attachedTo++;
                }
              },
              cancel: function() {
                if (attachedTo === 1) {
                  window.clearInterval(loadingFixIntervalId);
                }
                if (attachedTo > 0) {
                  attachedTo--;
                }
              }
            };
          })();
      signalR.transports.foreverFrame = {
        name: "foreverFrame",
        supportsKeepAlive: function() {
          return true;
        },
        iframeClearThreshold: 50,
        start: function(connection, onSuccess, onFailed) {
          var that = this,
              frameId = (transportLogic.foreverFrame.count += 1),
              url,
              frame = createFrame(),
              frameLoadHandler = function() {
                connection.log("Forever frame iframe finished loading and is no longer receiving messages.");
                if (!onFailed || !onFailed()) {
                  that.reconnect(connection);
                }
              };
          if (window.EventSource) {
            if (onFailed) {
              connection.log("Forever Frame is not supported by SignalR on browsers with SSE support.");
              onFailed();
            }
            return;
          }
          frame.setAttribute("data-signalr-connection-id", connection.id);
          loadPreventer.prevent();
          url = transportLogic.getUrl(connection, this.name);
          url += "&frameId=" + frameId;
          window.document.documentElement.appendChild(frame);
          connection.log("Binding to iframe's load event.");
          if (frame.addEventListener) {
            frame.addEventListener("load", frameLoadHandler, false);
          } else if (frame.attachEvent) {
            frame.attachEvent("onload", frameLoadHandler);
          }
          frame.src = url;
          transportLogic.foreverFrame.connections[frameId] = connection;
          connection.frame = frame;
          connection.frameId = frameId;
          if (onSuccess) {
            connection.onSuccess = function() {
              connection.log("Iframe transport started.");
              onSuccess();
            };
          }
        },
        reconnect: function(connection) {
          var that = this;
          if (transportLogic.isConnectedOrReconnecting(connection) && transportLogic.verifyLastActive(connection)) {
            window.setTimeout(function() {
              if (!transportLogic.verifyLastActive(connection)) {
                return;
              }
              if (connection.frame && transportLogic.ensureReconnectingState(connection)) {
                var frame = connection.frame,
                    src = transportLogic.getUrl(connection, that.name, true) + "&frameId=" + connection.frameId;
                connection.log("Updating iframe src to '" + src + "'.");
                frame.src = src;
              }
            }, connection.reconnectDelay);
          }
        },
        lostConnection: function(connection) {
          this.reconnect(connection);
        },
        send: function(connection, data) {
          transportLogic.ajaxSend(connection, data);
        },
        receive: function(connection, data) {
          var cw,
              body,
              response;
          if (connection.json !== connection._originalJson) {
            data = connection._originalJson.stringify(data);
          }
          response = connection._parseResponse(data);
          transportLogic.processMessages(connection, response, connection.onSuccess);
          if (connection.state === $.signalR.connectionState.connected) {
            connection.frameMessageCount = (connection.frameMessageCount || 0) + 1;
            if (connection.frameMessageCount > signalR.transports.foreverFrame.iframeClearThreshold) {
              connection.frameMessageCount = 0;
              cw = connection.frame.contentWindow || connection.frame.contentDocument;
              if (cw && cw.document && cw.document.body) {
                body = cw.document.body;
                while (body.firstChild) {
                  body.removeChild(body.firstChild);
                }
              }
            }
          }
        },
        stop: function(connection) {
          var cw = null;
          loadPreventer.cancel();
          if (connection.frame) {
            if (connection.frame.stop) {
              connection.frame.stop();
            } else {
              try {
                cw = connection.frame.contentWindow || connection.frame.contentDocument;
                if (cw.document && cw.document.execCommand) {
                  cw.document.execCommand("Stop");
                }
              } catch (e) {
                connection.log("Error occured when stopping foreverFrame transport. Message = " + e.message + ".");
              }
            }
            if (connection.frame.parentNode === window.document.body) {
              window.document.body.removeChild(connection.frame);
            }
            delete transportLogic.foreverFrame.connections[connection.frameId];
            connection.frame = null;
            connection.frameId = null;
            delete connection.frame;
            delete connection.frameId;
            delete connection.onSuccess;
            delete connection.frameMessageCount;
            connection.log("Stopping forever frame.");
          }
        },
        abort: function(connection, async) {
          transportLogic.ajaxAbort(connection, async);
        },
        getConnection: function(id) {
          return transportLogic.foreverFrame.connections[id];
        },
        started: function(connection) {
          if (changeState(connection, signalR.connectionState.reconnecting, signalR.connectionState.connected) === true) {
            $(connection).triggerHandler(events.onReconnect);
          }
        }
      };
    }(window.jQuery, window));
    (function($, window, undefined) {
      var signalR = $.signalR,
          events = $.signalR.events,
          changeState = $.signalR.changeState,
          isDisconnecting = $.signalR.isDisconnecting,
          transportLogic = signalR.transports._logic;
      signalR.transports.longPolling = {
        name: "longPolling",
        supportsKeepAlive: function() {
          return false;
        },
        reconnectDelay: 3000,
        start: function(connection, onSuccess, onFailed) {
          var that = this,
              fireConnect = function() {
                fireConnect = $.noop;
                connection.log("LongPolling connected.");
                onSuccess();
              },
              tryFailConnect = function(error) {
                if (onFailed(error)) {
                  connection.log("LongPolling failed to connect.");
                  return true;
                }
                return false;
              },
              privateData = connection._,
              reconnectErrors = 0,
              fireReconnected = function(instance) {
                window.clearTimeout(privateData.reconnectTimeoutId);
                privateData.reconnectTimeoutId = null;
                if (changeState(instance, signalR.connectionState.reconnecting, signalR.connectionState.connected) === true) {
                  instance.log("Raising the reconnect event");
                  $(instance).triggerHandler(events.onReconnect);
                }
              },
              maxFireReconnectedTimeout = 3600000;
          if (connection.pollXhr) {
            connection.log("Polling xhr requests already exists, aborting.");
            connection.stop();
          }
          connection.messageId = null;
          privateData.reconnectTimeoutId = null;
          privateData.pollTimeoutId = window.setTimeout(function() {
            (function poll(instance, raiseReconnect) {
              var messageId = instance.messageId,
                  connect = (messageId === null),
                  reconnecting = !connect,
                  polling = !raiseReconnect,
                  url = transportLogic.getUrl(instance, that.name, reconnecting, polling, true),
                  postData = {};
              if (instance.messageId) {
                postData.messageId = instance.messageId;
              }
              if (instance.groupsToken) {
                postData.groupsToken = instance.groupsToken;
              }
              if (isDisconnecting(instance) === true) {
                return;
              }
              connection.log("Opening long polling request to '" + url + "'.");
              instance.pollXhr = transportLogic.ajax(connection, {
                xhrFields: {onprogress: function() {
                    transportLogic.markLastMessage(connection);
                  }},
                url: url,
                type: "POST",
                contentType: signalR._.defaultContentType,
                data: postData,
                timeout: connection._.pollTimeout,
                success: function(result) {
                  var minData,
                      delay = 0,
                      data,
                      shouldReconnect;
                  connection.log("Long poll complete.");
                  reconnectErrors = 0;
                  try {
                    minData = connection._parseResponse(result);
                  } catch (error) {
                    transportLogic.handleParseFailure(instance, result, error, tryFailConnect, instance.pollXhr);
                    return;
                  }
                  if (privateData.reconnectTimeoutId !== null) {
                    fireReconnected(instance);
                  }
                  if (minData) {
                    data = transportLogic.maximizePersistentResponse(minData);
                  }
                  transportLogic.processMessages(instance, minData, fireConnect);
                  if (data && $.type(data.LongPollDelay) === "number") {
                    delay = data.LongPollDelay;
                  }
                  if (isDisconnecting(instance) === true) {
                    return;
                  }
                  shouldReconnect = data && data.ShouldReconnect;
                  if (shouldReconnect) {
                    if (!transportLogic.ensureReconnectingState(instance)) {
                      return;
                    }
                  }
                  if (delay > 0) {
                    privateData.pollTimeoutId = window.setTimeout(function() {
                      poll(instance, shouldReconnect);
                    }, delay);
                  } else {
                    poll(instance, shouldReconnect);
                  }
                },
                error: function(data, textStatus) {
                  var error = signalR._.transportError(signalR.resources.longPollFailed, connection.transport, data, instance.pollXhr);
                  window.clearTimeout(privateData.reconnectTimeoutId);
                  privateData.reconnectTimeoutId = null;
                  if (textStatus === "abort") {
                    connection.log("Aborted xhr request.");
                    return;
                  }
                  if (!tryFailConnect(error)) {
                    reconnectErrors++;
                    if (connection.state !== signalR.connectionState.reconnecting) {
                      connection.log("An error occurred using longPolling. Status = " + textStatus + ".  Response = " + data.responseText + ".");
                      $(instance).triggerHandler(events.onError, [error]);
                    }
                    if ((connection.state === signalR.connectionState.connected || connection.state === signalR.connectionState.reconnecting) && !transportLogic.verifyLastActive(connection)) {
                      return;
                    }
                    if (!transportLogic.ensureReconnectingState(instance)) {
                      return;
                    }
                    privateData.pollTimeoutId = window.setTimeout(function() {
                      poll(instance, true);
                    }, that.reconnectDelay);
                  }
                }
              });
              if (reconnecting && raiseReconnect === true) {
                privateData.reconnectTimeoutId = window.setTimeout(function() {
                  fireReconnected(instance);
                }, Math.min(1000 * (Math.pow(2, reconnectErrors) - 1), maxFireReconnectedTimeout));
              }
            }(connection));
          }, 250);
        },
        lostConnection: function(connection) {
          if (connection.pollXhr) {
            connection.pollXhr.abort("lostConnection");
          }
        },
        send: function(connection, data) {
          transportLogic.ajaxSend(connection, data);
        },
        stop: function(connection) {
          window.clearTimeout(connection._.pollTimeoutId);
          window.clearTimeout(connection._.reconnectTimeoutId);
          delete connection._.pollTimeoutId;
          delete connection._.reconnectTimeoutId;
          if (connection.pollXhr) {
            connection.pollXhr.abort();
            connection.pollXhr = null;
            delete connection.pollXhr;
          }
        },
        abort: function(connection, async) {
          transportLogic.ajaxAbort(connection, async);
        }
      };
    }(window.jQuery, window));
    (function($, window, undefined) {
      var eventNamespace = ".hubProxy",
          signalR = $.signalR;
      function makeEventName(event) {
        return event + eventNamespace;
      }
      function map(arr, fun, thisp) {
        var i,
            length = arr.length,
            result = [];
        for (i = 0; i < length; i += 1) {
          if (arr.hasOwnProperty(i)) {
            result[i] = fun.call(thisp, arr[i], i, arr);
          }
        }
        return result;
      }
      function getArgValue(a) {
        return $.isFunction(a) ? null : ($.type(a) === "undefined" ? null : a);
      }
      function hasMembers(obj) {
        for (var key in obj) {
          if (obj.hasOwnProperty(key)) {
            return true;
          }
        }
        return false;
      }
      function clearInvocationCallbacks(connection, error) {
        var callbacks = connection._.invocationCallbacks,
            callback;
        if (hasMembers(callbacks)) {
          connection.log("Clearing hub invocation callbacks with error: " + error + ".");
        }
        connection._.invocationCallbackId = 0;
        delete connection._.invocationCallbacks;
        connection._.invocationCallbacks = {};
        for (var callbackId in callbacks) {
          callback = callbacks[callbackId];
          callback.method.call(callback.scope, {E: error});
        }
      }
      function hubProxy(hubConnection, hubName) {
        return new hubProxy.fn.init(hubConnection, hubName);
      }
      hubProxy.fn = hubProxy.prototype = {
        init: function(connection, hubName) {
          this.state = {};
          this.connection = connection;
          this.hubName = hubName;
          this._ = {callbackMap: {}};
        },
        constructor: hubProxy,
        hasSubscriptions: function() {
          return hasMembers(this._.callbackMap);
        },
        on: function(eventName, callback) {
          var that = this,
              callbackMap = that._.callbackMap;
          eventName = eventName.toLowerCase();
          if (!callbackMap[eventName]) {
            callbackMap[eventName] = {};
          }
          callbackMap[eventName][callback] = function(e, data) {
            callback.apply(that, data);
          };
          $(that).bind(makeEventName(eventName), callbackMap[eventName][callback]);
          return that;
        },
        off: function(eventName, callback) {
          var that = this,
              callbackMap = that._.callbackMap,
              callbackSpace;
          eventName = eventName.toLowerCase();
          callbackSpace = callbackMap[eventName];
          if (callbackSpace) {
            if (callbackSpace[callback]) {
              $(that).unbind(makeEventName(eventName), callbackSpace[callback]);
              delete callbackSpace[callback];
              if (!hasMembers(callbackSpace)) {
                delete callbackMap[eventName];
              }
            } else if (!callback) {
              $(that).unbind(makeEventName(eventName));
              delete callbackMap[eventName];
            }
          }
          return that;
        },
        invoke: function(methodName) {
          var that = this,
              connection = that.connection,
              args = $.makeArray(arguments).slice(1),
              argValues = map(args, getArgValue),
              data = {
                H: that.hubName,
                M: methodName,
                A: argValues,
                I: connection._.invocationCallbackId
              },
              d = $.Deferred(),
              callback = function(minResult) {
                var result = that._maximizeHubResponse(minResult),
                    source,
                    error;
                $.extend(that.state, result.State);
                if (result.Progress) {
                  if (d.notifyWith) {
                    d.notifyWith(that, [result.Progress.Data]);
                  } else if (!connection._.progressjQueryVersionLogged) {
                    connection.log("A hub method invocation progress update was received but the version of jQuery in use (" + $.prototype.jquery + ") does not support progress updates. Upgrade to jQuery 1.7+ to receive progress notifications.");
                    connection._.progressjQueryVersionLogged = true;
                  }
                } else if (result.Error) {
                  if (result.StackTrace) {
                    connection.log(result.Error + "\n" + result.StackTrace + ".");
                  }
                  source = result.IsHubException ? "HubException" : "Exception";
                  error = signalR._.error(result.Error, source);
                  error.data = result.ErrorData;
                  connection.log(that.hubName + "." + methodName + " failed to execute. Error: " + error.message);
                  d.rejectWith(that, [error]);
                } else {
                  connection.log("Invoked " + that.hubName + "." + methodName);
                  d.resolveWith(that, [result.Result]);
                }
              };
          connection._.invocationCallbacks[connection._.invocationCallbackId.toString()] = {
            scope: that,
            method: callback
          };
          connection._.invocationCallbackId += 1;
          if (!$.isEmptyObject(that.state)) {
            data.S = that.state;
          }
          connection.log("Invoking " + that.hubName + "." + methodName);
          connection.send(data);
          return d.promise();
        },
        _maximizeHubResponse: function(minHubResponse) {
          return {
            State: minHubResponse.S,
            Result: minHubResponse.R,
            Progress: minHubResponse.P ? {
              Id: minHubResponse.P.I,
              Data: minHubResponse.P.D
            } : null,
            Id: minHubResponse.I,
            IsHubException: minHubResponse.H,
            Error: minHubResponse.E,
            StackTrace: minHubResponse.T,
            ErrorData: minHubResponse.D
          };
        }
      };
      hubProxy.fn.init.prototype = hubProxy.fn;
      function hubConnection(url, options) {
        var settings = {
          qs: null,
          logging: false,
          useDefaultPath: true
        };
        $.extend(settings, options);
        if (!url || settings.useDefaultPath) {
          url = (url || "") + "/signalr";
        }
        return new hubConnection.fn.init(url, settings);
      }
      hubConnection.fn = hubConnection.prototype = $.connection();
      hubConnection.fn.init = function(url, options) {
        var settings = {
          qs: null,
          logging: false,
          useDefaultPath: true
        },
            connection = this;
        $.extend(settings, options);
        $.signalR.fn.init.call(connection, url, settings.qs, settings.logging);
        connection.proxies = {};
        connection._.invocationCallbackId = 0;
        connection._.invocationCallbacks = {};
        connection.received(function(minData) {
          var data,
              proxy,
              dataCallbackId,
              callback,
              hubName,
              eventName;
          if (!minData) {
            return;
          }
          if (typeof(minData.P) !== "undefined") {
            dataCallbackId = minData.P.I.toString();
            callback = connection._.invocationCallbacks[dataCallbackId];
            if (callback) {
              callback.method.call(callback.scope, minData);
            }
          } else if (typeof(minData.I) !== "undefined") {
            dataCallbackId = minData.I.toString();
            callback = connection._.invocationCallbacks[dataCallbackId];
            if (callback) {
              connection._.invocationCallbacks[dataCallbackId] = null;
              delete connection._.invocationCallbacks[dataCallbackId];
              callback.method.call(callback.scope, minData);
            }
          } else {
            data = this._maximizeClientHubInvocation(minData);
            connection.log("Triggering client hub event '" + data.Method + "' on hub '" + data.Hub + "'.");
            hubName = data.Hub.toLowerCase();
            eventName = data.Method.toLowerCase();
            proxy = this.proxies[hubName];
            $.extend(proxy.state, data.State);
            $(proxy).triggerHandler(makeEventName(eventName), [data.Args]);
          }
        });
        connection.error(function(errData, origData) {
          var callbackId,
              callback;
          if (!origData) {
            return;
          }
          callbackId = origData.I;
          callback = connection._.invocationCallbacks[callbackId];
          if (callback) {
            connection._.invocationCallbacks[callbackId] = null;
            delete connection._.invocationCallbacks[callbackId];
            callback.method.call(callback.scope, {E: errData});
          }
        });
        connection.reconnecting(function() {
          if (connection.transport && connection.transport.name === "webSockets") {
            clearInvocationCallbacks(connection, "Connection started reconnecting before invocation result was received.");
          }
        });
        connection.disconnected(function() {
          clearInvocationCallbacks(connection, "Connection was disconnected before invocation result was received.");
        });
      };
      hubConnection.fn._maximizeClientHubInvocation = function(minClientHubInvocation) {
        return {
          Hub: minClientHubInvocation.H,
          Method: minClientHubInvocation.M,
          Args: minClientHubInvocation.A,
          State: minClientHubInvocation.S
        };
      };
      hubConnection.fn._registerSubscribedHubs = function() {
        var connection = this;
        if (!connection._subscribedToHubs) {
          connection._subscribedToHubs = true;
          connection.starting(function() {
            var subscribedHubs = [];
            $.each(connection.proxies, function(key) {
              if (this.hasSubscriptions()) {
                subscribedHubs.push({name: key});
                connection.log("Client subscribed to hub '" + key + "'.");
              }
            });
            if (subscribedHubs.length === 0) {
              connection.log("No hubs have been subscribed to.  The client will not receive data from hubs.  To fix, declare at least one client side function prior to connection start for each hub you wish to subscribe to.");
            }
            connection.data = connection.json.stringify(subscribedHubs);
          });
        }
      };
      hubConnection.fn.createHubProxy = function(hubName) {
        hubName = hubName.toLowerCase();
        var proxy = this.proxies[hubName];
        if (!proxy) {
          proxy = hubProxy(this, hubName);
          this.proxies[hubName] = proxy;
        }
        this._registerSubscribedHubs();
        return proxy;
      };
      hubConnection.fn.init.prototype = hubConnection.fn;
      $.hubConnection = hubConnection;
    }(window.jQuery, window));
    (function($, undefined) {
      $.signalR.version = "2.2.0";
    }(window.jQuery));
  })();
  return _retrieveGlobal();
});
