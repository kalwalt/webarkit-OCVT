/*
 * Simple script for running emcc on ARToolKit
 * @author zz85 github.com/zz85
 * @author ThorstenBux github.com/ThorstenBux
 */


var
	exec = require('child_process').exec,
	path = require('path'),
	fs = require('fs'),
	os = require('os');

const platform = os.platform();

var NO_LIBAR = false;

var arguments = process.argv;

for (var j = 2; j < arguments.length; j++) {
	if (arguments[j] == '--no-libar') {
		NO_LIBAR = true;
		console.log('Building webarkit with --no-libar option, libwebarkit will be preserved.');
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
var MEM = 512 * 1024 * 1024; // 64MB


var SOURCE_PATH = path.resolve(__dirname, '../emscripten/') + '/';
var OUTPUT_PATH = path.resolve(__dirname, '../build/') + '/';

var BUILD_DEBUG_FILE = 'webarkit.debug.js';
var BUILD_WASM_FILE = 'webarkit_wasm.js';
var BUILD_WASM_ES6_FILE = 'webarkit_ES6_wasm.js';
var BUILD_MIN_FILE = 'webarkit.min.js';

var MAIN_SOURCES = [
	'WebARKit_js.cpp'
];

if (!fs.existsSync(path.resolve(WEBARKITLIB_ROOT, 'include/AR/config.h'))) {
	console.log("Renaming and moving config.h.in to config.h");
	fs.copyFileSync(
		path.resolve(WEBARKITLIB_ROOT, 'include/AR/config.h.in'),
		path.resolve(WEBARKITLIB_ROOT, 'include/AR/config.h')
	);
	console.log("Done!");
}

MAIN_SOURCES = MAIN_SOURCES.map(function(src) {
  return path.resolve(SOURCE_PATH, src);
}).join(' ');

let ar_sources;

if (platform === 'win32') {
	var glob = require("glob");
function match(pattern) {
    var r = glob.sync('emscripten/WebARKitLib/lib/SRC/' + pattern);
    return r;
}
function matchAll(patterns, prefix="") {
    let r = [];
    for(let pattern of patterns) {
        r.push(...(match(prefix + pattern)));
    }
    return r;
}

  ar_sources = matchAll([
    'AR/arLabelingSub/*.c',
    'AR/*.c',
    'ARG/mtx.c',
    'ARICP/*.c',
    'ARMulti/arMultiEditConfig.c',
    'ARMulti/arMultiFreeConfig.c',
    'ARMulti/arMultiGetTransMat.c',
    'ARMulti/arMultiGetTransMatStereo.c',
    'ARMulti/arMultiReadConfigFile.c',
    'ARUtil/image_utils.cpp',
    'ARUtil/log.c',
    'ARUtil/time.c',
    'ARUtil/file_utils.c',
]);
} else {
	ar_sources = [
	  'AR/arLabelingSub/*.c',
	  'AR/*.c',
      'ARG/mtx.c',
	  'ARICP/*.c',
      'ARMulti/arMultiEditConfig.c',
      'ARMulti/arMultiFreeConfig.c',
      'ARMulti/arMultiGetTransMat.c',
      'ARMulti/arMultiGetTransMatStereo.c',
      'ARMulti/arMultiReadConfigFile.c',
      'ARUtil/image_utils.cpp',
	  'ARUtil/log.c',
      'ARUtil/time.c',
	  'ARUtil/file_utils.c',
      'ARUtil/thread_sub.c',
	].map(function(src) {
		return path.resolve(__dirname, WEBARKITLIB_ROOT + '/lib/SRC/', src);
	});
}

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
].map(function(src) {
	return path.resolve(__dirname, WEBARKITLIB_ROOT + '/lib/SRC/AR2/', src);
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
    return path.resolve(__dirname, WEBARKITLIB_ROOT + '/lib/SRC/ARVideo', src);
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
	return path.resolve(__dirname, WEBARKITLIB_ROOT + '/lib/SRC/KPM/', src);
});

var OCVT_sources = [
    "OCVConfig.cpp",
    "HarrisDetector.cpp",
    "OCVFeatureDetector.cpp",
    "PlanarTracker.cpp",
    "TrackedPoint.cpp",
    "TrackingPointSelector.cpp",
    "HomographyInfo.cpp",
].map(function(src) {
	return path.resolve(__dirname, WEBARKITLIB_ROOT + '/lib/SRC/OCVT/', src);
});

/*var OCVTUtil_sources = [ "image_utils.cpp"].map(function(src) {
	return path.resolve(__dirname, WEBARKITLIB_ROOT + '/lib/SRC/OCVTUtil/', src);
});*/

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

if (HAVE_NFT) {
  if (HAVE_NFT && HAVE_2D) {
    ar_sources = ar_sources
      .concat(ar2_sources)
      .concat(arvideo_sources)
      .concat(kpm_sources)
      .concat(OCVT_sources)
      //.concat(OCVTUtil_sources)
      .concat(webarkit_sources);
  } else {
    ar_sources = ar_sources
      .concat(ar2_sources)
      .concat(arvideo_sources)
      .concat(kpm_sources)
      .concat(webarkit_sources);
  }
} else if (HAVE_2D) {
  ar_sources = ar_sources
    .concat(ar2_sources)
    .concat(arvideo_sources)
    .concat(OCVT_sources)
    //.concat(OCVTUtil_sources)
    .concat(webarkit_sources);
}

var DEFINES = " ";
if (HAVE_NFT) DEFINES += " -D HAVE_NFT ";
if (HAVE_2D) DEFINES += " -D HAVE_2D ";
DEFINES += "  -DARX_EXPORTS=1 -D ARX_TARGET_PLATFORM_EMSCRIPTEN -DARVIDEO_INPUT_WEB ";

ARVIDEO_DEFINES = ' -DARVIDEO_INPUT_DUMMY -DARVIDEO_INPUT_IMAGE -DARVIDEO_INPUT_WEB '

var FLAGS = '' + OPTIMIZE_FLAGS;
FLAGS += ' -Wno-warn-absolute-paths ';
FLAGS += ' -s TOTAL_MEMORY=' + MEM + ' ';
FLAGS += ' -s USE_ZLIB=1';
FLAGS += ' -s USE_LIBJPEG=1';
FLAGS += ' --memory-init-file 0 '; // for memless file
FLAGS += ' -s "EXPORTED_RUNTIME_METHODS=[\'FS\']"';
FLAGS += ' -s ALLOW_MEMORY_GROWTH=1';
FLAGS += ' -msse -msse2 -msse3 -mssse3 -msimd128 '
//FLAGS += ' -fsanitize=address '
//FLAGS += ' -s ASSERTIONS=1 '
//FLAGS += ' -s SAFE_HEAP=1 '

//var WASM_FLAGS = ' -s SINGLE_FILE=1 '
var WASM_FLAGS = ' '
//var ES6_FLAGS = ' -s EXPORT_ES6=1 -s USE_ES6_IMPORT_META=0 -s MODULARIZE=1 ';
var EXPORT_FUNCTIONS = " -s EXPORTED_FUNCTIONS='['_arwUpdateAR', '_arwCapture', '_arwGetProjectionMatrix', '_arwQueryTrackableVisibilityAndTransformation', '_arwGetTrackablePatternConfig', '_arwGetTrackablePatternImage', '_arwLoadOpticalParams']' ";
var EXPORTED_RUNTIME_FUNCTIONS = " -s EXPORTED_RUNTIME_METHODS='['ccall', 'cwrap', 'FS', 'setValue']' ";
var WASM_FLAGS_SINGLE_FILE = " -s SINGLE_FILE=1 ";
var ES6_FLAGS = " -s EXPORT_ES6=1 -s USE_ES6_IMPORT_META=0 -s EXPORT_NAME='webarkit' -s MODULARIZE=1 ";
var POST_FLAGS = " --post-js " + path.resolve(__dirname, "../emscripten/") + "/WebARKit_additions.js ";

var PRE_FLAGS = ' --pre-js ' + path.resolve(__dirname, '../js/webarkit.api.js') +' ';

FLAGS += ' --bind ';

/* DEBUG FLAGS */
var DEBUG_FLAGS = ' -g ';
DEBUG_FLAGS += ' -s ASSERTIONS=1 '
DEBUG_FLAGS += ' --profiling '
DEBUG_FLAGS += ' -s ALLOW_MEMORY_GROWTH=1';
DEBUG_FLAGS += '  -s DEMANGLE_SUPPORT=1 ';

var INCLUDES = [
    path.resolve(__dirname, WEBARKITLIB_ROOT + '/include'),
    path.resolve(__dirname, '../emscripten'),
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
    OUTPUT_PATH,
    SOURCE_PATH,
    path.resolve(__dirname, WEBARKITLIB_ROOT + '/lib/SRC/KPM/FreakMatcher'),
].map(function(s) { return '-I' + s }).join(' ');

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
        var i;
                var filesLength = files.length;
        if (filesLength > 0)
				if (NO_LIBAR == true){
                    i=1;
				} else { i=0; }
            for ( ;i < filesLength; i++) {
                var filePath = OUTPUT_PATH + '/' + files[i];
                if (fs.statSync(filePath).isFile())
                    fs.unlinkSync(filePath);
            }
    }
    catch(e) { return console.log(e); }
}

