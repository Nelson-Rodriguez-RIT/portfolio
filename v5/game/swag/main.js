// Environment setup
const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');

canvas.width = 1024;
canvas.height = 576;
ctx.scale(2, 2);

// Maintains a pixalated look
ctx.imageSmoothingEnabled = false;
canvas.style.imageRendering = "pixelated";

var MouseX = 0;
var MouseY = 0;

var Deltatime    = 0;
let currentTime  = 0;
let previousTime = 0;


var User = {};


const CONFIG = {
    animation_fps: 60,

    defaultKeybinds: {
        up: 'w', down: 's', left: 'a', right: 'd', dodge: 'shift', 
        interact: '0', spellbook: '2', 
        delock: 'tab', spellbook_slot1: '1', spellbook_slot2: '2', spellbook_slot3: '3', spellbook_slot4: '4'
    },

    baseMovementSpeed:      50, // px/s
    statBonusMovementSpeed: 100, 

    baseMovementAcceleration:      400, //px/s^2
    statBonusMovementAcceleration: 200,


    statBonusSHPRegen: 100,
    statBonusMPRegen: 100,
    statBonusSPRegen: 100,

    dodgeMovementBoost: 3.25, // 1.0 = 100% boost

    hpUIConversionRatio: 1.25, // 1.0 means 100 HP is drawn with a total width of 100px
    mpUIConversionRatio: 1.0,
    spUIConversionRatio: 0.20,

    naturalRegenWait: 5.0,   // seconds

    dodgeSPCost: 40,

    // Only affects how fast the yellow bar created after your hp, mp, or sp decreases
    statusDecayRate: 30,

};


const ASSETS = {
    ui: {
        image:  null,
        url:    "./assets/ui.png",

        spritesheet: { w: 128, h: 64 },
    },
    ice_mage: { 
        image:  null,
        url:    "./assets/ice_mage.png",

        image_r: null,
        url_r:    "./assets/ice_mage_r.png",

        spritesheet: { w: 576, h: 512 },
        sprite:      { w: 64, h: 64 }, 
        offset:      { x: 0, y: 0 },
    },
};

const KEYFRAMES = {
    mage: [
        [10, 20, 30, 40, 50],                   // Idle
        [10, 20, 30, 40, 50],                   // Idle Air
        [6, 12, 18, 24],                        // Walk
        [6, 12, 18, 24, 30, 36, 42, 48],        // Walk Air
        [1],                                    // Hitstun
        [3, 7, 11, 15, 42],                     // Death/Teleport
        [6, 12, 18, 24, 30, 36, 42, 48, 52],    // Attack
        [6, 12, 18, 24, 30, 36, 42, 48, 52],    // Attack Air
    ]
}

const Entities = {};

const Hitboxes = {};






// Used to load external assets
function load() {
    ASSETS.ui.image     = new Image(ASSETS.ui.spritesheet.w, ASSETS.ui.spritesheet.h);
    ASSETS.ui.image.src = ASSETS.ui.url;

    ASSETS.ice_mage.image   = new Image(ASSETS.ice_mage.spritesheet.w, ASSETS.ice_mage.spritesheet.h);
    ASSETS.ice_mage.image_r = new Image(ASSETS.ice_mage.spritesheet.w, ASSETS.ice_mage.spritesheet.h);
    ASSETS.ice_mage.image.src   = ASSETS.ice_mage.url;
    ASSETS.ice_mage.image_r.src = ASSETS.ice_mage.url_r;

    init();
}


// Prepares the game environment
function init() {
    User = new Player({
        position_vector: new Vector3({primatives: {x: 20, y: 0, z: 20}}),
        sprite: new Sprite({asset: ASSETS.ice_mage, keyframes: KEYFRAMES.mage}),
        stats: {
            hp_max: 100,
            mp_max: 80,
            sp_max: 150,

            vit: 10,
            arc: 10,
            atk: 10,
            def: 10,
            spd: 10,

        },
        spellbook: {
            spellType_1: [
                
            ]
        }
    })

    update();
}


// Called every frame after load() and init() have finished their business 
function update() {
    // Queue this function to be called again next frame
    window.requestAnimationFrame(update);

    // Update deltatime
    currentTime = window.performance.now();
    Deltatime = (currentTime - previousTime) / 1000; // These means that if deltatime was cumulative it would equal 1 after 1 second
    previousTime = currentTime;

    // Set background
    ctx.fillStyle = 'rgb(36, 36, 36)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    User.update();
    User.draw();
}





class UI {
    constructor({script, cache = {}, image}) {
        this.image = image;
        this.script = script;
        this.cache = cache;
    }

    draw() {
        if (this.script != null)
            this.script(this);
    }
}

