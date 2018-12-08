class Opcode {
	constructor(opcode, name, callback) {
		this.opcode = opcode;     //Ex - 00E0
		this.name = name;		  //Ex - 'CLS'
		this.callback = callback; //Function it does
	}

	run(cpu, args) {
		this.callback(cpu, args);
	}

	toString(args) {
		//Splits the opcode name into tokens, then replace the args with actual number
		var tokens = this.name.split(' ');
		var result = '';
		for (var i = 0; i < tokens.length; i++) {
			if (tokens[i] == 'nnn') {
				result += ' ' + args[0].toString(16);
			} else if (tokens[i] == 'n') {
				result += ' ' + args[1].toString(16);
			} else if (tokens[i] == 'x') {
				result += ' ' + args[2].toString(16);
			} else if (tokens[i] == 'y') {
				result += ' ' + args[3].toString(16);
			} else if (tokens[i] == 'kk') {
				result += ' ' + args[4].toString(16);
			} else {
				result += ' ' + tokens[i];
			}
		}
		return result;
	}
}

class Opcodes {
	init() {
		this.opcode = [];

		this.opcode[0x00E0] = new Opcode(0x00E0, 'CLS', function(c, a) {
			//Clears the screen
			for (var i = 0; i < c.graphics.length; i++) {
				c.graphics[i] = 0;
			}
			c.drawFlag = true;
		});
		this.opcode[0x00EE] = new Opcode(0x00EE, 'RET', function(c, a) {
			//Returns from subroutine
			c.programCounter = c.stack[--c.stackPointer];
		});
		this.opcode[0x1000] = new Opcode(0x1000, 'JP nnn', function(c, a) {
			//Sets program counter to nnn
			c.programCounter = a[0];
		});
		this.opcode[0x2000] = new Opcode(0x2000, 'CALL nnn', function(c, a) {
			//Stores PC in stack, then goes to routine
			c.stack[c.stackPointer] = c.programCounter;
			c.stackPointer++;
			c.programCounter = a[0];
		});
		this.opcode[0x3000] = new Opcode(0x3000, 'SE x kk', function(c, a) {
			//If Register x is equal to byte kk, skip next instruction
			if (c.registers[a[2]] == a[4]) {
				c.programCounter += 2;
			}
		});
		this.opcode[0x4000] = new Opcode(0x4000, 'SNE x kk', function(c, a) {
			//If Register x is not equal to byte kk, skip next instruction
			if (c.registers[a[2]] != a[4]) {
				c.programCounter += 2;
			}
		});
		this.opcode[0x5000] = new Opcode(0x5000, 'SE x y', function(c, a) {
			//If Register x is equal to Register y, skip next instruction
			if (c.registers[a[2]] == c.registers[a[3]]) {
				c.programCounter += 2;
			}
		});
		this.opcode[0x6000] = new Opcode(0x6000, 'LD x kk', function(c, a) {
			//Set Register x to byte kk
			c.registers[a[2]] = a[4];
		});
		this.opcode[0x7000] = new Opcode(0x7000, 'ADD x kk', function(c, a) {
			//Add byte kk to Register x
			c.registers[a[2]] += a[4];
		});
		this.opcode[0x8000] = new Opcode(0x8000, 'LD x y', function(c, a) {
			//Set Register x to Register y
			c.registers[a[2]] = c.registers[a[3]];
		});
		this.opcode[0x8001] = new Opcode(0x8001, 'OR x y', function(c, a) {
			//OR Register x and Register y
			c.registers[a[2]] |= c.registers[a[3]];
		});
		this.opcode[0x8002] = new Opcode(0x8002, 'AND x y', function(c, a) {
			//AND Register x and Register y
			c.registers[a[2]] &= c.registers[a[3]];
		});
		this.opcode[0x8003] = new Opcode(0x8003, 'XOR x y', function(c, a) {
			//XOR Register x and Register y
			c.registers[a[2]] ^= c.registers[a[3]];
		});
		this.opcode[0x8004] = new Opcode(0x8004, 'ADD x y', function(c, a) {
			//Add Register x and Register y. If overflow, set Register F to 1, else 0
			if (c.registers[a[2]] + c.registers[a[3]] > 255) {
				c.registers[15] = 1; 
			} else {
				c.registers[15] = 0;
			}
			c.registers[a[2]] = (c.registers[a[2]] + c.registers[a[3]]) % 255
		});
		this.opcode[0x8005] = new Opcode(0x8005, 'SUB x y', function(c, a) {
			//Subtract Register y from Register x. If this causes an underflow, set Register F to 1, else 0
			if (c.registers[a[2]] > c.registers[a[3]]) {
				c.registers[15] = 1;
			} else {
				c.registers[15] = 0;
			}
			c.registers[a[2]] -= c.registers[a[3]]
		});
		this.opcode[0x8006] = new Opcode(0x8006, 'SHR x y', function(c, a) {
			//Set Register F to LSB (most-right bit), and shift Register x to the right by 1
			c.registers[15] = c.registers[a[2]] & 0x1;
            c.registers[a[2]] >>= 1;
		});
		this.opcode[0x8007] = new Opcode(0x8007, 'SUBN x y', function(c, a) {
			//Subtract Register x from Register y. If this causes an underflow, set Register F to 1, else 0
			if (c.registers[a[3]] > c.registers[a[2]]) {
				c.registers[15] = 1;
			} else {
				c.registers[15] = 0;
			}
			c.registers[a[2]] = c.registers[a[3]] - c.registers[a[2]]
		});
		this.opcode[0x800E] = new Opcode(0x800E, 'SHL x y', function(c, a) {
			//Set Register F to MSB (most-left bit), and shift Register x to the left by 1
			c.registers[15] = +(c.registers[a[2]] >> 7);
            c.registers[a[2]] <<= 1;
            if (c.registers[a[2]] > 255) {
            	c.registers[a[2]] -= 256;
            }
		});
		this.opcode[0x9000] = new Opcode(0x9000, 'SNE x y', function(c, a) {
			//If Register x is not equal to Register y, skip next instruction
			if (c.registers[a[2]] != c.registers[a[3]]) {
				c.programCounter += 2;
			}
		});
		this.opcode[0xA000] = new Opcode(0xA000, 'LD I nnn', function(c, a) {
			//Set Register I to nnn
			c.registerI = a[0];
		});
		this.opcode[0xB000] = new Opcode(0xB000, 'JP R0 nnn', function(c, a) {
			//Set program counter to Register 0 offsetted by nnn
			c.programCounter = c.registers[0] + a[0];
		});
		this.opcode[0xC000] = new Opcode(0xC000, 'RND x kk', function(c, a) {
			//AND a random byte and byte kk
			c.registers[a[2]] = Math.floor(Math.random() * 255) & a[4];
		})
		this.opcode[0xD000] = new Opcode(0xD000, 'DRW x y n', function(c, a) {
			//Draws a n-high sprite at the values of Register x for x, and Register y for y. If any pixels are erased, then set Register F to 1
			c.registers[15] = 0;
            var x, y, spr;
            for (y = 0; y < a[1]; y++) {
                spr = c.memory[c.registerI + y];
                for (x = 0; x < 8; x++) {
                    if ((spr & 0x80) > 0) {
                        if (c.setPixel(c.registers[a[2]] + x, c.registers[a[3]] + y, c.graphics)) {
                            c.registers[15] = 1;
                        }
                    }
                    spr <<= 1;
                }
            }
            c.drawFlag = true;
		});
		this.opcode[0xE091] = new Opcode(0xE091, 'SKP x', function(c, a) {
			//If the key with the value of Register x is pressed, skip next instruction
			if (c.keys[c.registers[a[2]]]) {
				c.programCounter += 2;
			}
		});
		this.opcode[0xE0A1] = new Opcode(0xE0A1, 'SKNP x', function(c, a) {
			//If the key with the value of Register x is not pressed, skip next instruction
			if (!c.keys[c.registers[a[2]]]) {
				c.programCounter += 2;
			}
		});
		this.opcode[0xF007] = new Opcode(0xF007, 'LD x DT', function(c, a) {
			//Set Register x to the delay timer
			c.registers[a[2]] = c.delayTimer;
		});
		this.opcode[0xF00A] = new Opcode(0xF00A, 'LD x KEY', function(c, a) {
			//The most confusing opcode of them all
			//Stop all instructions until a key is pressed, then store the key value in Register x
			c.paused = true;
		});
		this.opcode[0xF015] = new Opcode(0xF015, 'LD DT x', function(c, a) {
			//Set the delay timer to Register x
			c.delayTimer = c.registers[a[2]];
		});
		this.opcode[0xF018] = new Opcode(0xF018, 'LD ST x', function(c, a) {
			//Set the sound timer to Register x
			c.soundTimer = c.registers[a[2]];
		});
		this.opcode[0xF01E] = new Opcode(0xF01E, 'ADD I x', function(c, a) {
			//Add Register x to Register I
			c.registerI += c.registers[a[2]];
		});
		this.opcode[0xF029] = new Opcode(0xF029, 'LD F x', function(c, a) {
			//Set Register I to the font at Register x
			c.registerI = c.registers[a[2]] * 5;
		});
		this.opcode[0xF033] = new Opcode(0xF033, 'LD B x', function(c, a) {
			//Set Register I to the hundreds digit of Register x, Register I + 1 to the tens digit of Register x, and Register I + 2 to the ones digit of Register x
			c.memory[c.registerI] = Math.floor(c.registers[a[2]]/100);
			c.memory[c.registerI + 1] = Math.floor((c.registers[a[2]] % 100) / 10);
			c.memory[c.registerI + 2] = Math.floor((c.registers[a[2]] % 100) % 10);
		});
		this.opcode[0xF055] = new Opcode(0xF055, 'LD (I) x', function(c, a) {
			//Store Registers 0 through x into memory at Register I through Register I + x
			for (var i = 0; i <= a[2]; i++) {
				c.memory[c.registerI + i] = c.registers[i];
			}
		});
		this.opcode[0xF065] = new Opcode(0xF065, 'LD x (I)', function(c, a) {
			//Store memory at Register I through Register I + x into Registers 0 through x
			for (var i = 0; i <= a[2]; i++) {
				c.registers[i] = c.memory[c.registerI + i];
			}
		});
	}
}

