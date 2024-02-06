(function(me){

    function addToRenderQueue(folderName, outputModuleSettings, renderSettings, outputPath) {
        var project = app.project;
        if (!project) return alert("No project found.");

        var folder = findFolderByName(project.rootFolder, folderName);
        if (!folder) return alert("Folder '" + folderName + "' not found.");

        app.beginUndoGroup("Add Items to Render Queue");

        for (var i = 1; i <= folder.numItems; i++) {
            var item = folder.item(i);
            if (item instanceof CompItem && !isCompInRenderQueue(item)) {
                var renderQueueItem = app.project.renderQueue.items.add(item);
                renderQueueItem.applyTemplate(renderSettings);
                
                // Set output module settings and file path
                var outputModule = renderQueueItem.outputModule(1);
                outputModule.applyTemplate(outputModuleSettings);
                var outputFile = new File(outputPath + "/" + item.name + ".mov"); // .mov works for everything for some reason?
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

    function updateTake(comp){

        var getTake = comp.name.split("_").reverse()[0]
        var getTakeNumber = getTake.charAt(1);
        var getTakeType = getTake.charAt(0);

        return [getTakeType, getTakeNumber];

       
    }

    function updateDropdownSelection(takeTy) {
        var selectionIndex = 1;

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

        // Update the dropdown selection
        takeTypeDropdown.selection = selectionIndex;
    }

    function showSettingsDialog() {
        var dlg = new Window("dialog", "Settings");
        clearRenderQueue();
        var tempRQitem = app.project.renderQueue.items.add(topComp);
        $.writeln(tempRQitem.comp.name);
        dlg.orientation = "column";
        dlg.alignChildren = "fill";

        // Folder Name
        var folderGroup = dlg.add("group", undefined);
        folderGroup.add("statictext", undefined, "Folder Name:");
        var folderNameInput = folderGroup.add("edittext", undefined, "00_render");
        folderNameInput.size = [200, 20];

        // Output Module Settings Dropdown
        var outputModuleGroup = dlg.add("group", undefined);
        outputModuleGroup.add("statictext", undefined, "Output Module Settings:");
        var oMList = []
        $.writeln(oMList);
        oMList = tempRQitem.outputModule(1).templates;
        $.writeln(oMList);
        var outputModuleDropdown = outputModuleGroup.add("dropdownlist", undefined, oMList);
        outputModuleDropdown.selection = outputModuleDropdown.find("Prores422HQ"); // Default selection or first if not found

        // Render Settings Dropdown
        var renderSettingsGroup = dlg.add("group", undefined);
        renderSettingsGroup.add("statictext", undefined, "Render Settings:");
        var renderSettings = renderSettingsGroup.add("edittext", undefined, "Xaryen - Default");

        // Render Path
        var renderPathGroup = dlg.add("group", undefined);
        renderPathGroup.add("statictext", undefined, "Render Path:");
        var renderPathInput = renderPathGroup.add("edittext", undefined, "D:/08_test");
        renderPathInput.size = [200, 20];

        // Buttons
        var btnsGroup = dlg.add("group", undefined);
        btnsGroup.alignment = "right";
        var okBtn = btnsGroup.add("button", undefined, "OK");
        var cancelBtn = btnsGroup.add("button", undefined, "Cancel");

        okBtn.onClick = function() {
            // Update global variables with settings dialog input
            folderName = folderNameInput.text;
            outputModuleSettings = outputModuleDropdown.selection.text;
            renderSettings = renderSettingsDropdown.selection.text;
            renderPath = renderPathInput.text;
            clearRenderQueue();
            dlg.close();
        };

        cancelBtn.onClick = function() {
            dlg.close();
            clearRenderQueue();
        };

        dlg.show();
    }

    // Example usage
    var folderName = "00_render";
    var outputModuleSettings = "Prores422HQ"; // Specify your output module settings template name
    // var outputModuleSettings = "HDR-EXR"; // Specify your output module settings template name
    var renderSettings = "Xaryen - Default"; // Specify your render settings template name
    var renderPath = "D:/08_test";
    var topComp = app.project.item(2);

    // Create the UI
    var win = new Window("palette", "Render Queue Controls", undefined);
    win.orientation = "column";

    // ListBox for render queue items
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
    var takeTypeDropdown = bottRow1.add("dropdownlist", undefined, ["TIMING", "MAIN", "LINE", "PREVIZ", "KONTE"]);
    takeTypeDropdown.selection = 0; // Default selection

    // take number
    var bottRow2 = win.add("group", undefined);
    bottRow2.orientation = "row";
    var takeNumberText = bottRow2.add("statictext", undefined,"Take Type:");
    var takeMinus = bottRow2.add("button", undefined, "-");
    var takeNumber = bottRow2.add("edittext", undefined);
    takeNumber.readonly = true;
    takeNumber.text = updateTake(topComp)[1];
    var takePlus = bottRow2.add("button", undefined, "+");

    var takeType = updateTake(topComp)[0];
    var takeNumber = updateTake(topComp)[0];

    // Event Handlers
    updateBtn.onClick = function() {
        addToRenderQueue(folderName, outputModuleSettings, renderSettings,renderPath);
        updateListBox();
    };

    renderBtn.onClick = function() {
        $.writeln("rendering!");
        //alert("rendering!");
        app.project.renderQueue.render();
    };

    settingsBtn.onClick = function() {
        showSettingsDialog();
    };

    clearQueueBtn.onClick = function() {
        clearRenderQueue();
        updateListBox();
    };

    takeTypeDropdown.onChange = function(){
        var tKn = updateTake(app.project.item(2));
         $.writeln(tKn);
    };


    

    // Initial update of the ListBox
    updateListBox();
    updateDropdownSelection(takeType);

    // Show the window
    win.center();
    win.show();

    $.writeln("test");
})(this);
