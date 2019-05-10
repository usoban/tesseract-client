///<reference path="babylon.d.ts" />

class HexGridFreeCameraMouseInput extends BABYLON.FreeCameraMouseInput {
    // /**
    //  * Defines the camera the input is attached to.
    //  */
    // public camera: BABYLON.FreeCamera;

    // /**
    //  * Defines the buttons associated with the input to handle camera move.
    //  */
    // @BABYLON.serialize()
    // public buttons = [0, 1, 2];

    // /**
    //  * Defines the pointer angular sensibility  along the X and Y axis or how fast is the camera rotating.
    //  */
    // @BABYLON.serialize()
    // public angularSensibility = 2000.0;

    private pointerInput: (p: BABYLON.PointerInfo, s: BABYLON.EventState) => void;
    private onMouseMove: BABYLON.Nullable<(e: MouseEvent) => any>;
    private observer: BABYLON.Nullable<BABYLON.Observer<BABYLON.PointerInfo>>;
    private _previousPosition: BABYLON.Nullable<{ x: number, y: number }> = null;

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
    public attachControl(element: HTMLElement, noPreventDefault?: boolean): void {
        var engine = this.camera.getEngine();

        if (!this.pointerInput) {
            this.pointerInput = (p) => {
                var evt = <PointerEvent>p.event;

                if (engine.isInVRExclusivePointerMode) {
                    return;
                }

                if (!this.touchEnabled && evt.pointerType === "touch") {
                    return;
                }

                if (p.type !== BABYLON.PointerEventTypes.POINTERMOVE && this.buttons.indexOf(evt.button) === -1) {
                    return;
                }

                let srcElement = <HTMLElement>(evt.srcElement || evt.target);

                if (p.type === BABYLON.PointerEventTypes.POINTERDOWN && srcElement) {
                    if (evt.which != 3) {
                        return;
                    }

                    try {
                        srcElement.setPointerCapture(evt.pointerId);
                    } catch (e) {
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
                    } catch (e) {
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
                    if (this.camera.getScene().useRightHandedSystem) { offsetX *= -1; }
                    if (this.camera.parent && this.camera.parent._getWorldMatrixDeterminant() < 0) { offsetX *= -1; }

                    if (this._allowCameraRotation) {
                        this.camera.cameraRotation.y += offsetX / this.angularSensibility;
                        this.camera.cameraRotation.x += offsetY / this.angularSensibility;
                    }
                    this.onPointerMovedObservable.notifyObservers({offsetX: offsetX, offsetY: offsetY});

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
            if (this.camera.getScene().useRightHandedSystem) { offsetX *= -1; }
            if (this.camera.parent && this.camera.parent._getWorldMatrixDeterminant() < 0) { offsetX *= -1; }
            this.camera.cameraRotation.y += offsetX / this.angularSensibility;

            var offsetY = evt.movementY || evt.mozMovementY || evt.webkitMovementY || evt.msMovementY || 0;
            this.camera.cameraRotation.x += offsetY / this.angularSensibility;

            this._previousPosition = null;

            if (!noPreventDefault) {
                evt.preventDefault();
            }
        };

        this.observer = this.camera.getScene().onPointerObservable.add(
            this.pointerInput, BABYLON.PointerEventTypes.POINTERDOWN | 
            BABYLON.PointerEventTypes.POINTERUP | 
            BABYLON.PointerEventTypes.POINTERMOVE
        );

        element.addEventListener("mousemove", this.onMouseMove, false);

        element.addEventListener("contextmenu",
            <EventListener>this.onContextMenu.bind(this), false);
    }

    /**
     * Called on JS contextmenu event.
     * Override this method to provide functionality.
     */
    protected onContextMenu(evt: PointerEvent): void {
        evt.preventDefault();
    }

    /**
     * Detach the current controls from the specified dom element.
     * @param element Defines the element to stop listening the inputs from
     */
    public detachControl(element: BABYLON.Nullable<HTMLElement>): void {
        if (this.observer && element) {
            this.camera.getScene().onPointerObservable.remove(this.observer);

            if (this.onMouseMove) {
                element.removeEventListener("mousemove", this.onMouseMove);
            }

            if (this.onContextMenu) {
                element.removeEventListener("contextmenu", <EventListener>this.onContextMenu);
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
    public getClassName(): string {
        return "FreeCameraMouseInput";
    }

    /**
     * Get the friendly name associated with the input class.
     * @returns the input friendly name
     */
    public getSimpleName(): string {
        return "mouse";
    }
}

class HexCamera extends BABYLON.Camera {

    public inputs: HexCameraInputsManager;

    private swivel: BABYLON.TransformNode;

    private stick: BABYLON.TransformNode;

    private zoom: number = 1.0;

    public stickMinZoom: number = -250.0;
    public stickMaxZoom: number = -45.0;

    private _viewMatrix: BABYLON.Matrix = BABYLON.Matrix.Identity();

    constructor(name: string, position: BABYLON.Vector3, scene: BABYLON.Scene) {
        super(name, position, scene, true);

        this.swivel = new BABYLON.TransformNode("hex_camera_swivel", scene);
        this.swivel.rotate(new BABYLON.Vector3(1, 0, 0), Math.PI/4);
        this.swivel.position = position.clone();

        this.stick = new BABYLON.TransformNode("hex_camera_stick", scene);
        this.stick.setParent(this.swivel);
        this.stick.rotate(new BABYLON.Vector3(0, 0, 1), -Math.PI/4);

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

    private refresh() {
        let distance = BABYLON.Scalar.Lerp(this.stickMinZoom, this.stickMaxZoom, this.zoom);
        
        this.stick.position = new BABYLON.Vector3(0.0, 0.0, distance);

        if (this.parent) {
            this.parent.getWorldMatrix().invertToRef(BABYLON.Tmp.Matrix[0]);

            BABYLON.Vector3.TransformNormalToRef(
                this.stick.position, 
                BABYLON.Tmp.Matrix[0], 
                BABYLON.Tmp.Vector3[0]
            );

            this.position.addInPlace(BABYLON.Tmp.Vector3[0]);
            console.log(this.position.toString());

            this.position.addInPlace(BABYLON.Tmp.Vector3[0]);
            // this.
            return;
        }

        this.position.addInPlace(this.stick.position);
        this.getViewMatrix();
    }

    attachControl(element: HTMLElement, noPreventDefault?: boolean, useCtrlForPanning: boolean = true, panningMouseButton: number = 2): void {
        this.inputs.attachElement(element, noPreventDefault);
        this.refresh();
    }

    adjustZoom(delta: number) {
        this.zoom = BABYLON.Scalar.Clamp(this.zoom + delta, 0, 1);
        this.refresh();
    }
}

class HexCameraInputsManager extends BABYLON.CameraInputsManager<HexCamera> {
    constructor(camera: HexCamera) {
        super(camera);
    }

    public addMouseWheel(): HexCameraInputsManager {
        this.add(new HexCameraMouseWheelInput());
        return this;
    }
}

class HexCameraMouseWheelInput implements BABYLON.ICameraInput<HexCamera> {
    camera: HexCamera;
    
    private _wheel: BABYLON.Nullable<(p: BABYLON.PointerInfo, s: BABYLON.EventState) => void>;

    private _observer: BABYLON.Nullable<BABYLON.Observer<BABYLON.PointerInfo>>;

    getClassName(): string {
        return "HexCameraMouseWheelInput";
    }

    getSimpleName(): string {
        return "mouseWheel";
    }

    attachControl(element: HTMLElement, noPreventDefault?: boolean): void {
        this._wheel = (p: BABYLON.PointerInfo, s: BABYLON.EventState) => {
            if (p.type !== BABYLON.PointerEventTypes.POINTERWHEEL) {
                return;
            }

            let 
                event = <MouseWheelEvent>p.event,
                delta = event.deltaY || event.detail;

            if (delta != 0.0) {
                this.camera.adjustZoom(delta/40.0);
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

    detachControl(element: HTMLElement): void {
        if (this._observer && element) {
            this.camera.getScene().onPointerObservable.remove(this._observer);
            this._observer = null;
            this._wheel = null;
        }
    }

    checkInputs?: () => void;
}