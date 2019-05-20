///<reference path="babylon.d.ts" />
///<reference path="babylon.gui.d.ts" />
///<reference path="babylonjs.materials.module.d.ts" />

type Nullable<T> = T | null;

class ArrayBufferUtil {
    public static transfer(source: ArrayBuffer, length: number): ArrayBuffer {
        if (!(source instanceof ArrayBuffer)) {
            throw new TypeError('Source must be an instance of ArrayBuffer');
        }

        if (length <= source.byteLength) {
            return source.slice(0, length);
        }

        let 
            sourceView = new Uint8Array(source),
            destView = new Uint8Array(new ArrayBuffer(length));
        
        destView.set(sourceView);

        return destView.buffer;
    }
}

class ByteBuffer {
    private static INT8 = 1;
    private static UINT8 = 1;
    private static INT16 = 2;
    private static UINT16 = 2;
    private static INT32 = 4;
    private static UINT32 = 4;
    private static FLOAT32 = 4;
    private static FLOAT64 = 8;

    private _buffer: DataView;
    private _offset: number;

    constructor(size: number = 128) {
        this._buffer = new DataView(new ArrayBuffer(size));
        this._offset = 0;
    }

    readBoolean(): boolean {
        return this.readInt8() > 0 ? true : false;
    }

    readInt8(): number {
        let b = this._buffer.getInt8(this._offset);
        this._offset += ByteBuffer.INT8;

        return b;
    }

    readUint8(): number {
        let b = this._buffer.getUint8(this._offset);
        this._offset += ByteBuffer.UINT8;

        return b;
    }

    readInt16(): number {
        let b = this._buffer.getInt16(this._offset);
        this._offset += ByteBuffer.INT16;

        return b;
    }

    readUint16(): number {
        let b = this._buffer.getUint16(this._offset);
        this._offset += ByteBuffer.UINT16;

        return b;
    }

    readInt32(): number {
        let b = this._buffer.getInt32(this._offset);
        this._offset += ByteBuffer.INT32;

        return b;
    }

    readUint32(): number {
        let b = this._buffer.getUint32(this._offset);
        this._offset += ByteBuffer.UINT32;

        return b;
    }

    readFloat32(): number {
        let b = this._buffer.getFloat32(this._offset);
        this._offset += ByteBuffer.FLOAT32;

        return b;
    }

    readFloat64(): number {
        let b = this._buffer.getFloat64(this._offset);
        this._offset += ByteBuffer.FLOAT64;

        return b;
    }

    private assureFreeSpace(nBytes: number): void {
        // Buffer has enough space for nBytes?
        if (this._offset + nBytes <= this._buffer.byteLength) {
            return;
        }

        // If not, double the buffer size.
        this._buffer = new DataView(
            ArrayBufferUtil.transfer(this._buffer.buffer, this._buffer.byteLength * 2)
        );
    }

    writeBoolean(data: boolean): void {
        this.writeInt8(data ? 1 : 0);
    }

    writeInt8(data: number): void {
        this.assureFreeSpace(ByteBuffer.INT8);
        this._buffer.setInt8(this._offset, data);
        this._offset += ByteBuffer.INT8;
    }

    writeUint8(data: number): void {
        this.assureFreeSpace(ByteBuffer.UINT8);
        this._buffer.setUint8(this._offset, data);
        this._offset += ByteBuffer.UINT8;
    }

    writeInt16(data: number): void {
        this.assureFreeSpace(ByteBuffer.INT16);
        this._buffer.setInt16(this._offset, data);
        this._offset += ByteBuffer.INT16;
    }

    writeUint16(data: number): void {
        this.assureFreeSpace(ByteBuffer.UINT16);
        this._buffer.setUint16(this._offset, data);
        this._offset += ByteBuffer.UINT16;
    }

    writeInt32(data: number): void {
        this.assureFreeSpace(ByteBuffer.INT32);
        this._buffer.setInt32(this._offset, data);
        this._offset += ByteBuffer.INT32;
    }

    writeUint32(data: number): void {
        this.assureFreeSpace(ByteBuffer.UINT32);
        this._buffer.setUint32(this._offset, data);
        this._offset += ByteBuffer.UINT32;
    }

    writeFloat32(data: number): void {
        this.assureFreeSpace(ByteBuffer.FLOAT32);
        this._buffer.setFloat32(this._offset, data);
        this._offset += ByteBuffer.FLOAT32;
    }

    writeFloat64(data: number): void {
        this.assureFreeSpace(ByteBuffer.FLOAT64);
        this._buffer.setFloat64(this._offset, data);
        this._offset += ByteBuffer.FLOAT64;
    }

    reset(): void {
        this._offset = 0;
    }

    get buffer(): DataView {
        return this._buffer;
    }

    get offset(): number {
        return this._offset;
    }

    set buffer(buffer: DataView) {
        this._buffer = buffer;
        this.reset();
    }

    public static make(buffer: DataView) {
        let byteBuffer = new ByteBuffer();
        byteBuffer.buffer = buffer;

        return byteBuffer;
    }
}

class Filesys {
    private static objectUrl;

    public static write(data): string {
        data = new Blob([data], {type: "application/octet-stream"});

        if (Filesys.objectUrl) {
            window.URL.revokeObjectURL(Filesys.objectUrl);
        }

        Filesys.objectUrl = window.URL.createObjectURL(data);

        return Filesys.objectUrl;
    }

    public static resizeArrayBuffer(buffer: ArrayBuffer) {
        return ArrayBufferUtil.transfer(buffer, buffer.byteLength*2);
    }
}

class HexCellColor {
    public static BLACK = BABYLON.Color4.FromHexString("#000000ff");
    public static WHITE = BABYLON.Color4.FromHexString("#ffffffff");
    public static PASTEL_BLUE = BABYLON.Color4.FromHexString("#1338d6ff");
    public static PASTEL_YELLOW = BABYLON.Color4.FromHexString("#ffdc00ff");
    public static PASTEL_GREEN = BABYLON.Color4.FromHexString("#01ae08ff");
    public static PASTEL_ORANGE = BABYLON.Color4.FromHexString("#ff4e1bff");
    public static colors: Map<string, BABYLON.Color4>;

    public static initialize() {
        HexCellColor.colors = new Map<string, BABYLON.Color4>();

        HexCellColor.colors.set("Yellow", HexCellColor.PASTEL_YELLOW);
        HexCellColor.colors.set("Green", HexCellColor.PASTEL_GREEN);
        HexCellColor.colors.set("Blue", HexCellColor.PASTEL_BLUE);
        HexCellColor.colors.set("Orange", HexCellColor.PASTEL_ORANGE);
        HexCellColor.colors.set("White", HexCellColor.WHITE);
    }

    public static getAllColors(): BABYLON.Color4[] {
        let colors = [];

        HexCellColor.colors.forEach(c => colors.push(c));

        return colors;
    }

    public static average(colors: Array<BABYLON.Color4>): BABYLON.Color4 {
        let avgColor = new BABYLON.Color4(0, 0, 0, 0);

        for (let i = 0; i < colors.length; i++) {
            avgColor.addInPlace(colors[i]);
        }

        avgColor.r = avgColor.r / colors.length;
        avgColor.g = avgColor.g / colors.length;
        avgColor.b = avgColor.b / colors.length;

        return avgColor;
    }
}
HexCellColor.initialize();

class HexMetrics {
    public static outerToInner = 0.866025404;
    public static innerToOuter = 1.0 / HexMetrics.outerToInner;
    public static outerRadius: number = 10.0;
    public static innerRadius: number = HexMetrics.outerRadius * HexMetrics.outerToInner;
    public static solidFactor: number = 0.8;
    public static blendFactor: number = 1.0 - HexMetrics.solidFactor;
    public static elevationStep: number = 3.0;
    public static terracesPerSlope: number = 2;
    public static terraceSteps = HexMetrics.terracesPerSlope * 2 + 1;
    public static horizontalTerraceStepSize = (1.0 / HexMetrics.terraceSteps);
    public static verticalTerraceStepSize = (1.0 / (HexMetrics.terracesPerSlope + 1));
    public static noiseTexture: Texture;
    public static noiseScale = 0.7;
    public static cellPerturbStrength = 4.0;
    public static elevationPerturbStrength = 1.5;
    public static chunkSizeX = 5;
    public static chunkSizeZ = 5;
    public static streamBedElevationOffset = -1.75;
    public static waterElevationOffset = -0.5;
    public static waterFlowAnimationSpeedCoefficient = 180.0;
    public static waterFactor = 0.6;
    public static waterBlendFactor = 1.0 - HexMetrics.waterFactor;
    public static hashGridSize: number = 256;
    public static hashGridScale: number = 0.25;
    public static hashGrid: HexHash[];
    public static featureThresholds = [
        [0.0, 0.0, 0.4],
        [0.0, 0.4, 0.6],
        [0.4, 0.6, 0.8]
    ];
    public static wallHeight: number = 4.0;
    public static wallThickness: number = 0.75;
    public static wallElevationOffset: number = HexMetrics.verticalTerraceStepSize;
    public static wallTowerThreshold: number = 0.5;
    public static wallYOffset: number = -1.0;
    public static bridgeDesignLength = 7.0;

    private static corners: Array<BABYLON.Vector3> = [
        new BABYLON.Vector3(0.0, 0.0, HexMetrics.outerRadius),
        new BABYLON.Vector3(HexMetrics.innerRadius, 0.0, 0.5 * HexMetrics.outerRadius),
        new BABYLON.Vector3(HexMetrics.innerRadius, 0.0, -0.5 * HexMetrics.outerRadius),
        new BABYLON.Vector3(0.0, 0.0, -HexMetrics.outerRadius),
        new BABYLON.Vector3(-HexMetrics.innerRadius, 0.0, -0.5 * HexMetrics.outerRadius),
        new BABYLON.Vector3(-HexMetrics.innerRadius, 0.0, 0.5 * HexMetrics.outerRadius),
        new BABYLON.Vector3(0.0, 0.0, HexMetrics.outerRadius)
    ];

    public static colors: BABYLON.Color4[] = HexCellColor.getAllColors();

    public static getFirstCorner(direction: HexDirection): BABYLON.Vector3 {
        return HexMetrics.corners[direction];
    }

    public static getSecondCorner(direction: HexDirection): BABYLON.Vector3 {
        return HexMetrics.corners[direction + 1];
    }

    public static getFirstSolidCorner(direction: HexDirection): BABYLON.Vector3 {
        return HexMetrics.corners[direction].scale(HexMetrics.solidFactor);
    }

    public static getSecondSolidCorner(direction: HexDirection): BABYLON.Vector3 {
        return HexMetrics.corners[direction + 1].scale(HexMetrics.solidFactor);
    }

    public static getSolidEdgeMiddle(direction: HexDirection): BABYLON.Vector3 {
        return (
            HexMetrics.corners[direction]
            .add(HexMetrics.corners[direction + 1])
            .scale(0.5 * HexMetrics.solidFactor)
        );
    }

    public static getBridge(direction: HexDirection): BABYLON.Vector3 {
        return this.corners[direction].add(this.corners[direction + 1]).scale(HexMetrics.blendFactor);
    }

    public static terraceLerp(a: BABYLON.Vector3, b: BABYLON.Vector3, step: number) {
        const 
            h = step * HexMetrics.horizontalTerraceStepSize,
            v = ~~((step + 1)/2.0) * HexMetrics.verticalTerraceStepSize,
            t = a.clone();

        t.x += (b.x - a.x) * h;
        t.z += (b.z - a.z) * h;
        t.y += (b.y - a.y) * v;

        return t;
    }

    public static terraceColorLerp(a: BABYLON.Color4, b: BABYLON.Color4, step: number) {
        const h = step * HexMetrics.horizontalTerraceStepSize;

        return BABYLON.Color4.Lerp(a, b, h);
    }

    public static getEdgeType(elevation1: number, elevation2: number): HexEdgeType {
        if (elevation1 === elevation2) {
            return HexEdgeType.Flat;
        }

        const delta = elevation2 - elevation1;

        if (delta == 1 || delta == -1) {
            return HexEdgeType.Slope;
        }

        return HexEdgeType.Cliff;
    }

    public static sampleNoise(position: BABYLON.Vector3): BABYLON.Vector4 {
        return Texture.sample(HexMetrics.noiseTexture, position);
    }

    public static sampleHashGrid(position: BABYLON.Vector3): HexHash {
        let 
            x = ~~(position.x * HexMetrics.hashGridScale) % HexMetrics.hashGridSize,
            z = ~~(position.z * HexMetrics.hashGridScale) % HexMetrics.hashGridSize;

        x = x < 0 ? x + HexMetrics.hashGridSize : x;
        z = z < 0 ? z + HexMetrics.hashGridSize : z;

        return HexMetrics.hashGrid[x + z * HexMetrics.hashGridSize];
    }

    public static perturb(position: BABYLON.Vector3): BABYLON.Vector3 {
        let sample = HexMetrics.sampleNoise(position);

        return new BABYLON.Vector3(
            position.x + (sample.x * 2.0 - 1.0) * HexMetrics.cellPerturbStrength,
            position.y,
            position.z + (sample.z * 2.0 - 1.0) * HexMetrics.cellPerturbStrength
        );
    }

    public static getRoadInterpolators(direction: HexDirection, cell: HexCell): BABYLON.Vector2 {
        let interpolators = new BABYLON.Vector2();

        if (cell.hasRoadThroughEdge(direction)) {
            interpolators.x = interpolators.y = 0.5;
        }
        else {
            interpolators.x = cell.hasRoadThroughEdge(HexDirection.previous(direction)) ? 0.5 : 0.25;
            interpolators.y = cell.hasRoadThroughEdge(HexDirection.next(direction)) ? 0.5 : 0.25;
        }

        return interpolators;
    }

    public static getFirstWaterCorner(direction: HexDirection): BABYLON.Vector3 {
        return HexMetrics.corners[direction].scale(HexMetrics.waterFactor);
    }

    public static getSecondWaterCorner(direction: HexDirection): BABYLON.Vector3 {
        return HexMetrics.corners[direction + 1].scale(HexMetrics.waterFactor);
    }

    public static getWaterBridge(direction: HexDirection): BABYLON.Vector3 {
        return HexMetrics.corners[direction].add(HexMetrics.corners[direction + 1]).scale(HexMetrics.waterBlendFactor);
    }

    public static initializeHashGrid(seed: number): void {
        HexMetrics.hashGrid = new Array<HexHash>(HexMetrics.hashGridSize * HexMetrics.hashGridSize);
        let rng = new (<any>Math).seedrandom(seed);
        for (let i = 0; i < HexMetrics.hashGrid.length; i++) {
            HexMetrics.hashGrid[i] = HexHash.create(rng);
        }
    }

    public static getFeatureThreshold(level: number): number[] {
        return HexMetrics.featureThresholds[level];
    }

    public static wallThicknessOffset(near: BABYLON.Vector3, far: BABYLON.Vector3): BABYLON.Vector3 {
        let offset = new BABYLON.Vector3();

        offset.x = far.x - near.x;
        offset.y = 0;
        offset.z = far.z - near.z;

        return offset.normalize().scale(HexMetrics.wallThickness * 0.5);
    }

    public static wallLerp(near: BABYLON.Vector3, far: BABYLON.Vector3): BABYLON.Vector3 {
        near = near.clone();

        near.x += (far.x - near.x) * 0.5;
        near.z += (far.z - near.z) * 0.5;

        let v = (near.y < far.y 
            ? HexMetrics.wallElevationOffset
            : (1.0 - HexMetrics.wallElevationOffset)
        );

        near.y += (far.y - near.y) * v + HexMetrics.wallYOffset;

        return near;
    }
}

class Texture {
    public data: Float32Array;
    public width: number;
    public height: number;

    constructor(data: Float32Array, width: number, height: number) {
        this.data = data;
        this.width = width;
        this.height = height;
    }

    public static sample(texture: Texture, position: BABYLON.Vector3): BABYLON.Vector4 {
        const
            x = Math.abs(Math.floor(position.x * HexMetrics.noiseScale)),
            z = Math.abs(Math.floor(position.z * HexMetrics.noiseScale)), 
            startOffset = 4 * (z * texture.width + x);

        return new BABYLON.Vector4(
            texture.data[startOffset],
            texture.data[startOffset+1],
            texture.data[startOffset+2],
            texture.data[startOffset+3]
        );
    }

    // http://strauss.pas.nu/js-bilinear-interpolation.html
    private static ivect(ix: number, iy: number, w: number) {
        // byte array, r,g,b,a
        return((ix + w * iy) * 4);
    }
    
    public static bilinearFiltered(srcImg: Texture, destImg: Texture, scale) {
        // c.f.: wikipedia english article on bilinear interpolation
        // taking the unit square, the inner loop looks like this
        // note: there's a function call inside the double loop to this one
        // maybe a performance killer, optimize this whole code as you need
        function inner(f00, f10, f01, f11, x, y) {
            var un_x = 1.0 - x; var un_y = 1.0 - y;
            return (f00 * un_x * un_y + f10 * x * un_y + f01 * un_x * y + f11 * x * y);
        }

        var i, j;
        var iyv, iy0, iy1, ixv, ix0, ix1;
        var idxD, idxS00, idxS10, idxS01, idxS11;
        var dx, dy;
        var r, g, b, a;
        for (i = 0; i < destImg.height; ++i) {
            iyv = i / scale;
            iy0 = Math.floor(iyv);
            // Math.ceil can go over bounds
            iy1 = ( Math.ceil(iyv) > (srcImg.height-1) ? (srcImg.height-1) : Math.ceil(iyv) );
            for (j = 0; j < destImg.width; ++j) {
                ixv = j / scale;
                ix0 = Math.floor(ixv);
                // Math.ceil can go over bounds
                ix1 = ( Math.ceil(ixv) > (srcImg.width-1) ? (srcImg.width-1) : Math.ceil(ixv) );
                idxD = Texture.ivect(j, i, destImg.width);
                // matrix to vector indices
                idxS00 = Texture.ivect(ix0, iy0, srcImg.width);
                idxS10 = Texture.ivect(ix1, iy0, srcImg.width);
                idxS01 = Texture.ivect(ix0, iy1, srcImg.width);
                idxS11 = Texture.ivect(ix1, iy1, srcImg.width);
                // overall coordinates to unit square
                dx = ixv - ix0; dy = iyv - iy0;
                // I let the r, g, b, a on purpose for debugging
                r = inner(srcImg.data[idxS00], srcImg.data[idxS10],
                    srcImg.data[idxS01], srcImg.data[idxS11], dx, dy);
                destImg.data[idxD] = r;

                g = inner(srcImg.data[idxS00+1], srcImg.data[idxS10+1],
                    srcImg.data[idxS01+1], srcImg.data[idxS11+1], dx, dy);
                destImg.data[idxD+1] = g;

                b = inner(srcImg.data[idxS00+2], srcImg.data[idxS10+2],
                    srcImg.data[idxS01+2], srcImg.data[idxS11+2], dx, dy);
                destImg.data[idxD+2] = b;

                a = inner(srcImg.data[idxS00+3], srcImg.data[idxS10+3],
                    srcImg.data[idxS01+3], srcImg.data[idxS11+3], dx, dy);
                destImg.data[idxD+3] = a;
            }
        }
    }
}

