# webarkit-OCVT
WIP -> Testing the OCVT module from [ArtoolkitX](https://github.com/webarkit/artoolkitX_em_2d) for webarkit.
Briefly this project try to integrate ARToolkit5 and ARToolkitX for WebAR thanks to Emscripten, the C and C++ was modified to adpat it to our needs. 

## Example
Run the example in localhost with a python server or http-server and in the browser console you should see some basic message.

## Building notes

You need to run the build script in the main folder `./build.sh`. The script will download the required opencv libs and modules to be used in te project. Pay attention that using other opencv version will not work out of the box. Last, you need to use emsdk (Emscripten) 3.1.7 because this project was compiled with this version (and opencv libs too)