class CPU {
	constructor() {
		this.opcodes = new Opcodes(); //All the opcodes
		this.registers = []; 	   	  //Registers 0-E
		this.registerI = 0;  	      //Register I - For Memory Addresses
		this.delayTimer = 0; 	      //Delay Timer - Goes down once a frame (60 fps)
		this.soundTimer = 0; 	      //Sound Timer - Goes down once a frame (60 fps)
		this.programCounter = 512;    //Program Counter - Stores current address
		this.stackPointer = 0;        //Stack Pointer - Index for the stack
		this.stack = [];              //Stack - Stores program counter. Max 16
		this.keys = [];			      //Keys - 16 keys to store
		this.graphics = [];		      //Graphics - 64 X 32
		this.memory = []; 		      //Memory - 4kB (4096 B)
		this.drawFlag = false;	      //Draw Flag - tells when to draw
		this.paused = false;	      //Paused State - tells to pause the program
		this.length = 0;		      //Length - the length of the program
		this.foreground = 'white';    //Foreground Color - default white
		this.background = 'black';    //Blackground Color - default black
		this.programArea = document.getElementById('program');
		this.font = [0xF0, 0x90, 0x90, 0x90, 0xF0,  //0
					 0x20, 0x60, 0x20, 0x20, 0x70,	//1
					 0xF0, 0x10, 0xF0, 0x80, 0xF0,	//2
					 0xF0, 0x10, 0xF0, 0x10, 0xF0,	//3
					 0x90, 0x90, 0xF0, 0x10, 0x10,	//4
					 0xF0, 0x80, 0xF0, 0x10, 0xF0,	//5
					 0xF0, 0x80, 0xF0, 0x90, 0xF0,	//6
					 0xF0, 0x10, 0x20, 0x40, 0x40,	//7
					 0xF0, 0x90, 0xF0, 0x90, 0xF0,	//8
					 0xF0, 0x90, 0xF0, 0x10, 0xF0,	//9
					 0xF0, 0x90, 0xF0, 0x90, 0x90,	//A
					 0xE0, 0x90, 0xE0, 0x90, 0xE0,	//B
					 0xF0, 0x80, 0x80, 0x80, 0xF0,	//C
					 0xE0, 0x90, 0x90, 0x90, 0xE0,	//D
					 0xF0, 0x80, 0xF0, 0x80, 0xF0,	//E
					 0xF0, 0x80, 0xF0, 0x80, 0x80]; //F
	}