enum HexDirection {
    NE, E, SE, SW, W, NW
}

namespace HexDirection {
    export function opposite(direction: HexDirection): HexDirection {
        return direction < 3 ? (direction + 3) : (direction - 3);
    }

    export function previous(direction: HexDirection): HexDirection {
        return direction === HexDirection.NE ? HexDirection.NW : (direction - 1);
    }

    export function previous2(direction: HexDirection): HexDirection {
        direction -= 2;
        return direction >=  HexDirection.NE ? direction : (direction + 6);
    }

    export function next(direction: HexDirection): HexDirection {
        return direction === HexDirection.NW ? HexDirection.NE : (direction + 1);
    }

    export function next2(direction: HexDirection): HexDirection {
        direction += 2;
        return direction <= HexDirection.NW ? direction : (direction - 6);
    }
}

enum HexEdgeType {
    Flat, Slope, Cliff
}

class HexCoordinates {
    public x: number;
    public z: number;
    private _y: number;

    constructor(x: number, z: number) {
        this.x = x;
        this.z = z;
    }

    get y(): number {
        return -this.x - this.z;
    }

    public static fromOffsetCoordinates(x: number, z: number): HexCoordinates {
        return new HexCoordinates(x - Math.floor(z/2.0), z);
    }

    public static fromPosition(position: BABYLON.Vector3): HexCoordinates {
        let x = position.x / (HexMetrics.innerRadius * 2.0),
            y = -x,
            offset = position.z / (HexMetrics.outerRadius * 3.0);

        x -= offset;
        y -= offset;

        let ix = Math.round(x),
            iy = Math.round(y),
            iz = Math.round(-x - y);

        if (ix + iy + iz != 0) {
            let dx = Math.abs(x - ix),
                dy = Math.abs(y - iy),
                dz = Math.abs(-x - y - iz);

            if (dx > dy && dx > dz) {
                ix = -iy - iz;
            } else if (dz > dy) {
                iz = -ix - iy;
            }
        }

        return new HexCoordinates(ix, iz);
    }

    public toString() {
        return `(${this.x}, ${this.y}, ${this.z})`;
    }
}

class HexHash {
    public a: number;
    public b: number;
    public c: number;
    public d: number;
    public e: number;

    public static create(randomFn): HexHash {
        let hexHash = new HexHash();

        hexHash.a = randomFn() * .999;
        hexHash.b = randomFn() * .999;
        hexHash.c = randomFn() * .999;
        hexHash.d = randomFn() * .999;
        hexHash.e = randomFn() * .999;

        return hexHash;
    }
}

class Prefabs {
    private static _terrainMaterial: BABYLON.PBRMaterial;
    private static _riverMaterial: BABYLON.PBRCustomMaterial;
    private static _roadMaterial: BABYLON.PBRCustomMaterial;
    private static _waterMaterial: BABYLON.PBRCustomMaterial;
    private static _waterShoreMaterial: BABYLON.PBRCustomMaterial;
    private static _estuariesMaterial: BABYLON.PBRCustomMaterial;
    private static _urbanFeatureMaterial: BABYLON.StandardMaterial;
    private static _farmFeatureMaterial: BABYLON.StandardMaterial;
    private static _plantFeatureMaterial: BABYLON.StandardMaterial;
    private static _wallsMaterial: BABYLON.PBRMaterial;
    private static _towerMaterial: BABYLON.PBRMaterial;
    private static _bridgeMaterial: BABYLON.PBRMaterial;

    private static _foamShaderFn = `
        float Foam(float shore, vec2 worldXZ, sampler2D noiseTex, float t) {
            shore = sqrt(shore) * 0.9;

            vec2 noiseUV = worldXZ + t * 0.25;
            vec4 noise = texture2D(noiseTex, noiseUV * 0.015);

            float distortion1 = noise.x * (1.0 - shore);
            float foam1 = sin((shore + distortion1) * 10.0 - t);
            foam1 *= foam1;

            float distortion2 = noise.y * (1.0 - shore);
            float foam2 = sin((shore + distortion2) * 10.0 + t + 2.0);
            foam2 *= foam2 * 0.7;

            return max(foam1, foam2) * shore;
        }
    `;

    private static _wavesShaderFn = `
        float Waves(vec2 worldXZ, sampler2D noiseTex, float t) {
            vec2 uv1 = worldXZ;
            uv1.y += t;
            vec4 noise1 = texture2D(noiseTex, uv1 * 0.025);

            vec2 uv2 = worldXZ;
            uv2.x += t;
            vec4 noise2 = texture2D(noiseTex, uv2 * 0.025);

            float blendWave = sin(
                (worldXZ.x + worldXZ.y) * 0.1 +
                (noise1.y + noise2.z) + t
            );

            blendWave *= blendWave;

            float waves = 
                mix(noise1.z, noise1.w, blendWave) +
                mix(noise2.x, noise2.y, blendWave);

            return smoothstep(0.75, 2.0, waves);
        }
    `;

    private static _riverShaderFn = `
        float River(vec2 riverUV, sampler2D noiseTex, float t) {
            vec2 uv = riverUV;
            vec2 uv2 = riverUV;

            uv.x = uv.x * 0.0625 + t * 0.005;
            uv.y -= t * 0.25;

            uv2.x = uv2.x * 0.0625 - t * 0.0052;
            uv2.y -= t * 0.23;
            
            vec4 noise = texture2D(noiseTex, uv);
            vec4 noise2 = texture2D(noiseTex, uv2);

            return noise.x * noise2.w;
        }
    `;

    private static terrainMaterial(scene: BABYLON.Scene) {
        if (!Prefabs._terrainMaterial) {
            Prefabs._terrainMaterial = new BABYLON.PBRMaterial("pbr_mat", scene);
            Prefabs._terrainMaterial.sideOrientation = BABYLON.Orientation.CW; // NOTE: if CCW, backfaceCulling must be turned on!!
            Prefabs._terrainMaterial.emissiveColor = BABYLON.Color3.Black();
            Prefabs._terrainMaterial.albedoColor = BABYLON.Color3.White();
            Prefabs._terrainMaterial.metallic = 0;
        }

        return Prefabs._terrainMaterial;
    }

    private static riverMaterial(scene: BABYLON.Scene) {
        if (!Prefabs._riverMaterial) {
            Prefabs._riverMaterial = new BABYLON.PBRCustomMaterial("river_material", scene);
            Prefabs._riverMaterial.sideOrientation = BABYLON.Orientation.CW; // NOTE: if CCW, backfaceCulling must be turned on!!
            Prefabs._riverMaterial.emissiveColor = BABYLON.Color3.FromHexString("#68AEEB");
            Prefabs._riverMaterial.albedoColor = BABYLON.Color3.FromHexString("#ffffff");
            Prefabs._riverMaterial.metallic = 0;
            Prefabs._riverMaterial.roughness = 0.5;
            Prefabs._riverMaterial.alpha = 0;
            Prefabs._riverMaterial.alphaMode = BABYLON.Engine.ALPHA_COMBINE;
            Prefabs._riverMaterial.transparencyMode = 2; 

            Prefabs._riverMaterial.albedoTexture = new BABYLON.Texture(
                './assets/gfx/material/noise.png',
                scene,
                true,
                false,
                BABYLON.Texture.BILINEAR_SAMPLINGMODE
            );
            Prefabs._riverMaterial.albedoTexture.hasAlpha = true;

            let t = 0;
            Prefabs._riverMaterial.AddUniform("time", "vec3", null);
            Prefabs._riverMaterial.onBindObservable.add(() => {
                if (Prefabs._riverMaterial && Prefabs._riverMaterial.getEffect && Prefabs._riverMaterial.getEffect()) {
                    t++;

                    Prefabs._riverMaterial.getEffect().setVector3(
                        "time", 
                        new BABYLON.Vector3(1.0, t/HexMetrics.waterFlowAnimationSpeedCoefficient, 1.0)
                    );
                }
            });

            Prefabs._riverMaterial.Fragment_Definitions(`${Prefabs._riverShaderFn}`);
            
            Prefabs._riverMaterial.Fragment_Custom_Albedo(`
                float river = River(vAlbedoUV, albedoSampler, time.y);
                vec4 c = clamp(vAlbedoColor + river, 0.0, 1.0);

                surfaceAlbedo.rgb = c.rgb;
                alpha = c.a;
            `);
        }
        
        return Prefabs._riverMaterial;
    }

    private static roadMaterial(scene: BABYLON.Scene) {
        if (!Prefabs._roadMaterial) {
            Prefabs._roadMaterial = new BABYLON.PBRCustomMaterial("road_material", scene);
            Prefabs._roadMaterial.sideOrientation = BABYLON.Orientation.CW; // NOTE: if CCW, backfaceCulling must be turned on!!
            Prefabs._roadMaterial.emissiveColor = BABYLON.Color3.FromHexString("#000000");
            Prefabs._roadMaterial.albedoColor = BABYLON.Color3.FromHexString("#CC302F");
            Prefabs._roadMaterial.metallic = 0;
            Prefabs._roadMaterial.roughness = 0.5;
            Prefabs._roadMaterial.needDepthPrePass = true;
            
            Prefabs._roadMaterial.alpha = 0.9;
            Prefabs._roadMaterial.alphaMode = BABYLON.Engine.ALPHA_COMBINE;
            Prefabs._roadMaterial.transparencyMode = 2; 
            Prefabs._roadMaterial.zOffset = -1.0;

            Prefabs._roadMaterial.albedoTexture = new BABYLON.Texture(
                './assets/gfx/material/noise.png',
                scene,
                true,
                false,
                BABYLON.Texture.BILINEAR_SAMPLINGMODE
            );
            Prefabs._roadMaterial.albedoTexture.hasAlpha = true;

            Prefabs._roadMaterial.Fragment_Custom_Albedo(`
                vec4 noise = texture2D(albedoSampler, vPositionW.xz * 0.025);
                vec4 c = vAlbedoColor * (noise.y * 0.75 + 0.25);
                float blend = vAlbedoUV.x;

                blend *= noise.x + 0.5;
                blend = smoothstep(0.4, 0.7, blend);

                surfaceAlbedo = c.rgb;
                alpha = blend;
            `);
        }
        
        return Prefabs._roadMaterial;
    }

    private static waterMaterial(scene: BABYLON.Scene) {
        if (!Prefabs._waterMaterial) {
            Prefabs._waterMaterial = new BABYLON.PBRCustomMaterial("water_material", scene);
            Prefabs._waterMaterial.sideOrientation = BABYLON.Orientation.CW; // NOTE: if CCW, backfaceCulling must be turned on!!
            Prefabs._waterMaterial.emissiveColor = BABYLON.Color3.FromHexString("#ffffff");
            Prefabs._waterMaterial.albedoColor = BABYLON.Color3.FromHexString("#ffffff");
            Prefabs._waterMaterial.metallic = 0;
            Prefabs._waterMaterial.roughness = 0.5;
            Prefabs._waterMaterial.alpha = 0.9;
            Prefabs._waterMaterial.alphaMode = BABYLON.Engine.ALPHA_COMBINE;
            Prefabs._waterMaterial.transparencyMode = 2;

            Prefabs._waterMaterial.albedoTexture = new BABYLON.Texture(
                './assets/gfx/material/noise.png',
                scene,
                true,
                false,
                BABYLON.Texture.BILINEAR_SAMPLINGMODE
            );
            Prefabs._waterMaterial.albedoTexture.hasAlpha = true;

            let t = 0;
            Prefabs._waterMaterial.AddUniform("vTime", "vec3", null);
            Prefabs._waterMaterial.onBindObservable.add(() => {
                if (Prefabs._waterMaterial && Prefabs._waterMaterial.getEffect && Prefabs._waterMaterial.getEffect()) {
                    t++;
                    Prefabs._waterMaterial.getEffect().setVector3("vTime", new BABYLON.Vector3(0.0, t/180.0, 0.0));
                }
            });

            Prefabs._waterMaterial.Fragment_Definitions(Prefabs._wavesShaderFn);

            Prefabs._waterMaterial.Fragment_Custom_Albedo(`
                vec4 _color = vec4(vEmissiveColor, 0.0);
                float waves = Waves(vPositionW.xz, albedoSampler, vTime.y);
                vec4 c = clamp(_color + waves, 0.0, 1.0);

                surfaceAlbedo.rgb = c.rgb;
                alpha = c.a;
            `);
        }
        
        return Prefabs._waterMaterial;
    }

    private static waterShoreMaterial(scene: BABYLON.Scene) {
        if (!Prefabs._waterShoreMaterial) {
            Prefabs._waterShoreMaterial = new BABYLON.PBRCustomMaterial("water_shore_material", scene);
            Prefabs._waterShoreMaterial.sideOrientation = BABYLON.Orientation.CW; // NOTE: if CCW, backfaceCulling must be turned on!!
            Prefabs._waterShoreMaterial.emissiveColor = BABYLON.Color3.FromHexString("#ffffff");
            Prefabs._waterShoreMaterial.albedoColor = BABYLON.Color3.FromHexString("#ffffff");
            Prefabs._waterShoreMaterial.metallic = 0;
            Prefabs._waterShoreMaterial.roughness = 0.5;
            Prefabs._waterShoreMaterial.alpha = 0.9;
            Prefabs._waterShoreMaterial.alphaMode = BABYLON.Engine.ALPHA_COMBINE;
            Prefabs._waterShoreMaterial.transparencyMode = 2; 

            Prefabs._waterShoreMaterial.albedoTexture = new BABYLON.Texture(
                './assets/gfx/material/noise.png',
                scene,
                true,
                false,
                BABYLON.Texture.BILINEAR_SAMPLINGMODE
            );
            Prefabs._waterShoreMaterial.albedoTexture.hasAlpha = true;

            let t = 0;
            Prefabs._waterShoreMaterial.AddUniform("vTime", "vec3", null);
            Prefabs._waterShoreMaterial.onBindObservable.add(() => {
                if (Prefabs._waterShoreMaterial && Prefabs._waterShoreMaterial.getEffect && Prefabs._waterShoreMaterial.getEffect()) {
                    t++;
                    Prefabs._waterShoreMaterial.getEffect().setVector3("vTime", new BABYLON.Vector3(0.0, t/180.0, 0.0));
                }
            });

            Prefabs._waterShoreMaterial.Fragment_Definitions(`
                ${Prefabs._foamShaderFn}
                
                ${Prefabs._wavesShaderFn}
            `);

            Prefabs._waterShoreMaterial.Fragment_Custom_Albedo(`
                vec4 _color = vec4(vEmissiveColor, 0.0);
                float shore = vAlbedoUV.y;
                float foam = Foam(shore, vPositionW.xz, albedoSampler, vTime.y);
                float waves = Waves(vPositionW.xz, albedoSampler, vTime.y);
                waves *= 1.0 - shore;

                vec4 c = clamp(_color + max(foam, waves), 0.0, 1.0);

                surfaceAlbedo.rgb = c.rgb;
                alpha = c.a;
            `);
        }
        
        return Prefabs._waterShoreMaterial;
    }

    private static estuariesMaterial(scene: BABYLON.Scene) {
        if (!Prefabs._estuariesMaterial) {
            Prefabs._estuariesMaterial = new BABYLON.PBRCustomMaterial("estuaries_material", scene);
            Prefabs._estuariesMaterial.sideOrientation = BABYLON.Orientation.CW; // NOTE: if CCW, backfaceCulling must be turned on!!
            Prefabs._estuariesMaterial.emissiveColor = BABYLON.Color3.FromHexString("#ffffff");
            Prefabs._estuariesMaterial.albedoColor = BABYLON.Color3.FromHexString("#ffffff");
            Prefabs._estuariesMaterial.metallic = 0;
            Prefabs._estuariesMaterial.roughness = 0.5;
            Prefabs._estuariesMaterial.alpha = 0.9;
            Prefabs._estuariesMaterial.alphaMode = BABYLON.Engine.ALPHA_COMBINE;
            Prefabs._estuariesMaterial.transparencyMode = 2; 

            Prefabs._estuariesMaterial.albedoTexture = new BABYLON.Texture(
                './assets/gfx/material/noise.png',
                scene,
                true,
                false,
                BABYLON.Texture.BILINEAR_SAMPLINGMODE
            );
            Prefabs._estuariesMaterial.albedoTexture.coordinatesIndex = 1;
            Prefabs._estuariesMaterial.albedoTexture.hasAlpha = true;

            let t = 0;
            Prefabs._estuariesMaterial.AddUniform("vTime", "vec3", null);
            Prefabs._estuariesMaterial.onBindObservable.add(() => {
                if (Prefabs._estuariesMaterial && Prefabs._estuariesMaterial.getEffect && Prefabs._estuariesMaterial.getEffect()) {
                    t++;
                    Prefabs._estuariesMaterial.getEffect().setVector3("vTime", new BABYLON.Vector3(0.0, t/180.0, 0.0));
                }
            });

            Prefabs._estuariesMaterial.Vertex_Definitions(`
                out vec2 vAlbedoUV2;
            `);
            Prefabs._estuariesMaterial.Vertex_MainEnd(`
                vAlbedoUV2 = uv2;
            `);
            
            Prefabs._estuariesMaterial.Fragment_Definitions(`
                in vec2 vAlbedoUV2;

                ${Prefabs._foamShaderFn}
                
                ${Prefabs._wavesShaderFn}

                ${Prefabs._riverShaderFn}
            `);

            Prefabs._estuariesMaterial.Fragment_Custom_Albedo(`
                vec4 _color = vec4(vEmissiveColor, 0.0);
                float shore = vAlbedoUV.y;
                float foam = Foam(shore, vPositionW.xz, albedoSampler, vTime.y);
                float waves = Waves(vPositionW.xz, albedoSampler, vTime.y);
                waves *= 1.0 - shore;

                float shoreWater = max(foam, waves);
                float river = River(vAlbedoUV2, albedoSampler, vTime.y);
                float water = mix(shoreWater, river, vAlbedoUV.x);
                vec4 c = clamp(_color + water, 0.0, 1.0);

                surfaceAlbedo.rgb = c.rgb;
                alpha = c.a;
            `);
        }
        
        return Prefabs._estuariesMaterial;
    }

