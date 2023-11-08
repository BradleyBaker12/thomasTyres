(cartCCFIelds = function (objWindow, cart, arrCss, zIndex, arrStyles, onTokenizeCallback, onTokenizeFailCallback, debugMode, unhideFirst6) {
    if ((!console || !console.log) && debugMode)
        debugMode = false;
		
	if (typeof unhideFirst6 === "undefined" || unhideFirst6 == null) {
		unhideFirst6 = false;
	}	
	
    if (typeof arrCss === "undefined" || arrCss == null) {
        arrCss = [
            "borderBottomColor", "borderBottomLeftRadius", "borderBottomRightRadius",
            "borderBottomStyle", "borderBottomWidth", "borderCollapse", "borderLeftColor",
            "borderLeftStyle", "borderLeftWidth", "borderRightColor", "borderRightStyle",
            "borderRightWidth", "borderSpacing", "borderTopColor", "borderTopLeftRadius",
            "borderTopRightRadius", "borderTopStyle", "borderTopWidth",
            "paddingBottom", "paddingLeft", "paddingRight", "paddingTop",
            "lineHeight", "fontSize", "fontFamily", "fontStyle", "fontWeight",
            "backgroundColor", "color"
        ];
    }

    if (typeof jQuery == 'undefined') {
        alert('Error loading payment credit card fields (code 101).');
        console.log("3d debug: jQuery is undefined")
    }

    var base = this;

    if (typeof onTokenizeCallback === "undefined" || onTokenizeCallback == null) {
        alert('Error loading payment credit card fields (code 102).');
        console.log("3d debug: onTokenizeCallback not defined")
    }

    if (typeof onTokenizeFailCallback === "undefined" || onTokenizeFailCallback == null) {
        alert('Error loading payment credit card fields (code 103).');
        console.log("3d debug: onTokenizeFailCallback not defined")
    }

    base.fieldsToEncrypt = [];
    base.cart = cart;
    base.arrCss = arrCss;
    base.fieldIdCounter = 0;
    base.fields = [];

    //noinspection JSUnusedGlobalSymbols - (this part added for testing)
    base.handleIPADSelect = function () {
        var selectOverlayId = 1;

        jQuery('select').each(function () {
            var select = jQuery(this);

            var parent = select.parent();

            if (parent.css('position') === 'static') {
                parent.css('position', 'relative');
                if (debugMode) console.log("3d debug: Changed position of ", parent, " from static to relative.");
            }

            var selectOverlay = jQuery("<input>", { id: 'selectOverlay' + selectOverlayId, type: 'text', style: 'border: none; background: transparent;', 'z-index': zIndex });
            select.after(selectOverlay);

            jQuery(document).on("focus", '#selectOverlay' + selectOverlayId, function () {
                jQuery(this).blur();
                jQuery(this).css('z-index', -1000);
                select.focus();
            });

            select.on("blur", function () {
                selectOverlay.css('z-index', zIndex);
            });

            base.maintainSelectOverlay(select, selectOverlay);

            selectOverlayId++;
        });
    };

    //noinspection JSUnusedGlobalSymbols
    base.setupField = function (fieldType, fieldConfig) {

        var that = this;

		if(debugMode){
			//debugger;
			//objOriginalCCField.attr('autocomplete', 'off');				
			//objOriginalCCField.attr('type', 'hidden');
		}
		
        if (fieldType !== "creditCardNumber" && fieldType !== "creditCardCvv2") return;

        var objOriginalCCField;
        objOriginalCCField = jQuery(fieldConfig.selector);

        if (objOriginalCCField.attr('type') && objOriginalCCField.attr('type') === 'number') {
            alert("Error loading payment credit card fields (code 104).");
            console.log("3d debug: Input type for " + fieldConfig.selector + " needs to be adjusted from number to text.")
        }

        if (!fieldConfig.value) {
            fieldConfig.value = objOriginalCCField.val();
        }
        if (!fieldConfig.placeholder) {
            fieldConfig.placeholder = objOriginalCCField.attr('placeholder');
        }

        var parent = objOriginalCCField.parent();

        if (parent.css('position') === 'static') {
            parent.css('position', 'relative');
            if (debugMode) console.log("3d debug: Changed position of ", parent, " from static to relative.");
        }

        objOriginalCCField.after("<div id='" + fieldConfig.fieldName + "CartCCFIeldsOverlay'></div>");

        var auxHiddenField = jQuery("<input>", { id: 'hdn' + fieldConfig.fieldName + 'token', type: 'hidden', name: 'hdn' + fieldConfig.fieldName + 'token' });
        objOriginalCCField.after(auxHiddenField);

        if (fieldType === "creditCardNumber") {
            auxHiddenField = jQuery("<input>", { id: 'hdn' + fieldConfig.fieldName + 'last4', type: 'hidden', name: 'hdn' + fieldConfig.fieldName + 'last4' });
			objOriginalCCField.after(auxHiddenField);			
        }
		
        var objIfrmContainer = jQuery("#" + fieldConfig.fieldName + "CartCCFIeldsOverlay");
        var tokenHolder = jQuery('#hdn' + fieldConfig.fieldName + 'token');
        var last4Holder = jQuery('#hdn' + fieldConfig.fieldName + 'last4');

        base.matchOverlay(objOriginalCCField, objIfrmContainer);
        jQuery(window).resize(function () {
            base.matchOverlay(objOriginalCCField, objIfrmContainer);
        });

        var fieldObject = {};
        base.fieldIdCounter++;
        fieldObject.id = base.fieldIdCounter;
        fieldObject.fieldType = fieldType;
        fieldObject.fieldConfig = fieldConfig;
        fieldObject.loaded = false;
        fieldObject.bufferedMessages = [];
        fieldObject.receiveMessageHandler = that.fieldReceiveMessageHandler;
        fieldObject.callback = fieldConfig.callback;
        fieldConfig.callback = null;
        fieldObject.change = fieldConfig.change;
        fieldConfig.change = null;
        if (!fieldObject.change) {
            if (debugMode) console.log("3d debug: No change handler on field " + fieldType + ".  Adding default change handler.");
            fieldObject.change = function (value) {
                if (debugMode) console.log("3d debug: change handler called for value for objOriginalCCField field ", objOriginalCCField);
                fieldObject.lastUnderlyingVal = value;
                objOriginalCCField.val(value);
                if (debugMode) console.log("3d debug: New value of objOriginalCCField field ", objOriginalCCField, " is ", objOriginalCCField.val());
                objOriginalCCField.trigger("change");
                if (debugMode) console.log("3d debug: New value of objOriginalCCField field after trigger:change on ", objOriginalCCField, " is ", objOriginalCCField.val());
            }
        } else {
            if (debugMode) console.log("3d debug: Custom change handler specified in field config for " + fieldType);
        }
        fieldObject.ifrmContainer = objIfrmContainer;
        fieldObject.parent = parent;
        fieldObject.objOriginalCCField = objOriginalCCField;
        fieldObject.cssClass = objOriginalCCField.get(0).className;
        fieldObject.tokenHolder = tokenHolder;
        fieldObject.last4Holder = last4Holder;

        fieldObject.lastUnderlyingVal = objOriginalCCField.val();

        fieldObject.underlyingOriginalTabIndex = objOriginalCCField.attr('tabindex');
        objOriginalCCField.attr('tabindex', '-1');		
        objOriginalCCField.css('visibility', 'hidden');
		
		

        base.fields[fieldObject.id] = fieldObject;

        var iFrameHtml = '<iframe src="https://ccencryption01.3dcart.com/jslib/cartCCFieldsRender.html?r=' + Math.random() + '&t=' + new Date().getTime() + '" sandbox="allow-scripts allow-same-origin" style="width: 100%; height: 100%; border: none; padding: 0; margin: 0; overflow: hidden;" scrolling="no"></iframe>';
        objIfrmContainer.html(iFrameHtml);
        fieldObject.iframeContentWindow = objIfrmContainer.find('iframe')[0].contentWindow;
        
        if (fieldObject.underlyingOriginalTabIndex) {
            objIfrmContainer.find('iframe').attr('tabindex', fieldObject.underlyingOriginalTabIndex);
        }

        fieldObject.retryIFrameLoadInMillis = 5000;
        fieldObject.retryCount = 0;
        base.checkForLoad(fieldObject);

        base.maintainOverlay(fieldObject, objOriginalCCField, objIfrmContainer);

        fieldObject.checkForLoadTimer = setTimeout(function () {
            alert("Error loading payment credit card fields (code 105).");
        }, 15000);
    };

    //noinspection JSUnusedGlobalSymbols
    base.fieldReceiveMessageHandler = function (message) {
        if (debugMode) console.log("3d debug: fieldReceiveMessageHandler", message);
        var fieldObject = this;

        if (message.messageType === "ready") {
            fieldObject.loaded = true;

            clearTimeout(fieldObject.checkForLoadTimer);

            if (fieldObject.bufferedMessages.length) {
                if (debugMode) console.log("3d debug: There are " + fieldObject.bufferedMessages.length + " buffered messages to send to the hosted field.");

                for (var i = 0; i < fieldObject.bufferedMessages.length; i++) {
                    fieldObject.iframeContentWindow.postMessage(
                        JSON.stringify(fieldObject.bufferedMessages[i])
                        ,
                        "*"
                    );
                    if (debugMode) console.log("3d debug: Sent buffered message", fieldObject.bufferedMessages[i]);
                }

                fieldObject.bufferedMessages = [];
            }

        } else if (message.messageType === "ccupdated") {
            if (fieldObject.callback) {
                fieldObject.callback(message.card);
            }
            if (fieldObject.tokenHolder) {
                fieldObject.tokenHolder.val("");
            }
            if (fieldObject.last4Holder) {
                fieldObject.last4Holder.val("");
            }
            fieldObject.lastUnderlyingVal = "4242424242424242";
            fieldObject.objOriginalCCField.val("4242424242424242");

        } else if (message.messageType === "cctokenized") {
            if (fieldObject.callback) {
                fieldObject.callback(message.card);
            }
            if (fieldObject.tokenHolder && message.token) {
                fieldObject.tokenHolder.val(message.token);
            }
            if (fieldObject.last4Holder && message.last4) {
                fieldObject.last4Holder.val(message.last4);
            }
            fieldObject.lastUnderlyingVal = "4242424242424242"; 
            fieldObject.objOriginalCCField.val("4242424242424242"); 

        } else if (message.messageType === "cvvupdated") {
            if (fieldObject.callback) {
                fieldObject.callback(message.card);
            }
            if (fieldObject.tokenHolder) {
                fieldObject.tokenHolder.val("");
            }
            fieldObject.lastUnderlyingVal = "000"; 
            fieldObject.objOriginalCCField.val("000"); 

        } else if (message.messageType === "ccupdatedinvalid") {
		      if (fieldObject.callback) {
                fieldObject.callback(message.card);
            }
            if (fieldObject.tokenHolder) {
                fieldObject.tokenHolder.val("");
            }
            if (fieldObject.last4Holder) {
                fieldObject.last4Holder.val("");
            }
            fieldObject.lastUnderlyingVal = "1111111111111111";
            fieldObject.objOriginalCCField.val("1111111111111111");

        } else if (message.messageType === "cvvtokenized") {
            if (fieldObject.callback) {
                fieldObject.callback(message.card);
            }
            if (fieldObject.tokenHolder && message.token) {
                fieldObject.tokenHolder.val(message.token);
            }
            fieldObject.lastUnderlyingVal = "000"; 
            fieldObject.objOriginalCCField.val("000"); 

        } else if (message.messageType === "change") {
            if (debugMode) console.log("3d debug: process change message");
            if (fieldObject.change) {
                if (debugMode) console.log("3d debug: Calling change handler with value", message.value);
                fieldObject.change(message.value);
            } else {
                if (debugMode) console.log("3d debug: no change method configured on fieldObject", fieldObject);
            }

            if (fieldObject.tokenHolder) {
                fieldObject.tokenHolder.val("");
                if (message.token)
                    fieldObject.tokenHolder.val(message.token);
            }
            if (fieldObject.last4Holder && message.last4) {
                fieldObject.last4Holder.val("");
                if (message.last4)
                    fieldObject.last4Holder.val(message.last4);
            }
            fieldObject.objOriginalCCField.val("");

        } else if (message.messageType === "blur") {
            fieldObject.objOriginalCCField.triggerHandler("blur");
            base.maintainOverlay(fieldObject.objOriginalCCField, fieldObject.ifrmContainer);
        } else if (message.messageType === "focus") {
            fieldObject.objOriginalCCField.triggerHandler("focus");
            base.maintainOverlay(fieldObject.objOriginalCCField, fieldObject.ifrmContainer);
        }
    };

    //noinspection JSUnusedGlobalSymbols
    base.checkForLoad = function (fieldObject) {
        var that = this;

        if (fieldObject.loaded) {
            console.log('ccencryption loaded');
            if (typeof LoadPPAdvCC === "function") { 
                //LoadPPAdvCC();
            }            
            return;
        }

        fieldObject.retryIFrameLoadInMillis -= 100;
        if (fieldObject.retryIFrameLoadInMillis <= 0) {
            fieldObject.retryCount++;
            fieldObject.retryIFrameLoadInMillis = 5000;

            if (debugMode) console.log("3d debug: Retry iframe load count", fieldObject.retryCount);
            fieldObject.ifrmContainer.find('iframe').attr('src', 'https://ccencryption01.3dcart.com/jslib/cartCCFieldsRender.html?r=' + Math.random() + '&t=' + new Date().getTime());
        }
        if (debugMode && fieldObject.retryIFrameLoadInMillis % 1000 == 0) console.log("3d debug: Retry iframe load in millis", fieldObject.retryIFrameLoadInMillis);

        var readyCheckMessage = {
            'messageType': 'readyCheck',
            'id': fieldObject.id,
            'cart': base.cart,
            'arrCss': base.arrCss,
            'cssClass': fieldObject.cssClass,
            'fieldType': fieldObject.fieldType,
            'fieldConfig': {
                'value': fieldObject.fieldConfig.value,
                'placeholder': fieldObject.fieldConfig.placeholder
            },
            'debugMode': debugMode,
			'unhideFirst6': unhideFirst6
        };

        fieldObject.iframeContentWindow.postMessage(
            JSON.stringify(readyCheckMessage)
            ,
            "*"
        );

        setTimeout(function () {
            that.checkForLoad(fieldObject);
        }, 100);
    };

    //noinspection JSUnusedGlobalSymbols
    base.receiveMessageHandler = function (event) {
        if (debugMode) console.log("3d debug: parent receiveMessage", event);
//if (debugMode) {debugger;}
        if ("https://ccencryption01.3dcart.com" !== event.origin) {
            return;
        }

        var message = null;
        try {
            message = JSON.parse(event.data);
        } catch (e) {
            if (debugMode) {debugger;}
            console.log('Error processing credit card fields (code 201).');
        }

        if (message && message.id && base.fields[message.id]) {
            base.fields[message.id].receiveMessageHandler(message);
        }
    };

    //noinspection JSUnusedGlobalSymbols
    base.maintainOverlay = function (fieldObject, objOriginalCCField, overlay) {

        try {
			if (fieldObject.ifrmContainer.find('iframe').css('display') === 'none')
                fieldObject.ifrmContainer.find('iframe').css('display', 'block');
			
            if (fieldObject.loaded && autoCopyStyles.length > 0) {
                var underlyingStyles = base.fetchStyles(objOriginalCCField, autoCopyStyles);
                var underlyingStylesJson = JSON.stringify(underlyingStyles);
                if (fieldObject.lastUnderlyingCssJson !== underlyingStylesJson) {
                    fieldObject.lastUnderlyingCssJson = underlyingStylesJson;

                    var setStylesMessage = {
                        'messageType': 'setStyles',
                        'styles': underlyingStyles
                    };

                    fieldObject.iframeContentWindow.postMessage(
                        JSON.stringify(setStylesMessage)
                        ,
                        "*"
                    );

                }
            }
        } catch (e) {
        }

        try {
            if (fieldObject.loaded) {
                var underlyingVal = objOriginalCCField.val();
                //3d: commenting this out - as someone can get the card on his own field.
                //then push the valid data into the original field in order to get our iframe filled
                if (1 == 2 && underlyingVal && fieldObject.lastUnderlyingVal !== underlyingVal) {
                    fieldObject.lastUnderlyingVal = underlyingVal;

                    if (debugMode) console.log("3d debug: Notify hosted field of value.  Autofill plugin");

                    var setValueMessage = {
                        'messageType': 'setValue',
                        'value': underlyingVal
                    };

                    fieldObject.iframeContentWindow.postMessage(
                        JSON.stringify(setValueMessage)
                        ,
                        "*"
                    );
                }
            }
        } catch (e) {
        }

        try {

            var underlyingPosition = objOriginalCCField.position();

            var underlyingTop = underlyingPosition.top + (parseInt(objOriginalCCField.css('margin-top')) || 0);
            var underlyingLeft = underlyingPosition.left + (parseInt(objOriginalCCField.css('margin-left')) || 0);

            var overlayPosition = overlay.position();
            if (underlyingPosition && overlayPosition) {
                var diffTop = Math.abs(underlyingTop - overlayPosition.top);
                var diffLeft = Math.abs(underlyingLeft - overlayPosition.left);
                if (diffTop >= 1 || diffLeft >= 1) {
                    base.matchOverlay(objOriginalCCField, overlay);
                } else {
                    var diffWidth = Math.abs(objOriginalCCField.outerWidth(false) - overlay.outerWidth(false));
                    var diffHeight = Math.abs(objOriginalCCField.outerHeight(false) - overlay.outerHeight(false));
                    if (diffWidth >= 1 || diffHeight >= 1) {
                        base.matchOverlay(objOriginalCCField, overlay);
                    }
                }
            }
        } catch (e) {
        }

        setTimeout(function () {
            base.maintainOverlay(fieldObject, objOriginalCCField, overlay);
        }, 100);
    };

    //noinspection JSUnusedGlobalSymbols
    base.maintainSelectOverlay = function (objOriginalCCField, overlay) {

        try {
            var overlayPosition;

            if (objOriginalCCField.is(":visible") && !objOriginalCCField.is(":hidden")) {
                var underlyingPosition = objOriginalCCField.position();

                if (overlay.is(":hidden")) {
                    if (debugMode) console.log("3d debug: Restoring overlay for select since objOriginalCCField is now visible.");
                    overlay.show();
                }

                var underlyingTop = underlyingPosition.top + (parseInt(objOriginalCCField.css('margin-top')) || 0);
                var underlyingLeft = underlyingPosition.left + (parseInt(objOriginalCCField.css('margin-left')) || 0);

                overlayPosition = overlay.position();
                if (underlyingPosition && overlayPosition) {
                    var diffTop = Math.abs(underlyingTop - overlayPosition.top);
                    var diffLeft = Math.abs(underlyingLeft - overlayPosition.left);
                    if (diffTop >= 1 || diffLeft >= 1) {
                        base.matchOverlay(objOriginalCCField, overlay);
                    } else {
                        var diffWidth = Math.abs(objOriginalCCField.outerWidth(false) - overlay.outerWidth(false));
                        var diffHeight = Math.abs(objOriginalCCField.outerHeight(false) - overlay.outerHeight(false));
                        if (diffWidth >= 1 || diffHeight >= 1) {
                            base.matchOverlay(objOriginalCCField, overlay);
                        }
                    }
                }
            } else {
                if (!overlay.is(":hidden")) {
                    if (debugMode) console.log("3d debug: Hiding overlay for select since objOriginalCCField is no longer visible.");
                    overlay.hide();
                }
            }

        } catch (e) {
        }

        setTimeout(function () {
            base.maintainSelectOverlay(objOriginalCCField, overlay);
        }, 100);
    };

    //noinspection JSUnusedGlobalSymbols
    base.matchOverlay = function (objOriginalCCField, overlay) {
        var underlyingPosition = objOriginalCCField.position();

        var underlyingTop = underlyingPosition.top + (parseInt(objOriginalCCField.css('margin-top')) || 0);
        var underlyingLeft = underlyingPosition.left + (parseInt(objOriginalCCField.css('margin-left')) || 0);

console.log("matchoverlay: " + objOriginalCCField);
console.log("underlyingPosition: " + underlyingPosition);
console.log("underlyingTop: " + underlyingTop);
console.log("underlyingLeft: " + underlyingLeft);
console.log("offsetWidth: " + objOriginalCCField.offsetWidth);
console.log("offsetHeight: " + objOriginalCCField.offsetHeight);

        overlay.css('position', 'absolute');
        overlay.css('top', underlyingTop);
        overlay.css('left', underlyingLeft);
        overlay.css('width', objOriginalCCField.outerWidth(false));
        overlay.css('height', objOriginalCCField.outerHeight(false));
        overlay.css('z-index', 0);
		
    };

    //noinspection JSUnusedGlobalSymbols
    base.destroy = function () {
        window.removeEventListener("message", base.receiveMessageHandler);
        for (var i = 0; i < base.fields.length; i++) {
            var fieldObject = base.fields[i];
            if (fieldObject) {
                if (fieldObject.checkForLoadTimer) {
                    clearTimeout(fieldObject.checkForLoadTimer);
                }

                fieldObject.ifrmContainer.remove();
                if (fieldObject.underlyingOriginalTabIndex) {
                    fieldObject.objOriginalCCField.attr('tabIndex', fieldObject.underlyingOriginalTabIndex);
                } else {
                    fieldObject.objOriginalCCField.removeAttr('tabIndex');
                }
                fieldObject.objOriginalCCField.css('visibility', 'visible');
            }
        }
    };

    //noinspection JSUnusedGlobalSymbols
    base.addClass = function (className, fieldType) {
        if (!fieldType) {
            fieldType = 'all';
        }

        for (var i = 0; i < base.fields.length; i++) {
            var fieldObject = base.fields[i];
            if (fieldObject && (fieldObject.fieldType === fieldType || 'all' === fieldType)) {
                var addClassMessage = {
                    'messageType': 'addClass',
                    'className': className
                };

                if (fieldObject.loaded) {
                    fieldObject.iframeContentWindow.postMessage(
                        JSON.stringify(addClassMessage)
                        ,
                        "*"
                    );
                } else {
                    fieldObject.bufferedMessages.push(addClassMessage);
                }

            }
        }
    };

    //noinspection JSUnusedGlobalSymbols
    base.removeClass = function (className, fieldType) {
        if (!fieldType) {
            fieldType = 'all';
        }

        for (var i = 0; i < base.fields.length; i++) {
            var fieldObject = base.fields[i];
            if (fieldObject && (fieldObject.fieldType === fieldType || 'all' === fieldType)) {
                var removeClassMessage = {
                    'messageType': 'removeClass',
                    'className': className
                };

                if (fieldObject.loaded) {
                    fieldObject.iframeContentWindow.postMessage(
                        JSON.stringify(removeClassMessage)
                        ,
                        "*"
                    );
                } else {
                    fieldObject.bufferedMessages.push(removeClassMessage);
                }

            }
        }
    };

    //noinspection JSUnusedGlobalSymbols
    base.fetchStyles = function (jqElement, only, except) {
        /*
         The following method imported from the jquery.copycss.js project on the Github.  The following copywrite notice
         applies only to this fetchStyles method.
         */
        /*
         Copyright 2014 Mike Dunn
         http://upshots.org/
         Permission is hereby granted, free of charge, to any person obtaining
         a copy of this software and associated documentation files (the
         "Software"), to deal in the Software without restriction, including
         without limitation the rights to use, copy, modify, merge, publish,
         distribute, sublicense, and/or sell copies of the Software, and to
         permit persons to whom the Software is furnished to do so, subject to
         the following conditions:
    
         The above copyright notice and this permission notice shall be
         included in all copies or substantial portions of the Software.
    
         THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
         EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
         MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
         NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
         LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
         OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
         WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
         */

        var product = {};

        var style;

        var name;

        var i, l;

        if (only && only instanceof Array) {

            for (i = 0, l = only.length; i < l; i++) {
                name = only[i];
                product[name] = jqElement.css(name);
            }

        } else {

            if (jqElement.length) {

                var dom = jqElement.get(0);

                if (window.getComputedStyle) {

                    var pattern = /\-([a-z])/g;
                    var uc = function (a, b) {
                        return b.toUpperCase();
                    };
                    var camelize = function (string) {
                        return string.replace(pattern, uc);
                    };

                    if (style = window.getComputedStyle(dom, null)) {
                        var camel, value;
                        if (style.length) {
                            for (i = 0, l = style.length; i < l; i++) {
                                name = style[i];
                                camel = camelize(name);
                                value = style.getPropertyValue(name);
                                product[camel] = value;
                            }
                        } else {
                            for (name in style) {
                                camel = camelize(name);
                                value = style.getPropertyValue(name) || style[name];
                                product[camel] = value;
                            }
                        }
                    }
                }
                else if (style = dom.currentStyle) {
                    for (name in style) {
                        product[name] = style[name];
                    }
                }
                else if (style = dom.style) {
                    for (name in style) {
                        if (typeof style[name] != 'function') {
                            product[name] = style[name];
                        }
                    }
                }
            }
        }

        if (except && except instanceof Array) {
            for (i = 0, l = except.length; i < l; i++) {
                name = except[i];
                delete product[name];
            }
        }

        return product;
    };
    base.startEncryptionTimer = function () {
        base.checkForEncryptionTimer = setTimeout(function () {
            base.checkForEncryption();
        }, 250);
    }
    base.checkForEncryptionTimer = null;
    base.checkForEncryptionTimerLoops = 0;
    base.checkForEncryption = function () {
        base.checkForEncryptionTimerLoops++;
        if (debugMode) console.log("3d debug: checkForEncryption - base.fieldsToEncrypt.length: " + base.fieldsToEncrypt.length);
        if (debugMode) console.log("3d debug: checkForEncryption - checkForEncryptionTimerLoops: " + base.checkForEncryptionTimerLoops);
        var allGood = true;
        for (var i = 0; i < base.fieldsToEncrypt.length; i++) {
            if (base.fieldsToEncrypt[i].val().length <= 0)
                allGood = false;
        }
        if (allGood) {
            base.onTokenize();
        }
        else {
            if (base.checkForEncryptionTimerLoops >= 120) {
                base.onTokenizeFail();
            }
            else {
                base.startEncryptionTimer();
            }
        }
    }

    //noinspection JSUnusedGlobalSymbols
    base.processEncryption = function (paymentId) {
        base.checkForEncryptionTimerLoops = 0;
        base.fieldsToEncrypt = [];
		
		//if(base.fields[1] && base.fields[1].objOriginalCCField[0] && base.fields[1].objOriginalCCField[0].value === '1111111111111111'){
		//	if (debugMode) console.log("credit card number doesn't pass LuhnCheck - trigger change event.");
		//	alert('Please enter a Valid Card Number.');
		//	return false;
		//}
		
        var j = 0;
        for (var i = 0; i < base.fields.length; i++) {
            if (base.fields[i] && base.fields[i].fieldConfig.fieldId == paymentId) {
									
                fieldObject = base.fields[i];
                base.fieldsToEncrypt[j] = fieldObject.tokenHolder;
                j++;
				
				if (fieldObject.objOriginalCCField[0].value === '1111111111111111') {
					if (debugMode) console.log("credit card number doesn't pass LuhnCheck - trigger change event.");
					alert('Please enter a Valid Credit Card Number.');
					return false;
				}
				
                var processEncryptionMessage = {
                    'messageType': 'processEncryption',
                    'id': fieldObject.id,
                    'cart': base.cart,
                    'debugMode': debugMode,
					'unhideFirst6': unhideFirst6
                };

                fieldObject.iframeContentWindow.postMessage(
                    JSON.stringify(processEncryptionMessage)
                    ,
                    "*"
                );
            }
        }
        if (j > 0)
            base.startEncryptionTimer();
        else
            base.onTokenizeFail();
    };

    //noinspection JSUnusedGlobalSymbols
    base.onTokenize = onTokenizeCallback;
    //noinspection JSUnusedGlobalSymbols
    base.onTokenizeFail = onTokenizeFailCallback;

    if (window.addEventListener) {
        window.addEventListener("message", base.receiveMessageHandler, false);
    } else if (window.attachEvent) {
        window.attachEvent('onmessage', base.receiveMessageHandler);
    }

});