	init() {
		//Initialize Memory
		for (var i = 0; i < 4096; i++) {
			this.memory[i] = 0;
		}

		//Initialize Registers 0-F
		for (var i = 0; i < 16; i++) {
			this.registers[i] = 0;
		}

		//Initialize Stack
		for (var i = 0; i < 16; i++) {
			this.stack[i] = 0;
		}

		//Initialize Keys
		for (var i = 0; i < 16; i++) {
			this.keys[i] = false;
		}

		//Initialize Grpahics
		for (var i = 0; i < 2048; i++) {
			this.graphics[i] = 0;
		}

		//Initalize all Opcodes
		this.opcodes.init();

		//Loads Font into Memory
		for (var i = 0; i < this.font.length; i++) {
			this.memory[i] = this.font[i];
		}
	}

	reset() {
		//Reset all the variables
		this.registerI = 0;
		this.delayTimer = 0;
		this.soundTimer = 0;
		this.programCounter = 512;
		this.stackPointer = 0;
		this.drawFlag = false;
		this.paused = false;
		this.length = 0;

		//Reset Memory
		for (var i = 0; i < 4096; i++) {
			this.memory[i] = 0;
		}

		//Reset Registers 0-E
		for (var i = 0; i < 16; i++) {
			this.registers[i] = 0;
		}

		//Reset Stack
		for (var i = 0; i < 16; i++) {
			this.stack[i] = 0;
		}

		//Reset Keys
		for (var i = 0; i < 16; i++) {
			this.keys[i] = false;
		}

		//Reset Grpahics
		for (var i = 0; i < 2048; i++) {
			this.graphics[i] = 0;
		}

		//Loads Font back into Memory
		for (var i = 0; i < this.font.length; i++) {
			this.memory[i] = this.font[i];
		}
	}