    private static urbanFeatureMaterial(scene: BABYLON.Scene): BABYLON.Material {
        if (!Prefabs._urbanFeatureMaterial) {
            Prefabs._urbanFeatureMaterial = new BABYLON.StandardMaterial("urban_material", scene);
            Prefabs._urbanFeatureMaterial.diffuseColor = BABYLON.Color3.FromHexString("#c8272e");
            Prefabs._urbanFeatureMaterial.emissiveColor = BABYLON.Color3.Black();
            Prefabs._urbanFeatureMaterial.specularColor = BABYLON.Color3.Black();
        }

        return Prefabs._urbanFeatureMaterial;
    }

    private static farmFeatureMaterial(scene: BABYLON.Scene): BABYLON.Material {
        if (!Prefabs._farmFeatureMaterial) {
            Prefabs._farmFeatureMaterial = new BABYLON.StandardMaterial("farm_material", scene);
            Prefabs._farmFeatureMaterial.diffuseColor = BABYLON.Color3.FromHexString("#15D700");
            Prefabs._farmFeatureMaterial.emissiveColor = BABYLON.Color3.Black();
            Prefabs._farmFeatureMaterial.specularColor = BABYLON.Color3.Black();
        }

        return Prefabs._farmFeatureMaterial;
    }
    
    private static plantFeatureMaterial(scene: BABYLON.Scene): BABYLON.Material {
        if (!Prefabs._plantFeatureMaterial) {
            Prefabs._plantFeatureMaterial = new BABYLON.StandardMaterial("plant_material", scene);
            Prefabs._plantFeatureMaterial.diffuseColor = BABYLON.Color3.FromHexString("#2e8923");
            Prefabs._plantFeatureMaterial.emissiveColor = BABYLON.Color3.Black();
            Prefabs._plantFeatureMaterial.specularColor = BABYLON.Color3.Black();
        }

        return Prefabs._plantFeatureMaterial;
    }

    private static wallsMaterial(scene: BABYLON.Scene): BABYLON.Material {
        if (!Prefabs._wallsMaterial) {
            Prefabs._wallsMaterial = new BABYLON.PBRMaterial("walls_material", scene);
            Prefabs._wallsMaterial.sideOrientation = BABYLON.Orientation.CW; // NOTE: if CCW, backfaceCulling must be turned on!!
            Prefabs._wallsMaterial.emissiveColor = BABYLON.Color3.Black();
            Prefabs._wallsMaterial.albedoColor = BABYLON.Color3.FromHexString("#c8272e");
            Prefabs._wallsMaterial.metallic = 0;
        }

        return Prefabs._wallsMaterial;
    }

    private static towerMaterial(scene: BABYLON.Scene): BABYLON.Material {
        if (!Prefabs._towerMaterial) {
            Prefabs._towerMaterial = new BABYLON.PBRMaterial("tower_material", scene);
            // Prefabs._towerMaterial.sideOrientation = BABYLON.Orientation.CW; // NOTE: if CCW, backfaceCulling must be turned on!!
            Prefabs._towerMaterial.emissiveColor = BABYLON.Color3.Black();
            Prefabs._towerMaterial.albedoColor = BABYLON.Color3.FromHexString("#c8272e");
            Prefabs._towerMaterial.metallic = 0;
        }

        return Prefabs._towerMaterial;
    }

    private static bridgeMaterial(scene: BABYLON.Scene): BABYLON.Material {
        if (!Prefabs._bridgeMaterial) {
            Prefabs._bridgeMaterial = new BABYLON.PBRMaterial("bridge_material", scene);
            Prefabs._bridgeMaterial.sideOrientation = BABYLON.Orientation.CCW;
            Prefabs._bridgeMaterial.emissiveColor = BABYLON.Color3.Black();
            Prefabs._bridgeMaterial.albedoColor = BABYLON.Color3.FromHexString("#c8272e");
            Prefabs._bridgeMaterial.metallic = 0;
        }

        return Prefabs._bridgeMaterial;
    }

    public static terrain(name: string, scene: BABYLON.Scene): HexMesh {
        let terrain = new HexMesh(name, Prefabs.terrainMaterial(scene), scene);

        terrain.isVisible = true;
        terrain.isPickable = true;
        terrain._useColors = true;
        terrain._useCollider = true;
        terrain._useUVCoordinates = false;

        return terrain;
    }

    public static rivers(name: string, scene: BABYLON.Scene): HexMesh {
        let rivers = new HexMesh(name, Prefabs.riverMaterial(scene), scene);

        rivers.isVisible = true;
        rivers.isPickable = false;
        rivers._useColors = false;
        rivers._useCollider = false;
        rivers._useUVCoordinates = true;
        rivers.alphaIndex = 100;

        return rivers;
    }

    public static roads(name: string, scene: BABYLON.Scene): HexMesh {
        let roads = new HexMesh(name, Prefabs.roadMaterial(scene), scene);

        roads.isVisible = true;
        roads.isPickable = false;
        roads._useColors = false;
        roads._useCollider = false;
        roads._useUVCoordinates = true;
        // roads.renderingGroupId = 3;

        return roads;
    }

    public static water(name: string, scene: BABYLON.Scene): HexMesh {
        let water = new HexMesh(name, Prefabs.waterMaterial(scene), scene);

        water.isVisible = true;
        water.isPickable = false;
        water._useColors = false;
        water._useCollider = false;
        water._useUVCoordinates = false;
        water.alphaIndex = 40;

        return water;
    }

    public static waterShore(name: string, scene: BABYLON.Scene): HexMesh {
        let waterShore = new HexMesh(name, Prefabs.waterShoreMaterial(scene), scene);

        waterShore.isVisible = true;
        waterShore.isPickable = false;
        waterShore._useColors = false;
        waterShore._useCollider = false;
        waterShore._useUVCoordinates = true;
        waterShore.alphaIndex = 50;

        return waterShore;
    }

    public static estuaries(name: string, scene: BABYLON.Scene): HexMesh {
        let estuaries = new HexMesh(name, Prefabs.estuariesMaterial(scene), scene);

        estuaries.isVisible = true;
        estuaries.isPickable = false;
        estuaries._useColors = false;
        estuaries._useCollider = false;
        estuaries._useUVCoordinates = true;
        estuaries._useUV2Coordinates = true;
        estuaries.alphaIndex = 40;

        return estuaries;
    }

    public static urbanFeature(options: any, name: string, scene: BABYLON.Scene) {
        let cubeMesh = BABYLON.MeshBuilder.CreateBox(name, options, scene);

        cubeMesh.material = Prefabs.urbanFeatureMaterial(scene);
        cubeMesh.isVisible = true;
        cubeMesh.isPickable = false;

        return cubeMesh;
    }

    public static farmFeature(options: any, name: string, scene: BABYLON.Scene) {
        let cubeMesh = BABYLON.MeshBuilder.CreateBox(name, options, scene);

        cubeMesh.material = Prefabs.farmFeatureMaterial(scene);
        cubeMesh.isVisible = true;
        cubeMesh.isPickable = false;

        return cubeMesh;
    }

    public static plantFeature(options: any, name: string, scene: BABYLON.Scene) {
        let cubeMesh = BABYLON.MeshBuilder.CreateBox(name, options, scene);

        cubeMesh.material = Prefabs.plantFeatureMaterial(scene);
        cubeMesh.isVisible = true;
        cubeMesh.isPickable = false;

        return cubeMesh;
    }

    public static walls(name: string, scene: BABYLON.Scene): HexMesh {
        let walls = new HexMesh(name, Prefabs.wallsMaterial(scene), scene);

        walls.isVisible = true;
        walls.isPickable = false;
        walls._useColors = false;
        walls._useCollider = false;
        walls._useUVCoordinates = false;
        walls.alphaIndex = 150;

        return walls;
    }

    public static wallTower(name: string, scene: BABYLON.Scene): BABYLON.Mesh {
        let
            box1 = BABYLON.MeshBuilder.CreateBox(`${name}_base`, {width: 2, height: 5, depth: 2}, scene),
            box2 = BABYLON.MeshBuilder.CreateBox(`${name}_top`, {size: 1}, scene);

        box2.setParent(box1);
        box2.locallyTranslate(new BABYLON.Vector3(0, 2.5, 0));
 
        let tower = BABYLON.Mesh.MergeMeshes([box1, box2], true);
        
        tower.isVisible = true;
        tower.isPickable = false;
        tower.material = Prefabs.towerMaterial(scene);

        return tower;
    }

    public static bridge(name: string, scene: BABYLON.Scene): BABYLON.Mesh {
        let 
            bridge = BABYLON.MeshBuilder.CreateBox(
                name, 
                {
                    width: 3, 
                    height: 1, 
                    depth: HexMetrics.bridgeDesignLength
                }, 
                scene
            );

        bridge.isVisible = true;
        bridge.isPickable = false;
        bridge.material = Prefabs.bridgeMaterial(scene);

        return bridge;
    }

    public static castle(_opts: any, name: string, scene: BABYLON.Scene): BABYLON.Mesh {
        let
            base = BABYLON.MeshBuilder.CreateBox(`${name}_base`, {width: 6, height: 4, depth: 6}, scene),
            t1 = BABYLON.MeshBuilder.CreateBox(`${name}_tower1`, {width: 2, height: 6, depth: 2}, scene),
            t2 = BABYLON.MeshBuilder.CreateBox(`${name}_tower2`, {width: 2, height: 6, depth: 2}, scene),
            t3 = BABYLON.MeshBuilder.CreateBox(`${name}_tower3`, {width: 2, height: 6, depth: 2}, scene),
            t4 = BABYLON.MeshBuilder.CreateBox(`${name}_tower4`, {width: 2, height: 6, depth: 2}, scene);

        XMesh.fixInitialPosition(base);
        XMesh.fixInitialPosition(t1);
        XMesh.fixInitialPosition(t2);
        XMesh.fixInitialPosition(t3);
        XMesh.fixInitialPosition(t4);

        t1.setParent(base);
        t2.setParent(base);
        t3.setParent(base);
        t4.setParent(base);

        t1.position.x = -2.5;
        t1.position.z = 2.5;
        t2.position.x = -2.5;
        t2.position.z = -2.5;
        t3.position.x = 2.5;
        t3.position.z = 2.5;    
        t4.position.x = 2.5;
        t4.position.z = -2.5;

        let castle = BABYLON.Mesh.MergeMeshes([base, t1, t2, t3, t4]);

        castle.isVisible = true;
        castle.isPickable = false;
        castle.material = Prefabs.urbanFeatureMaterial(scene);

        return castle;
    }
}

class XQuaternion {
    public static getForwardVector(q: BABYLON.Quaternion): BABYLON.Vector3 {
        return new BABYLON.Vector3(
            2 * (q.x * q.z + q.w * q.y),
            2 * (q.y * q.x - q.w * q.x),
            1 - 2 * (q.x * q.x + q.y * q.y)
        );
    }

    public static getUpVector(q: BABYLON.Quaternion): BABYLON.Vector3 {
        return new BABYLON.Vector3(
            2 * (q.x * q.y - q.w * q.z),
            1 - 2 * (q.x * q.x + q.z * q.z),
            2 * (q.y * q.z + q.w * q.x)
        );
    }

    public static getRightVector(q: BABYLON.Quaternion): BABYLON.Vector3 {
        return new BABYLON.Vector3(
            1 - 2 * (q.y * q.y + q.z * q.z),
            2 * (q.x * q.y + q.w * q.z),
            2 * (q.x * q.z - q.w * q.y)
        );
    }

    /**
     * Source: https://bitbucket.org/sinbad/ogre/src/9db75e3ba05c/OgreMain/include/OgreVector3.h#cl-651
     */
    public static getRotationTo(
        vector: BABYLON.Vector3, 
        destination: BABYLON.Vector3,
        fallbackAxis: BABYLON.Vector3 = BABYLON.Vector3.Zero()
    ): BABYLON.Quaternion {
        let q = new BABYLON.Quaternion(),
            // v0 = vector.clone(),
            // v1 = destination.clone(),
            d: number;
        
        BABYLON.Tmp.Vector3[0] = vector.clone();
        BABYLON.Tmp.Vector3[1] = destination.clone();

        BABYLON.Tmp.Vector3[0].normalize();
        BABYLON.Tmp.Vector3[1].normalize();

        d = BABYLON.Vector3.Dot(BABYLON.Tmp.Vector3[0], BABYLON.Tmp.Vector3[1]);
        
        if (d >= 1.0) {
            return BABYLON.Quaternion.Identity();
        }

        if (d < (1e-6 - 1.0)) {
            if (fallbackAxis !== BABYLON.Vector3.Zero()) {
                BABYLON.Quaternion.RotationAxisToRef(fallbackAxis, Math.PI, q);
            }
            else {
                let axis = BABYLON.Vector3.Cross(BABYLON.Vector3.Right(), vector);

                if (axis.length() === 0) {
                    axis = BABYLON.Vector3.Cross(BABYLON.Vector3.Up(), vector);
                }

                axis.normalize();
                BABYLON.Quaternion.RotationAxisToRef(axis, Math.PI, q);
            }
        }
        else {
            let
                s = Math.sqrt((1 + d) * 2),
                invs = 1/s,
                c = BABYLON.Vector3.Cross(BABYLON.Tmp.Vector3[0], BABYLON.Tmp.Vector3[1]);

            q.x = c.x * invs;
            q.y = c.y * invs;
            q.z = c.z * invs;
            q.w = s * 0.5;

            q.normalize();
        }

        return q;
    }
}

class XMesh {
    public static fixInitialPosition(mesh: BABYLON.Mesh): void {
        mesh.position.y += mesh.getBoundingInfo().boundingBox.extendSize.y;
    }

    public static setAxisRight(mesh: BABYLON.Mesh, axis: BABYLON.Vector3): void {
        XMesh.setAxisVector(mesh, axis, XQuaternion.getRightVector);
    }

    public static setAxisForward(mesh: BABYLON.Mesh, axis: BABYLON.Vector3): void {
        XMesh.setAxisVector(mesh, axis, XQuaternion.getForwardVector);
    }

    private static setAxisVector(mesh: BABYLON.Mesh, axis: BABYLON.Vector3, getAxisFN): void {
        let
            rot = mesh.rotation,
            eulerAngles = BABYLON.Quaternion.FromEulerAngles(rot.x, rot.y, rot.z),
            currentAxis = getAxisFN(eulerAngles).clone(),
            destination = axis.clone();

        currentAxis.y = 0;
        destination.y = 0;

        mesh.rotationQuaternion = XQuaternion.getRotationTo(currentAxis, destination);
    }
}

/**
 * CAUTION: UNTIL HexCell extends BABYLON.Mesh, ALWAYS SET POSITION VIA cellPostion!! 
 */
class HexCell extends BABYLON.Mesh {
    private static CELL_OVERLAY_ELEVATION = 0.1; 

    public coordinates: HexCoordinates;
    public neighbors: HexCell[] = new Array<HexCell>(6);
    public chunk: HexGridChunk;

    private _cellPosition: BABYLON.Vector3;
    private _elevation: number = Number.MIN_VALUE;
    private _terrainTypeIndex: number = 0;
    private _hasIncomingRiver: boolean;
    private _hasOutgoingRiver: boolean;
    private _incomingRiver: HexDirection;
    private _outgoingRiver: HexDirection;
    private roads: boolean[] = new Array<boolean>(6);
    private _waterLevel: number;
    private _urbanLevel: number = 0;
    private _farmLevel: number = 0;
    private _plantLevel: number = 0;
    private _walled: boolean = false;
    private _specialIndex: number = 0;

    constructor(name: string, scene: BABYLON.Scene) {
        super(name, scene);
        
        let options = {
            size: 10,
            width: 10,
            height: 10,
            updatable: true
        };

        let vertexData = BABYLON.VertexData.CreateGround(options);
        vertexData.applyToMesh(this);
    }

    public getNeighbor(direction: HexDirection): HexCell {
        return this.neighbors[direction];
    }

    public setNeighbor(direction: HexDirection, cell: HexCell): void {
        this.neighbors[direction] = cell;
        cell.neighbors[HexDirection.opposite(direction)] = this;
    }

    get elevation(): number {
        return this._elevation;
    }

    set elevation(elevation: number) {
        if (this._elevation === elevation) {
            return;
        }

        this._elevation = elevation;
        this.refreshPosition();
        this.validateRivers();

        for (let i = 0; i < this.roads.length; i++) {
            if (this.roads[i] && this.getElevationDifference(i) > 0) {
                this.setRoad(i, false);
            }
        }

        // this.refreshMeshPosition();
        this.refresh();
    }

    get cellPosition(): BABYLON.Vector3 {
        return this._cellPosition;
    }

    set cellPosition(position: BABYLON.Vector3) {
        this._cellPosition = position.clone();
        this.refreshMeshPosition();
    }

    get color(): BABYLON.Color4 {
        return HexMetrics.colors[this._terrainTypeIndex];
    }

    get terrainTypeIndex(): number {
        return this._terrainTypeIndex;
    }

    set terrainTypeIndex(value: number) {
        if (this._terrainTypeIndex === value) {
            return;
        }

        this._terrainTypeIndex = value;
        this.refresh();
    }

    get hasIncomingRiver(): boolean {
        return this._hasIncomingRiver;
    }

    get hasOutgoingRiver(): boolean {
        return this._hasOutgoingRiver;
    }

    get incomingRiver(): HexDirection {
        return this._incomingRiver;
    }

    get outgoingRiver(): HexDirection {
        return this._outgoingRiver;
    }

    get hasRiver(): boolean {
        return this._hasIncomingRiver || this._hasOutgoingRiver;
    }

    get hasRiverBeginingOrEnd(): boolean {
        return this._hasIncomingRiver != this._hasOutgoingRiver;
    }

    get riverSurfaceY(): number {
        return (
            (this.elevation + HexMetrics.waterElevationOffset) * HexMetrics.elevationStep
        );
    }

    get waterSurfaceY(): number {
        return (
            (this.waterLevel + HexMetrics.waterElevationOffset) * HexMetrics.elevationStep
        );
    }

    public hasRiverThroughEdge(direction: HexDirection): boolean {
        return (
            this._hasIncomingRiver && this._incomingRiver === direction ||
            this._hasOutgoingRiver && this._outgoingRiver === direction
        );
    }

