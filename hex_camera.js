///<reference path="babylon.d.ts" />
export class HexGridFreeCameraMouseInput extends BABYLON.FreeCameraMouseInput {
    constructor() {
        // /**
        //  * Defines the camera the input is attached to.
        //  */
        // public camera: BABYLON.FreeCamera;
        super(...arguments);
        this._previousPosition = null;
    }
    // /**
    //  * Observable for when a pointer move event occurs containing the move offset
    //  */
    // public onPointerMovedObservable = new BABYLON.Observable<{ offsetX: number, offsetY: number }>();
    // /**
    //  * @hidden
    //  * If the camera should be rotated automatically based on pointer movement
    //  */
    // public _allowCameraRotation = true;
    // /**
    //  * Manage the mouse inputs to control the movement of a free camera.
    //  * @see http://doc.babylonjs.com/how_to/customizing_camera_inputs
    //  * @param touchEnabled Defines if touch is enabled or not
    //  */
    // constructor(
    //     /**
    //      * Define if touch is enabled in the mouse input
    //      */
    //     public touchEnabled = true) {
    // }
    /**
     * Attach the input controls to a specific dom element to get the input from.
     * @param element Defines the element the controls should be listened from
     * @param noPreventDefault Defines whether event caught by the controls should call preventdefault() (https://developer.mozilla.org/en-US/docs/Web/API/Event/preventDefault)
     */
    attachControl(element, noPreventDefault) {
        var engine = this.camera.getEngine();
        if (!this.pointerInput) {
            this.pointerInput = (p) => {
                var evt = p.event;
                if (engine.isInVRExclusivePointerMode) {
                    return;
                }
                if (!this.touchEnabled && evt.pointerType === "touch") {
                    return;
                }
                if (p.type !== BABYLON.PointerEventTypes.POINTERMOVE && this.buttons.indexOf(evt.button) === -1) {
                    return;
                }
                let srcElement = (evt.srcElement || evt.target);
                if (p.type === BABYLON.PointerEventTypes.POINTERDOWN && srcElement) {
                    if (evt.which != 3) {
                        return;
                    }
                    try {
                        srcElement.setPointerCapture(evt.pointerId);
                    }
                    catch (e) {
                        //Nothing to do with the error. Execution will continue.
                    }
                    this._previousPosition = {
                        x: evt.clientX,
                        y: evt.clientY
                    };
                    if (!noPreventDefault) {
                        evt.preventDefault();
                        element.focus();
                    }
                }
                else if (p.type === BABYLON.PointerEventTypes.POINTERUP && srcElement) {
                    if (evt.which != 3) {
                        return;
                    }
                    try {
                        srcElement.releasePointerCapture(evt.pointerId);
                    }
                    catch (e) {
                        //Nothing to do with the error.
                    }
                    this._previousPosition = null;
                    if (!noPreventDefault) {
                        evt.preventDefault();
                    }
                }
                else if (p.type === BABYLON.PointerEventTypes.POINTERMOVE) {
                    if (!this._previousPosition || engine.isPointerLock) {
                        return;
                    }
                    var offsetX = evt.clientX - this._previousPosition.x;
                    var offsetY = evt.clientY - this._previousPosition.y;
                    if (this.camera.getScene().useRightHandedSystem) {
                        offsetX *= -1;
                    }
                    if (this.camera.parent && this.camera.parent._getWorldMatrixDeterminant() < 0) {
                        offsetX *= -1;
                    }
                    if (this._allowCameraRotation) {
                        this.camera.cameraRotation.y += offsetX / this.angularSensibility;
                        this.camera.cameraRotation.x += offsetY / this.angularSensibility;
                    }
                    this.onPointerMovedObservable.notifyObservers({ offsetX: offsetX, offsetY: offsetY });
                    this._previousPosition = {
                        x: evt.clientX,
                        y: evt.clientY
                    };
                    if (!noPreventDefault) {
                        evt.preventDefault();
                    }
                }
            };
        }
        this.onMouseMove = (evt) => {
            if (!engine.isPointerLock) {
                return;
            }
            if (engine.isInVRExclusivePointerMode) {
                return;
            }
            var offsetX = evt.movementX || evt.mozMovementX || evt.webkitMovementX || evt.msMovementX || 0;
            if (this.camera.getScene().useRightHandedSystem) {
                offsetX *= -1;
            }
            if (this.camera.parent && this.camera.parent._getWorldMatrixDeterminant() < 0) {
                offsetX *= -1;
            }
            this.camera.cameraRotation.y += offsetX / this.angularSensibility;
            var offsetY = evt.movementY || evt.mozMovementY || evt.webkitMovementY || evt.msMovementY || 0;
            this.camera.cameraRotation.x += offsetY / this.angularSensibility;
            this._previousPosition = null;
            if (!noPreventDefault) {
                evt.preventDefault();
            }
        };
        this.observer = this.camera.getScene().onPointerObservable.add(this.pointerInput, BABYLON.PointerEventTypes.POINTERDOWN |
            BABYLON.PointerEventTypes.POINTERUP |
            BABYLON.PointerEventTypes.POINTERMOVE);
        element.addEventListener("mousemove", this.onMouseMove, false);
        element.addEventListener("contextmenu", this.onContextMenu.bind(this), false);
    }
    /**
     * Called on JS contextmenu event.
     * Override this method to provide functionality.
     */
    onContextMenu(evt) {
        evt.preventDefault();
    }
    /**
     * Detach the current controls from the specified dom element.
     * @param element Defines the element to stop listening the inputs from
     */
    detachControl(element) {
        if (this.observer && element) {
            this.camera.getScene().onPointerObservable.remove(this.observer);
            if (this.onMouseMove) {
                element.removeEventListener("mousemove", this.onMouseMove);
            }
            if (this.onContextMenu) {
                element.removeEventListener("contextmenu", this.onContextMenu);
            }
            if (this.onPointerMovedObservable) {
                this.onPointerMovedObservable.clear();
            }
            this.observer = null;
            this.onMouseMove = null;
            this._previousPosition = null;
        }
    }
    /**
     * Gets the class name of the current intput.
     * @returns the class name
     */
    getClassName() {
        return "FreeCameraMouseInput";
    }
    /**
     * Get the friendly name associated with the input class.
     * @returns the input friendly name
     */
    getSimpleName() {
        return "mouse";
    }
}
class HexCamera extends BABYLON.Camera {
    constructor(name, position, scene) {
        super(name, position, scene, true);
        this.zoom = 1.0;
        this.stickMinZoom = -250.0;
        this.stickMaxZoom = -45.0;
        this._viewMatrix = BABYLON.Matrix.Identity();
        this.swivel = new BABYLON.TransformNode("hex_camera_swivel", scene);
        this.swivel.rotate(new BABYLON.Vector3(1, 0, 0), Math.PI / 4);
        this.swivel.position = position.clone();
        this.stick = new BABYLON.TransformNode("hex_camera_stick", scene);
        this.stick.setParent(this.swivel);
        this.stick.rotate(new BABYLON.Vector3(0, 0, 1), -Math.PI / 4);
        this.inputs = new HexCameraInputsManager(this);
        this.inputs.addMouseWheel();
        this.parent = this.stick;
    }
    // /** @hid
    //  * Observable for when a pointer move event occurs containing the move offset
    //  */
    // public onPointerMovedObservable = new BABYLON.Observable<{ offsetX: number, offsetY: number }>();
    // /**
    //  * @hidden
    //  * If the camera should be rotated automatically based on pointer movement
    //  */
    // public _allowCameraRotation = true;
    // public _
    //  * Observable for when a pointer move event occurs containing the move offset
    //  */
    // public onPointerMovedObservable = new BABYLON.Observable<{ offsetX: number, offsetY: number }>();
    // /**
    //  * @hidden
    //  * If the camera should be rotated automatically based on pointer movement
    //  */
    // public _allowCameraRotation = true;rix {
    //     // i
    //  * Observable for when a pointer move event occurs containing the move offset
    //  */
    // public onPointerMovedObservable = new BABYLON.Observable<{ offsetX: number, offsetY: number }>();
    // /**
    //  * @hidden
    //  * If the camera should be rotated automatically based on pointer movement
    //  */
    // public _allowCameraRotation = true;
    //     //  
    //  * Observable for when a pointer move event occurs containing the move offset
    //  */
    // public onPointerMovedObservable = new BABYLON.Observable<{ offsetX: number, offsetY: number }>();
    // /**
    //  * @hidden
    //  * If the camera should be rotated automatically based on pointer movement
    //  */
    // public _allowCameraRotation = true;ockedTargetPosition()!);
    //     // }
    //  * Observable for when a pointer move event occurs containing the move offset
    //  */
    // public onPointerMovedObservable = new BABYLON.Observable<{ offsetX: number, offsetY: number }>();
    // /**
    //  * @hidden
    //  * If the camera should be rotated automatically based on pointer movement
    //  */
    // public _allowCameraRotation = true;
    //     // Compute
    //     this._updateCameraRotationMatrix();
    //     // Apply the changed rotation to the upVector
    //     // if (this.rotationQuaternion && this._cachedQuaternionRotationZ != this.rotationQuaternion.z) {
    //     //     this._rotateUpVectorWithCameraRotationMatrix();
    //     //     this._cachedQuaternionRotationZ = this.rotationQuaternion.z;
    //     // } else if (this._cachedRotationZ != this.rotation.z) {
    //     //     this._rotateUpVectorWithCameraRotationMatrix();
    //     //     this._cachedRotationZ = this.rotation.z;
    //     // }
    //     BABYLON.Vector3.TransformCoordinatesToRef(this._referencePoint, this._cameraRotationMatrix, this._transformedReferencePoint);
    //     // Computing target and final matrix
    //     this.position.addToRef(this._transformedReferencePoint, this._currentTarget);
    //     if (this.updateUpVectorFromRotation) {
    //         // if (this.rotationQuaternion) {
    //         //     BABYLON.Axis.Y.rotateByQuaternionToRef(this.rotationQuaternion, this.upVector);
    //         // } else {
    //         //     BABYLON.Quaternion.FromEulerVectorToRef(this.rotation, this._tmpQuaternion);
    //         //     BABYLON.Axis.Y.rotateByQuaternionToRef(this._tmpQuaternion, this.upVector);
    //         // }
    //     }
    //     this._computeViewMatrix(this.position, this._currentTarget, this.upVector);
    //     return this._viewMatrix;
    // }
    // protected _computeViewMatrix(position: BABYLON.Vector3, target: BABYLON.Vector3, up: BABYLON.Vector3): void {
    //     if (this.parent) {
    //         const parentWorldMatrix = this.parent.getWorldMatrix();
    //         BABYLON.Vector3.TransformCoordinatesToRef(position, parentWorldMatrix, this._globalPosition);
    //         BABYLON.Vector3.TransformCoordinatesToRef(target, parentWorldMatrix, this._globalCurrentTarget);
    //         BABYLON.Vector3.TransformNormalToRef(up, parentWorldMatrix, this._globalCurrentUpVector);
    //         this._markSyncedWithParent();
    //     } else {
    //         this._globalPosition.copyFrom(position);
    //         this._globalCurrentTarget.copyFrom(target);
    //         this._globalCurrentUpVector.copyFrom(up);
    //     }
    //     if (this.getScene().useRightHandedSystem) {
    //         BABYLON.Matrix.LookAtRHToRef(this._globalPosition, this._globalCurrentTarget, this._globalCurrentUpVector, this._viewMatrix);
    //     } else {
    //         BABYLON.Matrix.LookAtLHToRef(this._globalPosition, this._globalCurrentTarget, this._globalCurrentUpVector, this._viewMatrix);
    //     }
    // }
    refresh() {
        let distance = BABYLON.Scalar.Lerp(this.stickMinZoom, this.stickMaxZoom, this.zoom);
        this.stick.position = new BABYLON.Vector3(0.0, 0.0, distance);
        if (this.parent) {
            this.parent.getWorldMatrix().invertToRef(BABYLON.TmpVectors.Matrix[0]);
            BABYLON.Vector3.TransformNormalToRef(this.stick.position, BABYLON.TmpVectors.Matrix[0], BABYLON.TmpVectors.Vector3[0]);
            this.position.addInPlace(BABYLON.TmpVectors.Vector3[0]);
            console.log(this.position.toString());
            this.position.addInPlace(BABYLON.TmpVectors.Vector3[0]);
            // this.
            return;
        }
        this.position.addInPlace(this.stick.position);
        this.getViewMatrix();
    }
    attachControl(element, noPreventDefault, useCtrlForPanning = true, panningMouseButton = 2) {
        this.inputs.attachElement(element, noPreventDefault);
        this.refresh();
    }
    adjustZoom(delta) {
        this.zoom = BABYLON.Scalar.Clamp(this.zoom + delta, 0, 1);
        this.refresh();
    }
}
class HexCameraInputsManager extends BABYLON.CameraInputsManager {
    constructor(camera) {
        super(camera);
    }
    addMouseWheel() {
        this.add(new HexCameraMouseWheelInput());
        return this;
    }
}
class HexCameraMouseWheelInput {
    getClassName() {
        return "HexCameraMouseWheelInput";
    }
    getSimpleName() {
        return "mouseWheel";
    }
    attachControl(element, noPreventDefault) {
        this._wheel = (p, s) => {
            if (p.type !== BABYLON.PointerEventTypes.POINTERWHEEL) {
                return;
            }
            let event = p.event, delta = event.deltaY || event.detail;
            if (delta != 0.0) {
                this.camera.adjustZoom(delta / 40.0);
                // this.
                // console.log(delta, event);
                // // delta = BABYLON.Scalar.Clamp()
            }
            if (event.preventDefault) {
                if (!noPreventDefault) {
                    event.preventDefault();
                }
            }
        };
        this._observer = this.camera.getScene().onPointerObservable.add(this._wheel, BABYLON.PointerEventTypes.POINTERWHEEL);
    }
    detachControl(element) {
        if (this._observer && element) {
            this.camera.getScene().onPointerObservable.remove(this._observer);
            this._observer = null;
            this._wheel = null;
        }
    }
}