	loadROM(rom) {
		//Splits rom into two bytes, splits that into two seperate bytes, then adds to memory
		var cleanedBytes = rom.replace(/(\r\n\t|\n|\r\t)/gm, " ");
		var bytes = cleanedBytes.split(' ');
		var mem = [];
		for (var i = 0; i < bytes.length; i++) {
			mem.push(bytes[i].substring(0, 2));
			mem.push(bytes[i].substring(2));
		}
		this.length = mem.length;
		for (var i = 0; i < mem.length; i++) {
			this.memory[512 + i] = parseInt(mem[i], 16);
		}
	}

	run() {
		//Runs one cycle of the CPU
		if (!this.paused) {
			//If not paused, get opcode, and run the function
			var opcode = this.memory[this.programCounter] << 8 | this.memory[this.programCounter + 1];
			var msb1 = (opcode & 0xF000);
			var msb2 = (opcode & 0xF00F);
			var msb3 = (opcode & 0xF0FF);
			var args = [(opcode & 0x0FFF), (opcode & 0x000F), (opcode & 0x0F00) >> 8, (opcode & 0x00F0) >> 4, (opcode & 0x00FF)];
			this.programCounter += 2;
			if (msb3 == 0x00E0 || msb3 == 0x00EE) {
				this.programArea.value += opcode.toString(16) + ': ' + this.opcodes.opcode[opcode].toString(args) + '\n';
				this.opcodes.opcode[opcode].run(this, args);
			} else if (this.opcodes.opcode[msb3] != null) {
				this.programArea.value += opcode.toString(16) + ': ' + this.opcodes.opcode[msb3].toString(args) + '\n';
				this.opcodes.opcode[msb3].run(this, args);
			} else if (this.opcodes.opcode[msb2] != null) {
				this.programArea.value += opcode.toString(16) + ': ' + this.opcodes.opcode[msb2].toString(args) + '\n';
				this.opcodes.opcode[msb2].run(this, args);
			} else if (this.opcodes.opcode[msb1] != null) {
				this.programArea.value += opcode.toString(16) + ': ' + this.opcodes.opcode[msb1].toString(args) + '\n';
				this.opcodes.opcode[msb1].run(this, args);
			} else {
				this.programArea.value += 'Invalid Opcode: ' + opcode.toString(16) + '\n';
			}
			//Draws if the draw flag is on
			if (this.drawFlag) {
				for (var y = 0; y < 32; y++) {
					for (var x = 0; x < 64; x++) {
						if (this.graphics[y * 64 + x] == 1) {
							document.getElementById('emu-canvas').getContext('2d').fillStyle = this.foreground;
						} else {
							document.getElementById('emu-canvas').getContext('2d').fillStyle = this.background;
						}
						document.getElementById('emu-canvas').getContext('2d').fillRect(x * 10, y * 10, 10, 10);
					}
				}
				this.drawFlag = false;
			}
			//Update Timers at whatever frame rate
			this.updateTimers();
		} else {
			//If paused, do opcode Fx0A
			var opcode = this.memory[this.programCounter] << 8 | this.memory[this.programCounter + 1];
			if (this.currentKey != -1) {
				this.registers[(opcode & 0x0F00) >> 8] = this.currentKey;
				this.paused = false;
			}
		}
	}

