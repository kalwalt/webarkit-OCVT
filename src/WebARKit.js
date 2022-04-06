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
}
