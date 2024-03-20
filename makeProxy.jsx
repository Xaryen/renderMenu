(function(me){

    function addToRenderQueue(comps, outputModuleSettings, renderSettings, outputPath) {

        var path = outputPath;

        $.writeln("check in");
        $.writeln(comps[1]);
        app.beginUndoGroup("Add Items to Render Queue");

        

        for (var i = 0; i < comps.length; i++) {
            var item = comps[i];
            $.writeln(item.name);
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


    function showSettingsDialog() {
        var dlg = new Window("dialog", "Settings");
        clearRenderQueue();
        var tempRQitem = app.project.renderQueue.items.add(app.project.activeItem);
        dlg.orientation = "column";
        dlg.alignChildren = "fill";

        //output Module Settings Dropdown
        var outputModuleGroup = dlg.add("group", undefined);
        outputModuleGroup.add("statictext", undefined, "Output Module Settings:");
        var oMList = tempRQitem.outputModule(1).templates.slice(0, -6); //removes the built in hidden output modules
        var outputModuleDropdown = outputModuleGroup.add("dropdownlist", undefined, oMList);
        outputModuleDropdown.selection = outputModuleDropdown.find(outputModuleSettings) || 0;

        //image sequence toggle
        var imgSeqToggle = dlg.add("checkbox", undefined, "ImageSequence Folder");
        imgSeqToggle.value = isImgSeq;

        //render settings dropdown
        var renderSettingsGroup = dlg.add("group", undefined);
        renderSettingsGroup.add("statictext", undefined, "Render Settings:");
        var rSList = tempRQitem.templates;
        var renderSettingsDropdown = renderSettingsGroup.add("dropdownlist", undefined, rSList);
        renderSettingsDropdown.selection = renderSettingsDropdown.find(renderSettings) || 0;

        // Buttons
        var btnsGroup = dlg.add("group", undefined);
        btnsGroup.alignment = "right";
        var okBtn = btnsGroup.add("button", undefined, "OK");
        var cancelBtn = btnsGroup.add("button", undefined, "Cancel");

        okBtn.onClick = function() {
            outputModuleSettings = outputModuleDropdown.selection.text;
            renderSettings = renderSettingsDropdown.selection.text;
            isImgSeq = imgSeqToggle.value;

            app.settings.saveSetting("makeProxy", "outputModuleSettings", outputModuleSettings);
            app.settings.saveSetting("makeProxy", "renderSettings", renderSettings);
            app.settings.saveSetting("makeProxy", "isImgSeq", isImgSeq);

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


    //-----------------------------------------------------------------------main

    //load prefs
    var outputModuleSettings = app.settings.haveSetting("makeProxy", "outputModuleSettings") ? app.settings.getSetting("makeProxy", "outputModuleSettings") : "proxy-QT";
    var renderSettings = app.settings.haveSetting("makeProxy", "renderSettings") ? app.settings.getSetting("makeProxy", "renderSettings") : "Xaryen - Proxy";
    var isImgSeq = app.settings.haveSetting("makeProxy", "isImgSeq") ? (app.settings.getSetting("makeProxy", "isImgSeq") === "true") : false;

    // Globals
    var myProject = app.project.file
    if (!myProject) return; 
    var renderPath = "";
    renderPath = myProject.path;
    var myComps = app.project.selection;
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


    // Event Handlers
    updateBtn.onClick = function() {
        myComps = app.project.selection;
        $.writeln(myComps);
        addToRenderQueue(myComps, outputModuleSettings, renderSettings, renderPath);
        updateListBox();
    };

    renderBtn.onClick = function() {
        $.writeln("rendering!");
        if (!(app.project.renderQueue.numItems > 0)){$.writeln("render queue empty");return;}
        app.project.save();
        win.update();
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

    // Initial update of the ListBox
    updateListBox();

    // Show the window
    win.center();
    win.show();

    $.writeln("joever");
})(this);


