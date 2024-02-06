
(function(me){

// Create a function to add items to the render queue
function addToRenderQueue(folderName, outputModuleSettings, renderSettings) {
    var project = app.project;
    if (!project) return alert("No project found.");

    var folder = findFolderByName(project.rootFolder, folderName);
    if (!folder) return alert("Folder '" + folderName + "' not found.");

    app.beginUndoGroup("Add Items to Render Queue");

    for (var i = 1; i <= folder.numItems; i++) {
        var item = folder.item(i);
        if (item instanceof CompItem) {
            var renderQueueItem = app.project.renderQueue.items.add(item);

            renderQueueItem.applyTemplate(renderSettings);
            renderQueueItem.outputModule(1).applyTemplate(outputModuleSettings);
        }
    }

    app.endUndoGroup();
}

// Function to find a folder by name
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
var outputModuleSettings = "Prores422HQ"; // Specify your output module settings template name
var renderSettings = "Xaryen - Default"; // Specify your render settings template name



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

// DropDownList for take type
var takeTypeDropdown = win.add("dropdownlist", undefined, ["Type 1", "Type 2", "Type 3"]);
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
    addToRenderQueue(folderName, outputModuleSettings, renderSettings);
    updateListBox();
};

renderBtn.onClick = function() {
    $.writeln("rendering!");
    //app.project.renderQueue.render();
};

settingsBtn.onClick = function() {
    alert("Settings button clicked. Implement settings dialog or functionality here.");
};

// Initial update of the ListBox
updateListBox();

// Show the window
win.center();
win.show();

$.writeln("test");




})(this);