	disassemble() {
		//Disassemble the ROM code and put it in the debugger
		var textarea = document.getElementById('disassembled');
		for (var i = 512; i < this.length + 512; i += 2) {
			var opcode = this.memory[i] << 8 | this.memory[i + 1];
			var msb1 = (opcode & 0xF000);
			var msb2 = (opcode & 0xF00F);
			var msb3 = (opcode & 0xF0FF);
			var args = [(opcode & 0x0FFF), (opcode & 0x000F), (opcode & 0x0F00) >> 8, (opcode & 0x00F0) >> 4, (opcode & 0x00FF)];
			if (msb3 == 0x00E0 || msb3 == 0x00EE) {
				textarea.value += opcode.toString(16) + ': ' + this.opcodes.opcode[opcode].toString(args) + '\n';
			} else if (this.opcodes.opcode[msb3] != null) {
				textarea.value += opcode.toString(16) + ': ' + this.opcodes.opcode[msb3].toString(args) + '\n';
			} else if (this.opcodes.opcode[msb2] != null) {
				textarea.value += opcode.toString(16) + ': ' + this.opcodes.opcode[msb2].toString(args) + '\n';
			} else if (this.opcodes.opcode[msb1] != null) {
				textarea.value += opcode.toString(16) + ': ' + this.opcodes.opcode[msb1].toString(args) + '\n';
			} else {
				textarea.value += 'Invalid Opcode: ' + opcode.toString(16) + '\n';
			}
		}
	}

	updateKeys(keyCode, mode) {
		if (mode == 0) {
			//Updates the keys if pressed
			if (keyCode == 49) {this.keys[0] = true; this.currentKey = 0;}
			if (keyCode == 50) {this.keys[1] = true; this.currentKey = 1;}
			if (keyCode == 51) {this.keys[2] = true; this.currentKey = 2;}
			if (keyCode == 52) {this.keys[3] = true; this.currentKey = 3;}
			if (keyCode == 81) {this.keys[4] = true; this.currentKey = 4;}
			if (keyCode == 87) {this.keys[5] = true; this.currentKey = 5;}
			if (keyCode == 69) {this.keys[6] = true; this.currentKey = 6;}
			if (keyCode == 82) {this.keys[7] = true; this.currentKey = 7;}
			if (keyCode == 65) {this.keys[8] = true; this.currentKey = 8;}
			if (keyCode == 83) {this.keys[9] = true; this.currentKey = 9;}
			if (keyCode == 68) {this.keys[10] = true; this.currentKey = 10;}
			if (keyCode == 70) {this.keys[11] = true; this.currentKey = 11;}
			if (keyCode == 90) {this.keys[12] = true; this.currentKey = 12;}
			if (keyCode == 88) {this.keys[13] = true; this.currentKey = 13;}
			if (keyCode == 67) {this.keys[14] = true; this.currentKey = 14;}
			if (keyCode == 86) {this.keys[15] = true; this.currentKey = 15;}
		} else {
			//Updates the keys if released
			this.currentKey = -1;
			if (keyCode == 49) this.keys[0] = false;
			if (keyCode == 50) this.keys[1] = false;
			if (keyCode == 51) this.keys[2] = false;
			if (keyCode == 52) this.keys[3] = false;
			if (keyCode == 81) this.keys[4] = false;
			if (keyCode == 87) this.keys[5] = false;
			if (keyCode == 69) this.keys[6] = false;
			if (keyCode == 82) this.keys[7] = false;
			if (keyCode == 65) this.keys[8] = false;
			if (keyCode == 83) this.keys[9] = false;
			if (keyCode == 68) this.keys[10] = false;
			if (keyCode == 70) this.keys[11] = false;
			if (keyCode == 90) this.keys[12] = false;
			if (keyCode == 88) this.keys[13] = false;
			if (keyCode == 67) this.keys[14] = false;
			if (keyCode == 86) this.keys[15] = false;
		}
	}