class Sprite {
/*
    USAGE

    Sprite's have 3 sets of functionality:

    "this.animate = false"      [Requires] An image, sprite dimensions, and an offset (can be 0, but has to be defined at least)
        Displays a static image sourced from the over spritesheet

    "this.animate = true"       [Requires] The above and sets of keyframes
        Goes through the image and changes the sourced sprite used based on keyframes.
        NOTE:   Assumes that frames for an animation are layed out horizontally,
                with an entire animations be layed out vertically

    
    "this.script = function"    [Requires] One of the above to fufilled and must be manually set
        Does the above, but will also call this script function with respecitive Sprite object being passed as a param. Allows for more
        control over how the sprite is displayed by directly changing values such as this.timer, this.spriteSet, and/or this.spriteFrame.
        Additionally, animation data can be stored for further use via this.cache
    
*/

    constructor({asset, keyframes, animate = true, flipX = false}) {
        // Base data required to display anything
        this.image  = asset.image;
        this.image_r = asset.image_r;

        this.offset = asset.offset;
        this.sprite = asset.sprite;

        // Functionality control
        this.animate = animate;
        this.flipX = flipX;

        // Animation control
        this.keyframes = keyframes;

        this.spriteSet      = 0; // Determines index of the current animation i.e. walk, run, attack
        this.spriteFrame    = 0; // Determines the index of the sprite within the animation i.e. 1st sprite, 2nd sprite, etc
        this.timer          = 0; // Keeps track of when to update to the next sprite in the spriteSet (or to restart the animation if finished)

        // Used, mainly, to interact with keyframes in a specifc way. This should be set manually when needed
        // i.e. teleport uses the death animation twice, playing it backwards a second time while also skipping the first frame both times
        this.script = null;    // Scripts, when called, are passed this entire object as a parem
        this.cache  = {};      // For scripts to store data
        
    }

    draw(position_vector) {
        if (this.animate) {
            let keyframesCount = this.keyframes[this.spriteSet].length;
            let keyframeFinal = this.keyframes[this.spriteSet][keyframesCount- 1];

            // Update animation timer
            if ((this.timer += Deltatime * CONFIG.animation_fps) >= keyframeFinal)
                this.timer = 0;

            // Set spriteframe based on animation timer
            this.spriteFrame = (this.flipX ? (this.image_r.width / this.sprite.w - 1) : 0 );
            this.keyframes[this.spriteSet].forEach(
                (keyframe) => { 
                    if (this.timer >= keyframe && !this.flipX) 
                        this.spriteFrame++; 

                    if (this.timer >= keyframe && this.flipX) 
                        this.spriteFrame--; 
                });
        }

        if (this.script != null)
            this.script(this);

        ctx.drawImage(
            // Sprite sheet
            !this.flipX ? this.image : this.image_r,

            // Offset before extracting image
            this.offset.x + (this.spriteFrame * this.sprite.w),
            this.offset.y + (this.spriteSet   * this.sprite.h),

            // Extracted image size
            this.sprite.w, 
            this.sprite.h,

            // Final image position. We want the origin to the be the center of the sprite
            position_vector.x - this.sprite.w / 2,
            position_vector.z - position_vector.y - this.sprite.h / 2,

            // Final image size
            this.sprite.w, 
            this.sprite.h,
        );
    }

    
}

class Vector3 {
    constructor({primatives = {x: 0, y: 0, z: 0}, vector3 = null}) {
        if (vector3) {
            this.x = vector3.x;
            this.y = vector3.y;
            this.z = vector3.z;
        }
        else {
            this.x = primatives.x;
            this.y = primatives.y;
            this.z = primatives.z;
        }
    }

    magnitude() {
        return Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2) + Math.pow(this.z, 2));
    }

    normalize() {
        let mag = this.magnitude();
        return new Vector3({primatives: {x: this.x / mag, y: this.y / mag, z: this.z / mag}});
    }


    static add({vector1, vector2 = null, value = null}) {
        return new Vector3({
            primatives: {
                x: vector1.x + (vector2 ? vector2.x : 0) + (value ? value : 0), 
                y: vector1.y + (vector2 ? vector2.y : 0) + (value ? value : 0), 
                z: vector1.z + (vector2 ? vector2.z : 0) + (value ? value : 0)
            }
        })
    }
    static subtract({vector1, vector2 = null, value = null}) {
        return new Vector3({
            primatives: {
                x: vector1.x - (vector2 ? vector2.x : 0) - (value ? value : 0), 
                y: vector1.y - (vector2 ? vector2.y : 0) - (value ? value : 0), 
                z: vector1.z - (vector2 ? vector2.z : 0) - (value ? value : 0)
            }
        })
    }
    static multiply({vector1, vector2 = null, value = null}) {
        return new Vector3({
            primatives: {
                x: vector1.x * (vector2 ? vector2.x : 1) * (value ? value : 1), 
                y: vector1.y * (vector2 ? vector2.y : 1) * (value ? value : 1), 
                z: vector1.z * (vector2 ? vector2.z : 1) * (value ? value : 1)
            }
        })
    }
    static divide({vector1, vector2 = null, value = null}) {
        return new Vector3({
            primatives: {
                x: vector1.x / (vector2 && vector2.x != 0 ? vector2.x : (value && value != 0 ? value : 1)), 
                y: vector1.y / (vector2 && vector2.y != 0 ? vector2.y : (value && value != 0 ? value : 1)),
                z: vector1.z / (vector2 && vector2.z != 0 ? vector2.z : (value && value != 0 ? value : 1)) 
            }
        })
    }


    add({vector = null, value = null}) {
        if (vector) {
            this.x += vector.x;
            this.y += vector.y;
            this.z += vector.z;
        }

        if (value){
            this.x += value;
            this.y += value;
            this.z += value;
        }
    }    
    subtract({vector = null, value = null}) {
        if (vector) {
            this.x -= vector.x;
            this.y -= vector.y;
            this.z -= vector.z;
        }

        if (value){
            this.x -= value;
            this.y -= value;
            this.z -= value;
        }
    }
    multiply({vector = null, value = null}) {
        if (vector) {
            this.x *= vector.x;
            this.y *= vector.y;
            this.z *= vector.z;
        }

        if (value){
            this.x *= value;
            this.y *= value;
            this.z *= value;
        }
    }
    divide({vector = null, value = null}) {
        if (vector) {
            this.x /= (vector.x != 0 ? vector.z : 1);
            this.y /= (vector.y != 0 ? vector.z : 1);
            this.z /= (vector.z != 0 ? vector.z : 1);
        }

        if (value){
            this.x /= value;
            this.y /= value;
            this.z /= value;
        }
    }
}


