// Environment setup
const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');

const Config = {
    canvas_width:  1024, // px
    canvas_height: 576,

    animation_fps: 60,  // frames per second

    assets_spritesheets: {
        wizard_ice: "",
    },
    assets_meta: {
        wizard: {xOffset: 0, yOffset: 0, w: 64, h: 64}, // px
    },
    assets_animations: {
        wizard: {
            keyframes: [
                [10, 20, 30, 40, 50],
                [10, 20, 30, 40, 50],
                [6, 12, 18, 24],
                [6, 12, 18, 24, 30, 36, 42, 48],
                [0],
                [3, 6, 9, 12, 25],
                [6, 12, 18, 24, 30, 36, 42, 48, 52],
                [6, 12, 18, 24, 30, 36, 42, 48, 52],
            ],
        }
    },
};



class Vector3 {
    constructor(x = 0, y = 0, z = 0) {
        this.x = x;
        this.y = y;
        this.z = z;
    }

    magnitude() {
        return Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2) + Math.pow(this.z, 2));
    }

    normalize() {
        let mag = this.magnitude();
        return new Vector3(this.x / mag, this.y / mag, this.z / mag);
    }
}

class Sprites {
    constructor({spritesheet, spritesheet_r, xOffset, yOffset, w, h, animations}, animate = true, reversed = false, startingSpriteSetIndex = 0) {
        this.spritesheet = spritesheet;
        this.spritesheet_r = spritesheet_r; // Each animation needs a reverse 

        // Used to select a specific sprite within a spritesheet
        this.xOffset = xOffset;
        this.yOffset = yOffset;

        this.w = w;
        this.h = h;

        // Controls how this sprite is displayed
        this.reversed = reversed;
        this.animate = animate;

        // Represents the current animation set of sprites (i.e. walk, attack, take damage, etc)
        this.spriteSetIndex = startingSpriteSetIndex

        // Tracks all animation keyframes and the current frame
        this.animations = animations;
        this.timer = 0;
    }

    update() {

    }

    draw() {

    }
}

class GameObject {
    constructor({}) {

    }
}