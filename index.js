var loadedROM = false;

var cpu = new CPU();
cpu.init();

var fileSelected = document.getElementById('files');
fileSelected.addEventListener('change', function (e) {
    var fileTobeRead = fileSelected.files[0];
    var fileReader = new FileReader(); 
    fileReader.onload = function (e) {
    	cpu.reset();
	    cpu.loadROM(fileReader.result);
		cpu.disassemble();
		loadedROM = true;
   	} 
    fileReader.readAsText(fileTobeRead); 
}, false);

var debug = new Debugger();
debug.init(cpu);

document.onkeydown = function(e) {
	cpu.updateKeys(e.keyCode, 0);
}

document.onkeyup = function(e) {
	cpu.updateKeys(e.keyCode, 1)
}

setInterval(function () {
	if (loadedROM) {
		cpu.run();
		debug.update();
	}
}, 1000/240);

function debug1() {
	document.getElementById('memoryAddress').innerHTML = cpu.getMemory(document.getElementById('memorySubmit').value)
}

function changeColor(mode) {
	if (mode == 0) {
		cpu.changeForeground(document.getElementById('fpicker').value);
	} else {
		cpu.changeBackground(document.getElementById('bpicker').value);
	}
}