class GameObject {
    constructor({
        position_vector = new Vector3({x: 0, y: 0, z: 0}), 
        sprite = null, 
        physics = {
            enableFrictionX:                false,
            enableFrictionZ:                false,
            frictionStregnth:               CONFIG.baseMovementAcceleration * 0.5, // px/s^2

            enableGravity:                  false,
            weight:                         0,

            enableWallBounce:               false,
            wallBounceVelocityThreshold:    0,

            enableGroundBounce:             false,
            groundBounceVelocityThreshold:  0,

            enableTerrainCollision:         false,
            enableNonTerrainCollision:      false,
        }}
    ) {
        this.position     = position_vector;
        this.velocity     = new Vector3({x: 0, y: 0, z: 0});
        this.acceleration = new Vector3({x: 0, y: 0, z: 0});

        // Physics flags
        this.isGrounded = true;
        this.physics = physics;


        this.sprite = sprite;
    }

    update() {
        // Additional physics updated based on set flags
        if (this.isGrounded) {
            this.acceleration = new Vector3({
                primatives: {
                    x: (this.physics.enableFrictionX) ? ((this.velocity.x != 0) ? CONFIG.baseMovementAcceleration * (this.velocity.x < 0 ? 1.5 : -1.5) : 0) : this.acceleration.x,
                    y: 0,
                    z: (this.physics.enableFrictionZ) ? ((this.velocity.z != 0) ? CONFIG.baseMovementAcceleration * (this.velocity.z < 0 ? 1.5 : -1.5) : 0) : this.acceleration.z,
                }
            })   
        }

        if (this.enableGravity && !this.isGrounded) {
        }



        if (this.enableWallBounce || this.enableGroundBounce) {
            // TODO: This
        }

        if (this.enableTerrainCollision || this.enableNonTerrainCollision) {
            // TODO: This
        }



        // Last to give physics logic a chance to modify values accuratly (i.e. collision)
        this.velocity.add({vector: Vector3.multiply({vector1: this.acceleration, value: Deltatime})})

        // Prevents logic like friction from bobbing position between -1 and 1
        if (Math.abs(this.velocity.x) < 1)
            this.velocity.x = 0;
            
        if (Math.abs(this.velocity.z) < 1)
            this.velocity.z = 0;
            


        this.position.add({vector: Vector3.multiply({vector1: this.velocity, value: Deltatime})})
    }

    draw() {
        if (this.sprite != null) this.sprite.draw(this.position);
    }
}


class Mage {
    constructor({position_vector = new Vector3(), sprite, stats}) {
        this.gameObject = new GameObject({position_vector: position_vector, sprite: sprite, physics: {
            enableFriction:                 false,
            frictionStregnth:               0,
    
            enableGravity:                  false,
            weight:                         0,
    
            enableWallBounce:               false,
            wallBounceVelocityThreshold:    0,
    
            enableGroundBounce:             false,
            groundBounceVelocityThreshold:  0,
    
            enableTerrainCollision:         false,
            enableNonTerrainCollision:      false,
        }});

        this.stats = {
            hp_max: stats.hp_max,
            hp:     stats.hp_max,
            shp:    stats.hp_max / 2,

            mp_max: stats.mp_max,
            mp:     stats.mp_max,

            sp_max: stats.sp_max,
            sp:     stats.sp_max,

            vit: stats.vit,
            arc: stats.arc,
            atk: stats.atk,
            def: stats.def,
            spd: stats.spd,

        }

        this.status = {
            startlag:   0,      // Prevents certain status from using their special properties (i.e. like dodge)
                                // Required to be 0 before endlag can start progressing

            endlag:     0,      // Prevents the mage from doing Movement or Major actions, leaving them vulnerable
                                // Required to be 0 before doing any Movement or Major action

            dodge:          0,      // Makes the mage unabled to be hit during the duration
            hitstun:        0,      // Prevents the mage from doing Movement or Major actions and makes them easier to combo as this doesn't go down mid-air, leaving them vulnerable
            naturalRegen:   0,

        };
    }

