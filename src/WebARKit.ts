/*
 *  WebARKit.ts
 *  WebARKit
 *
 *  This file is part of WebARKit.
 *
 *  WebARKit is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU Lesser General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  WebARKit is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU Lesser General Public License for more details.
 *
 *  You should have received a copy of the GNU Lesser General Public License
 *  along with WebARKit.  If not, see <http://www.gnu.org/licenses/>.
 *
 *  As a special exception, the copyright holders of this library give you
 *  permission to link this library with independent modules to produce an
 *  executable, regardless of the license terms of these independent modules, and to
 *  copy and distribute the resulting executable under terms of your choice,
 *  provided that you also meet, for each linked independent module, the terms and
 *  conditions of the license of that module. An independent module is a module
 *  which is neither derived from nor based on this library. If you modify this
 *  library, you may extend this exception to your version of the library, but you
 *  are not obligated to do so. If you do not wish to do so, delete this exception
 *  statement from your version.
 *
 *  Copyright 2022 WebARKit.
 *
 *  Author(s): Walter Perdan @kalwalt https://github.com/kalwalt
 *
 */

import webarkit from '../build/webarkit_ES6_wasm'
import WebARKitLoader from './loaders/WebARKitLoader'

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
  videoWidth: number,
  width: number,
  videoHeight: number,
  height: number,
  data: Uint8ClampedArray,
}

interface ITrackable {
  trackableId: number;
  transformation: Float32Array;
  arCameraViewRH?: Float32Array;
  visible?: boolean;
  scale?: number;
}

interface ITrackableObj {
  width: number;
  height: number;
  trackableType: string;
  barcodeId: number;
  url: string;
}

interface IPatternDetectionObj {
  barcode: boolean,
  template: boolean,
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
  private id: number;
  private width: number;
  private height: number;
  public instance: any;
  public webarkit: any;
  private pipeline: WebARKitPipeline;
  private cameraCount: number;
  private cameraParam: string;
  private cameraParaFileURL: string;
  private _projectionMatPtr: number;
  private cameraId: number;
  private cameraLoaded: boolean;
  private camera_mat: Float32Array;
  private defaultMarkerWidth: number;
  private default2dHeight: number;
  private framepointer: number;
  private framesize: number;
  private dataHeap: Uint8Array;
  private has2DTrackable: boolean;
  private image: any;
  private listeners: object;
  private _marker_count: number;
  private _patternDetection: IPatternDetectionObj;
  private userSetPatternDetection: boolean;
  private trackables: Array<ITrackable>;
  private version: string;
  public videoWidth: number;
  public videoHeight: number;
  public videoSize: number;
  private videoLuma: Uint8ClampedArray;
  private _transMatPtr: number;

