// Environment setup
const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');

canvas.width  = 1024;
canvas.height = 576;


ctx.scale(2, 2);

// Maintains a pixalated look
ctx.imageSmoothingEnabled = false;
canvas.style.imageRendering = "pixelated";



// Globals
var Deltatime = 0;
let previousTime = window.performance.now(); // Needed to calculate deltatime
let currentTime = 0;                         // ^

var User = {};

const Mages    = [];
const Hitboxes = [];

const Assets    = [];
const Assets_UI = {
    // I.e. health, mana, stamina, etc
    container_start: {},
    container_end: {},
    container_center: {},

    bar_start: {},
    bar_end: {},
    bar_center: {},

    
    // Spell charge UI
    charge_container: {},
    charge_bar: {},

    // Mana shield indicator
    shield_container: {},
    shield_bar: {},

    // Spell slot UI
    spellslot_container: {},

    spellslot_fire_icon: {},
    spellslot_ice_icon: {},
    spellslot_wind_icon: {},
    spellslot_rock_icon: {},


    // Enemy mage UI
    enemy_container: {},
    enemy_bar_hp: {},
    enemy_bar_shield: {},
}

/*

MaxQuadTreeDepth = ??? (Depends on map size, but I think ill stick with 3 for the demo)

Hitboxes = {
    nw: 
    [
        [
            [],
            [],
            [],
            []
        ],
        [],
        [],
        []
    ]
    ne: []
    se: []
    sw: []
}


*/

// Config
const config = {
    mageWidth:  25, // px
    mageHeight: 25, // px

    mageYHitbox: 50,

    dodgeBoost: 2, // multiplier

    friction: 400,  // px/s^2
    minVelocity: 5, // px/s, velocity has to be above this value

    defaultKeybinds: {
        up: 'w', down: 's', left: 'a', right: 'd', dodge: 'shift', 
        interact: 'm1', spellbook: 'm3',
        spellbook_slot1: '1', spellbook_slot2: '2', spellbook_slot3: '3', spellbook_slot4: '4'
    },


    assetWidth:  64, // px
    assetHeight: 64,
    assets: [
        {url: './assets/ice_attack.png', rows: 2, columns: 7},
        {url: './assets/ice_attack_r.png', rows: 2, columns: 7}, /* Due to canvas (or IQ) limitations, a seperate spritehseet for reversed version of sprites is needed */
        {url: './assets/ice_mage.png', rows: 8, columns: 9},
        {url: './assets/ice_mage_r.png', rows: 8, columns: 9},
    ],

    assets_uiURL: './assets/ui.png',
    assets_uiMeta: { // https://stackoverflow.com/questions/2688961/how-do-i-tint-an-image-with-html5-canvas
        // offsetX: 0, offsetY: 0, width: 0, height: 0, tint: 'rgba(255, 255, 255, 1.0)'

        // I.e. health, mana, stamina, etc
        container_start: {offsetX: 5, offsetY: 5, width: 10, height: 6},
        container_end: {offsetX: 0, offsetY: 0, width: 0, height: 0},
        container_center: {offsetX: 0, offsetY: 0, width: 0, height: 0},
    
        bar_start: {offsetX: 0, offsetY: 0, width: 0, height: 0},
        bar_end: {offsetX: 0, offsetY: 0, width: 0, height: 0},
        bar_center: {offsetX: 0, offsetY: 0, width: 0, height: 0},
    
        
        // Spell charge UI
        charge_container: {offsetX: 0, offsetY: 0, width: 0, height: 0},
        charge_bar: {offsetX: 0, offsetY: 0, width: 0, height: 0},
    
        // Mana shield indicator
        shield_container: {offsetX: 0, offsetY: 0, width: 0, height: 0},
        shield_bar: {offsetX: 0, offsetY: 0, width: 0, height: 0},
    
        // Spell slot UI
        spellslot_container: {},
    
        spellslot_fire_icon: {},
        spellslot_ice_icon: {},
        spellslot_wind_icon: {},
        spellslot_rock_icon: {},
    
    
        // Enemy mage UI
        enemy_container: {},
        enemy_bar_hp: {},
        enemy_bar_shield: {},
    },

    animationFPS: 60,
    animations: {
        mage_idle: [],
        mage_walk: [],
    }
};