    update() {
        this.gameObject.update();

        // Enable friction when the player is grounded and not doing any action (movement is handled via the player after this update)
        this.gameObject.physics.enableFrictionX = !this.status.hitstun && !this.status.dodge;
        this.gameObject.physics.enableFrictionZ = !this.status.hitstun && !this.status.dodge;


        // Change facing direction upon velocity reaching a threshold
        if (this.gameObject.velocity.x > CONFIG.baseMovementSpeed)
            this.gameObject.sprite.flipX = false;
        if (this.gameObject.velocity.x < -CONFIG.baseMovementSpeed)
            this.gameObject.sprite.flipX = true;


        // Adjust status timers
        if (this.status.startlag) {
            if ((this.status.startlag -= Deltatime * 60) < 0)   this.status.startlag = 0;
        }
        else {
            if ((this.status.endlag -= Deltatime * 60) < 0)   this.status.endlag = 0;

            if ((this.status.dodge -= Deltatime * 60) < 0)   this.status.dodge = 0;
            if ((this.status.hitstun -= Deltatime * 60) < 0) this.status.hitstun = 0;
            if ((this.status.naturalRegen -= Deltatime) < 0) this.status.naturalRegen = 0;
        }


        // Natural regen
        if (this.status.naturalRegen <= 3.5 && (this.stats.sp += (75 + (CONFIG.statBonusSPRegen * this.stats.vit / 10)) * Deltatime) > this.stats.sp_max)
            this.stats.sp = this.stats.sp_max;

        if (this.status.naturalRegen <= 3.0 && (this.stats.mp += (50 + (CONFIG.statBonusMPRegen * this.stats.vit / 10)) * Deltatime) > this.stats.mp_max)
            this.stats.mp = this.stats.mp_max;

        if (this.status.naturalRegen <= 0 && (this.stats.shp += (25 + (CONFIG.statBonusSHPRegen * this.stats.vit / 10)) * Deltatime) > this.stats.hp_max / 2)
            this.stats.shp = this.stats.hp_max / 2;


        // Prevent HP, SP, or MP from going below zero (probably only relevant for testing purposes)
        if (this.stats.hp < 0) this.stats.hp = 0;
        if (this.stats.mp < 0) this.stats.mp = 0;
        if (this.stats.sp < 0) this.stats.sp = 0;
    }

    draw() {
        this.gameObject.draw();
    }
}

