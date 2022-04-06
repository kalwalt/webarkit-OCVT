import webarkit from '../build/webarkit_ES6_wasm'

export default class WebARKit {
  // construction
  constructor () {
    // reference to WASM module
    this.instance
    this.version = '1.0.0'
    console.info('WebARKit ', this.version)
  }
  // ---------------------------------------------------------------------------

  // initialization
  async init () {

    const runtime = await webarkit()
    this.instance = runtime;
    this._decorate()
    const scope = (typeof window !== 'undefined') ? window : global
    scope.webarkit = this

    return this
  }

   // private methods
  /**
   * Used internally to link the instance in the ModuleLoader to the
   * ARToolkitX internal methods.
   * @return {void}
   */
   _decorate () {
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
      this[method] = this.instance[method]
    })
    // expose constants
    for (const co in this.instance) {
      if (co.match(/^WebAR/)) {
        this[co] = this.instance[co]
      }
    }
  }
  async loadCameraParam(urlOrData){
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
                    errorCallback(error)
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
   _storeDataFile (data, target) {
    // FS is provided by emscripten
    // Note: valid data must be in binary format encoded as Uint8Array
    this.FS.writeFile(target, data, {
      encoding: 'binary'
    })
  }

}
