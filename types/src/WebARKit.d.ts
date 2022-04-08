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
export interface WebARKitPipeline {
    trackableLoaded?: (trackableId: number) => void;
    trackablesLoaded?: (trackableIds: number[]) => void;
    initialized: (cameraMatrix: number[]) => void;
    tracking: (world: any, trackableId: number) => void;
    trackingLost: () => void;
    process: () => HTMLVideoElement;
}
export default class WebARKit {
    instance: any;
    webarkit: any;
    private pipeline;
    private cameraCount;
    private cameraParam;
    private cameraParaFileURL;
    private _projectionMatPtr;
    private cameraId;
    private cameraLoaded;
    private listeners;
    private version;
    videoWidth: number;
    videoHeight: number;
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
    process: () => Promise<void>;
    loadCameraParam: (urlOrData: any) => Promise<string | Uint8Array>;
    private _storeDataFile;
    dispatchEvent(event: {
        name: string;
        target: any;
        data?: object;
    }): void;
}
