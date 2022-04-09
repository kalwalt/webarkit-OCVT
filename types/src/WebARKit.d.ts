declare global {
    namespace NodeJS {
        interface Global {
            webarkit: any;
        }
    }
    interface Window {
        webarkit: any;
    }
}
interface ImageObj {
    videoWidth: number;
    width: number;
    videoHeight: number;
    height: number;
    data: Uint8ClampedArray;
}
interface ITrackableObj {
    width: number;
    height: number;
    trackableType: string;
    barcodeId: number;
    url: string;
}
export interface WebARKitPipeline {
    trackableLoaded?: (trackableId: number) => void;
    trackablesLoaded?: (trackableIds: number[]) => void;
    initialized: (cameraMatrix: number[]) => void;
    tracking: (world: any, trackableId: number) => void;
    trackingLost: () => void;
    process: () => Promise<ImageObj>;
}
export default class WebARKit {
    private id;
    private width;
    private height;
    instance: any;
    webarkit: any;
    private pipeline;
    private cameraCount;
    private cameraParam;
    private cameraParaFileURL;
    private _projectionMatPtr;
    private cameraId;
    private cameraLoaded;
    private camera_mat;
    private defaultMarkerWidth;
    private default2dHeight;
    private framepointer;
    private framesize;
    private dataHeap;
    private has2DTrackable;
    private image;
    private listeners;
    private _marker_count;
    private _patternDetection;
    private userSetPatternDetection;
    private trackables;
    private version;
    videoWidth: number;
    videoHeight: number;
    videoSize: number;
    private videoLuma;
    private _transMatPtr;
    constructor(pipeline: WebARKitPipeline);
    setCameraURL: (url: string) => this;
    setVideoSize: (videoWidth: number, videoHeight: number) => this;
    static init(pipeline: WebARKitPipeline): Promise<WebARKit>;
    private _initialize;
    start(): Promise<void>;
    dispose(): void;
    private _decorate;
    private _converter;
    setPatternDetectionMode(mode: number): any;
    private _updateDetectionMode;
    private _setPatternDetectionMode;
    process: (image: ImageObj) => Promise<void>;
    _processImage(image: ImageObj): void;
    private _prepareImage;
    getCameraProjMatrix(nearPlane?: number, farPlane?: number): Float32Array;
    loadCameraParam: (urlOrData: any) => Promise<string | Uint8Array>;
    addTrackables(trackableObj: ITrackableObj): Promise<any>;
    addEventListener(name: string, callback: object): void;
    removeEventListener(name: string, callback: object): void;
    dispatchEvent(event: {
        name: string;
        target: any;
        data?: object;
    }): void;
    arglCameraViewRHf(glMatrix: Float32Array, glRhMatrix?: Float32Array, scale?: number): Float32Array;
    private _loadTrackable;
    private _storeDataFile;
    private _queryTrackableVisibility;
}
export {};
