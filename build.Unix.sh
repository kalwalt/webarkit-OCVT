#!/usr/bin/env bash

if [ ! -f "opencv/build_wasm/em-flags.txt" ] ; then
  curl --location "https://github.com/webarkit/opencv-em/releases/download/0.0.4/opencv-em-4.5.0-emcc-3.1.7.zip" -o opencv-em.zip
  unzip -o opencv-em.zip -d opencv
  cp -avr opencv/build_wasm/opencv ./
  rm opencv-em.zip
fi

cd emscripten/WebARKitLib/ARX
cmake .
make
echo "Created config.h file!"