cartCCFIelds.init = function (config) {
    var obj3dCCFields = new cartCCFIelds(window, config.cart, config.arrCss, config.zIndex || 999999, config.autoCopyStyles, config.onTokenize, config.onTokenizeFail, config.debugMode || false, config.unhideFirst6 || false);

    if (config && config.hostedFields && config.hostedFields.length) {
        for (var i = 0; i < config.hostedFields.length; i++) {
            var objHostedField = config.hostedFields[i];

            if (objHostedField.creditCardNumber) {
                var fieldCreditCardNumber = objHostedField.creditCardNumber;

                if (!fieldCreditCardNumber.selector) {
                    alert('Error processing credit card fields (code 202).');
                } else {
                    var creditCardNumberSelector;
                    if (fieldCreditCardNumber.selectorContext) {
                        creditCardNumberSelector = jQuery(fieldCreditCardNumber.selector, fieldCreditCardNumber.selectorContext);
                    } else {
                        creditCardNumberSelector = jQuery(fieldCreditCardNumber.selector);
                    }

                    if (creditCardNumberSelector.size() == 1) {
                        obj3dCCFields.setupField("creditCardNumber", fieldCreditCardNumber);
                    } else if (creditCardNumberSelector.size() == 0) {
                        if (fieldCreditCardNumber.alertIfMissing) {
                            alert('Error processing credit card fields (code 203).');
                        }
                    } else if (creditCardNumberSelector.size() > 1) {
                        alert('Error processing credit card fields (code 204).');
                    }
                }
            }
            if (objHostedField.creditCardCvv2) {
                var fieldCreditCardCvv2 = objHostedField.creditCardCvv2;

                if (!fieldCreditCardCvv2.selector) {
                    alert('Error processing credit card fields (code 301).');
                } else {
                    var creditCardCvv2Selector;
                    if (fieldCreditCardCvv2.selectorContext) {
                        creditCardCvv2Selector = jQuery(fieldCreditCardCvv2.selector, fieldCreditCardCvv2.selectorContext);
                    } else {
                        creditCardCvv2Selector = jQuery(fieldCreditCardCvv2.selector);
                    }

                    if (creditCardCvv2Selector.size() == 1) {
                        obj3dCCFields.setupField("creditCardCvv2", fieldCreditCardCvv2);
                    } else if (creditCardCvv2Selector.size() == 0) {
                        if (fieldCreditCardCvv2.alertIfMissing) {
                            alert('Error processing credit card fields (code 302).');
                        }
                    } else if (creditCardCvv2Selector.size() > 1) {
                        alert('Error processing credit card fields (code 303).');
                    }

                }

            }
        }


        if (navigator.userAgent && navigator.userAgent.indexOf("AppleWebKit") != -1 && navigator.userAgent.indexOf("Mobile") != -1 && navigator.userAgent.indexOf("Android") == -1) {
            obj3dCCFields.handleIPADSelect();
        }
    }

    return obj3dCCFields;
};