    public setOutgoingRiver(direction: HexDirection): void {
        if (this._hasOutgoingRiver && this._outgoingRiver === direction) {
            return;
        }

        const neighbor = this.getNeighbor(direction);

        if (!this.isValidRiverDestination(neighbor)) {
            return;
        }

        this.removeOutgoigRiver();
        if (this._hasIncomingRiver && this._incomingRiver === direction) {
            this.removeIncomingRiver();
        }

        this._hasOutgoingRiver = true;
        this._outgoingRiver = direction;
        this._specialIndex = 0;

        neighbor.removeIncomingRiver();
        neighbor._hasIncomingRiver = true;
        neighbor._incomingRiver = HexDirection.opposite(direction);
        neighbor._specialIndex = 0;

        this.setRoad(direction, false);
    }

    public removeOutgoigRiver(): void {
        if (!this._hasOutgoingRiver) {
            return;
        }

        this._hasOutgoingRiver = false;
        this.refreshSelfOnly();

        const neighbor = this.getNeighbor(this._outgoingRiver);
        neighbor._hasIncomingRiver = false;
        neighbor.refreshSelfOnly();
    }

    public removeIncomingRiver(): void {
        if (!this._hasIncomingRiver) {
            return;
        }

        this._hasIncomingRiver = false;
        this.refreshSelfOnly();

        const neighbor = this.getNeighbor(this._incomingRiver);
        neighbor._hasOutgoingRiver = false;
        neighbor.refreshSelfOnly();
    }

    public removeRiver(): void {
        this.removeOutgoigRiver();
        this.removeIncomingRiver();
    }

    public get streamBedY(): number {
        return (this._elevation + HexMetrics.streamBedElevationOffset) * HexMetrics.elevationStep;
    }

    public isValidRiverDestination(neighbor: HexCell): boolean {
        return neighbor && (
            this.elevation >= neighbor.elevation || this.waterLevel === neighbor.elevation
        );
    }

    public validateRivers(): void {
        let 
            outgoigRiverNeighbor = this.getNeighbor(this.outgoingRiver),
            incomingRiverNeighbor = this.getNeighbor(this.incomingRiver);

        if (this.hasOutgoingRiver && !this.isValidRiverDestination(outgoigRiverNeighbor)) {
            this.removeOutgoigRiver();
        }

        if (this.hasIncomingRiver && !incomingRiverNeighbor.isValidRiverDestination(this)) {
            this.removeIncomingRiver();
        }
    }

    public hasRoadThroughEdge(direction: HexDirection): boolean {
        return this.roads[direction];
    }

    get hasRoads(): boolean {
        for (let i = 0; i < this.roads.length; i++) {
            if (this.roads[i]) {
                return true;
            }
        }

        return false;
    }

    public removeRoads(): void {
        for (let i = 0; i < this.neighbors.length; i++) {
            if (this.roads[i]) {
                this.setRoad(i, false);
            }
        }
    }

    public addRoad(direction: HexDirection): void {
        if (
            !this.roads[direction] && 
            !this.hasRiverThroughEdge(direction) &&
            !this.isSpecial &&
            !this.getNeighbor(direction).isSpecial &&
            this.getElevationDifference(direction) <= 1
        ) {
            this.setRoad(direction, true);
        }
    }

    public setRoad(index: number, state: boolean): void {
        this.roads[index] = state;
        this.neighbors[index].roads[HexDirection.opposite(index)] = state;
        this.neighbors[index].refreshSelfOnly();
        this.refreshSelfOnly();
    }

    get waterLevel(): number {
        return this._waterLevel;
    }

    set waterLevel(value: number) {
        if (this._waterLevel === value) {
            return;
        }

        this._waterLevel = value;
        this.validateRivers();
        this.refresh();
    }

    get isUnderwater(): boolean {
        return this.waterLevel > this.elevation;
    }

    public get urbanLevel(): number {
        return this._urbanLevel;
    }

    public set urbanLevel(level: number) {
        if (this._urbanLevel === level) {
            return;
        }

        this._urbanLevel = level;
        this.refreshSelfOnly();
    }

    public get farmLevel(): number {
        return this._farmLevel;
    }

    public set farmLevel(level: number) {
        if (this._farmLevel === level) {
            return;
        }

        this._farmLevel = level;
        this.refreshSelfOnly();
    }

    public get plantLevel(): number {
        return this._plantLevel;
    }

    public set plantLevel(level: number) {
        if (this._plantLevel === level) {
            return;
        }

        this._plantLevel = level;
        this.refreshSelfOnly();
    }

    public get walled(): boolean {
        return this._walled;
    }

    public set walled(value: boolean) {
        if (this._walled === value) {
            return;
        }

        this._walled = value;
        this.refresh();
    }

    public get specialIndex(): number {
        return this._specialIndex;
    }

    public set specialIndex(value: number) {
        if (this._specialIndex === value || this.hasRiver) {
            return;
        }

        this._specialIndex = value;
        this.removeRoads();
        this.refreshSelfOnly();
    }

    public get isSpecial(): boolean {
        return this._specialIndex > 0;
    }

    public getEdgeType(direction: HexDirection): HexEdgeType {
        return HexMetrics.getEdgeType(this.elevation, this.neighbors[direction].elevation);
    }

    public getEdgeTypeForCell(cell: HexCell): HexEdgeType {
        return HexMetrics.getEdgeType(this.elevation, cell.elevation);
    }

    public getElevationDifference(direction: HexDirection): number {
        let difference = this.elevation - this.getNeighbor(direction).elevation;
        return difference >= 0 ? difference : -difference;
    }

    get riverBeginOrEndDirection(): HexDirection {
        return this.hasIncomingRiver ? this.incomingRiver : this.outgoingRiver;
    }

    // Sets mesh render position from cellPosition (renders it slightly above).
    private refreshMeshPosition(): void {
        this.position = this._cellPosition.clone();
        //this.position.y += HexCell.CELL_OVERLAY_ELEVATION;
    }

    private refreshPosition(): void {
        let pos = this._cellPosition.clone();

        pos.y = this._elevation * HexMetrics.elevationStep;
        pos.y += (HexMetrics.sampleNoise(pos).y * 2.0 - 1.0) * HexMetrics.elevationPerturbStrength;

        this.cellPosition = pos;
    }

    private refresh(): void {
        if (!this.chunk) return;

        this.chunk.refresh();

        // Refresh all neighbor cell chunks which are not the same chunk as we're in.
        let n: HexCell;
        for (let i = 0; i < this.neighbors.length; i++) {
            n = this.neighbors[i];

            if (n && n.chunk != this.chunk) {
                n.chunk.refresh();
            }
        }
    }

    public refreshSelfOnly(): void {
        this.chunk.refresh();
    }

    public save(writer: ByteBuffer): void {
        writer.writeUint8(this._terrainTypeIndex);
        writer.writeInt8(this._elevation);
        writer.writeInt8(this._waterLevel);
        writer.writeUint8(this._urbanLevel);
        writer.writeUint8(this._farmLevel);
        writer.writeUint8(this._plantLevel);
        writer.writeUint8(this._specialIndex);
        writer.writeBoolean(this._walled);

        if (this._hasIncomingRiver) {
            writer.writeUint8(this._incomingRiver + 128);
        }
        else {
            writer.writeUint8(0);
        }

        if (this._hasOutgoingRiver) {
            writer.writeUint8(this._outgoingRiver + 128);
        }
        else {
            writer.writeUint8(0);
        }

        let roadFlags = 0;
        for (let i = 0; i < this.roads.length; i++) {
            if (this.roads[i]) {
                roadFlags |= 1 << i;
            }
        }

        writer.writeUint8(roadFlags);
    }

    public load(reader: ByteBuffer): void {
        this._terrainTypeIndex = reader.readUint8();
        this._elevation = reader.readInt8();
        this.refreshPosition();
        this._waterLevel = reader.readInt8();
        this._urbanLevel = reader.readUint8();
        this._farmLevel = reader.readUint8();
        this._plantLevel = reader.readUint8();
        this._specialIndex = reader.readUint8();
        this._walled = reader.readBoolean();

        let riverData = reader.readUint8();
        if (riverData >= 128) {
            this._hasIncomingRiver = true;
            this._incomingRiver = riverData - 128;
        }
        else {
            this._hasIncomingRiver = false;
        }

        riverData = reader.readUint8();
        if (riverData >= 128) {
            this._hasOutgoingRiver = true;
            this._outgoingRiver = riverData - 128;
        }
        else {
            this._hasOutgoingRiver = false;
        }
        
        let roadFlags = reader.readUint8();
        for (let i = 0; i < this.roads.length; i++) {
            this.roads[i] = (roadFlags & (1 << i)) != 0;
        }
    }
}

class EdgeVertices {
    public v1: BABYLON.Vector3;
    public v2: BABYLON.Vector3;
    public v3: BABYLON.Vector3;
    public v4: BABYLON.Vector3;
    public v5: BABYLON.Vector3;

    public static fromCorners(corner1: BABYLON.Vector3, corner2: BABYLON.Vector3, outerStep: number = 0.25) {
        let result = new EdgeVertices();

        result.v1 = corner1;
        result.v2 = BABYLON.Vector3.Lerp(corner1, corner2, outerStep);
        result.v3 = BABYLON.Vector3.Lerp(corner1, corner2, 0.5);
        result.v4 = BABYLON.Vector3.Lerp(corner1, corner2, 1.0 - outerStep);
        result.v5 = corner2;

        return result;
    }

    public static terraceLerp(a: EdgeVertices, b: EdgeVertices, step: number) {
        let result = new EdgeVertices();

        result.v1 = HexMetrics.terraceLerp(a.v1, b.v1, step);
        result.v2 = HexMetrics.terraceLerp(a.v2, b.v2, step);
        result.v3 = HexMetrics.terraceLerp(a.v3, b.v3, step);
        result.v4 = HexMetrics.terraceLerp(a.v4, b.v4, step);
        result.v5 = HexMetrics.terraceLerp(a.v5, b.v5, step);

        return result;
    } 

    clone(): EdgeVertices {
        let e = new EdgeVertices();
        e.v1 = this.v1.clone();
        e.v2 = this.v2.clone();
        e.v3 = this.v3.clone();
        e.v4 = this.v4.clone();
        e.v5 = this.v5.clone();

        return e;
    }
}

class HexMesh extends BABYLON.Mesh {
    private _vertices: number[];
    private _triangles: number[];
    private _colors: number[];
    private _uvs: number[];
    private _uvs2: number[];
    
    public _useColors: boolean = true;
    public _useUVCoordinates: boolean = false;
    public _useUV2Coordinates: boolean = false;
    public _useCollider: boolean = true;

    constructor(name: string, material: BABYLON.Material, scene: BABYLON.Scene) {
        super(name, scene);

        this.material = material;

        this._setReady(false);
    }

    apply(): void {
        let 
            vertexData = new BABYLON.VertexData(),
            normals = [];

        BABYLON.VertexData.ComputeNormals(
            this._vertices, 
            this._triangles, 
            normals, 
            {useRightHandedSystem: true}
        );
        
        vertexData.positions = this._vertices;
        vertexData.indices = this._triangles;
        vertexData.normals = normals;

        if (this._useColors) {
            vertexData.colors = this._colors;
        }
        if(this._useUVCoordinates) {
            vertexData.uvs = this._uvs;
        }
        if (this._useUV2Coordinates) {
            vertexData.uvs2 = this._uvs2;
        }

        vertexData.applyToMesh(this, true);

        this._setReady(true);

        this.isPickable = this._useCollider;
    }

    clear(): void {
        this._vertices = [];
        this._triangles = [];
        this._colors = [];
        this._uvs = [];
        this._uvs2 = [];
    }

    addTriangle(v1: BABYLON.Vector3, v2: BABYLON.Vector3, v3: BABYLON.Vector3): void {
        const vertexIndex = this._vertices.length/3;
        this.addVertex(HexMetrics.perturb(v1));
        this.addVertex(HexMetrics.perturb(v2));
        this.addVertex(HexMetrics.perturb(v3));
        this._triangles.push(vertexIndex);
        this._triangles.push(vertexIndex + 1);
        this._triangles.push(vertexIndex + 2);
    }

    addTriangleUnperturbed(v1: BABYLON.Vector3, v2: BABYLON.Vector3, v3: BABYLON.Vector3): void {
        let vertexIndex = this._vertices.length/3;
        this.addVertex(v1);
        this.addVertex(v2);
        this.addVertex(v3);
        this._triangles.push(vertexIndex);
        this._triangles.push(vertexIndex + 1);
        this._triangles.push(vertexIndex + 2);
    }

    addTriangleColor1(color: BABYLON.Color4): void {
        this.addColor(color);
        this.addColor(color);
        this.addColor(color);
    }

    addTriangleColor(color1: BABYLON.Color4, color2: BABYLON.Color4, color3: BABYLON.Color4): void {
        this.addColor(color1);
        this.addColor(color2);
        this.addColor(color3);
    }

    addQuad(v1: BABYLON.Vector3, v2: BABYLON.Vector3, v3: BABYLON.Vector3, v4: BABYLON.Vector3): void {
        const vertexIndex = this._vertices.length/3;
        this.addVertex(HexMetrics.perturb(v1));
        this.addVertex(HexMetrics.perturb(v2));
        this.addVertex(HexMetrics.perturb(v3));
        this.addVertex(HexMetrics.perturb(v4));
        this._triangles.push(vertexIndex);
        this._triangles.push(vertexIndex + 2);
        this._triangles.push(vertexIndex + 1);
        this._triangles.push(vertexIndex + 1);
        this._triangles.push(vertexIndex + 2);
        this._triangles.push(vertexIndex + 3);
    }

    addQuadUnperturbed(v1: BABYLON.Vector3, v2: BABYLON.Vector3, v3: BABYLON.Vector3, v4: BABYLON.Vector3): void {
        const vertexIndex = this._vertices.length/3;
        this.addVertex(v1);
        this.addVertex(v2);
        this.addVertex(v3);
        this.addVertex(v4);
        this._triangles.push(vertexIndex);
        this._triangles.push(vertexIndex + 2);
        this._triangles.push(vertexIndex + 1);
        this._triangles.push(vertexIndex + 1);
        this._triangles.push(vertexIndex + 2);
        this._triangles.push(vertexIndex + 3);
    }

    addQuadColor(color1: BABYLON.Color4, color2: BABYLON.Color4, color3: BABYLON.Color4, color4: BABYLON.Color4): void {
        this.addColor(color1);
        this.addColor(color2);
        this.addColor(color3);
        this.addColor(color4);
    }

    /** Adds only two colors to the quad. */
    addQuadColor2(color1: BABYLON.Color4, color2: BABYLON.Color4): void {
        this.addColor(color1);
        this.addColor(color1);
        this.addColor(color2);
        this.addColor(color2);
    }

    /** Adds a single color to the quad. */
    addQuadColor1(color: BABYLON.Color4): void {
        this.addColor(color);
        this.addColor(color);
        this.addColor(color);
        this.addColor(color);
    }

    addVertex(vertex: BABYLON.Vector3): void {
        this._vertices.push(vertex.x);
        this._vertices.push(vertex.y);
        this._vertices.push(vertex.z);
    }

    addColor(color: BABYLON.Color4): void {
        this._colors.push(color.r);
        this._colors.push(color.g);
        this._colors.push(color.b);
        this._colors.push(color.a);
    }

    addTriangleUV(uv1: BABYLON.Vector2, uv2: BABYLON.Vector2, uv3: BABYLON.Vector2): void {
        this.addUV(uv1);
        this.addUV(uv2);
        this.addUV(uv3);
    }

    addTriangleUV2(uv1: BABYLON.Vector2, uv2: BABYLON.Vector2, uv3: BABYLON.Vector2): void {
        this.addUV2(uv1);
        this.addUV2(uv2);
        this.addUV2(uv3);
    }

    addQuadUV(uv1: BABYLON.Vector2, uv2: BABYLON.Vector2, uv3: BABYLON.Vector2, uv4: BABYLON.Vector2): void {
        this.addUV(uv1);
        this.addUV(uv2);
        this.addUV(uv3);
        this.addUV(uv4);
    }

    addQuadUV2(uv1: BABYLON.Vector2, uv2: BABYLON.Vector2, uv3: BABYLON.Vector2, uv4: BABYLON.Vector2): void {
        this.addUV2(uv1);
        this.addUV2(uv2);
        this.addUV2(uv3);
        this.addUV2(uv4);
    }

    addQuadUVMinMax(uMin: number, uMax: number, vMin: number, vMax: number): void {
        this.addUV(new BABYLON.Vector2(uMin, vMin));
        this.addUV(new BABYLON.Vector2(uMax, vMin));
        this.addUV(new BABYLON.Vector2(uMin, vMax));
        this.addUV(new BABYLON.Vector2(uMax, vMax));
    }

    addQuadUV2MinMax(uMin: number, uMax: number, vMin: number, vMax: number): void {
        this.addUV2(new BABYLON.Vector2(uMin, vMin));
        this.addUV2(new BABYLON.Vector2(uMax, vMin));
        this.addUV2(new BABYLON.Vector2(uMin, vMax));
        this.addUV2(new BABYLON.Vector2(uMax, vMax));
    }

    addUV(uv: BABYLON.Vector2): void {
        this._uvs.push(uv.x);
        this._uvs.push(uv.y);
    }

    addUV2(uv: BABYLON.Vector2): void {
        this._uvs2.push(uv.x);
        this._uvs2.push(uv.y);
    }
}

enum HexFeatureDensity {
    // LOW, MEDIUM, HIGH
    HIGH, MEDIUM, LOW
}

class HexFeatureCollection {
    public static urbanFeatures: HexFeatureCollection[] = [
        //  HIGH
        new HexFeatureCollection(Prefabs.urbanFeature, [
            {width: 2.0, height: 5.0, depth: 2.0},
            {width: 3.5, height: 3.0, depth: 2.0}
        ]),
        // MEDIUM
        new HexFeatureCollection(Prefabs.urbanFeature, [
            {width: 1.5, height: 2.0, depth: 1.5},
            {width: 2.75, height: 1.5, depth: 1.5}
        ]),
        // LOW
        new HexFeatureCollection(Prefabs.urbanFeature, [
            {width: 1.0, height: 1.0, depth: 1.0},
            {width: 1.75, height: 1.0, depth: 1.0}
        ])
    ];