// Notes //
/*

[ ] For hp/hps, just have the the two bars overlap each other. (Logic change: make hps regen require not getting hit until its fully charged) During a hps shield break, use a custom "broken" bar

[*] Make reverse sprites for all images (Perhaps just flipe each image directly, and store two copies? Canvas scale doesn't really help at this (apparently without major performance hit))

[*] Adjust velocity required for turnarounds to around movement speed * 0.75 or * 0.5
    [ ] Make this a config setting

[*] Make friction occur regardless if its a pc or npc

[ ] Make dodge turn into a dash when there's not enough mp

*/



class Hitbox {
    constructor({object, type, callback}) {
        this.object = object;

        this.type = type;

        this.callback = callback;
    }

    collidesWith(hitbox) {
        return  (this.object.position.x < hitbox.object.position.x + hitbox.object.dimensions.width) && 
                (hitbox.object.position.x < this.object.position.x + this.object.dimensions.width) &&

                (this.object.position.z < hitbox.object.position.z + hitbox.object.dimensions.height) && 
                (hitbox.object.position.z < this.object.position.z + this.object.dimensions.height) &&

                (this.object.position.y < hitbox.object.position.y + config.mageYHitbox) &&
                (hitbox.object.position.y < this.object.position.y + config.mageYHitbox);
    }
}


class Model {
    constructor({spritesheets, framedata, rows, columns}) {
        this.spritesheet = spritesheets[0];
        this.spritesheetReversed = spritesheets[1];

        this.rows = rows;
        this.columns = columns;

        this.framedata = framedata;



        this.timer = 0;
        this.spriteRow = 0;


        this.flipX = false;
        this.reverseAnimationSequence = false;
        this.animate = true;
    }


    swapAnimation(animationIndex) {
        this.spriteRow = animationIndex;
        this.reverseAnimationSequence = false; // Im sure putting this here won't bite me later, surely...
        this.timer = 0;
    }

    draw({position}) {
        if ((this.timer += Deltatime * config.animationFPS) >= this.framedata[this.spriteRow].last)
            this.timer = 0;


        let col = !this.reverseAnimationSequence ? 0 : this.columns - (this.columns - (this.framedata[this.spriteRow].frames.length - 1));
        
        if (this.animate) {
            if (!this.reverseAnimationSequence)
                this.framedata[this.spriteRow].frames.forEach( (frame) => {
                    if (this.timer > frame)
                        col++;
                })
            
            else
                this.framedata[this.spriteRow].frames.forEach( (frame) => {
                    if ((this.framedata[this.spriteRow].last - this.timer < frame) && (this.framedata[this.spriteRow].last != frame))
                        col--;
                })
        }
            
    
        if (this.flipX)
            col = (this.columns - 1) - col;
            


        ctx.drawImage(
            !this.flipX ? this.spritesheet : this.spritesheetReversed,

            // Image cut from sprite sheet
            col * config.assetWidth,
            this.spriteRow * config.assetHeight,

            config.assetWidth,
            config.assetHeight,

            // Image positioning and dimensions
            position.x,
            position.z - position.y,
            config.assetWidth,
            config.assetHeight
        );
    }
}



class Object {
    constructor({position, dimensions, model}) {
        this.dimensions = dimensions;

        this.position = position;

        this.velocity = {
            x: 0,
            y: 0,
            z: 0
        };

        this.isAcceleratingX = false;
        this.isAcceleratingZ = false;

        this.model = model;
    }

