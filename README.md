FOUR - CAD Application Components
=================================

Components for threejs computer aided design applications.
 
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

Install build tooling dependencies:

    npm install
    
Install run time dependencies:

    bower install
    
The ViewAxis control requires the THREE Helvetiker Regular typeface. This font
file is not included in the compiled FOUR library and must be loaded separately.
However, the file itself is provided in the distribution folder.


Compiling and Running the Demo
------------------------------

List all available build commands:

    grunt
    
Compile the library:
    
    grunt compile
    
Start a web server and serve the demo application from the localhost:

    grunt serve

Your default browser will open at the top level folder of the project. Select
the 'demo' folder in the file listing.


License
-------

See the LICENSE file.