    public static farmFeatures: HexFeatureCollection[] = [
        //  HIGH
        new HexFeatureCollection(Prefabs.farmFeature, [
            {width: 2.5, height: 0.1, depth: 2.5},
            {width: 3.5, height: 0.1, depth: 2.0}
        ]),
        // MEDIUM
        new HexFeatureCollection(Prefabs.farmFeature, [
            {width: 1.75, height: 0.1, depth: 1.75},
            {width: 2.5, height: 0.1, depth: 1.25}
        ]),
        // LOW
        new HexFeatureCollection(Prefabs.farmFeature, [
            {width: 1.0, height: 0.1, depth: 1.0},
            {width: 1.5, height: 0.1, depth: 0.75}
        ])
    ];

    public static plantFeatures: HexFeatureCollection[] = [
        //  HIGH
        new HexFeatureCollection(Prefabs.plantFeature, [
            {width: 1.25, height: 4.5, depth: 1.25},
            {width: 1.5, height: 3.0, depth: 1.5}
        ]),
        // MEDIUM
        new HexFeatureCollection(Prefabs.plantFeature, [
            {width: 0.75, height: 3.0, depth: 0.75},
            {width: 1.0, height: 1.5, depth: 1.0}
        ]),
        // LOW
        new HexFeatureCollection(Prefabs.plantFeature, [
            {width: 0.5, height: 1.5, depth: 0.5},
            {width: 0.75, height: 1.0, depth: 0.75}
        ])
    ];

    public static specialFeatures: HexFeatureCollection[] = [
        new HexFeatureCollection(Prefabs.castle, ["castle_1"])
    ];

    private _prefabFn: (name: string, args: any, scene: BABYLON.Scene) => BABYLON.Mesh;
    private _prefabArgs: any[];

    constructor(prefabFn: (name: string, args: any, scene: BABYLON.Scene) => BABYLON.Mesh, prefabArgs: any[]) {
        this._prefabFn = prefabFn;
        this._prefabArgs = prefabArgs;
    }

    public pickAndMake(choice: number, name: string, scene: BABYLON.Scene): BABYLON.Mesh {
        let idx = ~~(choice * this._prefabArgs.length);

        return this._prefabFn(this._prefabArgs[idx], name, scene);
    }
}

class HexFeatureManager {

    private _scene: BABYLON.Scene;
    private _container: BABYLON.TransformNode;
    private _walls: HexMesh;

    constructor(scene: BABYLON.Scene) {
        this._scene = scene;
        this._walls = Prefabs.walls(`walls_${Math.random()}`, scene);
    }

    public clear(): void {
        if (this._container) {
            this._container.dispose();
        }

        this._container = new BABYLON.TransformNode("feature_container", this._scene);
        this._walls.clear();
    }

    public apply(): void {
        this._walls.apply();
    }

    public addWall(
        near: EdgeVertices, nearCell: HexCell, 
        far: EdgeVertices, farCell: HexCell,
        hasRiver: boolean, hasRoad: boolean
    ): void {
        if (
            nearCell.walled !== farCell.walled &&
            !nearCell.isUnderwater && !farCell.isUnderwater &&
            nearCell.getEdgeTypeForCell(farCell) !== HexEdgeType.Cliff
        ) {
            this.addWallSegment(near.v1, far.v1, near.v2, far.v2);
            
            if (hasRiver || hasRoad) {
                this.addWallCap(near.v2, far.v2);
                this.addWallCap(far.v4, near.v4);
            } else {
                this.addWallSegment(near.v2, far.v2, near.v3, far.v3);
                this.addWallSegment(near.v3, far.v3, near.v4, far.v4);
            }
            
            this.addWallSegment(near.v4, far.v4, near.v5, far.v5);
        }
    }

    public addWallCorner(
        c1: BABYLON.Vector3, cell1: HexCell,
        c2: BABYLON.Vector3, cell2: HexCell,
        c3: BABYLON.Vector3, cell3: HexCell
    ): void {
        if (cell1.walled) {
            if (cell2.walled) {
                if (!cell3.walled) {
                    this.addWallSegmentCorner(c3, cell3, c1, cell1, c2, cell2);
                }
            }
            else if (cell3.walled) {
                this.addWallSegmentCorner(c2, cell2, c3, cell3, c1, cell1);
            }
            else {
                this.addWallSegmentCorner(c1, cell1, c2, cell2, c3, cell3);
            }
        }
        else if (cell2.walled) {
            if (cell3.walled) {
                this.addWallSegmentCorner(c1, cell1, c2, cell2, c3, cell3);
            }
            else {
                this.addWallSegmentCorner(c2, cell2, c3, cell3, c1, cell1);
            }
        }
        else if (cell3.walled) {
            this.addWallSegmentCorner(c3, cell3, c1, cell1, c2, cell2);
        }
    }

    public addWallSegment(
        nearLeft: BABYLON.Vector3, 
        farLeft: BABYLON.Vector3, 
        nearRight: BABYLON.Vector3, 
        farRight: BABYLON.Vector3,
        addTower: boolean = false
    ): void {
        nearLeft = HexMetrics.perturb(nearLeft);
        farLeft = HexMetrics.perturb(farLeft);
        nearRight = HexMetrics.perturb(nearRight);
        farRight = HexMetrics.perturb(farRight);

        let
            left = HexMetrics.wallLerp(nearLeft, farLeft),
            right = HexMetrics.wallLerp(nearRight, farRight),
            leftThicknessOffset = HexMetrics.wallThicknessOffset(nearLeft, farLeft),
            rightThicknessOffset = HexMetrics.wallThicknessOffset(nearRight, farRight),
            leftTop = left.y + HexMetrics.wallHeight,
            rightTop = right.y + HexMetrics.wallHeight,
            v1 = left.clone().subtract(leftThicknessOffset),
            v3 = left.clone().subtract(leftThicknessOffset),
            v2 = right.clone().subtract(rightThicknessOffset),
            v4 = right.clone().subtract(rightThicknessOffset);
        
        v3.y = leftTop;
        v4.y = rightTop;

        this._walls.addQuadUnperturbed(v1, v2, v3, v4);

        let t1 = v3.clone(), t2 = v4.clone();
        
        v1 = left.add(leftThicknessOffset);
        v3 = left.add(leftThicknessOffset);
        v2 = right.add(rightThicknessOffset);
        v4 = right.add(rightThicknessOffset);

        v3.y = leftTop;
        v4.y = rightTop;

        this._walls.addQuadUnperturbed(v2, v1, v4, v3);
        this._walls.addQuadUnperturbed(t1, t2, v3, v4);

        if (addTower) {
            let towerInstance = Prefabs.wallTower(`tower`, this._scene);
            towerInstance.setParent(this._container);
            towerInstance.position = left.add(right).scale(0.5);
            towerInstance.position.y += towerInstance.getBoundingInfo().boundingBox.extendSize.y * 0.5 + 1;
            XMesh.setAxisRight(towerInstance, right.subtract(left));
        }
    }

    public addWallSegmentCorner(
        pivot: BABYLON.Vector3, pivotCell: HexCell,
        left: BABYLON.Vector3, leftCell: HexCell,
        right: BABYLON.Vector3, rightCell: HexCell
    ): void {
        if (pivotCell.isUnderwater) {
            return;
        }
        
        let
            leftWall = !leftCell.isUnderwater && pivotCell.getEdgeTypeForCell(leftCell) !== HexEdgeType.Cliff,
            rightWall = !rightCell.isUnderwater && pivotCell.getEdgeTypeForCell(rightCell) !== HexEdgeType.Cliff;

        if (leftWall) {
            if (rightWall) {
                let hasTower = false;

                if (leftCell.elevation === rightCell.elevation) {
                    let hash = HexMetrics.sampleHashGrid(pivot.add(left).add(right).scale(1/3));
                    hasTower = hash.e < HexMetrics.wallTowerThreshold;                   
                }

                this.addWallSegment(pivot, left, pivot, right, hasTower);
            }
            else if (leftCell.elevation < rightCell.elevation) {
                this.addWallWedge(pivot, left, right);
            }
            else {
                this.addWallCap(pivot, left);
            }
        }
        else if (rightWall) {
            if (rightCell.elevation < leftCell.elevation) {
                this.addWallWedge(right, pivot, left);
            }
            else {
                this.addWallCap(right, pivot);
            }
        }
    }

    public addWallCap(near: BABYLON.Vector3, far: BABYLON.Vector3): void {
        near = HexMetrics.perturb(near);
        far = HexMetrics.perturb(far);

        let
            center = HexMetrics.wallLerp(near, far),
            thickness = HexMetrics.wallThicknessOffset(near, far),
            v1: BABYLON.Vector3, 
            v2: BABYLON.Vector3, 
            v3: BABYLON.Vector3, 
            v4: BABYLON.Vector3;
        
        v1 = center.subtract(thickness);
        v3 = center.subtract(thickness);
        v2 = center.add(thickness);
        v4 = center.add(thickness);

        v3.y = v4.y = center.y + HexMetrics.wallHeight;

        this._walls.addQuadUnperturbed(v1, v2, v3, v4);
    }

    public addWallWedge(near: BABYLON.Vector3, far: BABYLON.Vector3, point: BABYLON.Vector3): void {
        near = HexMetrics.perturb(near);
        far = HexMetrics.perturb(far);
        point = HexMetrics.perturb(point);

        let
            center = HexMetrics.wallLerp(near, far),
            thickness = HexMetrics.wallThicknessOffset(near, far),
            pointTop = point.clone(),
            v1: BABYLON.Vector3, 
            v2: BABYLON.Vector3, 
            v3: BABYLON.Vector3, 
            v4: BABYLON.Vector3;

        point.y = center.y;

        v1 = center.subtract(thickness);
        v3 = center.subtract(thickness);
        v2 = center.add(thickness);
        v4 = center.add(thickness);

        v3.y = v4.y = pointTop.y = center.y + HexMetrics.wallHeight;

        this._walls.addQuadUnperturbed(v1, point, v3, pointTop);
        this._walls.addQuadUnperturbed(point, v2, pointTop, v4);
        this._walls.addTriangleUnperturbed(pointTop, v3, v4);
    }

    public addBridge(roadCenter1: BABYLON.Vector3, roadCenter2: BABYLON.Vector3): void {
        let instance = Prefabs.bridge("bridge", this._scene);

        roadCenter1 = HexMetrics.perturb(roadCenter1);
        roadCenter2 = HexMetrics.perturb(roadCenter2);

        instance.position = roadCenter1.add(roadCenter2).scale(0.5);
        XMesh.setAxisForward(instance, roadCenter2.subtract(roadCenter1));

        let length = BABYLON.Vector3.Distance(roadCenter1, roadCenter2);

        instance.scaling = new BABYLON.Vector3(1, 1, length * (1 / HexMetrics.bridgeDesignLength));

        instance.setParent(this._container);
    }

    public addFeature(cell: HexCell, position: BABYLON.Vector3): void {
        if (cell.isSpecial) {
            return;
        }

        let hash = HexMetrics.sampleHashGrid(position)

        let instance = this.pickPrefab(
            `feature_${position.x}_${position.z}_urban`,
            HexFeatureCollection.urbanFeatures,
            cell.urbanLevel, 
            hash.a, 
            hash.d
        );
        let otherInstance = this.pickPrefab(
            `feature_${position.x}_${position.z}_farm`,
            HexFeatureCollection.farmFeatures,
            cell.farmLevel,
            hash.b, 
            hash.d
        );

        let usedHash = hash.a;

        if (instance) {
            if (otherInstance && hash.b < hash.a) {
                let tmp = instance;
                instance = otherInstance;
                usedHash = hash.b;
                tmp.dispose();
            } else if (otherInstance) {
                otherInstance.dispose();
            }
        }
        else if (otherInstance) {
            instance = otherInstance;
            usedHash = hash.b;
        } 

        otherInstance = this.pickPrefab(
            `feature_${position.x}_${position.z}_plant`,
            HexFeatureCollection.plantFeatures,
            cell.plantLevel,
            hash.c,
            hash.d
        );

        if (instance) {
            if (otherInstance && hash.c < usedHash) {
                let tmp = instance;
                instance = otherInstance;
                tmp.dispose();
            } else if (otherInstance) {
                otherInstance.dispose();
            }
        }
        else if (otherInstance) {
            instance = otherInstance;
        }    
        else {
            return;
        }

        instance.position = position.clone();
        instance.position.y += instance.getBoundingInfo().boundingBox.extendSize.y;
        instance.position = HexMetrics.perturb(instance.position);
        instance.rotationQuaternion = BABYLON.Quaternion.FromEulerAngles(0, 360.0 * hash.e, 0);
        instance.setParent(this._container);
    }

    public addSpecialFeature(cell: HexCell, position: BABYLON.Vector3): void {
        let instance = HexFeatureCollection.specialFeatures[cell.specialIndex - 1].pickAndMake(1, "special_feature", this._scene);

        instance.position = HexMetrics.perturb(position);

        let hash = HexMetrics.sampleHashGrid(position);

        instance.rotationQuaternion = BABYLON.Quaternion.FromEulerAngles(0, 360.0 * hash.e, 0);

        instance.setParent(this._container);
    }

    pickPrefab(
        name:string, 
        collection: HexFeatureCollection[], 
        level: number, 
        hash: number, 
        choice: number
    ): Nullable<BABYLON.Mesh> {
        if (level > 0) {
            let thresholds = HexMetrics.getFeatureThreshold(level - 1);

            for (let i = 0; i < thresholds.length; i++) {
                if (hash < thresholds[i]) {
                    return collection[i].pickAndMake(choice, name, this._scene);
                }
            }
        }

        return null;
    }
}

class HexGridChunk {
    private _scene: BABYLON.Scene;
    private cells: HexCell[];
    private terrain: HexMesh;
    private rivers: HexMesh;
    private roads: HexMesh;
    private water: HexMesh;
    private waterShore: HexMesh;
    private estuaries: HexMesh;
    private features: HexFeatureManager;

    constructor(name: string, scene: BABYLON.Scene) {
        this._scene = scene;
        this.terrain = Prefabs.terrain(`${name}_terrain`, scene);
        this.rivers = Prefabs.rivers(`${name}_rivers`, scene);
        this.roads = Prefabs.roads(`${name}_roads`, scene);
        this.water = Prefabs.water(`${name}_water`, scene);
        this.waterShore = Prefabs.waterShore(`${name}_water_shore`, scene);
        this.estuaries = Prefabs.estuaries(`${name}_estuaries`, scene);
        this.features = new HexFeatureManager(scene);

        this.cells = new Array<HexCell>(HexMetrics.chunkSizeX * HexMetrics.chunkSizeZ);
    }

    addCell(index: number, cell: HexCell): void {
        this.cells[index] = cell;
        cell.chunk = this;
    }

    triangulate(): void {
        this.terrain.clear();
        this.rivers.clear();
        this.roads.clear();
        this.water.clear();
        this.waterShore.clear();
        this.estuaries.clear();
        this.features.clear();

        for (let i = 0; i < this.cells.length; i++) {
            let cell = this.cells[i];

            for (let direction = HexDirection.NE; direction <= HexDirection.NW; direction++) {
                this.triangulateCell(direction, cell);
            }

            if (!cell.isUnderwater) {
                if (!cell.hasRiver && !cell.hasRoads) {
                    this.features.addFeature(cell, cell.cellPosition);
                }                

                if (cell.isSpecial) {
                    this.features.addSpecialFeature(cell, cell.cellPosition);
                }
            }
        }

        this.terrain.apply();
        this.rivers.apply();
        this.roads.apply();
        this.water.apply();
        this.waterShore.apply();
        this.estuaries.apply();
        this.features.apply();
    }

    triangulateCell(direction: HexDirection, cell: HexCell): void {
        let
            center = cell.cellPosition.clone(),
            e = EdgeVertices.fromCorners(
                center.add(HexMetrics.getFirstSolidCorner(direction)),
                center.add(HexMetrics.getSecondSolidCorner(direction))
            );

        if (cell.hasRiver) {
            if (cell.hasRiverThroughEdge(direction)) {
                e.v3.y = cell.streamBedY;
                if (cell.hasRiverBeginingOrEnd) {
                    this.triangulateWithRiverBeginOrEnd(direction, cell, center, e);
                }
                else {
                    this.triangulateCellWithRiver(direction, cell, center, e);
                }
            }
            else {
                this.triangulateAdjecentToRiver(direction, cell, center, e);
            }
        } 
        else {
            this.triangulateCellWithoutRiver(direction, cell, center, e);

            if (!cell.isUnderwater && !cell.hasRoadThroughEdge(direction)) {
                this.features.addFeature(cell, center.add(e.v1).add(e.v5).scale(1/3));
            }
        }

        if (direction <= HexDirection.SE) {
            this.triangulateCellConnection(direction, cell, e);
        }

        if (cell.isUnderwater) {
            this.triangulateWater(direction, cell, center);
        }
    }

    triangulateWater(direction: HexDirection, cell: HexCell, center: BABYLON.Vector3): void {
        center = center.clone();

        center.y = cell.waterSurfaceY;

        let neighbor = cell.getNeighbor(direction);

        if (neighbor != null && !neighbor.isUnderwater) {
            this.triangulateWaterShore(direction, cell, neighbor, center);
        }
        else {
            this.triangulateOpenWater(direction, cell, neighbor, center);
        }
    }

    triangulateOpenWater(direction: HexDirection, cell: HexCell, neighbor: HexCell, center: BABYLON.Vector3): void {
        let
            c1 = center.add(HexMetrics.getFirstWaterCorner(direction)),
            c2 = center.add(HexMetrics.getSecondWaterCorner(direction));

        this.water.addTriangle(center, c1, c2);

        if (direction <= HexDirection.SE && neighbor != null) {
            let 
                bridge = HexMetrics.getWaterBridge(direction),
                e1 = c1.add(bridge),
                e2 = c2.add(bridge);

            this.water.addQuad(c1, c2, e1, e2);

            if (direction <= HexDirection.E) {
                let nextNeighbor = cell.getNeighbor(HexDirection.next(direction));

                if (nextNeighbor == null || !nextNeighbor.isUnderwater) {
                    return;
                }

                this.water.addTriangle(c2, e2, c2.add(HexMetrics.getWaterBridge(HexDirection.next(direction))));
            }
        }
    }

