///<reference path="babylon.d.ts" />

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

    // /** @hidden */
    // public _getViewMatrix(): BABYLON.Matrix {
    //     // if (this.lockedTarget) {
    //     //     this.setTarget(this._getLockedTargetPosition()!);
    //     // }

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