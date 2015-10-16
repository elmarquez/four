'use strict';

var FOUR = FOUR || {};

/**
 * Trackball controller.
 * @todo listen for camera change on the viewport
 * @todo listen for domElement resize events
 * @todo handle mouse position, sizing differences between document and domelements
 */
FOUR.TrackballController = (function () {

    var STATE = {
        NONE: -1,
        ROTATE: 0,
        ZOOM: 1,
        PAN: 2,
        TOUCH_ROTATE: 3,
        TOUCH_ZOOM_PAN: 4
    };

    var _state = STATE.NONE,
      _prevState = STATE.NONE,

      _eye = new THREE.Vector3(),

      _movePrev = new THREE.Vector2(),
      _moveCurr = new THREE.Vector2(),

      _lastAxis = new THREE.Vector3(),
      _lastAngle = 0,

      _zoomStart = new THREE.Vector2(),
      _zoomEnd = new THREE.Vector2(),

      _touchZoomDistanceStart = 0,
      _touchZoomDistanceEnd = 0,

      _panStart = new THREE.Vector2(),
      _panEnd = new THREE.Vector2(),

      _key = null;

    function TrackballController (config) {
        THREE.EventDispatcher.call(this);
        config = config || {};
        var self = this;

        self.EPS = 0.000001;
        self.EVENTS = {
            UPDATE: {type: 'update'},
            END: {type: 'end'},
            START: {type: 'start'}
        };
        self.KEY = {
            A: 65,
            S: 83,
            D: 68,
            I: 73,
            J: 74,
            K: 75,
            L: 76,
            ALT: 18,
            CTRL: 17,
            SHIFT: 16,
            CANCEL: 27,
            GRAVE_ACCENT: 192,
            MOVE_FORWARD: 73,
            MOVE_LEFT: 74,
            MOVE_BACK: 75,
            MOVE_RIGHT: 76,
            MOVE_UP: 85,
            MOVE_DOWN: 79
        };
        self.MODE = {
            SELECTION: 0,
            TRACKBALL: 1,
            FIRSTPERSON: 2,
            ORBIT: 3
        };
        self.MOUSE_STATE = {
            UP: 0,
            DOWN: 1
        };
        self.SINGLE_CLICK_TIMEOUT = 400;

        // API
        self.allowZoom = true;
        self.allowPan = true;
        self.allowRotate = true;
        self.camera = config.viewport.camera;
        self.domElement = config.viewport.domElement;
        self.dynamicDampingFactor = 0.2;
        self.enabled = false;
        self.keys = [
            65 /*A*/, 83 /*S*/, 68 /*D*/,
            73 /*I*/, 74 /*J*/, 75 /*K*/, 76 /*L*/
        ];
        self.lastPosition = new THREE.Vector3();
        self.listeners = {};
        self.maxDistance = Infinity;
        self.minDistance = 0;
        self.modifiers = {};
        self.mouse = self.MOUSE_STATE.UP;
        self.mousePosition = new THREE.Vector2();
        self.panSpeed = 0.3;
        self.raycaster = new THREE.Raycaster();
        self.rotateSpeed = 1.0;
        self.screen = { left: 0, top: 0, width: 0, height: 0 };
        self.staticMoving = false;
        self.target = new THREE.Vector3();
        self.timeout = null;
        self.viewport = config.viewport;
        self.zoomSpeed = 1.2;

        // for reset
        self.target0 = self.target.clone();
        self.position0 = self.camera.position.clone();
        self.up0 = self.camera.up.clone();

        Object.keys(self.KEY).forEach(function (key) {
            self.modifiers[self.KEY[key]] = false;
        });

        Object.keys(config).forEach(function (key) {
           self[key] = config[key];
        });
    }

    TrackballController.prototype = Object.create(THREE.EventDispatcher.prototype);

    //TrackballController.prototype.constructor = TrackballController;

    TrackballController.prototype.checkDistances = function () {
        var self = this;
        if (self.allowZoom || self.allowPan) {
            if (_eye.lengthSq() > self.maxDistance * self.maxDistance) {
                self.camera.position.addVectors(self.target, _eye.setLength(self.maxDistance));
                _zoomStart.copy(_zoomEnd);
            }
            if (_eye.lengthSq() < self.minDistance * self.minDistance) {
                self.camera.position.addVectors(self.target, _eye.setLength(self.minDistance));
                _zoomStart.copy(_zoomEnd);
            }
        }
    };

    TrackballController.prototype.contextMenu = function (event) {
        event.preventDefault();
    };

    TrackballController.prototype.disable = function () {
        var self = this;
        self.enabled = false;
        Object.keys(self.listeners).forEach(function (key) {
            var listener = self.listeners[key];
            listener.element.removeEventListener(listener.event, listener.fn);
        });
    };

    TrackballController.prototype.enable = function () {
        var self = this;
        self.handleResize(); // update screen size settings
        function addListener(element, event, fn) {
            self.listeners[event] = {
                element: element,
                event: event,
                fn: fn.bind(self)
            };
            element.addEventListener(event, self.listeners[event].fn, false);
        }
        addListener(self.domElement, 'contextmenu', self.contextMenu);
        addListener(self.domElement, 'mousedown', self.mousedown);
        addListener(self.domElement, 'mousemove', self.mousemove);
        addListener(self.domElement, 'mouseup', self.mouseup);
        addListener(self.domElement, 'mousewheel', self.mousewheel);
        addListener(self.domElement, 'DOMMouseScroll', self.mousewheel);
        addListener(self.domElement, 'touchstart', self.touchstart);
        addListener(self.domElement, 'touchend', self.touchend);
        addListener(self.domElement, 'touchmove', self.touchmove);
        addListener(window, 'keydown', self.keydown);
        addListener(window, 'keyup', self.keyup);
        self.enabled = true;
    };

    TrackballController.prototype.getMouseOnCircle = (function () {
        var vector = new THREE.Vector2();
        return function getMouseOnCircle(pageX, pageY) {
            vector.set(
              ((pageX - this.screen.width * 0.5 - this.screen.left) / (this.screen.width * 0.5)),
              ((this.screen.height + 2 * (this.screen.top - pageY)) / this.screen.width) // screen.width intentional
            );
            return vector;
        };
    }());

    TrackballController.prototype.getMouseOnScreen = (function () {
        var vector = new THREE.Vector2();
        return function getMouseOnScreen(pageX, pageY) {
            vector.set(
              (pageX - this.screen.left) / this.screen.width,
              (pageY - this.screen.top) / this.screen.height
            );
            return vector;
        };
    }());

    TrackballController.prototype.handleDoubleClick = function (selected) {
        var self = this;
        // CTRL double click rotates the camera toward the selected point
        if (self.modifiers[self.KEY.CTRL]) {
            self.dispatchEvent({type:'lookat', position:selected.point, object:selected.object});
        }
        // double click navigates the camera to the selected point
        else {
            self.dispatchEvent({type:'navigate', position:selected.point, object:selected.object});
        }
    };

    TrackballController.prototype.handleEvent = function (event) {
        if (typeof this[event.type] === 'function') {
            this[event.type](event);
        }
    };

    TrackballController.prototype.handleResize = function () {
        var self = this;
        if (self.domElement === document) {
            self.screen.left = 0;
            self.screen.top = 0;
            self.screen.width = window.innerWidth;
            self.screen.height = window.innerHeight;
        } else {
            var box = self.domElement.getBoundingClientRect();
            // adjustments come from similar code in the jquery offset() function
            var d = self.domElement.ownerDocument.documentElement;
            self.screen.left = box.left + window.pageXOffset - d.clientLeft;
            self.screen.top = box.top + window.pageYOffset - d.clientTop;
            self.screen.width = box.width;
            self.screen.height = box.height;
        }
    };

    TrackballController.prototype.handleSingleClick = function () {};

    TrackballController.prototype.keydown = function (event) {
        var self = this;
        if (self.enabled === false) {
            return;
        }
        if (_state !== STATE.NONE) {
            return;
        } else if (event.keyCode === self.keys[STATE.ROTATE] && self.allowRotate) {
            _state = STATE.ROTATE;
        } else if (event.keyCode === self.keys[STATE.ZOOM] && self.allowZoom) {
            _state = STATE.ZOOM;
        } else if (event.keyCode === self.keys[STATE.PAN] && self.allowPan) {
            _state = STATE.PAN;
        } else if (event.keyCode === self.KEY.CTRL) {
            self.modifiers[self.KEY.CTRL] = true;
        }
        _prevState = _state;
    };

    TrackballController.prototype.keyup = function (event) {
        var self = this;
        if (self.enabled === false) {
            return;
        } else if (event.keyCode === self.KEY.CTRL) {
            self.modifiers[self.KEY.CTRL] = true;
        } else if (event.keyCode === self.KEY.GRAVE_ACCENT) {
            self.camera.resetOrientation();
        }
        _state = _prevState;
    };

    TrackballController.prototype.mousedown = function (event) {
        event.preventDefault();
        event.stopPropagation();
        var self = this;
        self.mouse = self.MOUSE_STATE.DOWN;
        if (self.enabled === false) {
            return;
        }
        if (_state === STATE.NONE) {
            _state = event.button;
        }
        if (_state === STATE.ROTATE && self.allowRotate) {
            _moveCurr.copy(self.getMouseOnCircle(event.pageX, event.pageY));
            _movePrev.copy(_moveCurr);
        } else if (_state === STATE.ZOOM && self.allowZoom) {
            _zoomStart.copy(self.getMouseOnScreen(event.pageX, event.pageY));
            _zoomEnd.copy(_zoomStart);
        } else if (_state === STATE.PAN && self.allowPan) {
            _panStart.copy(self.getMouseOnScreen(event.pageX, event.pageY));
            _panEnd.copy(_panStart);
        }
        self.dispatchEvent(self.EVENTS.START);
    };

    TrackballController.prototype.mousemove = function (event) {
        event.preventDefault();
        event.stopPropagation();
        var self = this;
        if (self.enabled === false) {
            return;
        }
        if (_state === STATE.ROTATE && self.allowRotate) {
            _movePrev.copy(_moveCurr);
            _moveCurr.copy(self.getMouseOnCircle(event.pageX, event.pageY));
        } else if (_state === STATE.ZOOM && self.allowZoom) {
            _zoomEnd.copy(self.getMouseOnScreen(event.pageX, event.pageY));
        } else if (_state === STATE.PAN && self.allowPan) {
            _panEnd.copy(self.getMouseOnScreen(event.pageX, event.pageY));
        }
    };

    TrackballController.prototype.mouseup = function (event) {
        event.preventDefault();
        event.stopPropagation();
        var self = this;
        self.mouse = self.MOUSE_STATE.UP;
        _state = STATE.NONE;
        if (self.enabled === false) {
            return;
        } else if (self.timeout !== null) {
            clearTimeout(self.timeout);
            self.timeout = null;
            // calculate mouse position in normalized device coordinates (-1 to +1)
            self.mousePosition.x = (event.offsetX / self.viewport.domElement.clientWidth) * 2 - 1;
            self.mousePosition.y = -(event.offsetY / self.viewport.domElement.clientHeight) * 2 + 1;
            // update the picking ray with the camera and mouse position
            self.raycaster.setFromCamera(self.mousePosition, self.camera);
            // calculate objects intersecting the picking ray
            var intersects = self.raycaster.intersectObjects(self.viewport.scene.children, true); // TODO this is FOUR specific use of children
            // handle the action for the nearest object
            if (intersects && intersects.length > 0) {
                self.handleDoubleClick(intersects[0]);
            }
        } else {
            self.timeout = setTimeout(function () {
                self.timeout = null;
            }, self.SINGLE_CLICK_TIMEOUT);
            self.dispatchEvent(self.EVENTS.END);
        }
    };

    TrackballController.prototype.mousewheel = function (event) {
        var self = this;
        if (self.enabled === false) {
            return;
        }
        event.preventDefault();
        event.stopPropagation();
        var delta = 0;
        if (event.wheelDelta) {
            // WebKit / Opera / Explorer 9
            delta = event.wheelDelta / 40;
        } else if (event.detail) {
            // Firefox
            delta = - event.detail / 3;
        }
        _zoomStart.y += delta * 0.01;
        self.dispatchEvent(self.EVENTS.START);
        self.dispatchEvent(self.EVENTS.END);
    };

    TrackballController.prototype.panCamera = (function() {
        var mouseChange = new THREE.Vector2(),
          cameraUp = new THREE.Vector3(),
          pan = new THREE.Vector3();

        return function panCamera () {
            var self = this;
            mouseChange.copy(_panEnd).sub(_panStart);
            if (mouseChange.lengthSq()) {
                mouseChange.multiplyScalar(_eye.length() * self.panSpeed);
                pan.copy(_eye).cross(self.camera.up).setLength(mouseChange.x);
                pan.add(cameraUp.copy(self.camera.up).setLength(mouseChange.y));

                self.camera.position.add(pan);
                self.target.add(pan);
                if (self.staticMoving) {
                    _panStart.copy(_panEnd);
                } else {
                    _panStart.add(mouseChange.subVectors(_panEnd, _panStart).multiplyScalar(self.dynamicDampingFactor));
                }
            }
        };
    }());

    TrackballController.prototype.reset = function () {
        var self = this;
        _state = STATE.NONE;
        _prevState = STATE.NONE;

        self.target.copy(self.target0);
        self.camera.position.copy(self.position0);
        self.camera.up.copy(self.up0);

        _eye.subVectors(self.camera.position, self.target);
        self.camera.lookAt(self.target);
        self.dispatchEvent(self.EVENTS.UPDATE);
        self.lastPosition.copy(self.camera.position);
    };

    TrackballController.prototype.rotateCamera = (function() {

        var axis = new THREE.Vector3(),
          quaternion = new THREE.Quaternion(),
          eyeDirection = new THREE.Vector3(),
          cameraUpDirection = new THREE.Vector3(),
          cameraSidewaysDirection = new THREE.Vector3(),
          moveDirection = new THREE.Vector3(),
          angle;

        return function rotateCamera() {
            var self = this;
            moveDirection.set(_moveCurr.x - _movePrev.x, _moveCurr.y - _movePrev.y, 0);
            angle = moveDirection.length();

            if (angle) {
                _eye.copy(self.camera.position).sub(self.target);

                eyeDirection.copy(_eye).normalize();
                cameraUpDirection.copy(self.camera.up).normalize();
                cameraSidewaysDirection.crossVectors(cameraUpDirection, eyeDirection).normalize();

                cameraUpDirection.setLength(_moveCurr.y - _movePrev.y);
                cameraSidewaysDirection.setLength(_moveCurr.x - _movePrev.x);

                moveDirection.copy(cameraUpDirection.add(cameraSidewaysDirection));

                axis.crossVectors(moveDirection, _eye).normalize();

                angle *= self.rotateSpeed;
                quaternion.setFromAxisAngle(axis, angle);

                _eye.applyQuaternion(quaternion);
                self.camera.up.applyQuaternion(quaternion);

                _lastAxis.copy(axis);
                _lastAngle = angle;
            } else if (! self.staticMoving && _lastAngle) {
                _lastAngle *= Math.sqrt(1.0 - self.dynamicDampingFactor);
                _eye.copy(self.camera.position).sub(self.target);
                quaternion.setFromAxisAngle(_lastAxis, _lastAngle);
                _eye.applyQuaternion(quaternion);
                self.camera.up.applyQuaternion(quaternion);
            }
            _movePrev.copy(_moveCurr);
        };
    }());

    TrackballController.prototype.touchstart = function (event) {
        var self = this;
        if (self.enabled === false) {
            return;
        }
        switch (event.touches.length) {
            case 1:
                _state = STATE.TOUCH_ROTATE;
                _moveCurr.copy(self.getMouseOnCircle(event.touches[0].pageX, event.touches[0].pageY));
                _movePrev.copy(_moveCurr);
                break;
            case 2:
                _state = STATE.TOUCH_ZOOM_PAN;
                var dx = event.touches[0].pageX - event.touches[1].pageX;
                var dy = event.touches[0].pageY - event.touches[1].pageY;
                _touchZoomDistanceEnd = _touchZoomDistanceStart = Math.sqrt(dx * dx + dy * dy);
                var x = (event.touches[0].pageX + event.touches[1].pageX) / 2;
                var y = (event.touches[0].pageY + event.touches[1].pageY) / 2;
                _panStart.copy(self.getMouseOnScreen(x, y));
                _panEnd.copy(_panStart);
                break;
            default:
                _state = STATE.NONE;
        }
        self.dispatchEvent(self.EVENTS.START);
    };

    TrackballController.prototype.touchmove = function (event) {
        var self = this;
        if (self.enabled === false) {
            return;
        }
        event.preventDefault();
        event.stopPropagation();

        switch (event.touches.length) {
            case 1:
                _movePrev.copy(_moveCurr);
                _moveCurr.copy(self.getMouseOnCircle( event.touches[0].pageX, event.touches[0].pageY));
                break;
            case 2:
                var dx = event.touches[0].pageX - event.touches[1].pageX;
                var dy = event.touches[0].pageY - event.touches[1].pageY;
                _touchZoomDistanceEnd = Math.sqrt(dx * dx + dy * dy);

                var x = (event.touches[0].pageX + event.touches[1].pageX) / 2;
                var y = (event.touches[0].pageY + event.touches[1].pageY) / 2;
                _panEnd.copy(self.getMouseOnScreen(x, y));
                break;
            default:
                _state = STATE.NONE;
        }
    };

    TrackballController.prototype.touchend = function (event) {
        var self = this;
        if (self.enabled === false) {
            return;
        }
        switch (event.touches.length) {
            case 1:
                _movePrev.copy(_moveCurr);
                _moveCurr.copy(self.getMouseOnCircle( event.touches[0].pageX, event.touches[0].pageY));
                break;
            case 2:
                _touchZoomDistanceStart = _touchZoomDistanceEnd = 0;

                var x = (event.touches[0].pageX + event.touches[1].pageX) / 2;
                var y = (event.touches[0].pageY + event.touches[1].pageY) / 2;
                _panEnd.copy(self.getMouseOnScreen(x, y));
                _panStart.copy(_panEnd);
                break;
        }
        _state = STATE.NONE;
        self.dispatchEvent(self.EVENTS.END);
    };

    TrackballController.prototype.update = function () {
        var self = this;
        _eye.subVectors(self.camera.position, self.target);
        if (self.allowRotate) {
            self.rotateCamera();
        }
        if (self.allowZoom) {
            self.zoomCamera();
        }
        if (self.allowPan) {
            self.panCamera();
        }
        self.camera.position.addVectors(self.target, _eye);
        self.checkDistances();
        self.camera.lookAt(self.target);

        if (self.lastPosition.distanceToSquared(self.camera.position) > self.EPS) {
            self.dispatchEvent(self.EVENTS.UPDATE);
            self.lastPosition.copy(self.camera.position);
        }
    };

    TrackballController.prototype.zoomCamera = function () {
        var factor, self = this;
        if (_state === STATE.TOUCH_ZOOM_PAN) {
            factor = _touchZoomDistanceStart / _touchZoomDistanceEnd;
            _touchZoomDistanceStart = _touchZoomDistanceEnd;
            _eye.multiplyScalar(factor);
        } else {
            factor = 1.0 + (_zoomEnd.y - _zoomStart.y) * self.zoomSpeed;
            if (factor !== 1.0 && factor > 0.0) {
                _eye.multiplyScalar(factor);
                if (self.staticMoving) {
                    _zoomStart.copy(_zoomEnd);
                } else {
                    _zoomStart.y += (_zoomEnd.y - _zoomStart.y) * this.dynamicDampingFactor;
                }
            }
        }
    };

    return TrackballController;

}());