class Player {
    constructor({position_vector = new Vector3(), keybinds = CONFIG.defaultKeybinds, sprite, stats, spellbook = null}) {
        this.mage = new Mage({position_vector: position_vector, sprite: sprite, stats: stats});

        this.inputs = {
            keybinds: keybinds,
            pressed: {
                up: false, down: false, left: false, right: false, dodge: false, 
                interact: false, spellbook: false, delock: false,
                spellbook_slot1: false, spellbook_slot2: false, spellbook_slot3: false, spellbook_slot4: false
            },
            timer: {
                up: 0, down: 0, left: 0, right: 0, dodge: 0, 
                interact: 0, spellbook: 0, delock: 0,
                spellbook_slot1: 0, spellbook_slot2: 0, spellbook_slot3: 0, spellbook_slot4: 0
            }
        };

        this.ui = [
            // Player status bar (i.e. hp, mp, sp)
            new UI({script: (ui) => {
                // Creates a yellow bar to represent lost health that rapidly decay (similar to Elden Ring) ((man I wonder what this was inspired by...))
                if (ui.cache.spDecay == undefined) {
                    ui.cache.hpDecay  = 0;
                    ui.cache.hpPrev   = ui.cache.stats.hp;

                    ui.cache.shpDecay  = 0;
                    ui.cache.shpPrev   = ui.cache.stats.shp;

                    ui.cache.mpDecay  = 0;
                    ui.cache.mpPrev   = ui.cache.stats.mp;

                    ui.cache.spDecay = 0;
                    ui.cache.spPrev  = ui.cache.stats.sp;
                }

                ui.cache.hpDecay += ui.cache.hpPrev - ui.cache.stats.hp;
                ui.cache.hpPrev   = ui.cache.stats.hp;

                ui.cache.shpDecay += ui.cache.shpPrev - ui.cache.stats.shp;
                ui.cache.shpPrev   = ui.cache.stats.shp;

                ui.cache.mpDecay += ui.cache.mpPrev - ui.cache.stats.mp;
                ui.cache.mpPrev   = ui.cache.stats.mp;

                ui.cache.spDecay += ui.cache.spPrev - ui.cache.stats.sp;
                ui.cache.spPrev   = ui.cache.stats.sp;


                if ((ui.cache.hpDecay -= CONFIG.statusDecayRate * Deltatime) < 0)
                    ui.cache.hpDecay = 0;
                if ((ui.cache.shpDecay -= CONFIG.statusDecayRate * Deltatime) < 0)
                    ui.cache.shpDecay = 0;

                if ((ui.cache.mpDecay -= CONFIG.statusDecayRate * Deltatime) < 0)
                    ui.cache.mpDecay = 0;

                if ((ui.cache.spDecay -= CONFIG.statusDecayRate * Deltatime * 2) < 0 ) // Decays faster since its a smaller sized bar that with a higher value than both hp and mp
                    ui.cache.spDecay = 0;






                // Health bar
                ctx.drawImage(ui.image,  5, 5, 10, 6,    10, 10, 20, 12);
                ctx.drawImage(ui.image, 15, 5,  1, 6,    30, 10, (ui.cache.stats.hp_max * CONFIG.hpUIConversionRatio) - 35, 12);
                ctx.drawImage(ui.image, 40, 5, 10, 6,    (ui.cache.stats.hp_max * CONFIG.hpUIConversionRatio) - 6, 10, 20, 12)

                ctx.fillStyle = 'rgba(255, 40, 40, 0.5)';
                ctx.fillRect(12, 12, ui.cache.stats.hp * CONFIG.hpUIConversionRatio, 6);
                ctx.fillStyle = 'rgba(81, 77, 255, 0.5)';
                ctx.fillRect(12, 12, ui.cache.stats.shp * CONFIG.hpUIConversionRatio * 2, 6);

                // Decay bar to show used HP
                ctx.fillStyle = 'rgb(220, 220, 43)';
                ctx.fillRect(12 + ui.cache.stats.hp * CONFIG.hpUIConversionRatio, 12, ui.cache.hpDecay * CONFIG.hpUIConversionRatio, 6);

                // Decay bar to show used SHP
                ctx.fillStyle = 'rgb(220, 220, 43)';
                ctx.fillRect(12 + ui.cache.stats.shp * CONFIG.hpUIConversionRatio * 2, 12, ui.cache.shpDecay * CONFIG.hpUIConversionRatio, 6);



                // Mana bar
                ctx.drawImage(ui.image,  5, 5, 10, 6,    10, 25, 20, 12);
                ctx.drawImage(ui.image, 15, 5,  1, 6,    30, 25, (ui.cache.stats.mp_max * CONFIG.mpUIConversionRatio) - 35, 12);
                ctx.drawImage(ui.image, 40, 5, 10, 6,    (ui.cache.stats.mp_max * CONFIG.mpUIConversionRatio) - 6, 25, 20, 12)

                ctx.fillStyle = 'rgba(40, 40, 255, 0.5)';
                ctx.fillRect(12, 27, ui.cache.stats.mp * CONFIG.mpUIConversionRatio, 6);

                // Decay bar to show used MP
                ctx.fillStyle = 'rgb(220, 220, 43)';
                ctx.fillRect(12 + ui.cache.stats.mp * CONFIG.mpUIConversionRatio, 27, ui.cache.mpDecay * CONFIG.mpUIConversionRatio, 6);


                // Stamina bar (special as it appears below the player when their stamina isnt 100%)
                if (ui.cache.stats.sp != ui.cache.stats.sp_max) {
                    
                    ctx.fillStyle = 'rgba(5, 5, 5, 0.75)';
                    ctx.fillRect(
                        ui.cache.position.x - (ui.cache.stats.sp_max * CONFIG.spUIConversionRatio) / 2, ui.cache.position.z - ui.cache.position.y + 20,
                        (ui.cache.stats.sp_max * CONFIG.spUIConversionRatio), 2
                    );

                    ctx.fillStyle = 'rgb(91, 222, 91)';
                    ctx.fillRect(
                        ui.cache.position.x - (ui.cache.stats.sp_max * CONFIG.spUIConversionRatio) / 2, ui.cache.position.z - ui.cache.position.y + 20,
                        (ui.cache.stats.sp * CONFIG.spUIConversionRatio), 2
                    );

                    // Decay bar to show used SP
                    ctx.fillStyle = 'rgb(220, 220, 43)';
                    ctx.fillRect(
                        (ui.cache.stats.sp * CONFIG.spUIConversionRatio) + ui.cache.position.x - (ui.cache.stats.sp_max * CONFIG.spUIConversionRatio) / 2, ui.cache.position.z - ui.cache.position.y + 20,
                        (ui.cache.spDecay * CONFIG.spUIConversionRatio), 2
                    )
                }

            }, cache: {stats: this.mage.stats, position: this.mage.gameObject.position}, image: ASSETS.ui.image}),
        ];

        this.spellbook = spellbook;
    }