    triangulateWaterShore(direction: HexDirection, cell: HexCell, neighbor: HexCell, center: BABYLON.Vector3): void {
        let e1: EdgeVertices;

        e1 = EdgeVertices.fromCorners(
            center.add(HexMetrics.getFirstWaterCorner(direction)),
            center.add(HexMetrics.getSecondWaterCorner(direction))
        );

        this.water.addTriangle(center, e1.v1, e1.v2);
        this.water.addTriangle(center, e1.v2, e1.v3);
        this.water.addTriangle(center, e1.v3, e1.v4);
        this.water.addTriangle(center, e1.v4, e1.v5);

        let center2 = neighbor.cellPosition.clone();

        center2.y = center.y;

        let e2 = EdgeVertices.fromCorners(
            center2.add(HexMetrics.getSecondSolidCorner(HexDirection.opposite(direction))),
            center2.add(HexMetrics.getFirstSolidCorner(HexDirection.opposite(direction)))
        );
        
        if (cell.hasRiverThroughEdge(direction)) {
            this.triangulateEstuary(e1, e2, cell.incomingRiver == direction);
        } else {
            this.waterShore.addQuad(e1.v1, e1.v2, e2.v1, e2.v2);
            this.waterShore.addQuad(e1.v2, e1.v3, e2.v2, e2.v3);
            this.waterShore.addQuad(e1.v3, e1.v4, e2.v3, e2.v4);
            this.waterShore.addQuad(e1.v4, e1.v5, e2.v4, e2.v5);
            this.waterShore.addQuadUVMinMax(0, 0, 0, 1);
            this.waterShore.addQuadUVMinMax(0, 0, 0, 1);
            this.waterShore.addQuadUVMinMax(0, 0, 0, 1);
            this.waterShore.addQuadUVMinMax(0, 0, 0, 1);
        }

        let nextNeighbor = cell.getNeighbor(HexDirection.next(direction));
        if (nextNeighbor != null) {
            let v3 = nextNeighbor.cellPosition.clone().add(
                nextNeighbor.isUnderwater
                ? HexMetrics.getFirstWaterCorner(HexDirection.previous(direction))
                : HexMetrics.getFirstSolidCorner(HexDirection.previous(direction))
            );

            v3.y = center.y;

            this.waterShore.addTriangle(e1.v5, e2.v5, v3);
            this.waterShore.addTriangleUV(
                new BABYLON.Vector2(0, 0),
                new BABYLON.Vector2(0, 1),
                new BABYLON.Vector2(0, nextNeighbor.isUnderwater ? 0 : 1)
            );
        }
    }

    triangulateWaterfallInWater(
        v1: BABYLON.Vector3, v2: BABYLON.Vector3, v3: BABYLON.Vector3, v4: BABYLON.Vector3,
        y1: number, y2: number, waterY: number
    ): void {
        v1 = v1.clone();
        v2 = v2.clone();
        v3 = v3.clone();
        v4 = v4.clone();

        v1.y = v2.y = y1;
        v3.y = v4.y = y2;

        v1 = HexMetrics.perturb(v1);
        v2 = HexMetrics.perturb(v2);
        v3 = HexMetrics.perturb(v3);
        v4 = HexMetrics.perturb(v4);
        
        let t = (waterY - y2) / (y1 - y2);
        
        v3 = BABYLON.Vector3.Lerp(v3, v1, t);
        v4 = BABYLON.Vector3.Lerp(v4, v2, t);

        this.rivers.addQuadUnperturbed(v1, v2, v3, v4);
        this.rivers.addQuadUVMinMax(0, 1, 0.8, 1);
    }

    triangulateEstuary(e1: EdgeVertices, e2: EdgeVertices, incomingRiver: boolean): void {
        this.waterShore.addTriangle(e2.v1, e1.v2, e1.v1);
        this.waterShore.addTriangle(e2.v5, e1.v5, e1.v4);
        this.waterShore.addTriangleUV(
            new BABYLON.Vector2(0, 1),
            new BABYLON.Vector2(0, 0),
            new BABYLON.Vector2(0, 0)
        );
        this.waterShore.addTriangleUV(
            new BABYLON.Vector2(0, 1),
            new BABYLON.Vector2(0, 0),
            new BABYLON.Vector2(0, 0)
        );

        this.estuaries.addQuad(e2.v1, e1.v2, e2.v2, e1.v3);
        this.estuaries.addTriangle(e1.v3, e2.v2, e2.v4);
        this.estuaries.addQuad(e1.v3, e1.v4, e2.v4, e2.v5);

        this.estuaries.addQuadUV(
            new BABYLON.Vector2(0, 1), new BABYLON.Vector2(0, 0),
            new BABYLON.Vector2(1, 1), new BABYLON.Vector2(0, 0)
        );

        this.estuaries.addTriangleUV(
            new BABYLON.Vector2(0, 0),
            new BABYLON.Vector2(1, 1),
            new BABYLON.Vector2(1, 1)
        );

        this.estuaries.addQuadUV(
            new BABYLON.Vector2(0, 0), new BABYLON.Vector2(0, 0),
            new BABYLON.Vector2(1, 1), new BABYLON.Vector2(0, 1)
        );

        if (incomingRiver) {
            this.estuaries.addQuadUV2(
                new BABYLON.Vector2(1.5, 1.1), new BABYLON.Vector2(0.7, 1.15),
                new BABYLON.Vector2(1, 0.8), new BABYLON.Vector2(0.5, 1.1)
            );
            this.estuaries.addTriangleUV2(
                new BABYLON.Vector2(0.5, 1.1),
                new BABYLON.Vector2(1, 0.8),
                new BABYLON.Vector2(0, 0.8)
            );
            this.estuaries.addQuadUV2(
                new BABYLON.Vector2(0.5, 1.1), new BABYLON.Vector2(0.3, 1.15),
                new BABYLON.Vector2(0, 0.8), new BABYLON.Vector2(-0.5, 1.0)
            );
        }
        else {
            this.estuaries.addQuadUV2(
                new BABYLON.Vector2(-0.5, -0.2), new BABYLON.Vector2(0.3, -0.35),
                new BABYLON.Vector2(0, 0), new BABYLON.Vector2(0.5, -0.3)
            );
            this.estuaries.addTriangleUV2(
                new BABYLON.Vector2(0.5, -0.3),
                new BABYLON.Vector2(0, 0),
                new BABYLON.Vector2(1, 0)
            );
            this.estuaries.addQuadUV2(
                new BABYLON.Vector2(0.5, -0.3), new BABYLON.Vector2(0.7, -0.35),
                new BABYLON.Vector2(1, 0), new BABYLON.Vector2(1.5, -0.2)
            );
        }
    }

    triangulateCellWithoutRiver(direction: HexDirection, cell: HexCell, center: BABYLON.Vector3, e: EdgeVertices): void {
        this.triangulateEdgeFan(center, e, cell.color);

        if (cell.hasRoads) {
            let interpolators = HexMetrics.getRoadInterpolators(direction, cell);

            this.triangulateRoad(
                center,
                BABYLON.Vector3.Lerp(center, e.v1, interpolators.x),
                BABYLON.Vector3.Lerp(center, e.v5, interpolators.y),
                e,
                cell.hasRoadThroughEdge(direction)
            );
        }
    }

    triangulateCellWithRiver(direction: HexDirection, cell: HexCell, center: BABYLON.Vector3, e: EdgeVertices): void {
        let 
            prevDir = HexDirection.previous(direction),
            nextDir = HexDirection.next(direction),
            prev2Dir = HexDirection.previous2(direction),
            next2Dir = HexDirection.next2(direction),
            oppositeDir = HexDirection.opposite(direction),
            centerL: BABYLON.Vector3, 
            centerR: BABYLON.Vector3, 
            m: EdgeVertices;

        if (cell.hasRiverThroughEdge(oppositeDir)) {
            centerL = center.add(HexMetrics.getFirstSolidCorner(prevDir).scale(0.25));
            centerR = center.add(HexMetrics.getSecondSolidCorner(nextDir).scale(0.25));
        } 
        else if (cell.hasRiverThroughEdge(nextDir)) {
            centerL = center;
            centerR = BABYLON.Vector3.Lerp(center, e.v5, 2/3);
        }
        else if (cell.hasRiverThroughEdge(prevDir)) {
            centerL = BABYLON.Vector3.Lerp(center, e.v1, 2/3);
            centerR = center;
        }
        else if (cell.hasRiverThroughEdge(next2Dir)) {
            centerL = center;
            centerR = center.add(HexMetrics.getSolidEdgeMiddle(nextDir).scale(0.5 * HexMetrics.innerToOuter));
        }
        else {
            centerL = center.add(HexMetrics.getSolidEdgeMiddle(prevDir).scale(0.5 * HexMetrics.innerToOuter));
            centerR = center;
        }

        center = BABYLON.Vector3.Lerp(centerL, centerR, 0.5);

        m = EdgeVertices.fromCorners(
            BABYLON.Vector3.Lerp(centerL, e.v1, 0.5), 
            BABYLON.Vector3.Lerp(centerR, e.v5, 0.5),
            1/6
        );

        m.v3.y = center.y = e.v3.y;

        this.triangulateEdgeStrip(m, cell.color, e, cell.color);

        this.terrain.addTriangle(centerL, m.v1, m.v2);
        this.terrain.addTriangleColor1(cell.color);
        this.terrain.addQuad(centerL, center, m.v2, m.v3);
        this.terrain.addQuadColor1(cell.color);
        this.terrain.addQuad(center, centerR, m.v3, m.v4);
        this.terrain.addQuadColor1(cell.color);
        this.terrain.addTriangle(centerR, m.v4, m.v5);
        this.terrain.addTriangleColor1(cell.color);

        if (!cell.isUnderwater) {
            let reversed = cell.incomingRiver === direction;

            this.triangulateRiverQuad(centerL, centerR, m.v2, m.v4, cell.riverSurfaceY, 0.4, reversed);
            this.triangulateRiverQuad(m.v2, m.v4, e.v2, e.v4, cell.riverSurfaceY, 0.6, reversed);
        }
    }

    triangulateWithRiverBeginOrEnd(direction: HexDirection, cell: HexCell, center: BABYLON.Vector3, e: EdgeVertices): void {
        let m = EdgeVertices.fromCorners(
            BABYLON.Vector3.Lerp(center, e.v1, 0.5),
            BABYLON.Vector3.Lerp(center, e.v5, 0.5)
        );

        m.v3.y = e.v3.y;

        this.triangulateEdgeStrip(m, cell.color, e, cell.color);
        this.triangulateEdgeFan(center, m, cell.color);
        
        if (!cell.isUnderwater) {
            let reversed = cell.hasIncomingRiver;
            this.triangulateRiverQuad(
                m.v2, m.v4, e.v2, e.v4, cell.riverSurfaceY, 0.6, reversed
            );

            center = center.clone();
            m = m.clone();
            center.y = m.v2.y = m.v4.y = cell.riverSurfaceY;
            this.rivers.addTriangle(center, m.v2, m.v4);

            if (reversed) {
                this.rivers.addTriangleUV(
                    new BABYLON.Vector2(0.5, 0.4), 
                    new BABYLON.Vector2(1, 0.2), 
                    new BABYLON.Vector2(0, 0.2)
                );
            }
            else {
                this.rivers.addTriangleUV(
                    new BABYLON.Vector2(0.5, 0.4),
                    new BABYLON.Vector2(0, 0.6),
                    new BABYLON.Vector2(1, 0.6)
                );
            }
        }
    }

    triangulateAdjecentToRiver(direction: HexDirection, cell: HexCell, center: BABYLON.Vector3, e: EdgeVertices): void {
        if (cell.hasRoads) {
            this.triangulateRoadAdjectedToRiver(direction, cell, center, e);
        }

        if (cell.hasRiverThroughEdge(HexDirection.next(direction))) {
            if (cell.hasRiverThroughEdge(HexDirection.previous(direction))) {
                center = center.add(HexMetrics.getSolidEdgeMiddle(direction).scale(0.5 * HexMetrics.innerToOuter));
            }
            else if (cell.hasRiverThroughEdge(HexDirection.previous2(direction))) {
                center = center.add(HexMetrics.getFirstSolidCorner(direction).scale(0.25));
            }
        }
        else if (
            cell.hasRiverThroughEdge(HexDirection.previous(direction)) &&
            cell.hasRiverThroughEdge(HexDirection.next2(direction))
        ) {
            center = center.add(HexMetrics.getSecondSolidCorner(direction).scale(0.25));
        }
        
        let m = EdgeVertices.fromCorners(
            BABYLON.Vector3.Lerp(center, e.v1, 0.5),
            BABYLON.Vector3.Lerp(center, e.v5, 0.5)
        );

        this.triangulateEdgeStrip(m, cell.color, e, cell.color);
        this.triangulateEdgeFan(center, m, cell.color);

        if (!cell.isUnderwater && !cell.hasRoadThroughEdge(direction)) {
            this.features.addFeature(cell, center.add(e.v1).add(e.v5).scale(1/3));
        }
    }

    triangulateRoadAdjectedToRiver(direction: HexDirection, cell: HexCell, center: BABYLON.Vector3, e: EdgeVertices): void {
        let
            hasRoadThroughEdge = cell.hasRoadThroughEdge(direction),
            previousHasRiver = cell.hasRiverThroughEdge(HexDirection.previous(direction)),
            nextHasRiver = cell.hasRiverThroughEdge(HexDirection.next(direction)),
            interpolators = HexMetrics.getRoadInterpolators(direction, cell),
            roadCenter = center.clone();

        if (cell.hasRiverBeginingOrEnd) {
            let oppositeDir = HexDirection.opposite(cell.riverBeginOrEndDirection);

            roadCenter = roadCenter.add(HexMetrics.getSolidEdgeMiddle(oppositeDir).scale(1/3));
        }
        else if (cell.incomingRiver === HexDirection.opposite(cell.outgoingRiver)) {
            let corner: BABYLON.Vector3;

            if (previousHasRiver) {
                if (!hasRoadThroughEdge && !cell.hasRoadThroughEdge(HexDirection.next(direction))) {
                    return;
                }

                corner = HexMetrics.getSecondSolidCorner(direction);
            }
            else {
                if (!hasRoadThroughEdge && !cell.hasRoadThroughEdge(HexDirection.previous(direction))) {
                    return;
                }

                corner = HexMetrics.getFirstSolidCorner(direction);
            }

            roadCenter = roadCenter.add(corner.scale(0.5));
            if (
                cell.incomingRiver === HexDirection.next(direction) && 
                (
                    cell.hasRoadThroughEdge(HexDirection.next2(direction)) ||
                    cell.hasRoadThroughEdge(HexDirection.opposite(direction))
                )
            ) {
                this.features.addBridge(roadCenter, center.subtract(corner.scale(0.5)));
            }
            center = center.add(corner.scale(0.25));
        }
        else if (cell.incomingRiver === HexDirection.previous(cell.outgoingRiver)) {
            roadCenter = roadCenter.subtract(HexMetrics.getSecondCorner(cell.incomingRiver).scale(0.2));
        }
        else if (cell.incomingRiver === HexDirection.next(cell.outgoingRiver)) {
            roadCenter = roadCenter.subtract(HexMetrics.getFirstCorner(cell.incomingRiver).scale(0.2));
        }
        else if (previousHasRiver && nextHasRiver) {
            if (!hasRoadThroughEdge) {
                return;
            }

            let offset = HexMetrics.getSolidEdgeMiddle(direction).scale(HexMetrics.innerToOuter);

            roadCenter = roadCenter.add(offset.scale(0.7));
            center = center.add(offset.scale(0.5));
        }
        else {
            let middle: HexDirection;

            if (previousHasRiver) {
                middle = HexDirection.next(direction);
            }
            else if (nextHasRiver) {
                middle = HexDirection.previous(direction);
            }
            else {
                middle = direction;
            }

            if (
                !cell.hasRoadThroughEdge(middle) &&
                !cell.hasRoadThroughEdge(HexDirection.previous(middle)) &&
                !cell.hasRoadThroughEdge(HexDirection.next(middle))
            ) {
                return;
            }

            let offset = HexMetrics.getSolidEdgeMiddle(middle);
            
            roadCenter = roadCenter.add(offset.scale(0.25));

            if (direction === middle && cell.hasRoadThroughEdge(HexDirection.opposite(direction))) {
                this.features.addBridge(
                    roadCenter,
                    center.subtract(offset.scale(HexMetrics.innerToOuter * 0.7))
                );
            }
        }

        let
            mL = BABYLON.Vector3.Lerp(roadCenter, e.v1, interpolators.x),
            mR = BABYLON.Vector3.Lerp(roadCenter, e.v5, interpolators.y);

        this.triangulateRoad(roadCenter, mL, mR, e, hasRoadThroughEdge);

        if (previousHasRiver) {
            this.triangulateRoadEdge(roadCenter, center, mL);
        }
        if (nextHasRiver) {
            this.triangulateRoadEdge(roadCenter, mR, center);
        }
    }

    triangulateRoad(
        center: BABYLON.Vector3, mL: BABYLON.Vector3,
        mR: BABYLON.Vector3, e: EdgeVertices,
        hasRoadThroughCellEdge: boolean
    ): void {
        if (hasRoadThroughCellEdge) {
            let mC = BABYLON.Vector3.Lerp(mL, mR, 0.5);

            this.triangulateRoadSegment(mL, mC, mR, e.v2, e.v3, e.v4);
            this.roads.addTriangle(center, mL, mC);
            this.roads.addTriangle(center, mC, mR);
            this.roads.addTriangleUV(
                new BABYLON.Vector2(1, 0), 
                new BABYLON.Vector2(0, 0), 
                new BABYLON.Vector2(1, 0)
            );
            this.roads.addTriangleUV(
                new BABYLON.Vector2(1, 0), 
                new BABYLON.Vector2(1, 0), 
                new BABYLON.Vector2(0, 0)
            );
        }
        else {
            this.triangulateRoadEdge(center, mL, mR);
        }
    } 

    triangulateRoadEdge(center: BABYLON.Vector3, mL: BABYLON.Vector3, mR: BABYLON.Vector3): void {
        this.roads.addTriangle(center, mL, mR);
        this.roads.addTriangleUV(
            new BABYLON.Vector2(1, 0),
            new BABYLON.Vector2(0, 0),
            new BABYLON.Vector2(0, 0)
        );
    }

    triangulateEdgeFan(center: BABYLON.Vector3, edge: EdgeVertices, color: BABYLON.Color4): void {
        this.terrain.addTriangle(center, edge.v1, edge.v2);
        this.terrain.addTriangleColor1(color);
        this.terrain.addTriangle(center, edge.v2, edge.v3);
        this.terrain.addTriangleColor1(color);
        this.terrain.addTriangle(center, edge.v3, edge.v4);
        this.terrain.addTriangleColor1(color);
        this.terrain.addTriangle(center, edge.v4, edge.v5);
        this.terrain.addTriangleColor1(color);
    }

