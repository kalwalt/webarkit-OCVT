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
    process: () => void;
}
export default class WebARKit {
    instance: any;
    private pipeline;
    private cameraCount;
    private version;
    private _transMatPtr;
    constructor(pipeline: WebARKitPipeline);
    startAR: (url: string, videoWidth: number, videoHeight: number) => Promise<void>;
    dispose(): void;
    private _init;
    private _decorate;
    private _converter;
    process: () => void;
    loadCameraParam: (urlOrData: any) => Promise<string | Uint8Array>;
    private _storeDataFile;
}
