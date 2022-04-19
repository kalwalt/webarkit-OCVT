/*
 * Simple script for running emcc on ARToolKit
 * @author zz85 github.com/zz85
 * @author kalwat https://github.com/kalwalt
 */

var
    exec = require('child_process').exec,
    path = require('path'),
    fs = require('fs');

var NO_LIBAR = false;

var arguments = process.argv;

for (var j = 2; j < arguments.length; j++) {
    if (arguments[j] == '--no-libar') {
        NO_LIBAR = true;
        console.log('Building webarkit with --no-libar option, libar will be preserved.');
    };
}

var HAVE_NFT = 1;
var HAVE_2D = 1;

var EMSCRIPTEN_ROOT = process.env.EMSCRIPTEN;
var WEBARKITLIB_ROOT = process.env.WEBARKITLIB_ROOT || path.resolve(__dirname, "../emscripten/WebARKitLib");

if (!EMSCRIPTEN_ROOT) {
    console.log("\nWarning: EMSCRIPTEN environment variable not found.")
    console.log("If you get a \"command not found\" error,\ndo `source <path to emsdk>/emsdk_env.sh` and try again.");
}

var EMCC = EMSCRIPTEN_ROOT ? path.resolve(EMSCRIPTEN_ROOT, 'emcc') : 'emcc';
var EMPP = EMSCRIPTEN_ROOT ? path.resolve(EMSCRIPTEN_ROOT, 'em++') : 'em++';
var OPTIMIZE_FLAGS = ' -Oz '; // -Oz for smallest size
var MEM = (256 * 1024 * 1024); // 64MB


var SOURCE_PATH = path.resolve(__dirname, '../emscripten/') + '/';
var OUTPUT_PATH = path.resolve(__dirname, '../build/') + '/';

var BUILD_WASM_ES6_FILE = 'webarkit_ES6_wasm.js';

if (!fs.existsSync(path.resolve(WEBARKITLIB_ROOT, "Source/ARX/AR/include/ARX/AR/config.h"))) {
    console.log("Renaming and moving config.h.in to config.h");
    /*fs.copyFileSync(
        path.resolve(WEBARKITLIB_ROOT, "Source/ARX/AR/include/ARX/AR/config.h.in"),
        path.resolve(WEBARKITLIB_ROOT, "Source/ARX/AR/include/ARX/AR/config.h")
    );*/
    console.log("Done!");
}

var MAIN_SOURCES = [
	'WebARKit_js.cpp',
    "WebARKit_bindings.cpp"
];

MAIN_SOURCES = MAIN_SOURCES.map(function(src) {
    return path.resolve(SOURCE_PATH, src);
  }).join(' ');

var webarkit_sources = [
    "WebARKitTrackable2d.cpp",
    "WebARKitTrackableNFT.cpp",
    "WebARKitTrackerNFT.cpp",
    "mapper.cpp",
    "WebARKit_c.cpp",
    "WebARKitTrackable.cpp",
    "WebARKitTrackableSquare.cpp",
    "WebARKitTrackerSquare.cpp",
    "WebARKitController.cpp",
    "WebARKitTrackableMultiSquareAuto.cpp",
    "WebARKitTracker2d.cpp",
    "WebARKitVideoSource.cpp",
    //"trackingSub.c",
    "trackingMod.c",
    "trackingSubMod.cpp",
    "WebARKitPattern.cpp",
    "WebARKitTrackableMultiSquare.cpp",
    "WebARKitTracker.cpp",
    "WebARKitVideoView.cpp",
].map(function(src) {
	return path.resolve(__dirname, WEBARKITLIB_ROOT + '/lib/SRC/WebARKit/', src);
});

var webarkit_sources = webarkit_sources
    //.concat(ar_sources)
    .concat(ar2_sources)
    .concat(ocvt_sources)

