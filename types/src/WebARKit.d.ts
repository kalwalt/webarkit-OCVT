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
    private framepointer;
    private framesize;
    private dataHeap;
    private image;
    private listeners;
    private _marker_count;
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
    process: (image: ImageObj) => Promise<void>;
    _processImage(image: ImageObj): void;
    private _prepareImage;
    loadCameraParam: (urlOrData: any) => Promise<string | Uint8Array>;
    private _storeDataFile;
    addEventListener(name: string, callback: object): void;
    removeEventListener(name: string, callback: object): void;
    dispatchEvent(event: {
        name: string;
        target: any;
        data?: object;
    }): void;
    arglCameraViewRHf(glMatrix: Float32Array, glRhMatrix?: Float32Array, scale?: number): Float32Array;
    private _queryTrackableVisibility;
}
export {};
