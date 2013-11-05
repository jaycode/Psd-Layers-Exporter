/**
 * Psd layers exporter
 *
 * @author Teguh Wijaya <jay@teguhwijaya.com>
 * @link http://www.teguhwijaya.com/
 * @copyright Copyright &copy; 2012 Teguh Wijaya
 * @version 1.2.4
 * Thanks to Brett Bibby (brettb@unity3d.com) for introducing me to jsx coding.
 */

/**
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

 v.1.2.2
 7. This script also support layersets within layersets too

 v.1.2.3
 8. Export as jpeg or gif

 v.1.2.4
 9. Will only export when file not found.

Layerset naming guide: [layerset name]:[w]:[h]:[type]
   This layerset will repeat vertically, looping the first 2px height from top-left:
   [layerset name]:-:2

   This layerset will repeat horizontally, looping the first 1px width from top-left:
   [layerset name]:1:-

   This layerset will repeat with 10px width and height:
   [layerset name]:10:10

   This layerset will not be exported:
   *[layerset name]

   This layerset will be exported as jpeg:
   [layerset name]:[w]:[h]:jpeg[quality] or [layerset name]:[w]:[h]:jpg[quality]
   quality is an integer between 1 - 10, default is 10. Example: jpg9

   This layerset will be exported as gif:
   [layerset name]:[w]:[h]:gif

   This layerset will be exported as png (default):
   [layerset name]:[w]:[h]:png or [layerset name]:[w]:[h]
 */

// enable double clicking from the Macintosh Finder or the Windows Explorer
#target photoshop

// setup global variables
var sourcePsd;
var duppedPsd;
var destinationFolder;
var objectId = 0;
var debugFile;
var existingFiles = '';

// run the exporter
main();

// main entry point
function main()
{

	// got a valid document?
	if( app.documents.length <= 0 )
	{
		if(app.playbackDisplayDialogs != DialogModes.NO)
		{
			alert("You must have a document open to export!");
		}
		// quit, returning 'cancel' makes the actions palette not record our script
		return 'cancel';
	}

	// ask for where the exported files should go
	destinationFolder = Folder(app.activeDocument.fullName.path).selectDlg("Choose the destination for export.");
	if(!destinationFolder)
	{
		return;
	}


	debugFile = new File(destinationFolder + "/debug.txt");
	debugFile.open('w');
	debugFile.writeln('start');

	folder = new Folder(destinationFolder);
	existingFiles = folder.getFiles().toString();
	debugFile.writeln('all existingFiles: ' + existingFiles);

	// cache useful variables
	sourcePsdName = app.activeDocument.name; 
	var layerCount = app.documents[sourcePsdName].layers.length;
	var layerSetsCount = app.documents[sourcePsdName].layerSets.length;

	if((layerCount <= 1)&&(layerSetsCount <= 0))
	{
		if(app.playbackDisplayDialogs != DialogModes.NO)
		{
			alert("You need a document with multiple layers to export!");
			// quit, returning 'cancel' makes the actions palette not record our script
			return 'cancel';
		}
	}

	debugFile.writeln('before duplicating psd');
	// duplicate document so we can extract everything we need
	duppedPsd = app.activeDocument.duplicate();
	duppedPsd.activeLayer = duppedPsd.layers[duppedPsd.layers.length-1];
	// clean it up
	debugFile.writeln('about to hide all art layers');
	hideAllArtLayers(duppedPsd);

	debugFile.writeln('about to export layer sets');
	exportLayerSets(duppedPsd, 0);

	debugFile.writeln('closing the file');
	duppedPsd.close(SaveOptions.DONOTSAVECHANGES);
	debugFile.close();
}


function filepathFromName(name) {
	var nameArray = name.split(':');
	var name = nameArray[0];
	var width = nameArray[1];
	var height = nameArray[2];
	var type = nameArray[3];

	if (typeof(type) == 'undefined') {
		type = 'png';
	}
	var ext = type;

	if (type.indexOf('jpg') !== -1 || type.indexOf('jpeg') !== -1) {
		ext = 'jpg';
	}
	else if (type == 'gif') {
	}
	else {
		ext = 'png';
	}
	return destinationFolder + "/" + name + "." + ext;
}