var ar_sources = [
    //'include/ARX/AR/config.h',
    'ar3DCreateHandle.c',
    'ar3DUtil.c',
    'arCreateHandle.c',
    'arDetectMarker.c',
    'arDetectMarker2.c',
    'arFilterTransMat.c',
    'arGetLine.c',
    'arGetMarkerInfo.c',
    'arGetTransMat.c',
    'arGetTransMatStereo.c',
    'arImageProc.c',
    'arLabeling.c',
    //'arLabelingSub/arLabelingPrivate.h',
    //'arLabelingSub/arLabelingSub.h',
    'arLabelingSub/arLabelingSubDBIC.c',
    'arLabelingSub/arLabelingSubDBRC.c',
    'arLabelingSub/arLabelingSubDBZ.c',
    'arLabelingSub/arLabelingSubDWIC.c',
    'arLabelingSub/arLabelingSubDWRC.c',
    'arLabelingSub/arLabelingSubDWZ.c',
    'arLabelingSub/arLabelingSubEBIC.c',
    'arLabelingSub/arLabelingSubEBRC.c',
    'arLabelingSub/arLabelingSubEBZ.c',
    'arLabelingSub/arLabelingSubEWIC.c',
    'arLabelingSub/arLabelingSubEWRC.c',
    'arLabelingSub/arLabelingSubEWZ.c',
    'arMultiEditConfig.c',
    'arMultiFreeConfig.c',
    'arMultiGetTransMat.c',
    'arMultiGetTransMatStereo.c',
    'arMultiReadConfigFile.c',
    'arPattAttach.c',
    'arPattCreateHandle.c',
    'arPattGetID.c',
    'arPattLoad.c',
    'arPattSave.c',
    'arRefineCorners.cpp',
    //'arRefineCorners.h',
    'arUtil.c',
    'icpCalibStereo.c',
    'icpCore.c',
    'icpHandle.c',
    'icpPoint.c',
    'icpPointRobust.c',
    'icpStereoHandle.c',
    'icpStereoPoint.c',
    'icpStereoPointRobust.c',
    'icpUtil.c',
    'mAlloc.c',
    'mAllocDup.c',
    'mAllocInv.c',
    'mAllocMul.c',
    'mAllocTrans.c',
    'mAllocUnit.c',
    'mDet.c',
    'mDisp.c',
    'mDup.c',
    'mFree.c',
    'mInv.c',
    'mMul.c',
    'mPCA.c',
    'mSelfInv.c',
    'mTrans.c',
    'mUnit.c',
    'paramChangeSize.c',
    'paramClear.c',
    'paramDecomp.c',
    'paramDisp.c',
    'paramDistortion.c',
    'paramFile.c',
    'paramGetPerspective.c',
    'paramGL.c',
    'paramLT.c',
    'vAlloc.c',
    'vDisp.c',
    'vFree.c',
    'vHouse.c',
    'vInnerP.c',
    'vTridiag.c'
].map(function (src) {
    return path.resolve(__dirname, WEBARKITLIB_ROOT + '/ARX/AR/', src);
});

var ar2_sources = [
    'handle.c',
    'imageSet.c',
    'jpeg.c',
    'marker.c',
    'featureMap.c',
    'featureSet.c',
    'selectTemplate.c',
    'surface.c',
    'tracking.c',
    'tracking2d.c',
    'matching.c',
    'matching2.c',
    'template.c',
    'searchPoint.c',
    'coord.c',
    'util.c',
].map(function (src) {
    return path.resolve(__dirname, WEBARKITLIB_ROOT + '/ARX/AR2/', src);
});

var arg_sources = [
    //'arg_private.h',
    'arg.c',
    //'arg_gl.h',
    'arg_gl.c',
    //'arg_gles2.h',
    'arg_gles2.c',
    //'arg_gl3.h',
    'arg_gl3.c',
    'mtx.c',
    'glStateCache2.c',
    'shader_gl.c'
].map(function (src) {
    return path.resolve(__dirname, WEBARKITLIB_ROOT + '/ARX/ARG/', src);
});

var arutil_sources = [
    'log.c',
    'profile.c',
    'thread_sub_winrt.cpp',
    'thread_sub.c',
    'system.c',
    'android_system_property_get.c',
    'time.c',
    'file_utils.c',
    'image_utils.cpp',
    'crypt.c',
    'ioapi.c',
    'unzip.c',
    'zip.c'
].map(function (src) {
    return path.resolve(__dirname, WEBARKITLIB_ROOT + '/ARX/ARUtil', src);
});