  // construction
  constructor (pipeline: WebARKitPipeline) {
    // reference to WASM module
    this.id = -1
    this._marker_count = 0
    this.instance
    this.cameraParaFileURL;
    this.cameraId = -1
    this.cameraLoaded = false;
    this.camera_mat = null
    this.framesize;
    this.image;
    this.has2DTrackable;
    this.listeners = {};
    this._patternDetection = {
      barcode: false,
      template: false,
    }
    this.pipeline = pipeline;
    this.trackables = [];
    this.videoWidth;
    this.videoHeight;
    this.videoSize = this.videoWidth * this.videoHeight
    this.videoLuma;
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

  /**
       Set the pattern detection mode

       The pattern detection determines the method by which ARToolKitX
       matches detected squares in the video image to marker templates
       and/or IDs. ARToolKitX v4.x can match against pictorial "template" markers,
       whose pattern files are created with the mk_patt utility, in either colour
       or mono, and additionally can match against 2D-barcode-type "matrix"
       markers, which have an embedded marker ID. Two different two-pass modes
       are also available, in which a matrix-detection pass is made first,
       followed by a template-matching pass.

       @param {number} mode
           Options for this field are:
           artoolkitX.AR_TEMPLATE_MATCHING_COLOR
           artoolkitX.AR_TEMPLATE_MATCHING_MONO
           artoolkitX.AR_MATRIX_CODE_DETECTION
           artoolkitX.AR_TEMPLATE_MATCHING_COLOR_AND_MATRIX
           artoolkitX.AR_TEMPLATE_MATCHING_MONO_AND_MATRIX
           The default mode is AR_TEMPLATE_MATCHING_COLOR.
   */
           public setPatternDetectionMode(mode: number) {
            this.userSetPatternDetection = true
            return this._setPatternDetectionMode(mode)
          };

  /**
   * For ease of use check what kinds of markers have been added and set the detection mode accordingly
   */
   private _updateDetectionMode() {
    if (this._patternDetection.barcode && this._patternDetection.template) {
      this.setPatternDetectionMode(this.webarkit.AR_TEMPLATE_MATCHING_COLOR_AND_MATRIX)
    } else if (this._patternDetection.barcode) {
      this.setPatternDetectionMode(this.webarkit.AR_MATRIX_CODE_DETECTION)
    } else {
      this.setPatternDetectionMode(this.webarkit.AR_TEMPLATE_MATCHING_COLOR)
    }
  }

  /**
    * Private function to set the pattenr detection mode.
    * It is implemented like this to have the posibility to let the user set the pattern detection mode
    * by still providing the automatism to allow to set the pattern detection mode depending on the registered trackables (see {@link #addTrackable}).
    * @param {*} mode see {@link #setPatternDetectionMode}
    */
   private _setPatternDetectionMode(mode: number) {
    return this.webarkit.setTrackerOptionInt(this.webarkit.TrackableOptions.ARW_TRACKER_OPTION_SQUARE_PATTERN_DETECTION_MODE.value, mode)
  }

  public process = async(image: ImageObj) => {
    if (!image) { image = this.image }
    /*let video: ImageObj = this.pipeline.process();
    console.log(video);
    this.pipeline.process()
    .then( data =>{})*/
    
    if (!this.webarkit.isInitialized()) {
      try {
        await this.start()
      } catch (e) {
        console.error('Unable to start running', e);
      }
      this._processImage(image);
    } else {
      this._processImage(image);
    }
  }

  public _processImage(image: ImageObj) {
    try {
      this._prepareImage(image)
      const success = this.webarkit._arwUpdateAR()
      if (success >= 0) {
        this.trackables.forEach((trackable) => {      
          const transformation = this._queryTrackableVisibility(trackable.trackableId)   
          if (transformation) {
            trackable.transformation = transformation
            trackable.arCameraViewRH = this.arglCameraViewRHf(transformation)
            trackable.visible = true
            trackable.scale = this.height / this.width
            try {
              this.dispatchEvent({
                name: 'getMarker',
                target: this,
                data: trackable
              })
            } catch (e) {
              console.error('Error during trackable found event processing ' + e)
            }
          } else {
            trackable.visible = false
          }
        }, this)
      }
    } catch (e) {
      console.error('Unable to detect marker: ' + e)
    }
  }

  /**
  * Sets imageData and videoLuma as properties to WebARKit object to be used for marker detection.
  * Copies the video image and luma buffer into the HEAP to be available for the compiled C code for marker detection.
  * Sets newFrame and fillFlag in the compiled C code to signal the marker detection that a new frame is available.
  *
  * @param {HTMLImageElement|HTMLVideoElement} [image] The image to prepare for marker detection
  * @returns {boolean} true if successfull
  * @private
  */
   private _prepareImage (sourceImage: ImageObj) {
    if (!sourceImage) {
    // default to preloaded image
      sourceImage = this.image
    }  

    // this is of type Uint8ClampedArray:
    // The Uint8ClampedArray typed array represents an array of 8-bit unsigned
    // integers clamped to 0-255
    // @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint8ClampedArray
    let data: Uint8ClampedArray;

    if (sourceImage.data) {
      // directly use source image
      data = sourceImage.data
    }

    this.videoLuma = new Uint8ClampedArray(data.length / 4)
    // Here we have access to the unmodified video image. We now need to add the videoLuma chanel to be able to serve the underlying ARTK API
    if (this.videoLuma) {
      
      let q = 0

      // Create luma from video data assuming Pixelformat AR_PIXEL_FORMAT_RGBA
      // see (ARToolKitJS.cpp L: 43)
      for (let p = 0; p < this.videoSize; p++) {      
        let r = data[q + 0], g = data[q + 1], b = data[q + 2];
        // @see https://stackoverflow.com/a/596241/5843642    
        this.videoLuma[p] = (r + r + r + b + g + g + g + g) >> 3
        q += 4
      }
    }

     // Get access to the video allocation object
     //const videoMalloc = this.webarkit.videoMalloc
     const params = this.webarkit.videoMalloc;
     
     // Copy luma image
     const videoFrameLumaBytes = new Uint8Array(this.webarkit.HEAPU8.buffer, params.lumaFramePointer, params.framesize / 4)
     videoFrameLumaBytes.set(this.videoLuma)
     //this.videoLuma = videoLuma
 
     // Copy image data into HEAP. HEAP was prepared during videoWeb.c::ar2VideoPushInitWeb()
     const videoFrameBytes = new Uint8Array(this.webarkit.HEAPU8.buffer, params.framepointer, params.framesize)
     videoFrameBytes.set(data)
     this.framesize = params.framesize
 
     this.webarkit.setValue(params.newFrameBoolPtr, 1, 'i8')
     this.webarkit.setValue(params.fillFlagIntPtr, 1, 'i32')
 
     // Provide a timestamp to each frame because arvideo2.arUtilTimeSinceEpoch() seems not to perform well with Emscripten.
     // It internally calls gettimeofday which should not be used with Emscripten according to this: https://github.com/urho3d/Urho3D/issues/916
     // which says that emscripten_get_now() should be used. However, this seems to have issues too https://github.com/kripken/emscripten/issues/5893
     // Basically because it relies on performance.now() and performance.now() is supposedly slower then Date.now() but offers greater accuracy.
     // Or rather should offer but does not anymore because of Spectre (https://en.wikipedia.org/wiki/Spectre_(security_vulnerability))
     // Bottom line as performance.now() is slower then Date.now() (https://jsperf.com/gettime-vs-now-0/7) and doesn't offer higher accuracy and we
     // would be calling it for each video frame I decided to read the time per frame from JS and pass it in to the compiled C-Code using a pointer.
     const time = Date.now()
     const seconds = Math.floor(time / 1000)
     const milliSeconds = time - seconds * 1000
     this.webarkit.setValue(params.timeSecPtr, seconds, 'i32')
     this.webarkit.setValue(params.timeMilliSecPtr, milliSeconds, 'i32')

     const ret = this.webarkit._arwCapture()
 
     /*if (this.debug) {
       this.debugDraw()
     }*/
     return ret
  };

/**
  * Returns the projection matrix computed from camera parameters for WebARKit.
  * @param nearPlane {number} the near plane value of the camera.
  * @param farPlane {number} the far plane value of the camera.
  * @return {Float32Array} The 16-element WebGL camera matrix for WebARKit camera parameters.
  */
 public getCameraProjMatrix(nearPlane = 0.1, farPlane = 1000) {
  const cameraMatrixElements = 16
  const numBytes: number = cameraMatrixElements * Float32Array.BYTES_PER_ELEMENT
  this._projectionMatPtr = this.webarkit._malloc(numBytes)
  // Call compiled C-function directly using '_' notation
  // https://kripken.github.io/emscripten-site/docs/porting/connecting_cpp_and_javascript/Interacting-with-code.html#interacting-with-code-direct-function-calls
  const cameraMatrix = this.webarkit._arwGetProjectionMatrix(nearPlane, farPlane, this._projectionMatPtr)
  this.camera_mat = new Float32Array(this.webarkit.HEAPU8.buffer, this._projectionMatPtr, cameraMatrixElements)
  if (cameraMatrix) {
    return this.camera_mat
  }
  return undefined
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

  /**
     * Loads a trackable into the artoolkitX contect by calling addTrackable on the artoolkitX native interface
     *
     * @param {object} trackableObj -
     *              {
     *                  trackableType:  {string} 'single_barcode' / 'multi' / 'single' / '2d'
     *                  url: {string} '<URL to the trackable file in case of multi, single or 2d>'
     *                  barcodeId: {number}
     *                  width: {number} defaults to this.markerWidth if not set
     *                  height: {number} if 2D trackable reflects height of trackable. If not set defaults to default2dHeight
     *              }
     * @returns {Promise} which resolves into a {number} trackable id if successfull or thorws an error
     */
   public async addTrackables(trackableObj: ITrackableObj) {
    if (!trackableObj.width) { trackableObj.width = this.defaultMarkerWidth }
    if (!trackableObj.height) trackableObj.height = this.default2dHeight
    let fileName, trackableId
    if (trackableObj.trackableType.includes('single') || trackableObj.trackableType.includes('2d')) {
      if (trackableObj.barcodeId !== undefined) {
        fileName = trackableObj.barcodeId
        console.log('filename inside barcodeId query', fileName);       
        if (!this._patternDetection.barcode) {
          this._patternDetection.barcode = true
        }
      } else {
        try {   
          fileName = await this._loadTrackable(trackableObj.url)
        } catch (error) {
          throw new Error('Error to load trackable: ' + error)
        }
        if (!this._patternDetection.template) {
          this._patternDetection.template = true
        }
      }
      if (trackableObj.trackableType.includes('2d')) {
        this.has2DTrackable = true
        trackableId = this.webarkit.addTrackable(trackableObj.trackableType + ';' + fileName + ';' + trackableObj.height)
        console.log('2d id: ', trackableId);    
      } else {
        trackableId = this.webarkit.addTrackable(trackableObj.trackableType + ';' + fileName + ';' + trackableObj.width)
        console.log('other id: ', trackableId);
      }
    }

    if (trackableId >= 0) {
      this.trackables.push({ trackableId: trackableId, transformation: (new Float32Array(16)), visible: false })
      if (!this.userSetPatternDetection) { this._updateDetectionMode() }
      return trackableId
    }
    throw new Error('Failed to add Trackable: ' + trackableId)
  }

  // event handling
  //----------------------------------------------------------------------------

  /**
   * Add an event listener on this WebARKit for the named event, calling the callback function
   * whenever that event is dispatched.
   * Possible events are:
   * - getMarker - dispatched whenever process() finds a square marker
   * - getMultiMarker - dispatched whenever process() finds a visible registered multimarker
   * - getMultiMarkerSub - dispatched by process() for each marker in a visible multimarker
   * - load - dispatched when the WebARKit is ready to use (useful if passing in a camera URL in the constructor)
   * @param {string} name Name of the event to listen to.
   * @param {function} callback Callback function to call when an event with the given name is dispatched.
   */
   public addEventListener(name: string, callback: object) {
    if (!this._converter().listeners[name]) {
      this._converter().listeners[name] = [];
    }
    this._converter().listeners[name].push(callback);
  };

  /**
   * Remove an event listener from the named event.
   * @param {string} name Name of the event to stop listening to.
   * @param {function} callback Callback function to remove from the listeners of the named event.
   */
  public removeEventListener(name: string, callback: object) {
    if (this._converter().listeners[name]) {
      let index = this._converter().listeners[name].indexOf(callback);
      if (index > -1) {
        this._converter().listeners[name].splice(index, 1);
      }
    }
  };

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

  /**
   * Converts the given 4x4 openGL matrix in the 16-element transMat array
   * into a 4x4 OpenGL Right-Hand-View matrix and writes the result into the 16-element glMat array.
   * If scale parameter is given, scales the transform of the glMat by the scale parameter.
   * @param {Float32Array} glMatrix The 4x4 marker transformation matrix.
   * @param {Float32Array} [glRhMatrix] The 4x4 GL right hand transformation matrix.
   * @param {number} [scale] The scale for the transform.
   */
   public arglCameraViewRHf(glMatrix: Float32Array, glRhMatrix?: Float32Array, scale?: number) {
    let m_modelview
    if (glRhMatrix == undefined) { m_modelview = new Float32Array(16) } else { m_modelview = glRhMatrix }

    // x
    m_modelview[0] = glMatrix[0]
    m_modelview[4] = glMatrix[4]
    m_modelview[8] = glMatrix[8]
    m_modelview[12] = glMatrix[12]
    // y
    m_modelview[1] = -glMatrix[1]
    m_modelview[5] = -glMatrix[5]
    m_modelview[9] = -glMatrix[9]
    m_modelview[13] = -glMatrix[13]
    // z
    m_modelview[2] = -glMatrix[2]
    m_modelview[6] = -glMatrix[6]
    m_modelview[10] = -glMatrix[10]
    m_modelview[14] = -glMatrix[14]

    // 0 0 0 1
    m_modelview[3] = 0
    m_modelview[7] = 0
    m_modelview[11] = 0
    m_modelview[15] = 1

    if (scale != undefined && scale !== 0.0) {
      m_modelview[12] *= scale
      m_modelview[13] *= scale
      m_modelview[14] *= scale
    }

    glRhMatrix = m_modelview

    return glRhMatrix
  }

/**
   * Used internally by the addTrackable method.
   * @param url of the file to load.
   * @returns the target.
   */
 private async _loadTrackable(url: string) {
  var target = "/trackable_" + this._marker_count++;
  try {
    let data = await WebARKitLoader.fetchRemoteData(url);
    this._storeDataFile(data,target);
    return target;
  } catch (e) {
    console.log(e);
    return e;
  }
}

// ---------------------------------------------------------------------------

  // implementation
  /**
   * Used internally by LoadCamera and _loadTrackable
   * @return {void}
   */
   private _storeDataFile = (data: Uint8Array, target: string) => {
    // FS is provided by emscripten
    // Note: valid data must be in binary format encoded as Uint8Array
    this.webarkit.FS.writeFile(target, data, {
      encoding: 'binary'
    })
  }

  // Internal wrapper to _arwQueryTrackableVisibilityAndTransformation to avoid ccall overhead
  private _queryTrackableVisibility (trackableId: number) {
    const transformationMatrixElements = 16
    const numBytes = transformationMatrixElements * Float32Array.BYTES_PER_ELEMENT
    this._transMatPtr = this.webarkit._malloc(numBytes)
    // Call compiled C-function directly using '_' notation
    // https://kripken.github.io/emscripten-site/docs/porting/connecting_cpp_and_javascript/Interacting-with-code.html#interacting-with-code-direct-function-calls
    const transformation = this.webarkit._arwQueryTrackableVisibilityAndTransformation(trackableId, this._transMatPtr)
    const matrix = new Float32Array(this.webarkit.HEAPU8.buffer, this._transMatPtr, transformationMatrixElements)
    if (transformation) {
      return matrix
    }
    return undefined
  }



}