    update() {
        this.position.x += this.velocity.x * Deltatime;
        this.position.y += this.velocity.y * Deltatime;
        this.position.z += this.velocity.z * Deltatime;


        // Friction only applies while touching the ground, y = 0, projectiles should make sure to set their y values different from 0
        if (this.position.y == 0) {
            if (this.velocity.x != 0 && !this.isAcceleratingX) {
                this.velocity.x += (this.velocity.x > 0 ? -config.friction : config.friction) * Deltatime;
    
                if (Math.abs(this.velocity.x) < config.minVelocity)
                    this.velocity.x = 0;
            }
    
            if (this.velocity.z != 0 && !this.isAcceleratingZ) {
                this.velocity.z += (this.velocity.z > 0 ? -config.friction : config.friction) * Deltatime;
    
                if (Math.abs(this.velocity.z) < config.minVelocity)
                    this.velocity.z = 0;
            }
        }
            
    }

    draw() {
        // TODO: Round position values to the nearest whole number to avoid blur

        if (this.model != null)
            this.model.draw({position: this.position});

        else {
            ctx.fillStyle = 'rgba(222, 222, 222, 0.5)';
            ctx.fillRect(
                this.position.x - this.dimensions.width / 2,
                (this.position.z - this.position.y) - this.dimensions.height / 2,
                this.dimensions.width,
                this.dimensions.height);
        }
    }
}


class Mage {
    constructor({position, stats}) {
        this.object = new Object({
            position: position,
            dimensions: {width: config.mageWidth, height: config.mageHeight},
            model: new Model({
                spritesheets: [Assets[2], Assets[3]],
                framedata: [
                    {frames: [10, 20, 30, 40, 50], last: 50},                // Idle
                    {frames: [10, 20, 30, 40, 50], last: 50},                // Idle Air
                    {frames: [6, 12, 18, 24], last: 24},                     // Walk Air
                    {frames: [6, 12, 18, 24, 30, 36, 42, 48], last: 48},     // Walk
                    {frames: [0], last: 0},                                  // Stun
                    {frames: [3, 6, 9, 12, 25], last: 25},                   // Death/Disappear
                    {frames: [6, 12, 18, 24, 30, 36, 42, 48, 52], last: 52}, // Attack Heavy
                    {frames: [4, 8, 12, 16, 20, 24, 28, 32, 36], last: 36},  // Attack Light
                ],
                rows: 8, columns: 9,
            }),
        });

        this.hitbox = new Hitbox({
            object: this.object,
            type: "player", 
            callback: (hitbox) => {
                switch(hitbox.type) {
                    case "player":
                        distanceX = (hitbox.object.position.x + hitbox.object.dimensions.width / 2) - (this.object.position.x + this.object.dimensions.width / 2)
                        distanceZ = (hitbox.object.position.z + hitbox.object.dimensions.height / 2) - (this.object.position.z + this.object.dimensions.height / 2)

                        scaler = Math.sqrt(Math.pow(distanceX, 2) + Math.pow(distanceY, 2))
                        angle = distanceZ / distanceX;

                        hitbox.object.velocity.x += (hitbox.object.velocity.x < 0 ? 1 : -1) * (Math.cos(angle)) * (1 / scaler);
                        hitbox.object.velocity.z += (hitbox.object.velocity.z < 0 ? 1 : -1) * (Math.sin(angle)) * (1 / scaler);


                        break;
                }

            }});
        Hitboxes.push(this.hitbox)

        this.stats = {
            hp_max: stats.hp_max,
            hp_base: stats.hp_max / 2,
            hp_mana: stats.hp_max / 2,

            mp_max: stats.mp_max,
            mp: stats.mp_max,

            sp_max: stats.sp_max,
            sp: stats.sp_max
        }

        this.status = {
            dodge: {active: false, timer: 0},
            stun:  {active: false, timer: 0, isLag: false}, // isLag means the stun sprite won't be used
        };
    }