    triangulateEdgeStrip(
        e1: EdgeVertices, c1: BABYLON.Color4, 
        e2: EdgeVertices, c2: BABYLON.Color4,
        hasRoad: boolean = false
    ): void {
        this.terrain.addQuad(e1.v1, e1.v2, e2.v1, e2.v2);
        this.terrain.addQuadColor2(c1, c2);
        this.terrain.addQuad(e1.v2, e1.v3, e2.v2, e2.v3);
        this.terrain.addQuadColor2(c1, c2);
        this.terrain.addQuad(e1.v3, e1.v4, e2.v3, e2.v4);
        this.terrain.addQuadColor2(c1, c2);
        this.terrain.addQuad(e1.v4, e1.v5, e2.v4, e2.v5);
        this.terrain.addQuadColor2(c1, c2);

        if (hasRoad) {
            this.triangulateRoadSegment(e1.v2, e1.v3, e1.v4, e2.v2, e2.v3, e2.v4);
        }
    }

    triangulateCellConnection(direction: HexDirection, cell: HexCell, e1: EdgeVertices): void {
        let neighbor = cell.getNeighbor(direction);
            
        if (neighbor == null) {
            return;
        }

        let bridge = HexMetrics.getBridge(direction);
        bridge.y = neighbor.cellPosition.y - cell.cellPosition.y;

        let e2 = EdgeVertices.fromCorners(e1.v1.add(bridge), e1.v5.add(bridge));

        let
            hasRiver = cell.hasRiverThroughEdge(direction),
            hasRoad = cell.hasRoadThroughEdge(direction);

        if (hasRiver) {
            e2.v3.y = neighbor.streamBedY;

            if (!cell.isUnderwater) {
                if (!neighbor.isUnderwater) {
                    this.triangulateRiverQuadWithDiff(
                        e1.v2, e1.v4, e2.v2, e2.v4,
                        cell.riverSurfaceY, neighbor.riverSurfaceY, 0.8,
                        cell.hasIncomingRiver && cell.incomingRiver === direction
                    );
                }
                else if (cell.elevation > neighbor.waterLevel) {
                    this.triangulateWaterfallInWater(
                        e1.v2, e1.v4, e2.v2, e2.v4,
                        cell.riverSurfaceY, neighbor.riverSurfaceY,
                        neighbor.waterSurfaceY
                    );
                }
            }
            else if (!neighbor.isUnderwater && neighbor.elevation > cell.waterLevel) {
                this.triangulateWaterfallInWater(
                    e2.v4, e2.v2, e1.v4, e1.v2,
                    neighbor.riverSurfaceY, cell.riverSurfaceY,
                    cell.waterSurfaceY
                );
            }
        }

        if (cell.getEdgeType(direction) === HexEdgeType.Slope) {
            this.triangulateCellEdgeTerraces(e1, cell, e2, neighbor, hasRoad);
        } else {
            this.triangulateEdgeStrip(e1, cell.color, e2, neighbor.color, hasRoad);
        }

        this.features.addWall(e1, cell, e2, neighbor, hasRiver, hasRoad);

        let 
            nextNeighborDirection = HexDirection.next(direction),
            nextNeighbor = cell.getNeighbor(nextNeighborDirection);

        if (direction <= HexDirection.E && nextNeighbor != null) {
            let v5 = e1.v5.add(HexMetrics.getBridge(nextNeighborDirection));
            v5.y = nextNeighbor.cellPosition.y;

            if (cell.elevation <= neighbor.elevation) {
                if (cell.elevation <= nextNeighbor.elevation) {
                    this.triangulateCellCorner(e1.v5, cell, e2.v5, neighbor, v5, nextNeighbor);
                } else {
                    this.triangulateCellCorner(v5, nextNeighbor, e1.v5, cell, e2.v5, neighbor);
                }             
            }
            else if (neighbor.elevation <= nextNeighbor.elevation) {
                this.triangulateCellCorner(e2.v5, neighbor, v5, nextNeighbor, e1.v5, cell);
            }
            else {
                this.triangulateCellCorner(v5, nextNeighbor, e1.v5, cell, e2.v5, neighbor);
            }
        }
    }

    triangulateCellCorner(
        bottom: BABYLON.Vector3, bottomCell: HexCell,
        left: BABYLON.Vector3, leftCell: HexCell,
        right: BABYLON.Vector3, rightCell: HexCell
    ): void {
        let
            leftEdgeType = bottomCell.getEdgeTypeForCell(leftCell),
            rightEdgeType = bottomCell.getEdgeTypeForCell(rightCell);

        if (leftEdgeType === HexEdgeType.Slope) {
            if (rightEdgeType === HexEdgeType.Slope) {
                this.triangulateCellCornerTerraces(bottom, bottomCell, left, leftCell, right, rightCell);
            }
            else if (rightEdgeType === HexEdgeType.Flat) {
                this.triangulateCellCornerTerraces(left, leftCell, right, rightCell, bottom, bottomCell);
            } 
            else {
                this.triangulateCellCornerTerracesCliff(bottom, bottomCell, left, leftCell, right, rightCell);
            }
        }
        else if (rightEdgeType === HexEdgeType.Slope) {
            if (leftEdgeType === HexEdgeType.Flat) {
                this.triangulateCellCornerTerraces(right, rightCell, bottom, bottomCell, left, leftCell);
            } 
            else {
                this.triangulateCellCornerCliffTerraces(bottom, bottomCell, left, leftCell, right, rightCell);
            }
        }
        else if (leftCell.getEdgeTypeForCell(rightCell) === HexEdgeType.Slope) {
            if (leftCell.elevation < rightCell.elevation) {
                this.triangulateCellCornerCliffTerraces(right, rightCell, bottom, bottomCell, left, leftCell);
            } 
            else {
                this.triangulateCellCornerTerracesCliff(left, leftCell, right, rightCell, bottom, bottomCell);
            }
        } 
        else {
            this.terrain.addTriangle(bottom, left, right);
            this.terrain.addTriangleColor(bottomCell.color, leftCell.color, rightCell.color);
        }

        this.features.addWallCorner(bottom, bottomCell, left, leftCell, right, rightCell);
    }

    triangulateCellCornerTerraces(
        begin: BABYLON.Vector3, beginCell: HexCell,
        left: BABYLON.Vector3, leftCell: HexCell,
        right: BABYLON.Vector3, rightCell: HexCell
    ): void {
        let
            v3 = HexMetrics.terraceLerp(begin, left, 1),
            v4 = HexMetrics.terraceLerp(begin, right, 1),
            c3 = HexMetrics.terraceColorLerp(beginCell.color, leftCell.color, 1),
            c4 = HexMetrics.terraceColorLerp(beginCell.color, rightCell.color, 1);

        this.terrain.addTriangle(begin, v3, v4);
        this.terrain.addTriangleColor(beginCell.color, c3, c4);

        let i: number,
            v1: BABYLON.Vector3,
            v2: BABYLON.Vector3,
            c1: BABYLON.Color4,
            c2: BABYLON.Color4;

        for (i = 2; i < HexMetrics.terraceSteps; i++) {
            v1 = v3;
            v2 = v4;
            c1 = c3;
            c2 = c4;
            v3 = HexMetrics.terraceLerp(begin, left, i);
            v4 = HexMetrics.terraceLerp(begin, right, i);
            c3 = HexMetrics.terraceColorLerp(beginCell.color, leftCell.color, i);
            c4 = HexMetrics.terraceColorLerp(beginCell.color, rightCell.color, i);

            this.terrain.addQuad(v1, v2, v3, v4);
            this.terrain.addQuadColor(c1, c2, c3, c4);
        }

        this.terrain.addQuad(v3, v4, left, right);
        this.terrain.addQuadColor(c3, c4, leftCell.color, rightCell.color);
    }

    triangulateCellCornerTerracesCliff(
        begin: BABYLON.Vector3, beginCell: HexCell,
        left: BABYLON.Vector3, leftCell: HexCell,
        right: BABYLON.Vector3, rightCell: HexCell
    ): void {
        let
            b = Math.abs(1.0 / (rightCell.elevation - beginCell.elevation)),
            boundry = BABYLON.Vector3.Lerp(HexMetrics.perturb(begin), HexMetrics.perturb(right), b),
            boundryColor = BABYLON.Color4.Lerp(beginCell.color, rightCell.color, b);

        this.trinagulateCellBoundryTriangle(begin, beginCell, left, leftCell, boundry, boundryColor);

        if (leftCell.getEdgeTypeForCell(rightCell) === HexEdgeType.Slope) {
            this.trinagulateCellBoundryTriangle(left, leftCell, right, rightCell, boundry, boundryColor);
        } else {
            this.terrain.addTriangleUnperturbed(HexMetrics.perturb(left), HexMetrics.perturb(right), boundry);
            this.terrain.addTriangleColor(leftCell.color, rightCell.color, boundryColor);
        }
    }

    triangulateCellCornerCliffTerraces(
        begin: BABYLON.Vector3, beginCell: HexCell,
        left: BABYLON.Vector3, leftCell: HexCell,
        right: BABYLON.Vector3, rightCell: HexCell
    ): void {
        let
            b = Math.abs(1.0 / (leftCell.elevation - beginCell.elevation)),
            boundry = BABYLON.Vector3.Lerp(HexMetrics.perturb(begin), HexMetrics.perturb(left), b),
            boundryColor = BABYLON.Color4.Lerp(beginCell.color, leftCell.color, b);

        this.trinagulateCellBoundryTriangle(right, rightCell, begin, beginCell, boundry, boundryColor);

        if (leftCell.getEdgeTypeForCell(rightCell) === HexEdgeType.Slope) {
            this.trinagulateCellBoundryTriangle(left, leftCell, right, rightCell, boundry, boundryColor);
        } else {
            this.terrain.addTriangleUnperturbed(HexMetrics.perturb(left), HexMetrics.perturb(right), boundry);
            this.terrain.addTriangleColor(leftCell.color, rightCell.color, boundryColor);
        }
    }

    trinagulateCellBoundryTriangle(
        begin: BABYLON.Vector3, beginCell: HexCell,
        left: BABYLON.Vector3, leftCell: HexCell,
        boundry: BABYLON.Vector3, boundryColor: BABYLON.Color4
    ): void {
        let
            v2 = HexMetrics.perturb(HexMetrics.terraceLerp(begin, left, 1)),
            c2 = HexMetrics.terraceColorLerp(beginCell.color, leftCell.color, 1);

        this.terrain.addTriangleUnperturbed(HexMetrics.perturb(begin), v2, boundry);
        this.terrain.addTriangleColor(beginCell.color, c2, boundryColor);

        let 
            i: number,
            v1: BABYLON.Vector3,
            c1: BABYLON.Color4;

        for (i = 2; i < HexMetrics.terraceSteps; i++) {
            v1 = v2;
            c1 = c2;
            v2 = HexMetrics.perturb(HexMetrics.terraceLerp(begin, left, i));
            c2 = HexMetrics.terraceColorLerp(beginCell.color, leftCell.color, i);

            this.terrain.addTriangleUnperturbed(v1, v2, boundry);
            this.terrain.addTriangleColor(c1, c2, boundryColor);
        }

        this.terrain.addTriangleUnperturbed(v2, HexMetrics.perturb(left), boundry);
        this.terrain.addTriangleColor(c2, leftCell.color, boundryColor);
    }

    triangulateCellEdgeTerraces(
        begin: EdgeVertices, beginCell: HexCell, 
        end: EdgeVertices, endCell: HexCell,
        hasRoad: boolean
    ): void {
        let
            e2 = EdgeVertices.terraceLerp(begin, end, 1),
            c2 = HexMetrics.terraceColorLerp(beginCell.color, endCell.color, 1);

        this.triangulateEdgeStrip(begin, beginCell.color, e2, c2, hasRoad);

        let e1: EdgeVertices, c1: BABYLON.Color4;
            
        for (let i = 2; i < HexMetrics.terraceSteps; i++) {
            e1 = e2;
            c1 = c2;
            e2 = EdgeVertices.terraceLerp(begin, end, i);
            c2 = HexMetrics.terraceColorLerp(beginCell.color, endCell.color, i);

            this.triangulateEdgeStrip(e1, c1, e2, c2, hasRoad);
        }

        this.triangulateEdgeStrip(e2, c2, end, endCell.color, hasRoad);
    }

    triangulateRoadSegment(
        v1: BABYLON.Vector3, v2: BABYLON.Vector3, v3: BABYLON.Vector3,
        v4: BABYLON.Vector3, v5: BABYLON.Vector3, v6: BABYLON.Vector3
    ): void {
        this.roads.addQuad(v1, v2, v4, v5);
        this.roads.addQuad(v2, v3, v5, v6);
        this.roads.addQuadUVMinMax(0, 1, 0, 0);
        this.roads.addQuadUVMinMax(1, 0, 0, 0);
    }

    triangulateRiverQuad(
        v1: BABYLON.Vector3, 
        v2: BABYLON.Vector3, 
        v3: BABYLON.Vector3, 
        v4: BABYLON.Vector3, 
        y: number,
        v: number,
        reversed: boolean
    ): void {
        this.triangulateRiverQuadWithDiff(v1, v2, v3, v4, y, y, v, reversed);
    }

    triangulateRiverQuadWithDiff(
        v1: BABYLON.Vector3, 
        v2: BABYLON.Vector3, 
        v3: BABYLON.Vector3, 
        v4: BABYLON.Vector3, 
        y1: number,
        y2: number,
        v: number,
        reversed: boolean
    ): void {
        v1 = v1.clone();
        v2 = v2.clone();
        v3 = v3.clone();
        v4 = v4.clone();

        v1.y = v2.y = y1;
        v3.y = v4.y = y2;

        this.rivers.addQuad(v1, v2, v3, v4);
        if (reversed) {
            this.rivers.addQuadUVMinMax(1, 0, v, v + 0.2);
        } 
        else {
            this.rivers.addQuadUVMinMax(0, 1, 0.8 - v, 0.6 - v);
        }
    }

    refresh(): void {
        HexGrid.CHUNKS_TO_REFRESH.set(this.terrain.name, this);
    }

    doRefresh(): void {
        this.triangulate();
    }
}

class HexGrid {
    public static CHUNKS_TO_REFRESH: Map<string, HexGridChunk> = new Map<string, HexGridChunk>();

    private cellCountX: number = 6;
    private cellCountZ: number = 6;
    public chunkCountX: number = 3;
    public chunkCountZ: number = 3;
    public cells: HexCell[];
    public chunks: HexGridChunk[];
    private _scene: BABYLON.Scene;

    public defaultColor: BABYLON.Color4 = HexCellColor.PASTEL_BLUE;

    // public static defaultGridonfiguration = {};
    public static defaultGridonfiguration = {
        "(0, -1, 1)": {color: HexCellColor.PASTEL_YELLOW, elevation: 1},
        "(2, -3, 1)": {color: HexCellColor.PASTEL_YELLOW, elevation: 1},
        "(3, -4, 1)": {color: HexCellColor.PASTEL_YELLOW, elevation: 1},
        "(-1, -1, 2)": {color: HexCellColor.PASTEL_YELLOW, elevation: 1},
        "(3, -5, 2)": {color: HexCellColor.PASTEL_YELLOW, elevation: 1},
        "(4, -6, 2)": {color: HexCellColor.PASTEL_YELLOW, elevation: 1},
        "(-1, -2, 3)": {color: HexCellColor.PASTEL_YELLOW, elevation: 1},
        "(0, -3, 3)": {color: HexCellColor.PASTEL_YELLOW, elevation: 1},
        "(1, -4, 3)": {color: HexCellColor.PASTEL_YELLOW, elevation: 1},
        "(2, -5, 3)": {color: HexCellColor.PASTEL_YELLOW, elevation: 1},

        "(1, -2, 1)": {color: HexCellColor.PASTEL_GREEN, elevation: 2},
        "(0, -2, 2)": {color: HexCellColor.PASTEL_GREEN, elevation: 2},
        "(1, -3, 2)": {color: HexCellColor.PASTEL_GREEN, elevation: 2},
        "(2, -4, 2)": {color: HexCellColor.PASTEL_GREEN, elevation: 2}
    };

    constructor(scene: BABYLON.Scene) {
        this._scene = scene;
        this.cellCountX = this.chunkCountX * HexMetrics.chunkSizeX;
        this.cellCountZ = this.chunkCountZ * HexMetrics.chunkSizeZ;
    }

    public static refresh(): void {
        HexGrid.CHUNKS_TO_REFRESH.forEach((c: HexGridChunk, k, _) => {
            c.doRefresh();
        });

        HexGrid.CHUNKS_TO_REFRESH = new Map<string, HexGridChunk>();
    }

    generate(): void {
        let texture = new BABYLON.Texture(
            './assets/gfx/material/noise.png', 
            this._scene,
            false, 
            false, 
            BABYLON.Texture.BILINEAR_SAMPLINGMODE,
            null,
            null,
            null,
            null,
            BABYLON.Engine.TEXTUREFORMAT_RGBA
        );

        (<any>window).txtr = texture;
        
        let convert = (incomingData) => { // incoming data is a UInt8Array
            var i, l = incomingData.length;
            var outputData = new Float32Array(incomingData.length);
            for (i = 0; i < l; i++) {
                outputData[i] = incomingData[i]/256.0;
            }
            return outputData;
        };

        texture.onLoadObservable.addOnce((event, estate) => {
            let noiseTexture: Texture,
                bilinearTexture: Texture;

            noiseTexture = new Texture(
                convert(texture.readPixels()),
                texture.getSize().width,
                texture.getSize().height
            );
            
            bilinearTexture = new Texture(
                Float32Array.from(noiseTexture.data), 
                noiseTexture.width, 
                noiseTexture.height
            );
            
            Texture.bilinearFiltered(noiseTexture, bilinearTexture, 1.0);
            HexMetrics.noiseTexture = bilinearTexture;
            
            HexMetrics.initializeHashGrid(1234);

            this.makeChunks();
            this.makeCells();

            this.chunks.forEach(c => c.refresh());
        });
    }

    makeCells(): void {
        this.cells = new Array<HexCell>(this.cellCountX*this.cellCountZ);
        let i = 0;

        for (let z = 0; z < this.cellCountZ; z++) {
            for (let x = 0; x < this.cellCountX; x++) {
                this.cells[i] = this.makeCell(x, z, i);
                i++;
            }
        }
    }

    makeChunks(): void {
        this.chunks = new Array<HexGridChunk>(this.chunkCountX * this.chunkCountZ);
        let i = 0;

        for (let z = 0; z < this.chunkCountZ; z++) {
            for (let x = 0; x < this.chunkCountX; x++) {
                this.chunks[i] = new HexGridChunk(`hex_${x}_${z}`, this._scene);
                i++;
            }
        }
    }