    update() {
        this.mage.update();

        // These inputs have different functions based on how long the input is held
        if (this.inputs.pressed.interact)
            this.inputs.timer.interact += Deltatime;
        else
            this.inputs.timer.interact = 0;

        if (this.inputs.pressed.spellbook) 
            this.inputs.timer.spellbook += Deltatime;
        else
            this.inputs.timer.spellbook = 0;


        // Movement Actions controlled via WASD (default)
        if (!this.mage.status.hitstun && !this.mage.status.endlag) {
            // If a movement input is pressed, load related sprite/animation information
            if (this.inputs.pressed.up || this.inputs.pressed.down || this.inputs.pressed.left || this.inputs.pressed.right) {
                this.mage.gameObject.sprite.spriteSet = 3; // Walk animation ID

                
                // If velocity drops to 0, return to idle
                this.mage.gameObject.sprite.script = (sprite) => {
                    if (this.mage.gameObject.velocity.x == 0 && this.mage.gameObject.velocity.z == 0) {
                        this.mage.gameObject.sprite.spriteSet = 0;
                        this.mage.gameObject.sprite.script = null;
                    }
                };
            }

            // Z axis movement controls
            if (this.inputs.pressed.up) {
                this.mage.gameObject.physics.enableFrictionZ = false;

                this.mage.gameObject.acceleration.z =                                                                       // Set acceleration to the mage's base movementAcceleration set by CONFIG
                    (-CONFIG.baseMovementAcceleration - (CONFIG.statBonusMovementAcceleration * this.mage.stats.spd / 10))  // + a bonus determined by a CONFIG value and the mage's speed (spd) stat
                    * ((this.inputs.pressed.left || this.inputs.pressed.right) ? Math.sqrt(2) / 2 : 1);                     // Additionally, if moving in multiple axis multiply this value by sqrt(2) / 2
               
                if (this.mage.gameObject.velocity.z <                                                           // If the velocity is over the cap set by CONFIG
                    (-CONFIG.baseMovementSpeed - (CONFIG.statBonusMovementSpeed * this.mage.stats.spd / 10))    // and a bonus determined similarly to the above
                    * ((this.inputs.pressed.left || this.inputs.pressed.right) ? Math.sqrt(2) / 2 : 1)
                    ) {
                        this.mage.gameObject.velocity.z = 
                            (-CONFIG.baseMovementSpeed - (CONFIG.statBonusMovementSpeed * this.mage.stats.spd / 10))
                            * ((this.inputs.pressed.left || this.inputs.pressed.right) ? Math.sqrt(2) / 2 : 1);
                }
            }
            if (this.inputs.pressed.down) {
                this.mage.gameObject.physics.enableFrictionZ = false;

                this.mage.gameObject.acceleration.z =
                    (CONFIG.baseMovementAcceleration + (CONFIG.statBonusMovementAcceleration * this.mage.stats.spd / 10))
                    * ((this.inputs.pressed.left || this.inputs.pressed.right) ? Math.sqrt(2) / 2 : 1);
               
                if (this.mage.gameObject.velocity.z >
                    (CONFIG.baseMovementSpeed + (CONFIG.statBonusMovementSpeed * this.mage.stats.spd / 10))
                    * ((this.inputs.pressed.left || this.inputs.pressed.right) ? Math.sqrt(2) / 2 : 1)
                    ) {
                        this.mage.gameObject.velocity.z = 
                            (CONFIG.baseMovementSpeed + (CONFIG.statBonusMovementSpeed * this.mage.stats.spd / 10))
                            * ((this.inputs.pressed.left || this.inputs.pressed.right) ? Math.sqrt(2) / 2 : 1);
                }
            }

            // X Axis movement controls
            if (this.inputs.pressed.left) {
                this.mage.gameObject.physics.enableFrictionX = false;

                this.mage.gameObject.acceleration.x =                                                                       // Set acceleration to the mage's base movementAcceleration set by CONFIG
                    (-CONFIG.baseMovementAcceleration - (CONFIG.statBonusMovementAcceleration * this.mage.stats.spd / 10))  // + a bonus determined by a CONFIG value and the mage's speed (spd) stat
                    * ((this.inputs.pressed.up || this.inputs.pressed.down) ? Math.sqrt(2) / 2 : 1);                        // Additionally, if moving in multiple axis multiply this value by sqrt(2) / 2
               
                if (this.mage.gameObject.velocity.x <                                                           // If the velocity is over the cap set by CONFIG
                    (-CONFIG.baseMovementSpeed - (CONFIG.statBonusMovementSpeed * this.mage.stats.spd / 10))    // and a bonus determined similarly to the above
                    * ((this.inputs.pressed.up || this.inputs.pressed.down) ? Math.sqrt(2) / 2 : 1)
                    ) {
                        this.mage.gameObject.velocity.x = 
                            (-CONFIG.baseMovementSpeed - (CONFIG.statBonusMovementSpeed * this.mage.stats.spd / 10))
                            * ((this.inputs.pressed.up || this.inputs.pressed.down) ? Math.sqrt(2) / 2 : 1);
                }
            }
            if (this.inputs.pressed.right) {
                this.mage.gameObject.physics.enableFrictionX = false;

                this.mage.gameObject.acceleration.x =
                    (CONFIG.baseMovementAcceleration + (CONFIG.statBonusMovementAcceleration * this.mage.stats.spd / 10))
                    * ((this.inputs.pressed.up || this.inputs.pressed.down) ? Math.sqrt(2) / 2 : 1);
               
                if (this.mage.gameObject.velocity.x >
                    (CONFIG.baseMovementSpeed + (CONFIG.statBonusMovementSpeed * this.mage.stats.spd / 10))
                    * ((this.inputs.pressed.up || this.inputs.pressed.down) ? Math.sqrt(2) / 2 : 1)
                    ) {
                        this.mage.gameObject.velocity.x = 
                            (CONFIG.baseMovementSpeed + (CONFIG.statBonusMovementSpeed * this.mage.stats.spd / 10))
                            * ((this.inputs.pressed.up || this.inputs.pressed.down) ? Math.sqrt(2) / 2 : 1);
                }
            }
        }

        // Major Actions controlled via m1 and shift (default)
        if (!this.mage.status.hitstun && !this.mage.status.endlag) {
            if (this.inputs.pressed.dodge && this.mage.stats.sp > 0) {
                if ((this.mage.stats.sp -= CONFIG.dodgeSPCost) < 0 ) this.mage.stats.sp = 0;
                this.mage.status.naturalRegen = CONFIG.naturalRegenWait;

                this.mage.status.startlag = 15;
                this.mage.status.endlag   = 42;
                this.mage.status.dodge    = 15;

                this.mage.gameObject.sprite.spriteSet = 5; // Death/Teleport ID
                this.mage.gameObject.sprite.timer = 3;  // Skips the initial white flash (saving that for actual deaths)
                this.mage.gameObject.sprite.cache.dodgeStartFinished = false;
                this.mage.gameObject.sprite.script = (sprite) => {
                    if (sprite.timer > 15 && !sprite.cache.dodgeStartFinished) {
                        sprite.cache.dodgeStartFinished = true;
                        sprite.timer = 42;
                    }
                        
                    if (sprite.cache.dodgeStartFinished)
                        sprite.timer -= Deltatime * CONFIG.animation_fps * 2

                    if (sprite.cache.dodgeStartFinished && sprite.timer <= 3) {
                        sprite.script = null;
                        sprite.timer = 0;
                        sprite.spriteSet = 0;
                    }
                    
                }

                
                this.mage.gameObject.velocity = new Vector3({primatives: {
                    x: (this.inputs.pressed.left || this.inputs.pressed.right) ? (
                            ((CONFIG.baseMovementSpeed * CONFIG.dodgeMovementBoost * this.mage.stats.spd / 10)
                                * ((this.inputs.pressed.up || this.inputs.pressed.down) ? Math.sqrt(2) / 2 : 1))
                                * (this.mage.gameObject.acceleration.x < 0 ? -1 : 1)
                            ) : 0,
                    y: 0,
                    z: (this.inputs.pressed.up || this.inputs.pressed.down) ? (
                        ((CONFIG.baseMovementSpeed * CONFIG.dodgeMovementBoost)
                            * ((this.inputs.pressed.left || this.inputs.pressed.right) ? Math.sqrt(2) / 2 : 1))
                            * (this.mage.gameObject.acceleration.z < 0 ? -1 : 1)
                        ) : 0,
                }})
                this.mage.gameObject.acceleration = new Vector3({primatives: {x: 0, y: 0, z: 0} });
            }

        }

        // Minor Actions controlled via m2, (1, 2, 3, 4), tab (default)
        // These can be done whenever since they are just spell and target selections



        // Testing
        if (this.mage.status.naturalRegen <= 0) {
            this.mage.status.naturalRegen = CONFIG.naturalRegenWait;
            this.mage.stats.shp -= 25;

            if (this.mage.stats.shp < 0) {
                this.mage.stats.hp += this.mage.stats.shp
                this.mage.stats.shp = 0;
            }
        }

    }

