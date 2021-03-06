#include <WebARKit/WebARKit_c.h>
#include <string>
#include <WebARKit/WebARKitController.h>

std::string getARToolKitVersion();
int addTrackable(std::string cfg);
bool arwStartRunningJS(std::string cparaName, int width, int height);
int pushVideoInit(int videoSourceIndex, int width, int height, std::string pixelFormat, int camera_index, int camera_face);

struct VideoParams {
    int width;
    int height;
    int pixelSize;
    std::string pixelFormat;
};
VideoParams getVideoParams();
