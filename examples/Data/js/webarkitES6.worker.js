importScripts('../../../dist/WebARKit.js')
self.onmessage = function (e) {
  var msg = e.data;
  switch (msg.type) {
    case 'load': {
      load(msg);
      return;
    }
    case 'process': {
      next = msg.imagedata;
      process();
      return;
    }
  }
};

var next = null;
var ar = null;
var markerResult = null;
var arController, camMatrix;
var _projectionMatPtr;
var _camera_count = 0;
var _cameraParaFileURL;
var videoWidth, videoHeight;

var trackable = {
  trackableType: 'nft',
  url: './../../../examples/DataNFT/pinball',
  scale: 0.5
};
var videoWidth = 640;
var videoHeight = 480;
var cameraParam = '../../Data/camera_para.dat';
const config = {
  cameraParam: cameraParam,
  width: videoWidth,
  height: videoHeight
};

function load(msg) {

  WebARKit.WebARKitController.init(0, config.cameraParam, config.width, config.height).then((arController) => {
    console.log('arController is: ', arController);
    //arController.setCameraURL('../../Data/camera_para.dat');
    //arController.setVideoSize(videoWidth, videoHeight);

    /*arController.addEventListener('getMarker', (trackableInfo) => {
      console.log("TrackableID: " + trackableInfo.data.trackableId);
      markerResult = {type: "found", matrixGL_RH: JSON.stringify(trackableInfo.data.transformation)};
    });*/
   
    try {

      arController.start().then(_ => {

        console.log('We are ready...');
        let cameraMatrix = arController.getCameraProjMatrix()
        console.log('camera projection matrix: ', cameraMatrix);
        // We send the camera matrix outside the worker
        postMessage({ type: 'loaded', proj: JSON.stringify(cameraMatrix) })
        if (trackable) {
          console.log('here');
          var trackableId = arController.addTrackable(trackable);
        }
        /*setInterval(function () {
          ar = arController;
        }, 13)*/
        ar = arController;
        ar.addEventListener('getMarker', (trackableInfo) => {
          console.log("TrackableID: " + trackableInfo.data.trackableId);
          markerResult = {type: "found", matrixGL_RH: JSON.stringify(trackableInfo.data.transformation)};
        });
      })
      
    } catch (e) {
      console.error(e)
    }

  })

  console.debug('Loading camera at:', msg.camera_para);

}

function process() {

  markerResult = null;

  if (ar && ar.process) {
    ar.process(next);
  }

  if (markerResult) {
    postMessage(markerResult);
  } else {
    postMessage({ type: 'not found' });
  }

  next = null;
}
