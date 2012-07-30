 As a web developer I found it really tedious and counter-productive to have to cut and export
 layers in photoshop everytime I made even the smallest changes to the design.

 This script is designed to handle just that. Now you can simply open the document in photoshop,
 then double click this script, and walla all the layers are exported in a folder you specify.

 Features:
 1. Group by layer sets then export each layer sets.
 2. Multiple layer in a layer set? Can do.
 3. Transparent layers? No problem.
 4. Layer sets with opacity? Also can.
 5. You can also export repeated images by defining width or height of layer set to be exported.
 6. You can exclude some layers from exports too.

 How to export:
 Say you have these layer sets:
 image1
 
 |_ layer1
 
 |_ layer2
 |_ layer3
 noexport
 |_ layer4
 |_ layer5
 xrepeat:1:-
 |_ layer6
 yrepeat:-:2
 |_ layer7
 |_ layer8
 xyrepeat:10:10
 |_ layer9
 noexport
 |_ layer10

When you run this script, you will get the following:
 1. Exported files are image1,png, xrepeat.png, yrepeat.png, xyrepeat.png. noexport layer sets are not processed.
    The name could be anything, obviously.
 2. image1.png will be filled with layer1, layer2, and layer3 merged together, and yrepeat.png will be the same only
    with layer7 and layer8.
 3. xrepeat.png will have 1px width and height as big as the combination of images inside of it. The idea is
    you should be able to use it with x-repeat ed background.
 4. yrepeat.png will have 2px height.
 5. xyrepeat.png will have 10px width x 10px height.