var arvideo_sources = [
    'cparamSearch.c',
    'nxjson.c',
    'video.c',
    'video2.c',
    'videoAspectRatio.c',
    'videoLuma.c',
    'videoRGBA.c',
    'videoSaveImage.c',
    'Dummy/videoDummy.c',
    'Image/videoImage.c',
    'Web/videoWeb.c'
].map(function (src) {
    return path.resolve(__dirname, WEBARKITLIB_ROOT + '/ARX/ARVideo', src);
});

var kpm_sources = [
	'kpmHandle.cpp',
	'kpmRefDataSet.cpp',
	'kpmMatching.cpp',
	'kpmResult.cpp',
	'kpmUtil.cpp',
	'kpmFopen.c',
	'FreakMatcher/detectors/DoG_scale_invariant_detector.cpp',
	'FreakMatcher/detectors/gaussian_scale_space_pyramid.cpp',
	'FreakMatcher/detectors/gradients.cpp',
	'FreakMatcher/detectors/harris.cpp',
	'FreakMatcher/detectors/orientation_assignment.cpp',
	'FreakMatcher/detectors/pyramid.cpp',
	'FreakMatcher/facade/visual_database_facade.cpp',
	'FreakMatcher/matchers/hough_similarity_voting.cpp',
	'FreakMatcher/matchers/freak.cpp',
	'FreakMatcher/framework/date_time.cpp',
	'FreakMatcher/framework/image.cpp',
	'FreakMatcher/framework/logger.cpp',
	'FreakMatcher/framework/timers.cpp',
].map(function(src) {
	return path.resolve(__dirname, WEBARKITLIB_ROOT + '/ARX/KPM/', src);
});

var ocvt_sources = [
    'OCVConfig.cpp',
    'HarrisDetector.cpp',
    'OCVFeatureDetector.cpp',
    'PlanarTracker.cpp',
    'TrackedPoint.cpp',
    'TrackingPointSelector.cpp',
    'HomographyInfo.cpp'
].map(function (src) {
    return path.resolve(__dirname, WEBARKITLIB_ROOT + '/ARX/OCVT', src);
});

var DEFINES = ' ';
if (HAVE_NFT) DEFINES += " -D HAVE_NFT ";
if (HAVE_2D) DEFINES += " -D HAVE_2D ";
DEFINES += ' -DARX_EXPORTS=1 -DARX_TARGET_PLATFORM_EMSCRIPTEN=1 ';

ARVIDEO_DEFINES = ' -DARVIDEO_INPUT_DUMMY -DARVIDEO_INPUT_IMAGE -DARVIDEO_INPUT_WEB '

var FLAGS = '' + OPTIMIZE_FLAGS;
//FLAGS += ' -std=c++11 '
FLAGS += ' -Wno-warn-absolute-paths ';
FLAGS += ' -s TOTAL_MEMORY=' + MEM + ' ';
FLAGS += ' -s USE_ZLIB=1';
FLAGS += ' -s USE_LIBJPEG=1';
FLAGS += ' --memory-init-file 0 '; // for memless file
FLAGS += ' -s ALLOW_MEMORY_GROWTH=1';
FLAGS += ' --bind ';

var PROJECT_SOURCE_DIR = path.resolve( WEBARKITLIB_ROOT + '/Source');

var EXPORT_FUNCTIONS = " -s EXPORTED_FUNCTIONS='['_arwUpdateAR', '_arwCapture', '_arwGetProjectionMatrix', '_arwQueryTrackableVisibilityAndTransformation', '_arwGetTrackablePatternConfig', '_arwGetTrackablePatternImage', '_arwLoadOpticalParams', '_ar2VideoOpenAsyncWeb', '_ar2VideoPushInitWeb']' ";
var EXPORTED_RUNTIME_FUNCTIONS = " -s EXPORTED_RUNTIME_METHODS='['ccall', 'cwrap', 'FS', 'setValue']' ";
var WASM_FLAGS_SINGLE_FILE = " -s SINGLE_FILE=1 ";
var ES6_FLAGS = " -s EXPORT_ES6=1 -s USE_ES6_IMPORT_META=0 -s EXPORT_NAME='webarkit' -s MODULARIZE=1 ";
var POST_FLAGS = " --post-js " + path.resolve(__dirname, "../emscripten/") + "/WebARKit_additions.js ";

