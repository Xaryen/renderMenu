//TODO: trim the hidden modules 

(function(me){

    function getObjectKeys(obj) {
        var keys = [];
        for (var key in obj) {
            if (obj.hasOwnProperty(key)) {
                keys.push(key);
            }
        }
        return keys;
    }

    function getObjectValues(obj) {
        var values = [];
        for (var key in obj) {
            if (obj.hasOwnProperty(key)) {
                values.push(obj[key]);
            }
        }
        return values;
    }

    function addToRenderQueue(renderFolder, outputModuleSettings, renderSettings, outputPath) {

        var path = outputPath;

        var folder = renderFolder;

        app.beginUndoGroup("Add Items to Render Queue");

        for (var i = 1; i <= folder.numItems; i++) {
            var item = folder.item(i);
            if (item instanceof CompItem && !isCompInRenderQueue(item)) {
                var renderQueueItem = app.project.renderQueue.items.add(item);
                renderQueueItem.applyTemplate(renderSettings);
                
                if (isImgSeq){
                    path = outputPath + "/" + "imgSeq"
                }
                
                // Set output module settings and file path
                var outputModule = renderQueueItem.outputModule(1);
                outputModule.applyTemplate(outputModuleSettings);
                var outputFile = new File(path + "/" + item.name + ".mov"); // .mov works for everything for some reason?
                outputModule.file = outputFile;
            }
        }

        app.endUndoGroup();
    }

    function isCompInRenderQueue(compToCheck) {
        for (var i = 1; i <= app.project.renderQueue.items.length; i++) {
            var rqItem = app.project.renderQueue.item(i);
            if (rqItem.status !== RQItemStatus.USER_STOPPED && rqItem.comp.id === compToCheck.id) {
                return true; // The composition is already in the render queue
            }
        }
        return false; // The composition is not in the render queue
    }

    function findFolderByName(parentFolder, name) {
        for (var i = 1; i <= parentFolder.numItems; i++) {
            var item = parentFolder.item(i);
            if (item instanceof FolderItem && item.name === name) {
                return item;
            }
        }
        return null;
    }

    function clearRenderQueue() {
        var rq = app.project.renderQueue;
        app.beginUndoGroup("Clear Render Queue");

        for (var i = rq.items.length; i >= 1; i--) {
            rq.item(i).remove();
        }

        app.endUndoGroup();
    }

    function updateListBox() {
        listBox.removeAll();
        for (var i = 1; i <= app.project.renderQueue.items.length; i++) {
            var item = app.project.renderQueue.item(i);
            listBox.add("item", item.comp.name);
        }
    }

    function getTake(comp){

        var take = comp.name.split("_").reverse()[0]
        var takeT = take.charAt(0);
        var takeN = parseInt(take.charAt(1));

        return [takeT, takeN];
    }

    function getDropdownSelection(takeTy) {
        var selectionIndex = 0;

            switch(takeTy) {
                case "T":
                    selectionIndex = 0;
                    break;
                case "F":
                    selectionIndex = 1;
                    break;
                case "G":
                    selectionIndex = 2;
                    break;
                case "P":
                    selectionIndex = 3;
                    break;
                case "K":
                    selectionIndex = 4;
                    break;
            default:
                    selectionIndex = 1;
                    break;
            }

        return selectionIndex;
    }

    function showSettingsDialog() {
        var dlg = new Window("dialog", "Settings");
        clearRenderQueue();
        var tempRQitem = app.project.renderQueue.items.add(app.project.activeItem);
        dlg.orientation = "column";
        dlg.alignChildren = "fill";

        // Render Path
        var renderPathGroup = dlg.add("group", undefined);
        renderPathGroup.add("statictext", undefined, "Render Path:");
        var renderPathInput = renderPathGroup.add("edittext", undefined, renderPath);
        renderPathInput.size = [200, 20];

        // Folder Name
        var folderGroup = dlg.add("group", undefined);
        folderGroup.add("statictext", undefined, "Folder Name:");
        var folderNameInput = folderGroup.add("edittext", undefined, folderName);
        folderNameInput.size = [200, 20];

        // Output Module Settings Dropdown
        var outputModuleGroup = dlg.add("group", undefined);
        outputModuleGroup.add("statictext", undefined, "Output Module Settings:");
        var oMList = tempRQitem.outputModule(1).templates.slice(0, -6);
        var outputModuleDropdown = outputModuleGroup.add("dropdownlist", undefined, oMList);
        outputModuleDropdown.selection = outputModuleDropdown.find(outputModuleSettings) || 0;

        //image sequence toggle
        var imgSeqToggle = dlg.add("checkbox", undefined, "ImageSequence Folder");
        imgSeqToggle.value = isImgSeq;

        // Render Settings Dropdown - This should actually be an EditText based on your provided code
        var renderSettingsGroup = dlg.add("group", undefined);
        renderSettingsGroup.add("statictext", undefined, "Render Settings:");
        var rSList = tempRQitem.templates;
        var renderSettingsDropdown = renderSettingsGroup.add("dropdownlist", undefined, rSList);
        renderSettingsDropdown.selection = renderSettingsDropdown.find(renderSettings) || 0;

        //slate
        var nameGrp = dlg.add("group")
        nameGrp.orientation = "row";
        nameGrp.add("statictext", undefined, "Compositor Name: ");
        var myNameInput = nameGrp.add("edittext", undefined, myName);
        myNameInput.size = [100,28];

        // Buttons
        var btnsGroup = dlg.add("group", undefined);
        btnsGroup.alignment = "right";
        var okBtn = btnsGroup.add("button", undefined, "OK");
        var cancelBtn = btnsGroup.add("button", undefined, "Cancel");

        okBtn.onClick = function() {
            folderName = folderNameInput.text;
            outputModuleSettings = outputModuleDropdown.selection.text;
            renderSettings = renderSettingsDropdown.selection.text;
            renderPath = renderPathInput.text;
            isImgSeq = imgSeqToggle.value;
            myName = myNameInput.text;

            app.settings.saveSetting("xRender", "folderName", folderName);
            app.settings.saveSetting("xRender", "outputModuleSettings", outputModuleSettings);
            app.settings.saveSetting("xRender", "renderSettings", renderSettings);
            app.settings.saveSetting("xRender", "renderPath", renderPath);
            app.settings.saveSetting("xRender", "isImgSeq", isImgSeq);
            app.settings.saveSetting("xRender", "myName", myName);

            clearRenderQueue();
            dlg.close();
        };

        cancelBtn.onClick = function() {
            dlg.close();
            clearRenderQueue();
        };

        dlg.show();
    }

    function updateComp(){
        for (i = 1; i <= renderFolder.numItems; i++){
            var comp = renderFolder.item(i);
            var oldCompName = comp.name;
            var compNameParts = comp.name.split("_");
            compNameParts[compNameParts.length - 1] = takeType + takeNumber;
            comp.name = compNameParts.join("_");
            app.project.autoFixExpressions(oldCompName, comp.name);
        }
    }

    function pad(n) {
        return n < 10 ? '0' + n : n;
    }

    function getDateTime(){
        var now = new Date();
        var year = now.getFullYear();
        var month = now.getMonth() + 1;
        var day = now.getDate();
        var hours = now.getHours();
        var minutes = now.getMinutes();
        var seconds = now.getSeconds();
        var dateTime = year + "/" + pad(month) + "/" + pad(day) + " " + pad(hours) + ":" + pad(minutes);
        var dateString = "Rendered on " + dateTime;
        return dateString;
    }

    function slateBurnIn(){

        for (i = 1; i <= renderFolder.numItems; i++){
            var comp = renderFolder.item(i);
            var dateLayer = comp.layer(1);
            var nameLayer = comp.layer(2);
            if (!(dateLayer instanceof TextLayer) || dateLayer.name !== "DATE-TIME"){return;};
            if (nameLayer instanceof TextLayer && nameLayer.name == "NAME" && nameLayer.text.sourceText.value == ""){
                $.writeln("test");
                nameLayer.text.sourceText.setValue(myName);
            };
            dateLayer.text.sourceText.setValue(getDateTime());
        }
    }


    //-----------------------------------------------------------------------main

    //load prefs
    var folderName = app.settings.haveSetting("xRender", "folderName") ? app.settings.getSetting("xRender", "folderName") : "00_render";
    var outputModuleSettings = app.settings.haveSetting("xRender", "outputModuleSettings") ? app.settings.getSetting("xRender", "outputModuleSettings") : "Prores422HQ";
    var renderSettings = app.settings.haveSetting("xRender", "renderSettings") ? app.settings.getSetting("xRender", "renderSettings") : "Xaryen - Default";
    var renderPath = app.settings.haveSetting("xRender", "renderPath") ? app.settings.getSetting("xRender", "renderPath") : "D:/";
    var isImgSeq = app.settings.haveSetting("xRender", "isImgSeq") ? (app.settings.getSetting("xRender", "isImgSeq") === "true") : false;
    var myName = app.settings.haveSetting("xRender", "myName") ? app.settings.getSetting("xRender", "myName") : "";

    // Globals
    var takeType = "T";
    var takeNumber = 1;
    var takeLookup = {
        "T": "TIMING",
        "F": "MAIN",
        "G": "LINE",
        "P": "PREVIZ",
        "K": "KONTE"
    }
    var tSA = getObjectKeys(takeLookup);
    var takeArray = getObjectValues(takeLookup);

    var topComp = app.project.item(2);
    takeType = getTake(topComp)[0];
    takeNumber = getTake(topComp)[1];

    var renderFolder = findFolderByName(app.project.rootFolder, folderName);

    //UI
    var win = new Window("window", "Render Control", undefined);
    win.orientation = "column";

    var listBox = win.add("listbox", undefined, [], {multiselect: true});
    listBox.size = [300, 200];

    // Buttons
    var btnsGroup = win.add("group", undefined);
    btnsGroup.orientation = "row";
    
    var updateBtn = btnsGroup.add("button", undefined, "Update");
    var renderBtn = btnsGroup.add("button", undefined, "Render");
    var settingsBtn = btnsGroup.add("button", undefined, "Settings");
    var clearQueueBtn = btnsGroup.add("button", undefined, "Clear Queue");

    // DropDownList for take type
    var bottRow1 = win.add("group", undefined);
    bottRow1.orientation = "row";
    var takeTypeText = bottRow1.add("statictext", undefined,"Take Type:");
    var takeTypeDropdown = bottRow1.add("dropdownlist", undefined, takeArray);
    takeTypeDropdown.selection = getDropdownSelection(takeType);

    // take number
    var bottRow2 = win.add("group", undefined);
    bottRow2.orientation = "row";
    var takeNumberText = bottRow2.add("statictext", undefined,"Take:");
    var takeMinus = bottRow2.add("button", undefined, "-");
    var takeNumberDisplay = bottRow2.add("edittext", undefined,"", {readonly: true, multiline: false});
    var takePlus = bottRow2.add("button", undefined, "+");
    takeMinus.size = [50, 28];
    takeNumberDisplay.size = [50, 28];
    takePlus.size = [50, 28];
    takeNumberDisplay.text = takeNumber;
    
 
    // Event Handlers
    updateBtn.onClick = function() {
        addToRenderQueue(renderFolder, outputModuleSettings, renderSettings,renderPath);
        updateListBox();
        slateBurnIn();
    };

    renderBtn.onClick = function() {
        $.writeln("rendering!");
        //alert("rendering!");
        win.close();
        app.project.renderQueue.render();
    };

    settingsBtn.onClick = function() {
        showSettingsDialog();
        updateListBox();
    };

    clearQueueBtn.onClick = function() {
        clearRenderQueue();
        updateListBox();
    };

    takeTypeDropdown.onChange = function(){
        takeType = tSA[takeTypeDropdown.selection.index];
        updateComp();
    };

    takeMinus.onClick = function() {
        if (takeNumber > 1) { 
            takeNumber -= 1;
        }
        takeNumberDisplay.text = takeNumber;
        updateComp();
    };

    takePlus.onClick = function() {
        takeNumber += 1;
        takeNumberDisplay.text = takeNumber;
        updateComp();
    };

    // Initial update of the ListBox
    updateListBox();

    // Show the window
    win.center();
    win.show();

    $.writeln("joever");
})(this);


