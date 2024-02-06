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
                var outputFile = new File(outputPath + "/" + item.name + ".mov"); // Example for .mov file
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

    // Example usage
    var folderName = "00_render";
    // var outputModuleSettings = "Prores422HQ"; // Specify your output module settings template name
    var outputModuleSettings = "HDR-EXR"; // Specify your output module settings template name
    var renderSettings = "Xaryen - Default"; // Specify your render settings template name
    var renderPath = "D:/_toRender";

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
    var bottRow = win.add("group", undefined);
    bottRow.orientation = "row";
    var takeText = bottRow.add("statictext", undefined,"Take Type:");
    var takeTypeDropdown = bottRow.add("dropdownlist", undefined, ["TIMING", "MAIN", "LINE", "PREVIZ", "KONTE"]);
    takeTypeDropdown.selection = 0; // Default selection

    // Function to update ListBox with render queue items
    function updateListBox() {
        listBox.removeAll();
        for (var i = 1; i <= app.project.renderQueue.items.length; i++) {
            var item = app.project.renderQueue.item(i);
            listBox.add("item", item.comp.name);
        }
    }

    // Event Handlers
    updateBtn.onClick = function() {
        addToRenderQueue(folderName, outputModuleSettings, renderSettings,renderPath);
        updateListBox();
    };

    renderBtn.onClick = function() {
        $.writeln("rendering!");
        alert("rendering!");
        //app.project.renderQueue.render();
    };

    settingsBtn.onClick = function() {
        alert("Settings button clicked. Implement settings dialog or functionality here.");
    };

    clearQueueBtn.onClick = function() {
        clearRenderQueue();
    };


    // Function to clear the render queue
    function clearRenderQueue() {
        var rq = app.project.renderQueue;
        app.beginUndoGroup("Clear Render Queue");

        // Iterate backwards through the render queue items to remove them
        for (var i = rq.items.length; i >= 1; i--) {
            rq.item(i).remove();
        }

        app.endUndoGroup();
    }

    // Initial update of the ListBox
    updateListBox();

    // Show the window
    win.center();
    win.show();

    $.writeln("test");
})(this);