var ASSERTIONS_FLAGS = ' -s ASSERTIONS=1 ';
//FLAGS += ASSERTIONS_FLAGS;

var INCLUDES = [
    path.resolve(__dirname, WEBARKITLIB_ROOT + '/ARX/AR/include/'),
    path.resolve(__dirname, WEBARKITLIB_ROOT + '/ARX/ARUtil/include/'),
    OUTPUT_PATH,
    SOURCE_PATH,
].map(function (s) { return '-I' + s }).join(' ');

var INCLUDES_AR = [
    path.resolve(__dirname, WEBARKITLIB_ROOT + '/ARX/AR/arRefineCorners.h'),
].map(function (s) { return '-I' + s }).join(' ');

var INCLUDES_ARX = [
    path.resolve(__dirname, WEBARKITLIB_ROOT + '/ARX/include/'),
].map(function (s) { return '-I' + s }).join(' ');

var INCLUDES_AR2 = [
    path.resolve(__dirname, WEBARKITLIB_ROOT + '/ARX/AR2/include/'),
].map(function (s) { return '-I' + s }).join(' ');

var INCLUDES_ARG = [
    path.resolve(__dirname, WEBARKITLIB_ROOT + '/ARX/ARG/include/'),
].map(function (s) { return '-I' + s }).join(' ');

var INCLUDES_ARUTIL = [
    path.resolve(__dirname, WEBARKITLIB_ROOT + '/ARX/ARUtil/include/'),
    path.resolve(__dirname, WEBARKITLIB_ROOT + '/depends/emscripten/include/'),
].map(function (s) { return '-I' + s }).join(' ');

var INCLUDES_ARVIDEO = [
    path.resolve(__dirname, WEBARKITLIB_ROOT + '/ARX/ARVideo/include/'),
    path.resolve(__dirname, WEBARKITLIB_ROOT + '/ARX/ARVideo/Web/'),
].map(function (s) { return '-I' + s }).join(' ');

var INCLUDES_KPM = [
    path.resolve(__dirname, WEBARKITLIB_ROOT + '/ARX/KPM/include/'),
    path.resolve(__dirname, WEBARKITLIB_ROOT + '/ARX/KPM/FreakMatcher'),
].map(function (s) { return '-I' + s }).join(' ');

var INCLUDES_OCVT = [
    path.resolve(__dirname, WEBARKITLIB_ROOT + '/ARX/OCVT/include/'),
    path.resolve(__dirname, WEBARKITLIB_ROOT + '/ARX/OCVT/include/ARX/OCVT/'),
].map(function (s) { return '-I' + s }).join(' ');

var INCLUDES_WEBARKIT = [
    path.resolve(__dirname, WEBARKITLIB_ROOT + '/include/'),
    path.resolve(__dirname, WEBARKITLIB_ROOT + '/ARX/include/'),
].map(function (s) { return '-I' + s }).join(' ');

var INCLUDES_OPENCV = [
    path.resolve(__dirname, '../opencv/include'),
		path.resolve(__dirname, '../opencv/modules/calib3d/include'),
		path.resolve(__dirname, '../opencv/modules/core/include'),
		path.resolve(__dirname, '../opencv/modules/dnn/include'),
		path.resolve(__dirname, '../opencv/modules/features2d/include'),
		path.resolve(__dirname, '../opencv/modules/flann/include'),
        path.resolve(__dirname, '../opencv/modules/highgui/include'),
        path.resolve(__dirname, '../opencv/modules/imgcodecs/include'),
		path.resolve(__dirname, '../opencv/modules/imgproc/include'),
		path.resolve(__dirname, '../opencv/modules/objdetect/include'),
		path.resolve(__dirname, '../opencv/modules/photo/include'),
		path.resolve(__dirname, '../opencv/modules/video/include'),
		path.resolve(__dirname, '../opencv/build_wasm'),
].map(function (s) { return '-I' + s }).join(' ');

