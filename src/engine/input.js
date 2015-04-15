/**
    @module input
**/
game.module(
    'engine.input'
)
.body(function() {
'use strict';

/**
    @class Input
    @constructor
    @param {HTMLCanvasElement} canvas
**/
game.createClass('Input', {
    items: [],
    _needUpdate: false,
    _mouseDownTime: null,
    _mouseDownItem: null,
    _mouseUpItem: null,

    init: function(canvas) {
        canvas.addEventListener('touchstart', this._touchstart.bind(this));
        canvas.addEventListener('touchmove', this._touchmove.bind(this));
        canvas.addEventListener('touchend', this._touchend.bind(this));
        canvas.addEventListener('mousedown', this._mousedown.bind(this));
        canvas.addEventListener('mousemove', this._mousemove.bind(this));
        window.addEventListener('mouseup', this._mouseup.bind(this));
    },

    /**
        @method _touchstart
        @param {TouchEvent} event
        @private
    **/
    _touchstart: function(event) {
        if (game.Input.preventDefault) event.preventDefault();
        for (var i = 0; i < event.changedTouches.length; i++) {
            this._mousedown(event.changedTouches[i]);
        }
    },

    /**
        @method _touchmove
        @param {TouchEvent} event
        @private
    **/
    _touchmove: function(event) {
        if (game.Input.preventDefault) event.preventDefault();
        for (var i = 0; i < event.changedTouches.length; i++) {
            this._mousemove(event.changedTouches[i]);
        }
    },

    /**
        @method _touchend
        @param {TouchEvent} event
        @private
    **/
    _touchend: function(event) {
        if (game.Input.preventDefault) event.preventDefault();
        for (var i = 0; i < event.changedTouches.length; i++) {
            this._mouseup(event.changedTouches[i]);
        }
    },

    /**
        @method _mousedown
        @param {MouseEvent|TouchEvent} event
        @private
    **/
    _mousedown: function(event) {
        this._preventDefault(event);
        this._calculateXY(event);
        
        this._mouseDownItem = this._processEvent('mousedown', event);
        this._mouseDownTime = game.Timer.time;

        if (game.scene._mousedown) {
            game.scene._mousedown(event.canvasX, event.canvasY, event.identifier, event);
        }
    },

    /**
        @method _mousemove
        @param {MouseEvent|TouchEvent} event
        @private
    **/
    _mousemove: function(event) {
        this._preventDefault(event);
        this._calculateXY(event);
        
        var _mouseMoveItem = this._processEvent('mousemove', event);
        if (this._mouseMoveItem && this._mouseMoveItem !== _mouseMoveItem) {
            this._mouseMoveItem.mouseout(event.canvasX, event.canvasY, event);
        }
        this._mouseMoveItem = _mouseMoveItem;

        if (game.scene._mousemove) {
            game.scene._mousemove(event.canvasX, event.canvasY, event.identifier, event);
        }
    },

    /**
        @method _mouseup
        @param {MouseEvent|TouchEvent} event
        @private
    **/
    _mouseup: function(event) {
        this._preventDefault(event);
        this._calculateXY(event);

        this._mouseUpItem = this._processEvent('mouseup', event);
        if (this._mouseDownItem && this._mouseDownItem === this._mouseUpItem) {
            var time = game.Timer.time - this._mouseDownTime;
            if (game.Input.clickTimeout === 0 || time < game.Input.clickTimeout) {
                this._mouseDownItem.click(event.canvasX, event.canvasY, event);
            }
        }

        if (game.scene._mouseup) {
            game.scene._mouseup(event.canvasX, event.canvasY, event.identifier, event);
        }
    },

    /**
        @method _preventDefault
        @param {MouseEvent|TouchEvent} event
        @private
    **/
    _preventDefault: function(event) {
        if (!event.preventDefault || !game.Input.preventDefault) return;
        event.preventDefault();
    },

    /**
        @method _processEvent
        @param {String} eventName
        @param {MouseEvent|TouchEvent} event
        @return {Object} item
        @private
    **/
    _processEvent: function(eventName, event) {
        for (var i = this.items.length - 1; i >= 0; i--) {
            var item = this.items[i];
            if (item._interactive && this._hitTest(item, event.canvasX, event.canvasY)) {
                item[eventName](event.canvasX, event.canvasY, event);
                return item;
            }
        }
    },

    /**
        @method _calculateXY
        @param {MouseEvent|TouchEvent} event
        @private
    **/
    _calculateXY: function(event) {
        var rect = game.renderer.canvas.getBoundingClientRect();
        var x = (event.clientX - rect.left) * (game.renderer.canvas.width / rect.width);
        var y = (event.clientY - rect.top) * (game.renderer.canvas.height / rect.height);
        event.canvasX = x;
        event.canvasY = y;
    },

    /**
        @method _hitTest
        @param {Container} container
        @param {Number} x
        @param {Number} y
        @return {Boolean}
        @private
    **/
    _hitTest: function(container, x, y) {
        var hitArea = container.hitArea;
        if (hitArea) {
            var hx = (container._worldTransform.tx + hitArea.x) * game.scale;
            var hy = (container._worldTransform.ty + hitArea.y) * game.scale;
        }
        else {
            hitArea = container._getBounds();
            var hx = hitArea.x;
            var hy = hitArea.y;
        }
        var hw = hitArea.width * game.scale;
        var hh = hitArea.height * game.scale;
        
        return (x >= hx && y >= hy && x <= hx + hw && y <= hy + hh);
    },

    /**
        @method _updateItems
        @param {Container} container
        @private
    **/
    _updateItems: function(container) {
        for (var i = 0; i < container.children.length; i++) {
            var child = container.children[i];
            if (child._interactive) this.items.push(child);
            if (child.children.length > 0) this._updateItems(child);
        }
    },

    /**
        @method _update
        @private
    **/
    _update: function() {
        if (!this._needUpdate) return;

        this.items.length = 0;
        this._updateItems(game.scene.stage);
    }
});

game.addAttributes('Input', {
    /**
        Time after click is not called (ms).
        @attribute {Number} clickTimeout
        @default 500
    **/
    clickTimeout: 500,
    /**
        Should events prevent default action.
        @attribute {Boolean} preventDefault
        @default true
    **/
    preventDefault: true
});

/**
    @class Keyboard
**/
game.createClass('Keyboard', {
    /**
        @property {Array} _keysDown
        @private
    **/
    _keysDown: [],

    init: function() {
        window.addEventListener('keydown', this._keydown.bind(this));
        window.addEventListener('keyup', this._keyup.bind(this));
        window.addEventListener('blur', this._resetKeys.bind(this));
    },

    /**
        Check if key is pressed down.
        @method down
        @param {String} key
        @return {Boolean}
    **/
    down: function(key) {
        return !!this._keysDown[key];
    },

    /**
        @method _resetKeys
        @private
    **/
    _resetKeys: function() {
        for (var key in this._keysDown) {
            this._keysDown[key] = false;
        }
    },

    /**
        @method _keydown
        @private
    **/
    _keydown: function(event) {
        if (!game.Keyboard.keys[event.keyCode]) {
            // Unknown key
            game.Keyboard.keys[event.keyCode] = event.keyCode;
        }

        this._keysDown[game.Keyboard.keys[event.keyCode]] = true;
        if (game.scene && game.scene.keydown) {
            var prevent = game.scene.keydown(game.Keyboard.keys[event.keyCode], this.down('SHIFT'), this.down('CTRL'), this.down('ALT'));
            if (prevent) event.preventDefault();
        }
    },

    /**
        @method _keyup
        @private
    **/
    _keyup: function(event) {
        this._keysDown[game.Keyboard.keys[event.keyCode]] = false;
        if (game.scene && game.scene.keyup) {
            game.scene.keyup(game.Keyboard.keys[event.keyCode]);
        }
    }
});

game.addAttributes('Keyboard', {
    /**
        List of available keys.
        @attribute {Object} keys
    **/
    keys: {
        8: 'BACKSPACE',
        9: 'TAB',
        13: 'ENTER',
        16: 'SHIFT',
        17: 'CTRL',
        18: 'ALT',
        19: 'PAUSE',
        20: 'CAPS_LOCK',
        27: 'ESC',
        32: 'SPACE',
        33: 'PAGE_UP',
        34: 'PAGE_DOWN',
        35: 'END',
        36: 'HOME',
        37: 'LEFT',
        38: 'UP',
        39: 'RIGHT',
        40: 'DOWN',
        44: 'PRINT_SCREEN',
        45: 'INSERT',
        46: 'DELETE',
        48: '0',
        49: '1',
        50: '2',
        51: '3',
        52: '4',
        53: '5',
        54: '6',
        55: '7',
        56: '8',
        57: '9',
        65: 'A',
        66: 'B',
        67: 'C',
        68: 'D',
        69: 'E',
        70: 'F',
        71: 'G',
        72: 'H',
        73: 'I',
        74: 'J',
        75: 'K',
        76: 'L',
        77: 'M',
        78: 'N',
        79: 'O',
        80: 'P',
        81: 'Q',
        82: 'R',
        83: 'S',
        84: 'T',
        85: 'U',
        86: 'V',
        87: 'W',
        88: 'X',
        89: 'Y',
        90: 'Z',
        96: 'NUM_ZERO',
        97: 'NUM_ONE',
        98: 'NUM_TWO',
        99: 'NUM_THREE',
        100: 'NUM_FOUR',
        101: 'NUM_FIVE',
        102: 'NUM_SIX',
        103: 'NUM_SEVEN',
        104: 'NUM_EIGHT',
        105: 'NUM_NINE',
        106: 'NUM_MULTIPLY',
        107: 'NUM_PLUS',
        109: 'NUM_MINUS',
        110: 'NUM_PERIOD',
        111: 'NUM_DIVISION',
        112: 'F1',
        113: 'F2',
        114: 'F3',
        115: 'F4',
        116: 'F5',
        117: 'F6',
        118: 'F7',
        119: 'F8',
        120: 'F9',
        121: 'F10',
        122: 'F11',
        123: 'F12',
        186: 'SEMICOLON',
        187: 'PLUS',
        189: 'MINUS',
        192: 'GRAVE_ACCENT',
        222: 'SINGLE_QUOTE'
    }
});

});