function fileExists(needle) {
	var rx = new RegExp(needle+"(.)");
	return rx.test(existingFiles);
}

function exportLayerSets(obj, level)
{
	var levelText = "";
	for(var x = 0; x<level;x++) {
		levelText += "  ";
	}

	// for each layer set
	for (var i = 0; i <= obj.layerSets.length-1; i++) {
		var name = obj.layerSets[i].name;
		debugFile.writeln(levelText+"checking layerSet "+name);
		// if it starts with '*', skips
		if (name[0] != '*') {
			debugFile.writeln(levelText+"name does not contain *");
			// turn it to visible first so layers inside it can be exported.
			debugFile.writeln(levelText+'setting ' + obj.layerSets[i].name + ' to visible');
			obj.layerSets[i].visible = true;

			// if it does not contain another layer set
			if (obj.layerSets[i].layerSets.length == 0) {
				// exports
				debugFile.writeln(levelText+"layerSet does not contain another layer set");

				var filepath = filepathFromName(name);
				debugFile.writeln(levelText+'checking if ' + filepath + ' exists');
				if (!fileExists(filepath)) {
					debugFile.writeln(levelText+'does not exist, let\'s create it!');
					exportLayerSet(obj.layerSets[i], levelText);
				}
				else {
					debugFile.writeln(levelText+'not saving because file existed.');
				}
			}
			else {
				// if it contains other layer sets,
				// do exportLayerSets to each of layer sets inside it.
				debugFile.writeln(levelText+"layerSet contains layer sets");
				exportLayerSets(obj.layerSets[i], level+1);
			}

			// turn it to back to invisible.
			obj.layerSets[i].visible = false;
		}
	}
}

function exportLayerSet(layerSet, levelText)
{
	levelText += "> ";
	// filename could be "name:-:10" to make an image with layer width and 10px height.
	var nameArray = layerSet.name.split(':')
	debugFile.writeln(levelText+'export layer set '+layerSet.name+': setup variables');
	var name = nameArray[0];
	var width = nameArray[1];
	var height = nameArray[2];
	var type = nameArray[3];

	if (width == '-') width = null;
	if (height == '-') height = null;
	debugFile.writeln(levelText+'name: '+name+"\n"+levelText+"width: "+width+"\n"+levelText+"height: "+height);

	if (layerSet.artLayers.length > 0) {
		for (var j = 0; j < layerSet.artLayers.length; j++) {
			var artLayer = layerSet.artLayers[j];
			debugFile.writeln(levelText+'turning layer ' + artLayer.name + ' to visible');
			artLayer.visible = true;
			duppedPsd.activeLayer = artLayer;
		}
		debugFile.writeln(levelText+'about to save to scene');
		saveScene(duppedPsd.duplicate(), name, width, height, levelText, type);
		debugFile.writeln(levelText+'Now hide all artLayers inside this layerSet');

		for (var j = 0; j < layerSet.artLayers.length; j++) {
			debugFile.writeln(levelText+'turning layer ' + artLayer.name + ' to hidden');
			var artLayer = layerSet.artLayers[j];
			artLayer.visible = false;
		}
		debugFile.writeln(levelText+'done');
	}
}

