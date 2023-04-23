function isMobile() {
  return /Android|mobile|iPad|iPhone/i.test(navigator.userAgent);
}

var setMatrix = function (matrix, value) {
  var array = [];
  for (var key in value) {
    array[key] = value[key];
  }
  if (typeof matrix.elements.set === "function") {
    matrix.elements.set(array);
  } else {
    matrix.elements = [].slice.call(array);
  }
};


function start(markerUrl, video, input_width, input_height, render_update, track_update) {
  var vw, vh;
  var worker;
  var camera_para = '../../../examples/Data/camera_para.dat'

  var canvas_process = document.createElement('canvas');
  var context_process = canvas_process.getContext('2d');
  var targetCanvas = document.querySelector("#canvas");

  var overlayCanvas = document.querySelector("#overlayCanvas");

  var renderer = new THREE.WebGLRenderer({ canvas: targetCanvas, alpha: true, antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);

  var scene = new THREE.Scene();

  //let fov = 0.8 * 180 / Math.PI;
  //const camera = new THREE.PerspectiveCamera(fov, vw / vh, 0.01, 1000);

  var camera = new THREE.Camera();
  camera.matrixAutoUpdate = false;

  scene.add(camera);

  var sphere = new THREE.Mesh(
    new THREE.SphereGeometry(0.5, 8, 8),
    new THREE.MeshNormalMaterial()
  );

  var root = new THREE.Object3D();
  scene.add(root);

  sphere.material.flatShading;
  sphere.position.z = 0;
  sphere.position.x = 100;
  sphere.position.y = 100;
  sphere.scale.set(100, 100, 100);

  root.matrixAutoUpdate = false;
  root.add(sphere);

  var load = function () {
    vw = input_width;
    vh = input_height;

    pscale = 320 / Math.max(vw, vh / 3 * 4);
    sscale = isMobile() ? window.outerWidth / input_width : 1;

    sw = vw * sscale;
    sh = vh * sscale;

    w = vw * pscale;
    h = vh * pscale;
    pw = Math.max(w, h / 3 * 4);
    ph = Math.max(h, w / 4 * 3);
    ox = (pw - w) / 2;
    oy = (ph - h) / 2;
    //canvas_process.style.clientWidth = pw + "px";
    //canvas_process.style.clientHeight = ph + "px";
    //canvas_process.width = pw;
    //canvas_process.height = ph;

    renderer.setSize(sw, sh);
    worker = new Worker('./Data/js/webarkitES6.worker_orb_2d.js')

    worker.postMessage({ type: "load",  pw: pw, ph: ph, camera_para: camera_para, marker: markerUrl });

    worker.onmessage = function (ev) {
      var msg = ev.data;
      switch (msg.type) {
        case "loaded": {
          var proj = JSON.parse(msg.proj);
          //camera.projectionMatrix.fromArray(proj);
          //camera.updateProjectionMatrix();
          var ratioW = pw / w;
          var ratioH = ph / h;
          proj[0] *= ratioW;
          proj[4] *= ratioW;
          proj[8] *= ratioW;
          proj[12] *= ratioW;
          proj[1] *= ratioH;
          proj[5] *= ratioH;
          proj[9] *= ratioH;
          proj[13] *= ratioH;
          setMatrix(camera.projectionMatrix, proj);
          break;
        }
        case "endLoading": {
          if (msg.end == true) {
            // removing loader page if present
            var loader = document.getElementById('loading');
            if (loader) {
              loader.querySelector('.loading-text').innerText = 'Start the tracking!';
              setTimeout(function () {
                loader.parentElement.removeChild(loader);
              }, 2000);
            }
          }
          break;
        }
        case 'found': {
          found(msg);
          break;
        }
        case 'not found': {
          found(null);
          break;
        }
        case 'warped': {
          warped(msg);
          break;
      }
    }
      track_update();
      process();
    };
  };

  var world;

  var found = function (msg) {
    if (!msg) {
      world = null;
    } else {
      world = JSON.parse(msg.matrixGL_RH);
    }
  };

  function clearOverlayCtx() {
    const overlayCtx = overlayCanvas.getContext("2d");
    overlayCtx.clearRect(0, 0, vw, vh);
  }

  function drawCorners(corners) {
    const overlayCtx = overlayCanvas.getContext("2d");
    clearOverlayCtx();
  
    overlayCtx.beginPath();
    overlayCtx.strokeStyle = "blue";
    overlayCtx.lineWidth = 3;
  
    // [x1,y1,x2,y2,x3,y3,x4,y4]
    overlayCtx.moveTo(corners[0], corners[1]);
    overlayCtx.lineTo(corners[2], corners[3]);
    overlayCtx.lineTo(corners[4], corners[5]);
    overlayCtx.lineTo(corners[6], corners[7]);
    overlayCtx.lineTo(corners[0], corners[1]);
  
    overlayCtx.stroke();
  }

  var warped = function(msg) {
    if (!msg) {
      console.log("no warped");
    } else {
      console.log("warped", msg.data);
      clearOverlayCtx();
      drawCorners(msg.data);
    }
  };

  var lasttime = Date.now();
  var time = 0;

  var draw = function () {
    render_update();
    var now = Date.now();
    var dt = now - lasttime;
    time += dt;
    lasttime = now;

    if (!world) {
      sphere.visible = false;
    } else {
      sphere.visible = true;
      // set matrix of 'root' by detected 'world' matrix
      setMatrix(root.matrix, world);
    }
    renderer.render(scene, camera);
  };

  var process = function () {
    context_process.fillStyle = 'black';
    context_process.fillRect(0, 0, pw, ph);
    context_process.drawImage(video, 0, 0, vw, vh, ox, oy, w, h);

    var imageData = context_process.getImageData(0, 0, pw, ph);
    worker.postMessage({ type: 'process', imagedata: imageData }, [imageData.data.buffer]);
  }
  var tick = function () {
    draw();
    requestAnimationFrame(tick);
  };

  load();
  tick();
  process();
}