var OPENCV_LIBS = [
    path.resolve(__dirname, '../opencv/build_wasm/lib/libopencv_calib3d.a'),
	path.resolve(__dirname, '../opencv/build_wasm/lib/libopencv_core.a'),
	path.resolve(__dirname, '../opencv/build_wasm/lib/libopencv_dnn.a'),
	path.resolve(__dirname, '../opencv/build_wasm/lib/libopencv_features2d.a'),
	path.resolve(__dirname, '../opencv/build_wasm/lib/libopencv_flann.a'),
    //path.resolve(__dirname, '../opencv/build_wasm/lib/libopencv_imgcodecs.a'),
    path.resolve(__dirname, '../opencv/build_wasm/lib/libopencv_imgproc.a'),
	//path.resolve(__dirname, '../opencv/build_wasm/lib/libopencv_highgui.a'),
	path.resolve(__dirname, '../opencv/build_wasm/lib/libopencv_objdetect.a'),
	path.resolve(__dirname, '../opencv/build_wasm/lib/libopencv_photo.a'),
	path.resolve(__dirname, '../opencv/build_wasm/lib/libopencv_video.a'),
].map(function(s) { return ' ' + s }).join(' ');

var ALL_BC = [
    path.resolve(OUTPUT_PATH + '/libwebarkit.bc'),
    path.resolve(OUTPUT_PATH + '/libar.bc'),
    path.resolve(OUTPUT_PATH + '/libar2.bc'),
    path.resolve(OUTPUT_PATH + '/libarg.bc'),
    path.resolve(__dirname, OUTPUT_PATH + '/libarutil.bc'),
    path.resolve(__dirname, OUTPUT_PATH + '/libarvideo.bc'),
    path.resolve(__dirname, OUTPUT_PATH + '/libkpm.bc'),
    path.resolve(__dirname, OUTPUT_PATH + '/libocvt.bc')
].map(function (s) { return s }).join(' ');

function format(str) {
    for (var f = 1; f < arguments.length; f++) {
        str = str.replace(/{\w*}/, arguments[f]);
    }
    return str;
}

function clean_builds() {
    try {
        var stats = fs.statSync(OUTPUT_PATH);
    } catch (e) {
        fs.mkdirSync(OUTPUT_PATH);
    }

    try {
        var files = fs.readdirSync(OUTPUT_PATH);
        var filesLength = files.length;
        if (filesLength > 0) {
          if (NO_LIBAR == true) {
            for (var i = 0; i < filesLength-8; i++) {
              var filePath = OUTPUT_PATH + "/" + files[i];
              if (fs.statSync(filePath).isFile()) fs.unlinkSync(filePath);
            }
          } else {
            for (var i = 0; i < filesLength; i++) {
              var filePath = OUTPUT_PATH + "/" + files[i];
              if (fs.statSync(filePath).isFile()) fs.unlinkSync(filePath);
            }
          }
        }
      } 
    catch (e) { return console.log(e); }
}

var compile_arlib = format(EMCC + ' ' + ' --llvm-lto 1 --memory-init-file 0 -s INVOKE_RUN=0 -s NO_EXIT_RUNTIME=1   -msse -msse2 -msse3 -mssse3 -msimd128 ' + INCLUDES + ' '
    + INCLUDES_AR + ' ' + INCLUDES_OPENCV + ' ' + INCLUDES_OCVT + ' ' + ar_sources.join(' ')
    + FLAGS + ' ' + DEFINES + ' -DNDEBUG ' + ' -r -o {OUTPUT_PATH}libar.bc ',
    OUTPUT_PATH);

var compile_ar2lib = format(EMCC + ' ' + INCLUDES + ' '
    + INCLUDES_AR2 + ' ' + ar2_sources.join(' ')
    + FLAGS + ' ' + DEFINES + ' -r -o {OUTPUT_PATH}libar2.bc ',
    OUTPUT_PATH);

var compile_arglib = format(EMCC + ' ' + INCLUDES + ' '
    + INCLUDES_ARG + ' ' + arg_sources.join(' ')
    + FLAGS + ' ' + DEFINES + ' -r -o {OUTPUT_PATH}libarg.bc ',
    OUTPUT_PATH);