    update() {
        // Swap facing direction if velocity reverses enough
        if (this.object.velocity.x < -75)
            this.object.model.flipX = true;
        if (this.object.velocity.x > 75)
            this.object.model.flipX = false;

        


        
            
        // Update status durations
        if (this.status.stun.active && (this.status.stun.timer -= Deltatime * config.animationFPS) < 0) {
            this.status.stun.timer = 0;
            this.status.stun.active = false;

        } 
        if (this.status.dodge.active && (this.status.dodge.timer -= Deltatime * config.animationFPS) < 0) { 
            this.status.dodge.timer = 0;
            this.status.dodge.active = false;

            // Dodge endlag
            this.status.stun.timer = 12;
            this.status.stun.active = true;
        }
            



        if (!this.status.dodge.active && !this.status.stun.active) {
            // Swap animation based on relative actions
            if (this.object.model.spriteRow != 3 && (this.object.velocity.x != 0 || this.object.velocity.z != 0))   // Start walking
            this.object.model.swapAnimation(3);

            else if (this.object.model.spriteRow != 0 && (this.object.velocity.x == 0 && this.object.velocity.z == 0)) // Start idling
                this.object.model.swapAnimation(0);
        }


        // Dodge animations
        if (this.status.dodge.active && this.status.stun.active && this.object.model.spriteRow != 5) 
            this.object.model.swapAnimation(5);
        else if (this.status.dodge.timer <= 13 && this.object.model.spriteRow == 5 && !this.object.model.reverseAnimationSequence) {
            // Show dodge ending animation
            this.object.model.swapAnimation(5);
            this.object.model.reverseAnimationSequence = true;
        }


        this.object.update();
    }

    draw() {
        this.object.draw();
    }
}



class Player {
    constructor({position, keybinds, stats}) {
        this.mage = new Mage({position, stats});
        Mages.push(this.mage);

        this.inputs = {
            keybinds: keybinds,
            pressed: {
                up: false, down: false, left: false, right: false, dodge: false, 
                interact: false, spellbook: false,
                spellbook_slot1: false, spellbook_slot2: false, spellbook_slot3: false, spellbook_slot4: false
            }
        };

        // If maxVelocity is 200, then the player will move at 200 pixels a second at max movement velocity
        // therefore if their acceleration is 400, it will take them 0.5 seconds to reach it
        this.movementMaxVelocity = 150; // px/s
        this.movementAcceleraton = 800; // px/s^2 

        this.activeSpellSlot = 0;
    }

