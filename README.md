FOUR - User Interface Components for Web Based CAD
==================================================

FOUR is a family of components for building web-based computer aided design applications using THREE.js.
 
 * FirstPersonController - First person navigation controller
 * OrbitController - Orbit controller
 * TrackballController - Trackball controller
 * MotionPlanner - camera motion path planner
 * TargetCamera - camera for CAD applications
 * ViewAxis - camera orientation controller
 * ViewCube - camera orientation controller
 * Viewport3D - 3D viewport.


Dependencies
------------

Install dependencies:

    yarn install
    
The ViewAxis control requires the THREE Helvetiker Regular typeface. This font
file is not included in the compiled FOUR library and must be loaded separately.
However, the file itself is provided in the distribution folder.


Compiling and Running the Demo
------------------------------

Compile the library:
    
    yarn build
    
Start a web server and serve the demo application from the localhost:

    yarn serve

Your default browser will open at the top level folder of the project. Select
the 'demo' folder in the file listing.


License
-------

See the LICENSE file.