var compile_arutillib = format(EMCC + ' ' + INCLUDES + ' '
    + INCLUDES_ARUTIL + ' ' + arutil_sources.join(' ')
    + FLAGS + ' ' + DEFINES + ' -r -o {OUTPUT_PATH}libarutil.bc ',
    OUTPUT_PATH);

var compile_arvideolib = format(EMCC + ' ' + INCLUDES + ' '
    + INCLUDES_ARVIDEO + ' ' + arvideo_sources.join(' ')
    + FLAGS + ' ' + DEFINES + ARVIDEO_DEFINES + ' -r -o {OUTPUT_PATH}libarvideo.bc ',
    OUTPUT_PATH);

var compile_kpm = format(EMCC + ' ' + INCLUDES + ' '
    + INCLUDES_KPM + ' ' + kpm_sources.join(' ')
    + FLAGS + ' ' + DEFINES + ' -r -o {OUTPUT_PATH}libkpm.bc ',
    OUTPUT_PATH);

var compile_ocvtlib = format(EMCC + ' ' + INCLUDES + ' '
    + INCLUDES_OCVT + ' ' + INCLUDES_OPENCV + ' ' + ocvt_sources.join(' ')
    + FLAGS + ' ' + DEFINES + ' -r -o {OUTPUT_PATH}libocvt.bc ',
    OUTPUT_PATH);

var compile_webarkitlib = format(EMCC + ' ' + INCLUDES + ' ' + INCLUDES_ARX + ' ' 
    + INCLUDES_AR2 + ' ' + INCLUDES_ARG + ' ' + INCLUDES_ARUTIL + ' ' 
    + INCLUDES_ARVIDEO + ' ' + INCLUDES_OCVT + ' ' + INCLUDES_WEBARKIT + ' '
    + INCLUDES_KPM + ' ' + INCLUDES_OPENCV + ' ' + webarkit_sources.join(' ')
    + FLAGS + ' ' + DEFINES + ' -r -o {OUTPUT_PATH}libwebarkit.bc ',
    OUTPUT_PATH);

var compile_wasm_es6 = format(EMCC + ' ' + MAIN_SOURCES + ' ' + INCLUDES + ' '
    + INCLUDES_WEBARKIT + ' ' + INCLUDES_ARX + ' ' + INCLUDES_AR2 + ' ' + INCLUDES_ARG + ' '
    + INCLUDES_ARUTIL + ' ' + INCLUDES_ARVIDEO + ' ' + INCLUDES_OCVT + ' ' + INCLUDES_KPM + ' '
    + INCLUDES_OPENCV + ' ' + ALL_BC + ' ' +  OPENCV_LIBS
    + FLAGS + ' ' + DEFINES + ES6_FLAGS + WASM_FLAGS_SINGLE_FILE
    + EXPORT_FUNCTIONS + EXPORTED_RUNTIME_FUNCTIONS  + POST_FLAGS
    + " -o {OUTPUT_PATH}{BUILD_WASM_ES6_FILE} ",
    OUTPUT_PATH,
    BUILD_WASM_ES6_FILE);

/*
 * Run commands
 */

function onExec(error, stdout, stderr) {
    if (stdout) console.log('stdout: ' + stdout);
    if (stderr) console.log('stderr: ' + stderr);
    if (error !== null) {
        console.log('exec error: ' + error.code);
        process.exit(error.code);
    } else {
        runJob();
    }
}

function runJob() {
    if (!jobs.length) {
        console.log('Jobs completed');
        return;
    }
    var cmd = jobs.shift();

    if (typeof cmd === 'function') {
        cmd();
        runJob();
        return;
    }

    console.log('\nRunning command: ' + cmd + '\n');
    exec(cmd, onExec);
}

var jobs = [];

function addJob(job) {
    jobs.push(job);
}

addJob(clean_builds);
addJob(compile_arlib);
addJob(compile_ar2lib);
addJob(compile_arglib);
addJob(compile_arutillib);
addJob(compile_arvideolib);
addJob(compile_ocvtlib);
addJob(compile_kpm);
addJob(compile_webarkitlib);
addJob(compile_wasm_es6);

if (NO_LIBAR == true) {
    jobs.splice(1, 9);
  }

runJob();