    // Player controls
    update() {
        this.mage.object.isAcceleratingX = false;
        this.mage.object.isAcceleratingZ = false;    

        // For spell selection, use movement keys to pick between one of the four (make it doable during something like dash)

        // If the up keybind is pressed, check if the current z velocity is less than the max 
        // movement velocity (normalize it if moving in more than axis) and if so, add to velocity (outside of typical acceleration)
        if (!this.mage.status.stun.active && !this.mage.status.dodge.active) {


            if (this.inputs.pressed.dodge) {
                this.mage.status.stun.active = true;
                this.mage.status.stun.timer = 12;
                this.mage.status.stun.isLag = true;

                this.mage.status.dodge.active = true;
                this.mage.status.dodge.timer = 38;
            }

            if (this.inputs.pressed.up && 
                this.mage.object.velocity.z >= -this.movementMaxVelocity * ((this.inputs.pressed.left || this.inputs.pressed.right) ? Math.sqrt(2) / 2 : 1) 
            ) {
                this.mage.object.isAcceleratingZ = true;

                if (this.inputs.pressed.dodge || this.mage.status.dodge.active) // Dodging immediatly increases movementVelocity
                    this.mage.object.velocity.z = -this.movementMaxVelocity * config.dodgeBoost * ((this.inputs.pressed.left || this.inputs.pressed.right) ? Math.sqrt(2) / 2 : 1);
                else {
                    this.mage.object.velocity.z -= this.movementAcceleraton * Deltatime;
                }
            }

            if (this.inputs.pressed.down && 
                this.mage.object.velocity.z <= this.movementMaxVelocity * ((this.inputs.pressed.left || this.inputs.pressed.right) ? Math.sqrt(2) / 2 : 1) 
            ) {
                this.mage.object.isAcceleratingZ = true;

                if (this.inputs.pressed.dodge || this.mage.status.dodge.active)
                    this.mage.object.velocity.z = this.movementMaxVelocity * config.dodgeBoost * ((this.inputs.pressed.left || this.inputs.pressed.right) ? Math.sqrt(2) / 2 : 1);
                else {
                    this.mage.object.velocity.z += this.movementAcceleraton * Deltatime;
                }
            }


            if (this.inputs.pressed.left && 
                this.mage.object.velocity.x >= -this.movementMaxVelocity * ((this.inputs.pressed.up || this.inputs.pressed.down) ? Math.sqrt(2) / 2 : 1) 
            ) {
                this.mage.object.isAcceleratingX = true;
                
                if (this.inputs.pressed.dodge || this.mage.status.dodge.active)
                    this.mage.object.velocity.x = -this.movementMaxVelocity * config.dodgeBoost * ((this.inputs.pressed.up || this.inputs.pressed.down) ? Math.sqrt(2) / 2 : 1);
                else {
                    this.mage.object.velocity.x -= this.movementAcceleraton * Deltatime;
                }
            }

            if (this.inputs.pressed.right && 
                this.mage.object.velocity.x <= this.movementMaxVelocity * ((this.inputs.pressed.up || this.inputs.pressed.down) ? Math.sqrt(2) / 2 : 1) 
            ) {
                this.mage.object.isAcceleratingX = true;

                if (this.inputs.pressed.dodge || this.mage.status.dodge.active)
                    this.mage.object.velocity.x = this.movementMaxVelocity * config.dodgeBoost * ((this.inputs.pressed.up || this.inputs.pressed.down) ? Math.sqrt(2) / 2 : 1);
                else {
                    this.mage.object.velocity.x += this.movementAcceleraton * Deltatime;
                }
            }


            if (!this.inputs.pressed.dodge) {
                if (Math.abs(this.mage.object.velocity.x) > this.movementMaxVelocity * ((this.inputs.pressed.up || this.inputs.pressed.down) ? Math.sqrt(2) / 2 : 1))
                    this.mage.object.velocity.x = (this.mage.object.velocity.x > 0 ? this.movementMaxVelocity : -this.movementMaxVelocity) * ((this.inputs.pressed.up || this.inputs.pressed.down) ? Math.sqrt(2) / 2 : 1)

                if (Math.abs(this.mage.object.velocity.z) > this.movementMaxVelocity * ((this.inputs.pressed.left || this.inputs.pressed.right) ? Math.sqrt(2) / 2 : 1))
                    this.mage.object.velocity.z = (this.mage.object.velocity.z > 0 ? this.movementMaxVelocity : -this.movementMaxVelocity) * ((this.inputs.pressed.left || this.inputs.pressed.right) ? Math.sqrt(2) / 2 : 1)
            }
        }
    }

    // Player ui elements
    draw() {
        // TODO: This... i've begun working on stats below
    }
}









function init() {
    config.assets.forEach( (asset) => {
        let sprite = new Image(asset.columns * config.assetWidth, asset.rows * config.assetHeight);
        sprite.src = asset.url;

        Assets.push(sprite);
    });

    User = new Player({
        position: { x: 50, y: 0, z: 50 },
        keybinds: config.defaultKeybinds,
        stats: {
            hp_max: 100,
            mp_max: 80,
            sp_max: 140,
        }
    });

    Mages.push(new Mage({
        position: { x: 350, y: 0, z: 50 },
        stats: {
            hp_max: 100,
            mp_max: 80,
            sp_max: 140,
        }
    }))

    main();
} init();

function main() {
    // Update deltatime
    currentTime = window.performance.now();
    Deltatime = (currentTime - previousTime) / 1000; // These means that if deltatime was cumulative it would equal 1 after 1 second

    // Request main to be called next frame
    window.requestAnimationFrame(main);

    // Set background
    ctx.fillStyle = 'rgb(36, 36, 36)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);


    // Check for user interaction and update player mage if needed
    User.update();

    Hitboxes.forEach( (hitbox) => {

    })

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


    // Draw player specific UI elements
    User.draw();


    console.log(Deltatime)
    previousTime = currentTime;
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
    let button = event.key.toLocaleLowerCase();

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
    let button = event.key.toLocaleLowerCase();

    switch (button) {
        case User.inputs.keybinds.interact:
            User.inputs.pressed.interact = false;
            break;

        case User.inputs.keybinds.spellbook:
            User.inputs.pressed.spellbook = false;
            break;
    }
})