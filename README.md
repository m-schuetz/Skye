# Skye

This is the source code to the paper: [*Progressive Real-Time Rendering of One Billion Points Without Hierarchical Acceleration Structures*](https://www.cg.tuwien.ac.at/research/publications/2019/TR%20193-2-2019-4/) (_Markus Schütz, Gottfried Mandlburger, Johannes Otepka, Michael Wimmer_).

Skye is a live coding framework and point cloud viewer using a progressive rendering method that allows viewing any point cloud that fits in GPU memory in real time without the need to create hierarchical acceleration structures in advance. Instead of rendering all the points every frame, we distribute the rendering over multiple frames. The previous frame is reprojected to the current in order to preserve already rendered detail, and holes are filled by rendering a certain number of random points. The amount of random points can be adjusted to ensure real-time frame rates and over the course of a few frames, the image will converge to the full model.

* The rendering engine is implemented in Javascript (using V8) and code can be modified at runtime. Saving a *.js file via ctrl+s will immediately execute it and subsequently replace old code with the new one. 
* The javascript engine is backed by a C++ and OpenGL core. JS bindings exist for most OpenGL functions. Some performance sensitive parts may be written entirely in C++.
* It's relatively easy to implement your own functionality in C++ and write a JS binding to it. Check V8Helper.cpp for some examples. There are also examples like _readFileAsync_ for bindings that return promises, and therefore allow you to execute C++ code in parallel threads and invoke a callback / resolve the promise in JS once the thread finishes.

It's being developed at the [Research Division of Computer Graphics, TU Wien](https://www.cg.tuwien.ac.at/)  

Video (YouTube):

<a href="https://www.youtube.com/watch?v=6_ivIcynok8" target="_blank">
	<img src="./resources/images/video_preview.jpg" />
</a>

## Getting Started

### Install

Open Skye.sln and compile the project in Release mode. 

Then, open the workspace in [Visual Studio Code](https://code.visualstudio.com/) by right clicking an empty region, then selecting "Open with Code". Start the application from vscode by pressing __ctrl+shift+b__.

### Things to do

In order to view one of your own point clouds, open "modules/progressive/progressive_pointcloud.js" and change the load command to ```let las = loadLASProgressive("C:/my_pointcloud.las");```. Once you save the file with ctrl+s, the file will be loaded. The current demo works with point clouds that have color data and point clouds that have extra attributes. There are bugs to fix for standard attributes other than RGB. We recommend to try [ot_35121F2416A_1.laz](https://cloud.sdsc.edu/v1/AUTH_opentopography/PC_Bulk/CA13_SAN_SIM/ot_35121F2416A_1.laz) hosted at [Open Topography](http://opentopo.sdsc.edu/lidarDataset?opentopoID=OTLAS.032013.26910.2) with 54 million points, convert it to LAS (```las2las ot_35121F2416A_1.laz -o ot_35121F2416A_1.las```), and then specify that file in the loadLASProgressive call. You can also try a las file without color. In that case, uncomment ```vColor = vec3(1, 1, 1);``` in reproject.vs. This will render your point cloud in white. 

## Performance

Point clouds can be loaded at rates up to 100 million points per second from M.2 NVMe SSDs. For this to work, you will need to convert your las file to a custom format (that matches the vertex buffer format) with tools/las2bin.js. You will also need to change the load command to ```loadBINProgressive```. 

Rendering performance depends on how many points you use to progressively fill holes. You can change this amount in render_progressive.js. Look for ```let remainingBudget = ``` and set this to something between 1 to 30 million, depending on your GPU performance. Just press ctrl+s, the change will be applied at runtime. There is also a dynamic/adaptive budget, but that one is bugged since one of the recent commits.

<img src="doc/perf.png"/>
Rendering performance. Brute-force: Time to render all points in a single frame. Progressive: Time spent on the passes and the
total time of a progressively rendered frame. Budget: Number of points rendered in the Fill pass. All timings in milliseconds.

## Limitations

This project is an early prototype that is super unstable. It works, but you should expect crashes, bugs and frequent breaking changes as it is updated.

## License

This project is licensed under the 2-Clause BSD License, see LICENSE.txt.
Some parts of the engine, mainly the math classes is *src_js/math*, are heavily inspired and partially taken from [three.js](https://github.com/mrdoob/three.js/), which is available under the [MIT License](https://github.com/mrdoob/three.js/blob/dev/LICENSE).

