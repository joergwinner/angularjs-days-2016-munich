"bundle";
(function() {
var define = System.amdDefine;
(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    define('pnotify', ['jquery'], function($) {
      return factory($, root);
    });
  } else if (typeof exports === 'object' && typeof module !== 'undefined') {
    module.exports = factory(require('jquery'), global || root);
  } else {
    root.PNotify = factory(root.jQuery, root);
  }
}(this, function($, root) {
  var init = function(root) {
    var default_stack = {
      dir1: "down",
      dir2: "left",
      push: "bottom",
      spacing1: 36,
      spacing2: 36,
      context: $("body"),
      modal: false
    };
    var posTimer,
        body,
        jwindow = $(root);
    var do_when_ready = function() {
      body = $("body");
      PNotify.prototype.options.stack.context = body;
      jwindow = $(root);
      jwindow.bind('resize', function() {
        if (posTimer) {
          clearTimeout(posTimer);
        }
        posTimer = setTimeout(function() {
          PNotify.positionAll(true);
        }, 10);
      });
    };
    var createStackOverlay = function(stack) {
      var overlay = $("<div />", {"class": "ui-pnotify-modal-overlay"});
      overlay.prependTo(stack.context);
      if (stack.overlay_close) {
        overlay.click(function() {
          PNotify.removeStack(stack);
        });
      }
      return overlay;
    };
    var PNotify = function(options) {
      this.parseOptions(options);
      this.init();
    };
    $.extend(PNotify.prototype, {
      version: "3.0.0",
      options: {
        title: false,
        title_escape: false,
        text: false,
        text_escape: false,
        styling: "brighttheme",
        addclass: "",
        cornerclass: "",
        auto_display: true,
        width: "300px",
        min_height: "16px",
        type: "notice",
        icon: true,
        animation: "fade",
        animate_speed: "normal",
        shadow: true,
        hide: true,
        delay: 8000,
        mouse_reset: true,
        remove: true,
        insert_brs: true,
        destroy: true,
        stack: default_stack
      },
      modules: {},
      runModules: function(event, arg) {
        var curArg;
        for (var module in this.modules) {
          curArg = ((typeof arg === "object" && module in arg) ? arg[module] : arg);
          if (typeof this.modules[module][event] === 'function') {
            this.modules[module].notice = this;
            this.modules[module].options = typeof this.options[module] === 'object' ? this.options[module] : {};
            this.modules[module][event](this, typeof this.options[module] === 'object' ? this.options[module] : {}, curArg);
          }
        }
      },
      state: "initializing",
      timer: null,
      animTimer: null,
      styles: null,
      elem: null,
      container: null,
      title_container: null,
      text_container: null,
      animating: false,
      timerHide: false,
      init: function() {
        var that = this;
        this.modules = {};
        $.extend(true, this.modules, PNotify.prototype.modules);
        if (typeof this.options.styling === "object") {
          this.styles = this.options.styling;
        } else {
          this.styles = PNotify.styling[this.options.styling];
        }
        this.elem = $("<div />", {
          "class": "ui-pnotify " + this.options.addclass,
          "css": {"display": "none"},
          "aria-live": "assertive",
          "aria-role": "alertdialog",
          "mouseenter": function(e) {
            if (that.options.mouse_reset && that.animating === "out") {
              if (!that.timerHide) {
                return;
              }
              that.cancelRemove();
            }
            if (that.options.hide && that.options.mouse_reset) {
              that.cancelRemove();
            }
          },
          "mouseleave": function(e) {
            if (that.options.hide && that.options.mouse_reset && that.animating !== "out") {
              that.queueRemove();
            }
            PNotify.positionAll();
          }
        });
        if (this.options.animation === "fade") {
          this.elem.addClass("ui-pnotify-fade-" + this.options.animate_speed);
        }
        this.container = $("<div />", {
          "class": this.styles.container + " ui-pnotify-container " + (this.options.type === "error" ? this.styles.error : (this.options.type === "info" ? this.styles.info : (this.options.type === "success" ? this.styles.success : this.styles.notice))),
          "role": "alert"
        }).appendTo(this.elem);
        if (this.options.cornerclass !== "") {
          this.container.removeClass("ui-corner-all").addClass(this.options.cornerclass);
        }
        if (this.options.shadow) {
          this.container.addClass("ui-pnotify-shadow");
        }
        if (this.options.icon !== false) {
          $("<div />", {"class": "ui-pnotify-icon"}).append($("<span />", {"class": this.options.icon === true ? (this.options.type === "error" ? this.styles.error_icon : (this.options.type === "info" ? this.styles.info_icon : (this.options.type === "success" ? this.styles.success_icon : this.styles.notice_icon))) : this.options.icon})).prependTo(this.container);
        }
        this.title_container = $("<h4 />", {"class": "ui-pnotify-title"}).appendTo(this.container);
        if (this.options.title === false) {
          this.title_container.hide();
        } else if (this.options.title_escape) {
          this.title_container.text(this.options.title);
        } else {
          this.title_container.html(this.options.title);
        }
        this.text_container = $("<div />", {
          "class": "ui-pnotify-text",
          "aria-role": "alert"
        }).appendTo(this.container);
        if (this.options.text === false) {
          this.text_container.hide();
        } else if (this.options.text_escape) {
          this.text_container.text(this.options.text);
        } else {
          this.text_container.html(this.options.insert_brs ? String(this.options.text).replace(/\n/g, "<br />") : this.options.text);
        }
        if (typeof this.options.width === "string") {
          this.elem.css("width", this.options.width);
        }
        if (typeof this.options.min_height === "string") {
          this.container.css("min-height", this.options.min_height);
        }
        if (this.options.stack.push === "top") {
          PNotify.notices = $.merge([this], PNotify.notices);
        } else {
          PNotify.notices = $.merge(PNotify.notices, [this]);
        }
        if (this.options.stack.push === "top") {
          this.queuePosition(false, 1);
        }
        this.options.stack.animation = false;
        this.runModules('init');
        if (this.options.auto_display) {
          this.open();
        }
        return this;
      },
      update: function(options) {
        var oldOpts = this.options;
        this.parseOptions(oldOpts, options);
        this.elem.removeClass("ui-pnotify-fade-slow ui-pnotify-fade-normal ui-pnotify-fade-fast");
        if (this.options.animation === "fade") {
          this.elem.addClass("ui-pnotify-fade-" + this.options.animate_speed);
        }
        if (this.options.cornerclass !== oldOpts.cornerclass) {
          this.container.removeClass("ui-corner-all " + oldOpts.cornerclass).addClass(this.options.cornerclass);
        }
        if (this.options.shadow !== oldOpts.shadow) {
          if (this.options.shadow) {
            this.container.addClass("ui-pnotify-shadow");
          } else {
            this.container.removeClass("ui-pnotify-shadow");
          }
        }
        if (this.options.addclass === false) {
          this.elem.removeClass(oldOpts.addclass);
        } else if (this.options.addclass !== oldOpts.addclass) {
          this.elem.removeClass(oldOpts.addclass).addClass(this.options.addclass);
        }
        if (this.options.title === false) {
          this.title_container.slideUp("fast");
        } else if (this.options.title !== oldOpts.title) {
          if (this.options.title_escape) {
            this.title_container.text(this.options.title);
          } else {
            this.title_container.html(this.options.title);
          }
          if (oldOpts.title === false) {
            this.title_container.slideDown(200);
          }
        }
        if (this.options.text === false) {
          this.text_container.slideUp("fast");
        } else if (this.options.text !== oldOpts.text) {
          if (this.options.text_escape) {
            this.text_container.text(this.options.text);
          } else {
            this.text_container.html(this.options.insert_brs ? String(this.options.text).replace(/\n/g, "<br />") : this.options.text);
          }
          if (oldOpts.text === false) {
            this.text_container.slideDown(200);
          }
        }
        if (this.options.type !== oldOpts.type)
          this.container.removeClass(this.styles.error + " " + this.styles.notice + " " + this.styles.success + " " + this.styles.info).addClass(this.options.type === "error" ? this.styles.error : (this.options.type === "info" ? this.styles.info : (this.options.type === "success" ? this.styles.success : this.styles.notice)));
        if (this.options.icon !== oldOpts.icon || (this.options.icon === true && this.options.type !== oldOpts.type)) {
          this.container.find("div.ui-pnotify-icon").remove();
          if (this.options.icon !== false) {
            $("<div />", {"class": "ui-pnotify-icon"}).append($("<span />", {"class": this.options.icon === true ? (this.options.type === "error" ? this.styles.error_icon : (this.options.type === "info" ? this.styles.info_icon : (this.options.type === "success" ? this.styles.success_icon : this.styles.notice_icon))) : this.options.icon})).prependTo(this.container);
          }
        }
        if (this.options.width !== oldOpts.width) {
          this.elem.animate({width: this.options.width});
        }
        if (this.options.min_height !== oldOpts.min_height) {
          this.container.animate({minHeight: this.options.min_height});
        }
        if (!this.options.hide) {
          this.cancelRemove();
        } else if (!oldOpts.hide) {
          this.queueRemove();
        }
        this.queuePosition(true);
        this.runModules('update', oldOpts);
        return this;
      },
      open: function() {
        this.state = "opening";
        this.runModules('beforeOpen');
        var that = this;
        if (!this.elem.parent().length) {
          this.elem.appendTo(this.options.stack.context ? this.options.stack.context : body);
        }
        if (this.options.stack.push !== "top") {
          this.position(true);
        }
        this.animateIn(function() {
          that.queuePosition(true);
          if (that.options.hide) {
            that.queueRemove();
          }
          that.state = "open";
          that.runModules('afterOpen');
        });
        return this;
      },
      remove: function(timer_hide) {
        this.state = "closing";
        this.timerHide = !!timer_hide;
        this.runModules('beforeClose');
        var that = this;
        if (this.timer) {
          root.clearTimeout(this.timer);
          this.timer = null;
        }
        this.animateOut(function() {
          that.state = "closed";
          that.runModules('afterClose');
          that.queuePosition(true);
          if (that.options.remove) {
            that.elem.detach();
          }
          that.runModules('beforeDestroy');
          if (that.options.destroy) {
            if (PNotify.notices !== null) {
              var idx = $.inArray(that, PNotify.notices);
              if (idx !== -1) {
                PNotify.notices.splice(idx, 1);
              }
            }
          }
          that.runModules('afterDestroy');
        });
        return this;
      },
      get: function() {
        return this.elem;
      },
      parseOptions: function(options, moreOptions) {
        this.options = $.extend(true, {}, PNotify.prototype.options);
        this.options.stack = PNotify.prototype.options.stack;
        var optArray = [options, moreOptions],
            curOpts;
        for (var curIndex = 0; curIndex < optArray.length; curIndex++) {
          curOpts = optArray[curIndex];
          if (typeof curOpts === "undefined") {
            break;
          }
          if (typeof curOpts !== 'object') {
            this.options.text = curOpts;
          } else {
            for (var option in curOpts) {
              if (this.modules[option]) {
                $.extend(true, this.options[option], curOpts[option]);
              } else {
                this.options[option] = curOpts[option];
              }
            }
          }
        }
      },
      animateIn: function(callback) {
        this.animating = "in";
        var that = this;
        callback = (function() {
          if (that.animTimer) {
            clearTimeout(that.animTimer);
          }
          if (that.animating !== "in") {
            return;
          }
          if (that.elem.is(":visible")) {
            if (this) {
              this.call();
            }
            that.animating = false;
          } else {
            that.animTimer = setTimeout(callback, 40);
          }
        }).bind(callback);
        if (this.options.animation === "fade") {
          this.elem.one('webkitTransitionEnd mozTransitionEnd MSTransitionEnd oTransitionEnd transitionend', callback).addClass("ui-pnotify-in");
          this.elem.css("opacity");
          this.elem.addClass("ui-pnotify-fade-in");
          this.animTimer = setTimeout(callback, 650);
        } else {
          this.elem.addClass("ui-pnotify-in");
          callback();
        }
      },
      animateOut: function(callback) {
        this.animating = "out";
        var that = this;
        callback = (function() {
          if (that.animTimer) {
            clearTimeout(that.animTimer);
          }
          if (that.animating !== "out") {
            return;
          }
          if (that.elem.css("opacity") == "0" || !that.elem.is(":visible")) {
            that.elem.removeClass("ui-pnotify-in");
            if (this) {
              this.call();
            }
            that.animating = false;
          } else {
            that.animTimer = setTimeout(callback, 40);
          }
        }).bind(callback);
        if (this.options.animation === "fade") {
          this.elem.one('webkitTransitionEnd mozTransitionEnd MSTransitionEnd oTransitionEnd transitionend', callback).removeClass("ui-pnotify-fade-in");
          this.animTimer = setTimeout(callback, 650);
        } else {
          this.elem.removeClass("ui-pnotify-in");
          callback();
        }
      },
      position: function(dontSkipHidden) {
        var stack = this.options.stack,
            elem = this.elem;
        if (typeof stack.context === "undefined") {
          stack.context = body;
        }
        if (!stack) {
          return;
        }
        if (typeof stack.nextpos1 !== "number") {
          stack.nextpos1 = stack.firstpos1;
        }
        if (typeof stack.nextpos2 !== "number") {
          stack.nextpos2 = stack.firstpos2;
        }
        if (typeof stack.addpos2 !== "number") {
          stack.addpos2 = 0;
        }
        var hidden = !elem.hasClass("ui-pnotify-in");
        if (!hidden || dontSkipHidden) {
          if (stack.modal) {
            if (stack.overlay) {
              stack.overlay.show();
            } else {
              stack.overlay = createStackOverlay(stack);
            }
          }
          elem.addClass("ui-pnotify-move");
          var curpos1,
              curpos2;
          var csspos1;
          switch (stack.dir1) {
            case "down":
              csspos1 = "top";
              break;
            case "up":
              csspos1 = "bottom";
              break;
            case "left":
              csspos1 = "right";
              break;
            case "right":
              csspos1 = "left";
              break;
          }
          curpos1 = parseInt(elem.css(csspos1).replace(/(?:\..*|[^0-9.])/g, ''));
          if (isNaN(curpos1)) {
            curpos1 = 0;
          }
          if (typeof stack.firstpos1 === "undefined" && !hidden) {
            stack.firstpos1 = curpos1;
            stack.nextpos1 = stack.firstpos1;
          }
          var csspos2;
          switch (stack.dir2) {
            case "down":
              csspos2 = "top";
              break;
            case "up":
              csspos2 = "bottom";
              break;
            case "left":
              csspos2 = "right";
              break;
            case "right":
              csspos2 = "left";
              break;
          }
          curpos2 = parseInt(elem.css(csspos2).replace(/(?:\..*|[^0-9.])/g, ''));
          if (isNaN(curpos2)) {
            curpos2 = 0;
          }
          if (typeof stack.firstpos2 === "undefined" && !hidden) {
            stack.firstpos2 = curpos2;
            stack.nextpos2 = stack.firstpos2;
          }
          if ((stack.dir1 === "down" && stack.nextpos1 + elem.height() > (stack.context.is(body) ? jwindow.height() : stack.context.prop('scrollHeight'))) || (stack.dir1 === "up" && stack.nextpos1 + elem.height() > (stack.context.is(body) ? jwindow.height() : stack.context.prop('scrollHeight'))) || (stack.dir1 === "left" && stack.nextpos1 + elem.width() > (stack.context.is(body) ? jwindow.width() : stack.context.prop('scrollWidth'))) || (stack.dir1 === "right" && stack.nextpos1 + elem.width() > (stack.context.is(body) ? jwindow.width() : stack.context.prop('scrollWidth')))) {
            stack.nextpos1 = stack.firstpos1;
            stack.nextpos2 += stack.addpos2 + (typeof stack.spacing2 === "undefined" ? 25 : stack.spacing2);
            stack.addpos2 = 0;
          }
          if (typeof stack.nextpos2 === "number") {
            if (!stack.animation) {
              elem.removeClass("ui-pnotify-move");
              elem.css(csspos2, stack.nextpos2 + "px");
              elem.css(csspos2);
              elem.addClass("ui-pnotify-move");
            } else {
              elem.css(csspos2, stack.nextpos2 + "px");
            }
          }
          switch (stack.dir2) {
            case "down":
            case "up":
              if (elem.outerHeight(true) > stack.addpos2) {
                stack.addpos2 = elem.height();
              }
              break;
            case "left":
            case "right":
              if (elem.outerWidth(true) > stack.addpos2) {
                stack.addpos2 = elem.width();
              }
              break;
          }
          if (typeof stack.nextpos1 === "number") {
            if (!stack.animation) {
              elem.removeClass("ui-pnotify-move");
              elem.css(csspos1, stack.nextpos1 + "px");
              elem.css(csspos1);
              elem.addClass("ui-pnotify-move");
            } else {
              elem.css(csspos1, stack.nextpos1 + "px");
            }
          }
          switch (stack.dir1) {
            case "down":
            case "up":
              stack.nextpos1 += elem.height() + (typeof stack.spacing1 === "undefined" ? 25 : stack.spacing1);
              break;
            case "left":
            case "right":
              stack.nextpos1 += elem.width() + (typeof stack.spacing1 === "undefined" ? 25 : stack.spacing1);
              break;
          }
        }
        return this;
      },
      queuePosition: function(animate, milliseconds) {
        if (posTimer) {
          clearTimeout(posTimer);
        }
        if (!milliseconds) {
          milliseconds = 10;
        }
        posTimer = setTimeout(function() {
          PNotify.positionAll(animate);
        }, milliseconds);
        return this;
      },
      cancelRemove: function() {
        if (this.timer) {
          root.clearTimeout(this.timer);
        }
        if (this.animTimer) {
          root.clearTimeout(this.animTimer);
        }
        if (this.state === "closing") {
          this.state = "open";
          this.animating = false;
          this.elem.addClass("ui-pnotify-in");
          if (this.options.animation === "fade") {
            this.elem.addClass("ui-pnotify-fade-in");
          }
        }
        return this;
      },
      queueRemove: function() {
        var that = this;
        this.cancelRemove();
        this.timer = root.setTimeout(function() {
          that.remove(true);
        }, (isNaN(this.options.delay) ? 0 : this.options.delay));
        return this;
      }
    });
    $.extend(PNotify, {
      notices: [],
      reload: init,
      removeAll: function() {
        $.each(PNotify.notices, function() {
          if (this.remove) {
            this.remove(false);
          }
        });
      },
      removeStack: function(stack) {
        $.each(PNotify.notices, function() {
          if (this.remove && this.options.stack === stack) {
            this.remove(false);
          }
        });
      },
      positionAll: function(animate) {
        if (posTimer) {
          clearTimeout(posTimer);
        }
        posTimer = null;
        if (PNotify.notices && PNotify.notices.length) {
          $.each(PNotify.notices, function() {
            var s = this.options.stack;
            if (!s) {
              return;
            }
            if (s.overlay) {
              s.overlay.hide();
            }
            s.nextpos1 = s.firstpos1;
            s.nextpos2 = s.firstpos2;
            s.addpos2 = 0;
            s.animation = animate;
          });
          $.each(PNotify.notices, function() {
            this.position();
          });
        } else {
          var s = PNotify.prototype.options.stack;
          if (s) {
            delete s.nextpos1;
            delete s.nextpos2;
          }
        }
      },
      styling: {
        brighttheme: {
          container: "brighttheme",
          notice: "brighttheme-notice",
          notice_icon: "brighttheme-icon-notice",
          info: "brighttheme-info",
          info_icon: "brighttheme-icon-info",
          success: "brighttheme-success",
          success_icon: "brighttheme-icon-success",
          error: "brighttheme-error",
          error_icon: "brighttheme-icon-error"
        },
        jqueryui: {
          container: "ui-widget ui-widget-content ui-corner-all",
          notice: "ui-state-highlight",
          notice_icon: "ui-icon ui-icon-info",
          info: "",
          info_icon: "ui-icon ui-icon-info",
          success: "ui-state-default",
          success_icon: "ui-icon ui-icon-circle-check",
          error: "ui-state-error",
          error_icon: "ui-icon ui-icon-alert"
        },
        bootstrap3: {
          container: "alert",
          notice: "alert-warning",
          notice_icon: "glyphicon glyphicon-exclamation-sign",
          info: "alert-info",
          info_icon: "glyphicon glyphicon-info-sign",
          success: "alert-success",
          success_icon: "glyphicon glyphicon-ok-sign",
          error: "alert-danger",
          error_icon: "glyphicon glyphicon-warning-sign"
        }
      }
    });
    PNotify.styling.fontawesome = $.extend({}, PNotify.styling.bootstrap3);
    $.extend(PNotify.styling.fontawesome, {
      notice_icon: "fa fa-exclamation-circle",
      info_icon: "fa fa-info",
      success_icon: "fa fa-check",
      error_icon: "fa fa-warning"
    });
    if (root.document.body) {
      do_when_ready();
    } else {
      $(do_when_ready);
    }
    return PNotify;
  };
  return init(root);
}));
(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    define("pNotify/pnotify.custom", ["jquery", "pnotify"], factory), define("pnotify.mobile", ["pNotify/pnotify.custom"], function(m) {
      return m;
    });
  } else if (typeof exports === 'object' && typeof module !== 'undefined') {
    module.exports = factory(require('jquery'), require('./pnotify'));
  } else {
    factory(root.jQuery, root.PNotify);
  }
}(this, function($, PNotify) {
  PNotify.prototype.options.mobile = {
    swipe_dismiss: true,
    styling: true
  };
  PNotify.prototype.modules.mobile = {
    swipe_dismiss: true,
    init: function(notice, options) {
      var that = this,
          origX = null,
          diffX = null,
          noticeWidth = null;
      this.swipe_dismiss = options.swipe_dismiss;
      this.doMobileStyling(notice, options);
      notice.elem.on({
        "touchstart": function(e) {
          if (!that.swipe_dismiss) {
            return;
          }
          origX = e.originalEvent.touches[0].screenX;
          noticeWidth = notice.elem.width();
          notice.container.css("left", "0");
        },
        "touchmove": function(e) {
          if (!origX || !that.swipe_dismiss) {
            return;
          }
          var curX = e.originalEvent.touches[0].screenX;
          diffX = curX - origX;
          var opacity = (1 - (Math.abs(diffX) / noticeWidth)) * notice.options.opacity;
          notice.elem.css("opacity", opacity);
          notice.container.css("left", diffX);
        },
        "touchend": function() {
          if (!origX || !that.swipe_dismiss) {
            return;
          }
          if (Math.abs(diffX) > 40) {
            var goLeft = (diffX < 0) ? noticeWidth * -2 : noticeWidth * 2;
            notice.elem.animate({"opacity": 0}, 100);
            notice.container.animate({"left": goLeft}, 100);
            notice.remove();
          } else {
            notice.elem.animate({"opacity": notice.options.opacity}, 100);
            notice.container.animate({"left": 0}, 100);
          }
          origX = null;
          diffX = null;
          noticeWidth = null;
        },
        "touchcancel": function() {
          if (!origX || !that.swipe_dismiss) {
            return;
          }
          notice.elem.animate({"opacity": notice.options.opacity}, 100);
          notice.container.animate({"left": 0}, 100);
          origX = null;
          diffX = null;
          noticeWidth = null;
        }
      });
    },
    update: function(notice, options) {
      this.swipe_dismiss = options.swipe_dismiss;
      this.doMobileStyling(notice, options);
    },
    doMobileStyling: function(notice, options) {
      if (options.styling) {
        notice.elem.addClass("ui-pnotify-mobile-able");
        if ($(window).width() <= 480) {
          if (!notice.options.stack.mobileOrigSpacing1) {
            notice.options.stack.mobileOrigSpacing1 = notice.options.stack.spacing1;
            notice.options.stack.mobileOrigSpacing2 = notice.options.stack.spacing2;
          }
          notice.options.stack.spacing1 = 0;
          notice.options.stack.spacing2 = 0;
        } else if (notice.options.stack.mobileOrigSpacing1 || notice.options.stack.mobileOrigSpacing2) {
          notice.options.stack.spacing1 = notice.options.stack.mobileOrigSpacing1;
          delete notice.options.stack.mobileOrigSpacing1;
          notice.options.stack.spacing2 = notice.options.stack.mobileOrigSpacing2;
          delete notice.options.stack.mobileOrigSpacing2;
        }
      } else {
        notice.elem.removeClass("ui-pnotify-mobile-able");
        if (notice.options.stack.mobileOrigSpacing1) {
          notice.options.stack.spacing1 = notice.options.stack.mobileOrigSpacing1;
          delete notice.options.stack.mobileOrigSpacing1;
        }
        if (notice.options.stack.mobileOrigSpacing2) {
          notice.options.stack.spacing2 = notice.options.stack.mobileOrigSpacing2;
          delete notice.options.stack.mobileOrigSpacing2;
        }
      }
    }
  };
}));

})();