	changeForeground(color) {
		//Change the foreground color
		this.foreground = color;
		this.drawFlag = true;
	}

	changeBackground(color) {
		//Change the background color
		this.background = color;
		this.drawFlag = true;
	}

	updateTimers() {
		//Count down if greater than 0
		if (this.delayTimer > 0) this.delayTimer--;

		if (this.soundTimer > 0) {
			//If greater than zero, make noise
			console.log('Beep!')
			this.soundTimer--;
		}
	}

	getMemory(addr) {
		//Gets value of addr
		return 'Address ' + addr + ' (' + parseInt(addr, 16) + ') is ' + this.memory[parseInt(addr, 16)] + ', which byte is ' + this.memory[parseInt(addr, 16)].toString(16);
	}

	setPixel(x, y) {
		var location;

		//If the pixel x is bigger than width (64), loop it around
        if (x > 64) {
            x -= 64;
        } else if (x < 0) {
            x += 64;
        }

		//If the pixel y is bigger than height (32), loop it around
        if (y > 32) {
            y -= 32;
        } else if (y < 0) {
            y += 32;
        }

        location = x + (y * 64);

        //XOR the pixel
        this.graphics[location] ^= 1;

        //If it is 0, return true, meaning a pixel turned off, else return false
        return !this.graphics[location];
	}
}

class Debugger {
	init(cpu) {
		this.cpu = cpu;
		this.registers = [];
		for (var i = 0; i < 16; i++) {
			var registerTD = document.getElementById('r' + i);
			registerTD.innerHTML = 0;
			this.registers.push(registerTD)
		}
		this.registerI = document.getElementById('rI');
		this.actualRegisters = [];
		for (var i = 0; i < 16; i++) {
			var registerTD = document.getElementById('a' + i);
			registerTD.innerHTML = 0;
			this.actualRegisters.push(registerTD)
		}
		this.actualRegisterI = document.getElementById('aI');
		this.keys = [];
		for (var i = 0; i < 16; i++) {
			var keyTD = document.getElementById('k' + i);
			this.keys.push(keyTD)
		}
	}

	update() {
		for (var i = 0; i < this.keys.length; i++) {
			if (this.cpu.keys[i]) {
				this.keys[i].style = 'background-color: rgb(150, 150, 150);'
			} else {
				this.keys[i].style = 'background-color: rgb(255, 255, 255);'
			}
		}
		if (document.getElementById('debug-checker').checked) {
			document.getElementById('debugger').style.visibility = 'visible';
			for (var i = 0; i < this.registers.length; i++) {
				this.registers[i].innerHTML = this.cpu.registers[i].toString(16);
			}
			this.registerI.innerHTML = this.cpu.registerI.toString(16);
			for (var i = 0; i < this.registers.length; i++) {
				this.actualRegisters[i].innerHTML = this.cpu.registers[i];
			}
			this.actualRegisterI.innerHTML = this.cpu.registerI;
		} else {
			document.getElementById('debugger').style.visibility = 'hidden';
		}
	}
}