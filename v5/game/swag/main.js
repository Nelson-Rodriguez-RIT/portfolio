// Environment setup
const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');

ctx.scale(2, 2);

canvas.width  = 1024;
canvas.height = 576;

// Maintains a pixalated look
ctx.imageSmoothingEnabled = false;
canvas.style.imageRendering = "pixelated";

const Config = {
    canvas_width:  1024, // px
    canvas_height: 576,

    assets_path: "./assets/",

    animation_fps: 60,  // frames per second

    assets_spritesheets: {      // A * means that spritesheet also has a reverse spritesheet (assumed to have the same plus a _r tag)
        mage_ice: "ice_mage",   // [*]
    },
    assets_meta: {
        mage: {xOffset: 0, yOffset: 0, w: 64, h: 64}, // px
    },
    assets_keyframes: {
        mage: [
            [10, 20, 30, 40, 50],
            [10, 20, 30, 40, 50],
            [6, 12, 18, 24],
            [6, 12, 18, 24, 30, 36, 42, 48],
            [0],
            [3, 6, 9, 12, 25],
            [6, 12, 18, 24, 30, 36, 42, 48, 52],
            [6, 12, 18, 24, 30, 36, 42, 48, 52],
        ],
    },
};

var Deltatime    = 0;
let currentTime  = 0;
let previousTime = 0;


const Mages = [];



function init() {
    

    Mages.push(new Mage({
        position: new Vector3(200, 0, 200),
        stats: {
            HP_MAX: 100,
            MP_MAX: 80,
            SP_MAX: 150,

            VIT: 10,
            ARC: 10,
            ATK: 10,
            DEF: 10,
            SPD: 10
        },
        skin: Config.assets_spritesheets.mage_ice
    }))


    
    ctx.fillStyle = 'rgb(36, 36, 36)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    update();
}

function update() {
    // Request main to be called next frame
    window.requestAnimationFrame(update);

    // Update deltatime
    currentTime = window.performance.now();
    Deltatime = (currentTime - previousTime) / 1000; // These means that if deltatime was cumulative it would equal 1 after 1 second

    // Set background

    // Update each mage and check for hitbox collisions
    Mages.forEach((mage) => { 
        mage.update();
    });

    // Sort mages by their z positions in order to draw them properly
    // Note that the z axis, as it increases/decrease moves an object into the background/foreground
    Mages.sort((a, b) => {
        if (a.object.position.z > b.object.position.z)
            return b;

        return a;
    });

    // Draw each mage
    Mages.forEach((mage) => mage.draw());
}











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

    addVector(vector) {
        this.x += vector.x;
        this.y += vector.y;
        this.z += vector.z;
    }
}

class Sprites {
    constructor({spritesheetURL, spritesheetURL_r, xOffset, yOffset, w, h, keyframes, animate = true, reversed = false, startingSpriteSetIndex = 0}) {
        this.spritesheet     = new Image(576, 512);
        this.spritesheet.src = spritesheetURL;

        // Each animation needs a reverse spritesheet if they wish to have sprites be able to turn around
        this.spritesheet_r     = new Image(w, h); 
        this.spritesheet_r.src = spritesheetURL_r;

        // Used to select a specific sprite within a spritesheet
        this.xOffset = xOffset;
        this.yOffset = yOffset;

        this.w = w;
        this.h = h;

        // Controls how this sprite is displayed
        this.reversed = reversed;
        this.animate = animate;

        // Represents the current animation set of sprites (i.e. walk, attack, take damage, etc)
        this.spriteSetIndex = startingSpriteSetIndex;

        // Tracks all animation keyframes and the current frame
        this.keyframes = keyframes;
        this.timer = 0;
    }

    update() {
        frameCount = this.keyframes[this.spriteSetIndex].length;

        if (this.animate && frameCount != 0 && (this.timer += Deltatime * Config.animation_fps) > this.keyframes[this.spriteSetIndex][frameCount - 1])
            this.timer = 0;
    }

    // Sprites are draw with the assumption that position is relevant to the center of the object
    draw(position) {
        let spriteIndex = 0;
        if (this.animate)
            this.keyframes[this.spriteSetIndex].forEach(keyframe => {
                if (this.timer >= keyframe)
                    spriteIndex++;
            });
            

        ctx.drawImage(
            this.spritesheet,  // Source image this.reversed ? this.spritesheet_r : 
            
            this.xOffset + (this.spriteIndex * this.w),             // Top left position of extracted image from source
            this.yOffset + (this.spriteSetIndex * this.h),

            this.w, this.h,                                         // Size of image to extract from source

            position.x - this.w / 2,                                // Position of extracted image (center)
            (position.z - position.y) - this.h / 2, 

            this.w, this.h                                          // Size of final image (i.e. use this to scale the extracted image)
        );


        //console.log(this.spritesheet);
        //console.log(this);
        console.log(this.reversed, this.xOffset + (spriteIndex * this.w), this.yOffset + (this.spriteSetIndex * this.h), this.w, this.h, position.x - this.w / 2, (position.z - position.y) - this.h / 2, this.w, this.h )
        //debugger;

    }
}

class Hitbox {
    constructor({xOffset, yOffset, w, h, tag, meta = null, callback = null}, parent = null) {
        // A reference to the parent object so as to save work when checking collisions
        this.parent = parent;

        // Remember, the Vector3 position of an GameObject represents the center of it
        // These offsets move the hitbox without moving the entire GameObject
        this.xOffset = xOffset;
        this.yOffset = yOffset;


        // Size of the hitbox
        this.w = w; // Used for both x and z axis
        this.h = h;

        this.tag = tag;             // Used to identify the type of hitbox (useful for callbacks)
        this.meta = meta;
        this.callback = callback;   // Called when this hitbox collides with another, passing itself (incase the function is created outside of the object using it) and the collided hitbox as params
    }

