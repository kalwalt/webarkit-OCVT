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
  process: () => HTMLVideoElement;
}

export default class WebARKit {
  public instance: any;
  public webarkit: any;
  private pipeline: WebARKitPipeline;
  private cameraCount: number;
  private cameraParam: string;
  private cameraParaFileURL: string;
  private _projectionMatPtr: number;
  private cameraId: number;
  private cameraLoaded: boolean;
  private listeners: object;
  private version: string;
  public videoWidth: number;
  public videoHeight: number;
  private _transMatPtr: number;

  // construction
  constructor (pipeline: WebARKitPipeline) {
    // reference to WASM module
    this.instance
    this.cameraParaFileURL;
    this.cameraId = -1
    this.cameraLoaded = false;
    this.listeners = {};
    this.pipeline = pipeline;
    this.videoWidth;
    this.videoHeight;
    this.version = '1.0.0'
    console.info('WebARKit ', this.version)
  }

  public setCameraURL = (url: string) => {
    this.cameraParaFileURL = url;
    return this;
  }

  public setVideoSize = (videoWidth: number, videoHeight: number) => {
    this.videoWidth = videoWidth;
    this.videoHeight = videoHeight;
    return this;
  }

  static async init(pipeline: WebARKitPipeline) {
    const _wbk = new WebARKit(pipeline);
    return await _wbk._initialize();
  }

  private async _initialize() {
    // initialize the toolkit
    this.webarkit = await webarkit();
    console.log('[WebARKit]', 'WebARKit initialized');
    this._decorate()
    let scope: any = typeof window !== "undefined" ? window : global;
    scope.webarkit = this
    setTimeout(() => {
      this.dispatchEvent({
        name: 'load',
        target: this
      })
    }, 1);
    return this;
  }

  async start() {
    let success = this.webarkit.initialiseAR()
    if (success) {
      console.debug('Version: ' + this.webarkit.getARToolKitVersion())
      // Only try to load the camera parameter file if an URL was provided
      let arCameraURL: string | Uint8Array = ''

      if (this.cameraParaFileURL !== '') {
        try {
          arCameraURL = await this.loadCameraParam(this.cameraParaFileURL)

        } catch (e) {
          throw new Error('Error loading camera param: ' + e)
        }
      }
      success = this.webarkit.arwStartRunningJS(arCameraURL, this.videoWidth, this.videoHeight)

      if (success >= 0) {
        console.info('webarkit started')
        success = this.webarkit.pushVideoInit(0, this.videoWidth, this.videoHeight, 'RGBA', 0, 0)
        if (success < 0) {
          throw new Error('Error while starting')
        }
      } else { throw new Error('Error while starting') }
    } else {
      throw new Error('Error while starting')
    }

  }


  /**
        Destroys the WebARKit instance and frees all associated resources.
        After calling dispose, the WebARKit can't be used any longer. Make a new one if you need one.

        Calling this avoids leaking Emscripten memory.
    */
  public dispose() {
    this.webarkit._free(this._transMatPtr)
    this.webarkit.stopRunning()
    this.webarkit.shutdownAR()
    for (var t in this) {
      this[t] = null
    }
  };

   // private methods
   /**
   * Used internally to link the instance to the
   * WebARKit internal methods.
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
      this._converter()[method] = this.webarkit[method];
    })
    // expose constants
    for (const co in this.webarkit) {
      if (co.match(/^WebAR/)) {
        this._converter()[co] = this.webarkit[co];
      }
    }
  }

  private _converter = (): any => {
    return this;
  }

  public process = async() => {
    let video: HTMLVideoElement = this.pipeline.process();
    
    if (!this.webarkit.isInitialized()) {
      try {
        await this.start()
      } catch (e) {
        console.error('Unable to start running')
      }
      //this._processImage(video)
    } else {
      //this._processImage(video)
    }
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
    this.webarkit.FS.writeFile(target, data, {
      encoding: 'binary'
    })
  }

  /**
   * Dispatches the given event to all registered listeners on event.name.
   * @param {Object} event Event to dispatch.
   */
   public dispatchEvent(event: { name: string; target: any; data?: object }) {
    let listeners = this._converter().listeners[event.name];
    if (listeners) {
      for (let i = 0; i < listeners.length; i++) {
        listeners[i].call(this, event);
      }
    }
  };


}
