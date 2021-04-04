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

Add FOUR as a dependency to your project:

    npm install -S @elmarquez/four

then import the library in your application:

    import FOUR from '@elmarquez/four';

The ViewAxis control requires the THREE Helvetiker Regular typeface. This font
file is not included in the compiled FOUR library and must be loaded separately.
However, the file itself has been provided in the distribution folder.

    import '@elmarquez/four/dist/fonts/helvetiker_regular.typeface';

Optional FOUR css styles for HTML viewport overlay elements are available in a 
separate file:

    import '@elmarquez/four/dist/css/four.css';


Development
-----------

See the issues list and project board for the list of current or planned 
modifications.

Install build and runtime dependencies:

    npm install
 
Build the library:

    npm run build

Build documentation:

    npm run docs


License
-------

See the LICENSE file.
