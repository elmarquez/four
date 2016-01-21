Work to be Done
===============

x update repo name
x tour controller
x simulated annealing path planner
x camera tests
x marquee selection
x overlay/popup
- execute path planning in a worker
    - build worker versions of the SA, GA functions
    - split the planner functions off into a separate package
- execute view indexing in a worker

- snap to point
- decouple selection and path _navigation_
- arrow controls for all navigation modes
- !!! need to check both mouse down and which mouse button was pressed

- implement a new orbit controller from the individual pan, etc parts
- first person controller
  - need to make a decision as to whether the lookAt direction is the direction of travel or whether it is independent
  - need to maintain an offset direction 
- viewcube
- viewaxis
  - labels orient toward camera
  - mouseenter/mouseleave
  - configure the xy plane color
- command palette, hotbox
- transform controller
- make web site for library
- construction plane
- lidar editing
- documentation
- improve smoothness of camera controllers

- solid modelling
- packaging into an Electron application
- angular application components
    - layer palette
    - tool palette
    - selection palette
  
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

* http://blog.autodesk360.com/how-to-view-slice-your-3d-models-by-axis/