    collidesWith(hitbox) {
        if (this.parent.object.position.x < hitbox.parent.object.position.x + hitbox.w && this.parent.object.position.x + this.w > hitbox.parent.object.position.x &&
            this.parent.object.position.y < hitbox.parent.object.position.y + hitbox.h && this.parent.object.position.y + this.h > hitbox.parent.object.position.y &&
            this.parent.object.position.z < hitbox.parent.object.position.z + hitbox.w && this.parent.object.position.z + this.w > hitbox.parent.object.position.z
        ) {
            if (this.callback != null) this.callback(self, hitbox);
            return true;
        }

        return false;
    }
}

class GameObject {
    constructor({position = new Vector3(0, 0, 0), sprites = null, hitbox = null}) {
        // "Parent" object or the object that inherits this GameObjects properties
        // Used for callbacks functions on hitboxes to affect things beyond just GameObjects properties (i.e. Mage.status)
        this.parent = parent;

        this.position     = position;
        this.velocity     = new Vector3(0, 0, 0);
        this.acceleration = new Vector3(0, 0, 0);

        this.sprites = sprites;
        this.hitbox  = hitbox;
    }

    update() {
        this.velocity.addVector(this.acceleration);
        this.position.addVector(this.velocity);
    }

    draw() {
        if (this.sprites != null) this.sprites.draw(this.position);
    }
}




class Mage {
    constructor({position = new Vector3(0, 0, 0), stats, skin = Config.assets_spritesheets.mage_ice}, parent = null) {
        this.parent = parent;



        // Handles physics, hitboxes, and animation logic
        this.object = new GameObject({
            position: position,

            sprites: new Sprites({
                spritesheetURL:   Config.assets_path + skin + ".png",
                spritesheetURL_r: Config.assets_path + skin + "_r.png",
                xOffset: Config.assets_meta.mage.xOffset,
                yOffset: Config.assets_meta.mage.yOffset,
                w: Config.assets_meta.mage.w,
                h: Config.assets_meta.mage.h,
                keyframes: Config.assets_keyframes.mage
            }),

            hitbox: new Hitbox({
                xOffset: 26,
                yOffset: 43,
                w: 10,
                h: 5,
                tag: "mage",
                meta: null,
                callback: (self, hitbox) => {
                    switch (hitbox.tag) {
                        case 'damage':
                            if ((this.stats.SHP -= hitbox.meta.hpDamage) < 0) {
                                this.stats.HP += this.stats.SHP;
                                this.stats.SHP = 0;
                            }
    
                            if ((this.stats.MP -= hitbox.meta.mpDamage) < 0)
                                this.stats.MP = 0;
    
                            if ((this.stats.SP -= hitbox.meta.spDamage) < 0)
                                this.stats.SP = 0;
    
                            break;
    
                        case 'terrain':
                            // Terrain collision
                            break;
                    }
                },
            })
        });

        

        // Contains this mage's attributes
        this.stats = {
            HP_MAX: stats.HP_MAX,
            HP:  stats.HP_MAX,      // If HP is 0, a character is dead/down
            SHP: stats.HP_MAX / 2,  // SHP (Shield HP) regenerates naturally (can be sped up with MP, but if MP is 0, SHP depletes instantly)

            MP_MAX: stats.MP_MAX,
            MP:     stats.MP_MAX,   // Used to cast spells and regenerate SHP. Regens after a short moment of not using any spells 

            SP_MAX: stats.SP_MAX,   // Used to do any major action (i.e. casting, dodging) and rapidly regens after briefly not doing such
            SP:     stats.SP_MAX,


            VIT: stats.VIT, // "Vitality" Determines the rate at which your vitals (SHP, MP, and SP) can regenerate
            ARC: stats.ARC, // "Arcane"   Determines the rate at which you charge spells
            ATK: stats.ATK, // "Attack"   Determines additional damage added on top of a spells base damage (if it has one)         
            DEF: stats.DEF, // "Defense"  Determines your damage reduction (i.e. if the enemy has 20 DEF and you cast with 20 ATK, the spell does exactly base damage)
            SPD: stats.SPD, // "Speed"    Determines the rate at which you do and recover from non-casting actions and major actions (i.e. walk speed, dodge speed, dodge end lag)
        };

        // Represents the current status(es) of this mage
        // These are simply frame timers based on Config.animation_fps or are bools 
        this.status = {
            enableFriction: false,      // Disabled when doing any action or being impacted by any action

            startLag:   0,      // Time before the action occurs. Being interupted here interupts and cancels the entire action, but at not vital cost (i.e. no SP or MP cost)
            endLag:     0,      // Time after an action occurs. Players must wait for this timer to be 0 before they can input any new action

            hitstun:    0,      // Similar to startLag and endLag, but is applied when you are hit with certain moves applying more than others. Enables being combo'd essentially

            intangible: 0,      // Frames where the player cannot be hit
            dodge:      0,      // Similar to regular intangible but gets its own status for convience
        };
    }


    update() {
        this.object.update();
    }

    draw() {
        this.object.draw();
    }
}

class Player {
    constructor() {
        
    }
}



init() // starts game loop