    draw() {
        this.mage.draw();

        this.ui.forEach( (element) => { element.draw(); })
    }
}

class Hitbox {
    constructor({
        gameObject = new GameObject({}),
        dimensions, name, owner = null,
        scriptOnHit = null
    }) {
        this.gameObject = gameObject;

        this.name = name;
        this.owner = owner;
        this.dimensions = dimensions;

        this.onhit = scriptOnHit;
    }

    update() {
        this.gameObject.update();

        Hitboxes.forEach((hitbox) => {
            if (this.collidesWith(hitbox) && this.script_onhit != null)
                this.onhit({self: this, hitbox: hitbox});

        })
    }

    draw() {
        this.gameObject.draw();
    }

    /*
           ______
          /|    /|  _ represets what I consider the "origin" of the hitbox, bottom center.
         /_|___/ |    while the Sprite class doesn't account for an aditional axis like the hitbox
        |  |   | |    it still centers the sprite based on its x/z and sprite width/height (see below).
        |  |   | |    I did this so that GameObject.position.y = 0 represent being on the ground 
        |  |___|_|      _____
        | /  _ | /     |  _  |   _ represents the origin of the displayed sprite
        |/_____|/      |_____|
        
        
                y+
                ^  z-          
                | /         
                |/
          x-<---*---> x+    <--- Represents how axis are considered when both displaying and checking collisions
               /|
              / |
             z+ v
                y-
    */

