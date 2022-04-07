import webarkit from '../build/webarkit_ES6_wasm'

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
  public instance: any;
  private pipeline: WebARKitPipeline;
  private cameraCount: number;
  private version: string;

  // construction
  constructor (pipeline: WebARKitPipeline) {
    // reference to WASM module
    this.instance
    this.pipeline = pipeline;
    this.version = '1.0.0'
    console.info('WebARKit ', this.version)
  }
  // ---------------------------------------------------------------------------
  public startAR = async(url: string, videoWidth: number, videoHeight: number) => {
    this.init()
    .then(async(w) => {
      w.instance.initialiseAR();
      try {
        var arCameraURL = await this.loadCameraParam(url)
        .then(url => {
            var success = w.instance.arwStartRunningJS(url, videoWidth, videoHeight)
            console.log(success);
        })
    } catch (e) {
        throw new Error('Error loading camera param: ' + e)
    }
    })
   
    

    // TODO: camera opening process
  }

  // initialization
  private init = async () => {

    this.instance = await webarkit()
    this._decorate()
    let scope: any = typeof window !== "undefined" ? window : global;
    scope.webarkit = this

    return this
  }

   // private methods
   /**
   * Used internally to link the instance in the ModuleLoader to the
   * ARToolkitX internal methods.
   * @return {void}
   */
   private _decorate = () => {
    // add delegate methods
    [
      'setLogLevel',
      'getLogLevel',

      'ARLogLevel',
      'ARMatrixCodeType',

      'LabelingThresholdMode',
      'TrackableOptions',
      'TrackableOptionsSettings',

      'addTrackable',
      'arwGetTrackerOptionFloat',
      'arwGetTrackerOptionInt',
      'arwStartRunningJS',

      'getARToolKitVersion',
      'getError',
      'getTrackableOptionBool',
      'getTrackableOptionFloat',
      'getTrackableOptionInt',
      'getTrackablePatternConfig',
      'getTrackablePatternCount',
      'getTrackablePatternImage',
      'getTrackerOptionBool',
      'getVideoParams',

      'initialiseAR',
      'isInitialized',
      'isRunning',
      'loadOpticalParams',

      'pushVideoInit',

      'removeAllTrackables',
      'removeTrackable',

      'setTrackableOptionBool',
      'setTrackableOptionFloat',
      'setTrackableOptionInt',
      'setTrackerOptionBool',
      'setTrackerOptionFloat',
      'setTrackerOptionInt',

      'shutdownAR',
      'stopRunning',
      'updateAR',

      'videoMalloc',

      '_arwCapture',
      '_arwGetProjectionMatrix',
      '_arwGetTrackablePatternConfig',
      '_arwGetTrackablePatternImage',
      '_arwLoadOpticalParams',
      '_arwQueryTrackableVisibilityAndTransformation',
      '_arwUpdateAR',

      '_free',
      '_malloc',
      'FS'
    ].forEach(method => {
      this.converter()[method] = this.instance[method];
    })
    // expose constants
    for (const co in this.instance) {
      if (co.match(/^WebAR/)) {
        this.converter()[co] = this.instance[co];
      }
    }
  }

  private converter = (): any => {
    return this;
  }

  public loadCameraParam = async(urlOrData: any): Promise<string|Uint8Array> => {
    return new Promise((resolve, reject) => {
      const filename = '/camera_param_' + this.cameraCount++
      if (typeof urlOrData === 'object' || urlOrData.indexOf('\n') > -1) { // Maybe it's a byte array
      //if (url) {
        const byteArray = urlOrData
        const target = filename
        this._storeDataFile(byteArray, target);
        if (target) {
          resolve(filename)
        } else {
          reject(new Error('Error'))
        }
      } else {
        fetch(urlOrData)
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Network response was not OK');
                    }
                    return response.blob();
                })
                .then(blob => {
                    blob.arrayBuffer().then(buff => {
                        let buffer = new Uint8Array(buff)
                        this._storeDataFile(buffer, filename);
                        resolve(buffer)
                    })
                })
                .catch(error => {
                    console.error(error)
                });
        }
      
    })
  }

  // ---------------------------------------------------------------------------

  // implementation
  /**
   * Used internally by LoadCamera method
   * @return {void}
   */
   private _storeDataFile = (data: Uint8Array, target: string) => {
    // FS is provided by emscripten
    // Note: valid data must be in binary format encoded as Uint8Array
    this.instance.FS.writeFile(target, data, {
      encoding: 'binary'
    })
  }

}