var compile_arlib = format(EMCC + ' ' + INCLUDES + ' '
    + ar_sources.join(' ')
	//+ webarkit_sources.join(' ')
    + FLAGS + ' ' + DEFINES + ARVIDEO_DEFINES + ' -r -o {OUTPUT_PATH}libwebarkit.bc ',
    OUTPUT_PATH);

var ALL_BC = " {OUTPUT_PATH}libwebarkit.bc ";

var compile_combine = format(EMCC + ' ' + INCLUDES + ' '
    + ALL_BC + MAIN_SOURCES
    + FLAGS + ' -s WASM=0' + ' '  + DEBUG_FLAGS + DEFINES + ' -o {OUTPUT_PATH}{BUILD_FILE} ',
    OUTPUT_PATH, OUTPUT_PATH, BUILD_DEBUG_FILE);

var compile_combine_min = format(EMCC + ' ' + INCLUDES + ' '
    + ALL_BC + MAIN_SOURCES
    + FLAGS + ' -s WASM=0' + ' ' + DEFINES + PRE_FLAGS + ' -o {OUTPUT_PATH}{BUILD_FILE} ',
    OUTPUT_PATH, OUTPUT_PATH, BUILD_MIN_FILE);

var compile_wasm = format(EMCC + ' ' + INCLUDES + ' '
    + ALL_BC + MAIN_SOURCES
    + FLAGS + WASM_FLAGS + DEFINES + PRE_FLAGS + OPENCV_LIBS + ' -o {OUTPUT_PATH}{BUILD_FILE} ',
    OUTPUT_PATH, OUTPUT_PATH, BUILD_WASM_FILE);

var compile_wasm_es6 = format(EMCC + ' ' + INCLUDES + ' '
    + MAIN_SOURCES  + ALL_BC
    + WASM_FLAGS + OPENCV_LIBS
    + FLAGS + DEFINES + ARVIDEO_DEFINES + ES6_FLAGS + WASM_FLAGS_SINGLE_FILE
    + EXPORT_FUNCTIONS + EXPORTED_RUNTIME_FUNCTIONS + POST_FLAGS +
    ' -o {OUTPUT_PATH}{BUILD_FILE} ',
    OUTPUT_PATH, OUTPUT_PATH, BUILD_WASM_ES6_FILE);

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
//addJob(compile_combine);
//addJob(compile_wasm);
addJob(compile_wasm_es6)
//addJob(compile_combine_min);

if (NO_LIBAR == true){
  jobs.splice(1,1);
}

runJob();