    collidesWith(hitbox) {
        return ((this.gameObject.position.x - this.dimensions.x / 2) < (hitbox.gameObject.x + this.dimensions.x / 2) && (this.gameObject.position.x + this.dimensions.x / 2) > (hitbox.gameObject.x - this.dimensions.x / 2) &&
                 this.gameObject.position.y < (hitbox.gameObject.y + this.dimensions.y)                              &&  this.gameObject.position.y + this.dimensions.y > hitbox.gameObject.y &&
                (this.gameObject.position.z - this.dimensions.z / 2) < (hitbox.gameObject.z + this.dimensions.z / 2) && (this.gameObject.position.z + this.dimensions.z / 2) > (hitbox.gameObject.z - this.dimensions.z / 2));
    }
}

class Spell {
    constructor({
        gameObject = null, active = true, name = "",
        initScript = null, updateScript = null, drawScript = null 
    }) {
        
        this.gameObject = gameObject;
        this.name = name;

        // Set this to false to stop calling update and draw for this spell the following frame
        this.active = active;

        this.init = initScript;
        this.update = updateScript;
        this.draw = drawScript;
    }
}

const Spellbook = {
    fire: [
        new Spell({
            gameObject: new GameObject({

            }), name: "fireball", 
        
            
        })
    ]
}



window.addEventListener('keydown', (event) => {
    let key = event.key.toLocaleLowerCase();

    switch(key) {
        case User.inputs.keybinds.up:
            User.inputs.pressed.up = true;
            break;

        case User.inputs.keybinds.down:
            User.inputs.pressed.down = true;
            break;

        case User.inputs.keybinds.left:
            User.inputs.pressed.left = true;
            break;

        case User.inputs.keybinds.right:
            User.inputs.pressed.right = true;
            break;

        case User.inputs.keybinds.dodge:
            User.inputs.pressed.dodge = true;
            break;


        case User.inputs.keybinds.delock:
            User.inputs.pressed.dodge = true;
            break;


        case User.inputs.keybinds.spellbook_slot1:
            User.inputs.pressed.spellbook_slot1 = true
            break;

        case User.inputs.keybinds.spellbook_slot2:
            User.inputs.pressed.spellbook_slot2 = true
            break;

        case User.inputs.keybinds.spellbook_slot3:
            User.inputs.pressed.spellbook_slot3 = true
            break;
            
        case User.inputs.keybinds.spellbook_slot4:
            User.inputs.pressed.spellbook_slot4 = true
            break;
    }
}); 

window.addEventListener('keyup', (event) => {
    let key = event.key.toLocaleLowerCase();

    switch(key) {
        case User.inputs.keybinds.up:
            User.inputs.pressed.up = false;
            break;

        case User.inputs.keybinds.down:
            User.inputs.pressed.down = false;
            break;

        case User.inputs.keybinds.left:
            User.inputs.pressed.left = false;
            break;

        case User.inputs.keybinds.right:
            User.inputs.pressed.right = false;
            break;

        case User.inputs.keybinds.dodge:
            User.inputs.pressed.dodge = false;
            break;


        case User.inputs.keybinds.delock:
            User.inputs.pressed.dodge = true;
            break;    

        
        case User.inputs.keybinds.spellbook_slot1:
            User.inputs.pressed.spellbook_slot1 = false
            break;

        case User.inputs.keybinds.spellbook_slot2:
            User.inputs.pressed.spellbook_slot2 = false
            break;

        case User.inputs.keybinds.spellbook_slot3:
            User.inputs.pressed.spellbook_slot3 = false
            break;
            
        case User.inputs.keybinds.spellbook_slot4:
            User.inputs.pressed.spellbook_slot4 = false
            break;
    }
}); 



window.addEventListener('mousedown', (event) => {
    let button = event.button.toString();

    switch (button) {
        case User.inputs.keybinds.interact:
            User.inputs.pressed.interact = true;
            break;

        case User.inputs.keybinds.spellbook:
            User.inputs.pressed.spellbook = true;
            break;
    }
})

window.addEventListener('mouseup', (event) => {
    let button = event.button.toString();

    switch (button) {
        case User.inputs.keybinds.interact:
            User.inputs.pressed.interact = false;
            break;

        case User.inputs.keybinds.spellbook:
            User.inputs.pressed.spellbook = false;
            break;
    }
})


// We only care about positions within the canvas element
canvas.addEventListener('mousemove', (event) => {
    MouseX = event.layerX;
    MouseY = event.layerY;
})


load();