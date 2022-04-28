# webarkit-OCVT
WIP -> Testing the OCVT module from [ArtoolkitX](https://github.com/webarkit/artoolkitX_em_2d) for webarkit.
Briefly this project try to integrate ARToolkit5 and ARToolkitX for WebAR thanks to Emscripten, the C and C++ was modified to adpat it to our needs. 

## Example
Run the examples in localhost with a python server or http-server, inside the examples folder try one of them:

```html
barcode.html // using barcode marker 4.
hiro.html // using the hiro pattern.
nft_example.html // using nft marker, not yet working.
2d_example.html // using 2d tracking, just for testing, not tracking.
orb_2d_example.html // using orb_2d tracking, still experimental not working as expected. 
```

## Building notes

You need to run the build script in the main folder `./build.sh`. The script will download the required opencv libs and modules to be used in te project. Pay attention that using other opencv version will not work out of the box. Last, you need to use emsdk (Emscripten) 3.1.7 because this project was compiled with this version (and opencv libs too)