function saveScene(psd, fileName, fileWidth, fileHeight, levelText, type)
{
	levelText += "  ";

	debugFile.writeln(levelText+'decide save options');

	var ext = type;
	var saveOptions = null;
	if (typeof(type) == 'undefined') {
		type = 'png';
	}

	if (type.indexOf('jpg') !== -1 || type.indexOf('jpeg') !== -1) {
		type = 'jpeg';
		ext = 'jpg';
		saveOptions = new JPEGSaveOptions();
		var quality = parseInt(type.replace('jpg').replace('jpeg'));
		if (isNaN(quality)) {
			debugFile.writeln(levelText+'jpg quality not set, use default.');
			quality = 10;
		}
		saveOptions.quality = quality;
		debugFile.writeln(levelText+'use jpg save options with quality = '+quality);
	}
	else if (type == 'gif') {
		saveOptions = new GIFSaveOptions();
		debugFile.writeln(levelText+'use gif save options');
	}
	else {
		type = 'png';
		ext = 'png';
		saveOptions = new PNGSaveOptions();
		debugFile.writeln(levelText+'use png save options');
	}

	// save the image
	var file = new File(destinationFolder + "/" + fileName + "." + ext);

	debugFile.writeln(levelText+'mergeVisibleLayers');
	// we should now have a single art layer if all went well
	//psd.flatten();
	psd.mergeVisibleLayers();

	psd.trim(TrimType.TRANSPARENT);

	var width = new UnitValue(psd.width);
	if (fileWidth != null) {
		width = new UnitValue(fileWidth, 'px');
	}

	var height = new UnitValue(psd.height);
	if (fileHeight != null) {
		height = new UnitValue(fileHeight, 'px');
	}
	
	if (fileWidth != null || fileHeight != null) {
		debugFile.writeln(levelText+'resizeCanvas with width ' + width + ' and height ' + height);
		psd.resizeCanvas(width, height, AnchorPosition.TOPLEFT);
	}

	debugFile.writeln(levelText+"about to save the file");
	psd.saveAs(file, saveOptions, true, Extension.LOWERCASE);
	debugFile.writeln(levelText+'done saving scene');

	psd.close(SaveOptions.DONOTSAVECHANGES);
}		

function hideAllArtLayersDepr(obj)
{
	for(var i = 0; i < obj.artLayers.length; i++)
	{
		debugFile.writeln("hide artLayer " + obj.artLayers[i].name);
		obj.artLayers[i].allLocked = false;
		obj.artLayers[i].visible = false;
	}

	for( var i = 0; i < obj.layerSets.length; i++)
	{
		var type = obj.layerSets[i].name.split(':')[0];
		// If first character of name is '*', do not export.
		if (obj.layerSets[i].name.charAt(0) == '*') {
			debugFile.writeln("hide layerSet " + obj.layerSets[i].name);
			obj.layerSets[i].visible = false;
		}
		else {
			hideAllArtLayers(obj.layerSets[i]);
		}
	}
}

// Hide layers functions

///////////////////////////////////////////////////////////////////////////////
// main - set the visibility of all layers to off (invisible)
///////////////////////////////////////////////////////////////////////////////
function hideAllArtLayers(doc) {
	// declare local variables
	var layer = doc.activeLayer;
	// delete Background if it exists
	var background = doc.layers[doc.layers.length -1];
	if (background.isBackgroundLayer) {
		background.remove();
	}
	debugFile.writeln('background deleted');

	// select and hide all layers
	selectAllLayers();
	hideLayers();
	debugFile.writeln('layers hidden');
	
}

///////////////////////////////////////////////////////////////////////////////
// selectAllLayers - select all layers (Select > All Layers)
///////////////////////////////////////////////////////////////////////////////
function selectAllLayers() {
	var ref = new ActionReference();
	ref.putEnumerated(cTID('Lyr '), cTID('Ordn'), cTID('Trgt'));
	var desc = new ActionDescriptor();
	desc.putReference(cTID('null'), ref);
	executeAction(sTID('selectAllLayers'), desc, DialogModes.NO);
}

///////////////////////////////////////////////////////////////////////////////
// hideLayers - hide all selected layers (Layer > Hide Layers)
///////////////////////////////////////////////////////////////////////////////
function hideLayers() {
	var ref = new ActionReference();
	ref.putEnumerated(cTID('Lyr '), cTID('Ordn'), cTID('Trgt'));
	var list = new ActionList();
	list.putReference(ref);
	var desc = new ActionDescriptor();
	desc.putList(cTID('null'), list);
	executeAction(cTID('Hd  '), desc, DialogModes.NO);
}

function cTID(s) {return app.charIDToTypeID(s);}
function sTID(s) {return app.stringIDToTypeID(s);}