    getCell(position: BABYLON.Vector3): HexCell {
        let 
            coordinates = HexCoordinates.fromPosition(position),
            index = coordinates.x + coordinates.z * this.cellCountX + Math.floor(coordinates.z/2.0);

        return this.cells[index];
    }

    getCellByHexCoordinates(coordinates: HexCoordinates): Nullable<HexCell> {
        const
            z = coordinates.z,
            x = coordinates.x + ~~(z/2);

        if (z < 0 || z >= this.cellCountZ || x < 0 || x >= this.cellCountX) {
            return null;
        }

        return this.cells[x + z*this.cellCountX];
    }

    makeCell(x: number, z: number, i: number): HexCell {
        let 
            cell = new HexCell(`hex_cell_${x}_${z}`, this._scene),
            cellPosition = new BABYLON.Vector3(
                (x + z*0.5 - Math.floor(z/2)) * (HexMetrics.innerRadius * 2.0),
                0.0,
                z * (HexMetrics.outerRadius * 1.5)
            );

        cell.coordinates = HexCoordinates.fromOffsetCoordinates(x, z);
        cell.isVisible = true;
        cell.isPickable = false;
        cell.cellPosition = cellPosition;

        // let material = new BABYLON.StandardMaterial(`${x}${z}-material`, this._scene),
        //     textTexture = this.makeCellText(cell.coordinates.toString());

        // material.diffuseTexture = textTexture;
        // material.opacityTexture = textTexture;
        // material.specularColor = BABYLON.Color3.Black();

        // cell.material = material;

        if (cell.coordinates.toString() in HexGrid.defaultGridonfiguration) {
            let cfg = HexGrid.defaultGridonfiguration[cell.coordinates.toString()];
            cell.elevation = cfg.elevation;
        } else {
            cell.elevation = 0;
        }

        if (x > 0) {
            cell.setNeighbor(HexDirection.W, this.cells[i-1]);
        }
        if (z > 0) {
            if ((z & 1) === 0) {
                cell.setNeighbor(HexDirection.SE, this.cells[i - this.cellCountX]);
                if (x > 0) {
                    cell.setNeighbor(HexDirection.SW, this.cells[i - this.cellCountX - 1]);
                }
            } else {
                cell.setNeighbor(HexDirection.SW, this.cells[i - this.cellCountX]);
                if (x < this.cellCountX - 1) {
                    cell.setNeighbor(HexDirection.SE, this.cells[i - this.cellCountX + 1]);
                }
            }
        }

        this.addCellToChunk(x, z, cell);

        cell.isVisible = false;

        return cell;
    }

    private makeCellText(txt: string): BABYLON.DynamicTexture {
        let size = 64;
        let DTw = 10*60;
        let DTh = 10*60;
        let textTexture = new BABYLON.DynamicTexture("DT", {width: DTw, height: DTh}, this._scene, false);
        textTexture.hasAlpha = true;
        let textCtx = textTexture.getContext();
        textCtx.font = `${size}px bold monospace`;
        textCtx.fillStyle = "transparent";
        let textWidth = textCtx.measureText(txt).width;
        let ratio = textWidth/size;
        let fontSize = Math.floor(DTw / ratio);
    
        textTexture.drawText(txt, null, null, `${fontSize}px bold monospace`, "black", null);

        return textTexture;
    }

    private addCellToChunk(x: number, z: number, cell: HexCell): void {
        let
            chunkX = ~~(x / HexMetrics.chunkSizeX),
            chunkZ = ~~(z / HexMetrics.chunkSizeZ),
            chunk = this.chunks[chunkX + chunkZ * this.chunkCountX],
            localX = x - chunkX * HexMetrics.chunkSizeX,
            localZ = z - chunkZ * HexMetrics.chunkSizeZ;

        chunk.addCell(localX + localZ * HexMetrics.chunkSizeX, cell);
    }

    public save(writer: ByteBuffer): void {
        this.cells.forEach((cell: HexCell) => cell.save(writer));
    }

    public load(reader: ByteBuffer): void {
        this.cells.forEach((cell: HexCell) => cell.load(reader));
        this.chunks.forEach((chunk: HexGridChunk) => chunk.refresh());
    }
}

enum OptionalToggle {
    Ignore, Yes, No
}

class HexMapEditor {
    public static POINTER_BLOCKED_BY_GUI = false;

    private grid: HexGrid;
    private _scene: BABYLON.Scene;

    private _toolkitPanelOpened = false;
    private _toolkitPanel;
    private _toolkitPanelContainer;
    private _toolkitPanelToogle;
    
    private activeTerrainTypeIndex: number;
    private activeElevation: number = 0.0;
    private activeWaterLevel: number = 0.0;
    private activeUrbanLevel: number = 0.0;
    private activeFarmLevel: number = 0.0;
    private activePlantLevel: number = 0.0;
    private activeSpecialIndex: number = 0;

    private isElevationSelected: boolean = false;
    private isWaterLevelSelected: boolean = false;
    private isUrbanLevelSelected: boolean = false;
    private isFarmLevelSelected: boolean = false;
    private isPlantLevelSelected: boolean = false;
    private isSpecialIndexSelected: boolean = false;

    private brushSize: number = 0;
    private riverMode: OptionalToggle = OptionalToggle.Ignore;
    private roadMode: OptionalToggle = OptionalToggle.Ignore;
    private walledMode: OptionalToggle = OptionalToggle.Ignore;

    private isPointerDown: boolean = false;
    private isDrag: boolean = false;
    private dragDirection: HexDirection;
    private previousCell: Nullable<HexCell>;

    constructor(grid: HexGrid) {
        this.grid = grid;

        this.makePanel();
    }

    private static enumToSelectList(enumerable: Object): Array<any> {
        let names = Object.keys(enumerable).filter(k => typeof enumerable[k] === 'number') as string[];

        return names.map(name => {
            return {label: name, value: enumerable[name]};
        });
    }

    private showPanel(): void {
        this._toolkitPanelOpened = true;
        this._toolkitPanel.style.webkitTransform = 'translateX(17em)';
        this._toolkitPanel.style.transform = 'translateX(17em)';
    }

    private hidePanel(): void {
        this._toolkitPanelOpened = false;
        this._toolkitPanel.style.webkitTransform = 'translateX(0px)';
        this._toolkitPanel.style.transform = 'translateX(0px)';
    }

    private makePanel() {
        this._toolkitPanel = document.getElementById('guiPanel');
        this._toolkitPanelToogle = document.getElementById('guiClickableTag');
        this._toolkitPanelContainer = document.getElementById('guiPanelContainer');

        this._toolkitPanelToogle.addEventListener('click', () => {
            if (this._toolkitPanelOpened) {
                this.hidePanel();
            }
            else {
                this.showPanel();
            }
        });

        let 
            i = 0,
            terrainTypeSelection = [{label: "Ignore", value: -1}];
            
        HexCellColor.colors.forEach((_v: any, key: string) => {
            terrainTypeSelection.push({label: key, value: i++});
        });
        
        this.addPanelSelect("Terrain", terrainTypeSelection, this.setTerrainTypeIndex.bind(this));
        this.addPanelSelect("River", HexMapEditor.enumToSelectList(OptionalToggle), this.setRiverMode.bind(this));
        this.addPanelSelect("Road", HexMapEditor.enumToSelectList(OptionalToggle), this.setRoadMode.bind(this));
        this.addPanelSelect("Wall", HexMapEditor.enumToSelectList(OptionalToggle), this.setWalledMode.bind(this));
        this.addPanelToggleSlider("Elevation", 0, 7, 0, this.toggleElevation.bind(this), this.setElevation.bind(this));
        this.addPanelToggleSlider("Water level", 0, 7, 0, this.toggleWaterLevel.bind(this), this.setWaterLevel.bind(this));
        this.addPanelToggleSlider("Special", 0, 3, 0, this.toggleSpecialIndex.bind(this), this.setSpecialIndex.bind(this));
        this.addPanelToggleSlider("Urban level", 0, 3, 0, this.toggleUrbanLevel.bind(this), this.setUrbanLevel.bind(this));
        this.addPanelToggleSlider("Farm level", 0, 3, 0, this.toggleFarmLevel.bind(this), this.setFarmLevel.bind(this));
        this.addPanelToggleSlider("Plant level", 0, 3, 0, this.togglePlantLevel.bind(this), this.setPlantLevel.bind(this));
        this.addPanelToggleSlider("Brush", 0, 4, 0, () => {}, this.setBrushSize.bind(this));

        let 
            btnGroup = document.createElement('div'),
            saveBtn = document.createElement('button'),
            loadBtn = document.createElement('input');

        saveBtn.innerText = "Save";
        // loadBtn.innerText = "Load";
        loadBtn.type = 'File';

        saveBtn.onclick = this.save.bind(this);
        loadBtn.onchange = this.load.bind(this);

        btnGroup.appendChild(saveBtn);
        btnGroup.appendChild(loadBtn);

        this._toolkitPanelContainer.appendChild(btnGroup);
    }

    addPanelSelect(label: string, options: Array<any>, callbackFn): void {
        let 
            group = document.createElement('div'),
            groupLabel = document.createElement('label'),
            select = document.createElement('select');

        groupLabel.innerHTML = label + ': ';

        options.forEach((o: any) => {
            let opt = document.createElement('option');
            opt.value = o.value;
            opt.innerText = o.label;

            select.append(opt);
        });

        group.onchange = (changeEvent: any) => {
            let idx = changeEvent.srcElement.selectedIndex;

            callbackFn(changeEvent.srcElement[idx].value);
        };

        group.appendChild(groupLabel);
        group.appendChild(select);

        this._toolkitPanelContainer.appendChild(group);
        this._toolkitPanelContainer.appendChild(document.createElement('hr'));
    }

    addPanelToggleSlider(
        label: string, 
        minVal: number, 
        maxVal: number, 
        defaultVal: number, 
        toggleCallbackFn: (a: any) => void, 
        valueChangeCallbackFn: (a: any) => void
    ) {
        let
            group = document.createElement('div'),
            groupLabel = document.createElement('label'),
            toggle = document.createElement('input'),
            slider = document.createElement('input'),
            formatLabel = (v) => { return `${label} (${v})<br>`; };

        groupLabel.innerHTML = formatLabel(defaultVal);

        toggle.type = 'checkbox';
        toggle.value = '';
        toggle.onclick = (event: any) => {
            toggleCallbackFn(event.srcElement.checked);
        };
        
        slider.type = 'range';
        slider.min = `${minVal}`;
        slider.max = `${maxVal}`;
        slider.value = `${defaultVal}`;
        slider.onchange = (event: any) => {
            let v = event.srcElement.value;
            groupLabel.innerHTML = formatLabel(v);
            valueChangeCallbackFn(parseInt(v));
        };
        slider.oninput = (event: any) => {
            let v = event.srcElement.value;
            groupLabel.innerHTML = formatLabel(v);
        };

        group.appendChild(toggle);
        group.appendChild(groupLabel);
        group.appendChild(slider);

        this._toolkitPanelContainer.appendChild(group);
        this._toolkitPanelContainer.appendChild(document.createElement('hr'));
    }

    attachCameraControl(camera: BABYLON.FreeCamera): void {
        this._scene = camera.getScene();

        this._scene.onPointerObservable.add(this.onPointerDown.bind(this), BABYLON.PointerEventTypes.POINTERDOWN);
        this._scene.onPointerObservable.add(this.onPointerUp.bind(this), BABYLON.PointerEventTypes.POINTERUP);
        this._scene.onPointerObservable.add(this.onPointerMove.bind(this), BABYLON.PointerEventTypes.POINTERMOVE);
    }

    private handleInput(): boolean {
        if (HexMapEditor.POINTER_BLOCKED_BY_GUI) {
            this.previousCell = null;
            return false;
        }

        let pickResult = this._scene.pick(this._scene.pointerX, this._scene.pointerY);
        
        if (pickResult.hit && pickResult.pickedMesh instanceof HexMesh) {
            let currentCell = this.grid.getCell(pickResult.pickedPoint);

            if (this.previousCell && this.previousCell !== currentCell) {
                this.validateDrag(currentCell);
            } else {
                this.isDrag = false;
            }

            this.editCells(currentCell);
            this.previousCell = currentCell;
        } else {
            this.previousCell = null;
        }

        return true;
    }

    private onPointerDown(eventData: BABYLON.PointerInfo, eventState: BABYLON.EventState): void {
        if (eventData.event.which !== 1) {
            this.previousCell = null;
            return;
        }

        if (this.handleInput()) {
            this.isPointerDown = true;
        }
    }

    private onPointerUp(eventData: BABYLON.PointerInfo, eventState: BABYLON.EventState): void {
        this.isPointerDown = false;
    }

    private onPointerMove(eventData: BABYLON.PointerInfo, eventState: BABYLON.EventState): void {
        if (!this.isPointerDown) {
            return;
        }        

        this.handleInput();
    }

    private validateDrag(currentCell: HexCell): void {
        for (let dragDirection = HexDirection.NE; dragDirection <= HexDirection.NW; dragDirection++) {
            if (this.previousCell.getNeighbor(dragDirection) == currentCell) {
                this.isDrag = true;
                this.dragDirection = dragDirection;
                return;
            }
        }

        this.isDrag = false;
    }

    editCell(cell: Nullable<HexCell>): void {
        if (!cell) {
            return;
        }

        if (this.activeTerrainTypeIndex >= 0) {
            cell.terrainTypeIndex = this.activeTerrainTypeIndex;
        }

        if (this.isElevationSelected) {
            cell.elevation = this.activeElevation;
        }

        if (this.isWaterLevelSelected) {
            cell.waterLevel = this.activeWaterLevel;
        }

        if (this.isSpecialIndexSelected) {
            cell.specialIndex = this.activeSpecialIndex;
        }

        if (this.isUrbanLevelSelected) {
            cell.urbanLevel = this.activeUrbanLevel;
        }

        if (this.isFarmLevelSelected) {
            cell.farmLevel = this.activeFarmLevel;
        }

        if (this.isPlantLevelSelected) {
            cell.plantLevel = this.activePlantLevel;
        }

        if (this.riverMode === OptionalToggle.No) {
            cell.removeRiver();
        }

        if (this.roadMode === OptionalToggle.No) {
            cell.removeRoads();
        }

        if (this.walledMode != OptionalToggle.Ignore) {
            cell.walled = this.walledMode === OptionalToggle.Yes;
        }

        if (this.isDrag) {
            let otherCell = cell.getNeighbor(HexDirection.opposite(this.dragDirection));

            if (otherCell) {
                if (this.riverMode === OptionalToggle.Yes) {
                    otherCell.setOutgoingRiver(this.dragDirection);
                }
                if (this.roadMode === OptionalToggle.Yes) {
                    otherCell.addRoad(this.dragDirection);
                }
            }
        }
    }

    editCells(centerCell: HexCell): void {
        const
            centerX = centerCell.coordinates.x,
            centerZ = centerCell.coordinates.z;

        for (let r = 0, z = centerZ - this.brushSize; z <= centerZ; z++, r++) {
            for (let x = centerX - r; x <= centerX + this.brushSize; x++) {
                this.editCell(this.grid.getCellByHexCoordinates(new HexCoordinates(x, z)));
            }
        }
        for (let r = 0, z = centerZ + this.brushSize; z > centerZ; z--, r++) {
            for (let x = centerX - this.brushSize; x <= centerX + r; x++) {
                this.editCell(this.grid.getCellByHexCoordinates(new HexCoordinates(x, z)));
            }
        }
    }

    setTerrainTypeIndex(index: number): void {
        this.activeTerrainTypeIndex = index;
    }

    setElevation(elevation: number): void {
        this.activeElevation = Math.floor(elevation);
    }

    toggleElevation(state: boolean): void {
        this.isElevationSelected = state;
    }

    setWaterLevel(level: number): void {
        this.activeWaterLevel = Math.floor(level);
    }

    toggleWaterLevel(state: boolean): void {
        this.isWaterLevelSelected = state;
    }

    setBrushSize(size: number): void {
        this.brushSize = ~~size;
    }

    toggleUrbanLevel(state: boolean): void {
        this.isUrbanLevelSelected = state;
    }

    setUrbanLevel(level: number): void {
        this.activeUrbanLevel = ~~level;
    }

    toggleFarmLevel(state: boolean): void {
        this.isFarmLevelSelected = state;
    }

    setFarmLevel(level: number): void {
        this.activeFarmLevel = ~~level;
    }

    togglePlantLevel(state: boolean): void {
        this.isPlantLevelSelected = state;
    }

    setPlantLevel(level: number): void {
        this.activePlantLevel = ~~level;
    }

    toggleSpecialIndex(state: boolean): void {
        this.isSpecialIndexSelected = state;
    }

    setSpecialIndex(index: number): void {
        this.activeSpecialIndex = ~~index;
    }

    setRiverMode(mode: string): void {
        if (!OptionalToggle[mode]) {
            console.error('Invalid river mode.');
        }

        this.riverMode = parseInt(mode);
    }

    setRoadMode(mode: string): void {
        if (!OptionalToggle[mode]) {
            console.error('Invalid road mode.');
        }

        this.roadMode = parseInt(mode);
    }

    setWalledMode(mode: string): void {
        if (!OptionalToggle[mode]) {
            console.error('Invalid walled mode.');
        }

        this.walledMode = parseInt(mode);
    }

    public save(): void {
        let saveLink = this._toolkitPanelContainer.querySelector('#download-link');

        if (!saveLink) {
            saveLink = document.createElement('div');
            saveLink.id = 'download-link';
            this._toolkitPanelContainer.append(saveLink);
        }

        let dataWriter = new ByteBuffer();

        dataWriter.writeUint32(0); // Version header.
        this.grid.save(dataWriter);

        let
            link = Filesys.write(dataWriter.buffer),
            linkEl = document.createElement('a');

        linkEl.href = link;
        linkEl.innerText = "Download";

        saveLink.innerHTML = '';
        saveLink.appendChild(linkEl);
    }

    public load(evt): void {
        let 
            f = evt.target.files[0],
            reader = new FileReader();

        reader.onload = ((theFile) => {
            return (e) => {
                let byteBuffer = ByteBuffer.make(new DataView(e.target.result));
                
                let version = byteBuffer.readUint32();
                if (version === 0) {
                    this.grid.load(byteBuffer);
                }
                else {
                    console.error("Unknown map format " + version);
                }

            };
        })(f);
        
        reader.readAsArrayBuffer(f);
    }
}