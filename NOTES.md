Work to be Done
===============

* tour controller
* simulated annealing path planner
* camera tests
* documentation
- marquee selection
- decouple selection and path _navigation_
- arrow controls for all navigation modes
- !!! need to check both mouse down and which mouse button was pressed

-  implement a new orbit controller from the individual pan, etc parts
- first person controller
    - need to make a decision as to whether the lookAt direction is the direction of travel
      or whether it is independent
    - need to maintain an offset direction 
 - viewcube
 - viewaxis
    - labels orient toward camera
    - mouseenter/mouseleave
    - configure the xy plane color
 - transform controller
 
 - update repo name, make a web site for it
  
## Bugs

 - improve smoothness of camera motion w pan, rotate controllers
 - http://stackoverflow.com/questions/22571364/threejs-matrix-from-z-up-coordinate-system-to-y-up-coordinate-system
 - http://stackoverflow.com/questions/19625199/threejs-geometry-flipping

## Modes

- Select
    - LMB (single selection toggle)
    - SHIFT + LMB (add to selection)
    - ALT + LMB (remove from selection)
- Pan
    - RMB
- Rotate
    - MMB
- Zoom
    - Wheel


Marquee Selection
-----------------

* http://tempt3d.com/webgl-code-samples/canvas-interaction/marquee-select.html


User Interface Mockup
---------------------

 - Angular based
 - multiple viewports
 - scene graph


Alternate Camera Implementations
--------------------------------

http://hamelot.co.uk/visualization/three-js-quaternion-camera/


Other
-----

* <link href='https://fonts.googleapis.com/css?family=Abril+Fatface|Work+Sans:400,600,300,200,700' rel='stylesheet' type='text/css'>
* font-family: 'Work Sans', sans-serif;
* font-family: 'Abril Fatface', cursive;
* http://blog.autodesk360.com/how-to-view-slice-your-3d-models-by-axis/
