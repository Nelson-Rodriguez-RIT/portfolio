// Environment setup
const canvas = document.querySelector('canvas')
const ctx = canvas.getContext('2d')

canvas.width  = 1024
canvas.height = 576

ctx.fillRect(0, 0, canvas.width, canvas.height)

var Deltatime = 0

let previousTime = window.performance.now()
let currentTime = 0


const Players = []
const NPCs = []
const Hitboxes = []


class Object {
    constructor({position, dimensions}) {

        this.position = {
            x: position.x,
            y: position.y,
            z: position.z
        }

        this.velocity = {
            x: 0,
            y: 0,
            z: 0
        }

        this.acceleration = {
            x: 0,
            y: 0,
            z: 0
        }

        this.dimensions = {
            width:  dimensions.width,
            height: dimensions.height
        }    
    }

    update() {
        this.velocity.x += this.acceleration.x * Deltatime
        this.velocity.y += this.acceleration.y * Deltatime
        this.velocity.z += this.acceleration.z * Deltatime

        this.position.x += this.velocity.x * Deltatime
        this.position.y -= this.velocity.y * Deltatime
        this.position.z -= this.velocity.z * Deltatime
    }

    draw(color) {
        ctx.fillStyle = color
        ctx.fillRect(
            this.position.x, this.position.z + this.position.y, 
            this.dimensions.width, this.dimensions.height)
    }
}

class Character {
    constructor({position, stats}) {
        // Handles rendering and physics 
        this.object = new Object({
            position:   position,
            dimensions: {width: 25, height: 50}
        })

        this.stats = {
            // hp, mp, and rp regen mechanics
            // hp: takes the longest to start regenerating, only the mana shield health can regenerate, and causes the most amount of exhuastion gain
            // mp: takes a medium amount of time to start regenerating and causes a medium amount of exhuastion gain
            // sp: takes the shortest amount of time to regenerate and causes the least amount of exhuastion gain

            hp_max:    stats.hp,     // Health Points    if it reaches 0, the character dies. 
            hp:        stats.hp / 2, // The first 50% of hp is a "mana shield health" while the latter is "true health". 
            hp_shield: stats.hp / 2, // Reaching 0% mp causes the mana shield health to instantly deplete

            mp_max: stats.mp,   // Mana Points      required to fufill the cost of casting spells and to maintain your mana shield
            mp:     stats.mp,

            sp_max: stats.sp,   // Stamina Points   required to fufill the cost of an action... an action can still be done if you have less than the cost but above 0 total
            sp:     stats.sp,

            exhaustion: 0,   // Recovering sp, mp, and hp causes exhuastion to build up reducing the rate at which those stats recover. 
                             // Naturally goes away over time (even in combat) and directly decreases when your hp decreases

            vit: stats.vit, // Vitality     determines the rate you recover exhaustion and how quickly you begin to regain hp, mp, and sp
            atk: stats.atk, // Attack       determines the amount of damage you deal   (serves as a mutiplier)
            def: stats.def, // Defense      determines the amount of damage you resist (serves as a mutiplier)
            spd: stats.spd, // Speed        determines both the rate at which a character does non casting actions and the characters movement speed
        }

        this.hitstunTimer = 0
        this.timeSinceLastAction = 0
        this.intangible = false
        this.movementSpeed = 250 // Pixels per second
    }

    update() {
        this.timeSinceLastAction += Deltatime

        // Track player death
        if (this.stats.hp == 0)
            this.controllable = false


        // hp, mp, and sp recover logic + exhaustion logic
        if (this.timeSinceLastAction > (1.75 - this.stats.vit / 20)&& this.stats.sp < this.stats.sp_max) {
            this.stats.sp += (150 * this.stats.vit / 7.5 * Deltatime) * (1 - this.stats.exhaustion * .5)
            this.stats.sp = (this.stats.sp > this.stats.sp_max) ? this.stats.sp_max : this.stats.sp

            this.stats.exhaustion += 2.5 / 100 * Deltatime
        }

        if (this.timeSinceLastAction > (2.25 - this.stats.vit / 20) && this.stats.mp < this.stats.mp_max) {
            this.stats.mp += (50 * this.stats.vit / 10 * Deltatime) * (1 - this.stats.exhaustion * .33)
            this.stats.mp = (this.stats.mp > this.stats.mp_max) ? this.stats.mp_max : this.stats.mp

            this.stats.exhaustion += 5 / 100 * Deltatime
        }

        if (this.timeSinceLastAction > (5 - this.stats.vit / 7.5) && this.stats.hp_shield < this.stats.hp_max / 2) {
            this.stats.hp_shield += (25 * this.stats.vit / 10 * Deltatime) * (1 - this.stats.exhaustion * .25)
            this.stats.hp_shield = (this.stats.hp_shield > this.stats.hp_max / 2) ? this.stats.hp_max / 2 : this.stats.hp_shield

            this.stats.exhaustion += 10 / 100 * Deltatime
        }

        if (this.timeSinceLastAction < 0)
            this.stats.exhaustion -= Deltatime * (20 - this.stats.vit / 2) / 100

        if (this.timeSinceLastAction > 1)
            this.stats.exhaustion -= Deltatime * (2 + this.stats.vit / 20) / 100 

        if (this.stats.exhaustion < 0)
            this.stats.exhaustion = 0
        else if (this.stats.exhaustion >= 0.75) {
            this.timeSinceLastAction= -1.5
            this.stats.exhaustion = 1
        }
            


        if (this.stats.hp < 0)
            this.stats.hp = 0
        if (this.stats.hp_shield < 0)
            this.stats.hp_shield = 0
        if (this.stats.mp < 0)
            this.stats.mp = 0
        if (this.stats.sp < 0)
            this.stats.sp = 0


        if (this.hitstunTimer > 0)
            this.hitstunTimer -= Deltatime

        // For dodging at the moment, will need some sort of timer for status effects
        if (this.hitstunTimer <= 0.5 && this.intangible) {
            this.object.velocity.x /= 3
            this.object.velocity.z /= 3

            this.intangible = false
        }

        if (this.hitstunTimer < 0) {
            this.object.velocity.x = 0
            this.object.velocity.z = 0
        }
            

        // Should be last to give time for updating velocity, accceleration etc
        this.object.update()
    }

    draw(color) {
        if (color == 'orange') {
            ctx.fillStyle = `rgba(0, 0, 0, 0.5)`
            ctx.fillRect(this.object.position.x, this.object.position.z - 10, this.stats.hp_max, 5)
            ctx.fillStyle = `rgb(255, 69, 69)`
            ctx.fillRect(this.object.position.x, this.object.position.z - 10, this.stats.hp, 5)
            ctx.fillStyle = `rgb(100, 100, 155)`
            ctx.fillRect(this.object.position.x + this.stats.hp, this.object.position.z - 10, this.stats.hp_shield, 5)
        }

        if (this.intangible)
            this.object.draw('blue')
        else if (this.hitstunTimer > 0)
            this.object.draw('yellow')
        else
            this.object.draw(color)
    }
}

class Player {
    constructor({position, keybinds, stats}) {
        this.character = new Character({position, stats})

        // Tracks keyboard inputs
        this.controllable = true
        this.controls = {
            up: {
                key: keybinds.up,
                pressed: false,
            },
            down: {
                key: keybinds.down,
                pressed: false,
            },
            left: {
                key: keybinds.left,
                pressed: false,
            },
            right: {
                key: keybinds.right,
                pressed: false,
            },
            dodge: {
                key: keybinds.dodge,
                pressed: false,
            }
        }

        // Tracks mouse info
        this.mouse = {
            x: 0,
            y: 0,   // Called 'y' but really references the z axis in this context

            m1Pressed: false,
            m1PressedTimer: 0,

            m2Pressed: false,
            staticX: 0, // Used when the player is interacting with their 
            staticY: 0, // spell book to lock the UI at the m2 click

        }


        // Tracks 4 different schools of magic, with there respecitive spells
        this.magicSchools = [ // 2x2
            [
                {
                    id: 1,
                    name: 'magic_school_fire', 
                    spells: [
                        {callback: (x, z) => {
                            let hitbox = new Hitbox({
                                position: {x: this.character.object.position.x, y: 0, z: this.character.object.position.z},
                                dimensions: {width: 25, height: 25},
                                owner: this.character, // usually set to 'this' but for aoe moves that can hit yourself set it to null
                                lifespan: 1, // secondsds
                                metadata: { // TODO: Add knockbackVelocity of the Y axis
                                    knockbackVelocity: 125, // Actuals knockback will be relavant to the source, pos means away, neg means towards
                                    damageTypes: {hp: 25, mp: 0, sp: 0},
                                    hitstun: 0.75,
                                    pierces: false,
                                    callback: () => {},
                                    blockHitboxes: false,
                                }
                            })

                            let directDistance = Math.sqrt(Math.pow(x - this.character.object.position.x, 2) + Math.pow(this.character.object.position.z - z, 2))

                            hitbox.object.velocity.x = 500.0 * ((x - this.character.object.position.x) / directDistance)
                            hitbox.object.velocity.z = 500.0 * ((this.character.object.position.z - z) / directDistance)

                            Hitboxes.push(hitbox)
                        }, chargeTime: 0, mpCost: 10, spCost: 20},

                        {callback: (x, z) => {
                            for (let count = 0; count < 6; count++) {
                                let hitbox = new Hitbox({
                                    position: {x: this.character.object.position.x, y: 0, z: this.character.object.position.z},
                                    dimensions: {width: 30, height: 30},
                                    owner: this.character,
                                    lifespan: 1,
                                    metadata: {
                                        knockbackVelocity: 200, // Actuals knockback will be relavant to the source, pos means away, neg means towards
                                        damageTypes: {hp: 45, mp: 0, sp: 0},
                                        hitstun: 0.5,
                                        pierces: false,
                                        callback: () => {},
                                        blockHitboxes: false,
                                    }
                                })

                                let directDistance = Math.sqrt(Math.pow((x) - this.character.object.position.x, 2) + Math.pow(this.character.object.position.z - z, 2))

                                hitbox.object.velocity.x = 400.0 * (((x - this.character.object.position.x + (-80 + 32 * count) * (x - this.character.object.position.x > 0 ? 1 : -1)) / directDistance))
                                hitbox.object.velocity.z = 400.0 * (((this.character.object.position.z - z + (-80 + 32 * count) * (this.character.object.position.z - z < 0 ? 1 : -1)) / directDistance))

                                Hitboxes.push(hitbox)
                            }                 
                        }, chargeTime: 0.33, mpCost: 35, spCost: 60},

                        {callback: (x, z) => {
                            let hitbox = new Hitbox({
                                position: {x: this.character.object.position.x, y: 0, z: this.character.object.position.z},
                                dimensions: {width: 25, height: 25},
                                owner: this.character, // usually set to 'this' but for aoe moves that can hit yourself set it to null
                                lifespan: 2, // seconds
                                metadata: {
                                    knockbackVelocity: 0, // Actuals knockback will be relavant to the source, pos means away, neg means towards
                                    damageTypes: {hp: 25, mp: 0, sp: 0},
                                    hitstun: 0.25,
                                    pierces: false,
                                    callback: (character, oldHitbox) => {
                                        let hitbox = new Hitbox({
                                            position: {x: oldHitbox.object.position.x - oldHitbox.object.dimensions.width / 2, y: 0, z: oldHitbox.object.position.z - oldHitbox.object.dimensions.height / 2},
                                            dimensions: {width: 150, height: 150},
                                            owner: null, // usually set to 'this' but for aoe moves that can hit yourself set it to null
                                            lifespan: 0.33, // seconds
                                            metadata: {
                                                knockbackVelocity: 300, // Actuals knockback will be relavant to the source, pos means away, neg means towards
                                                damageTypes: {hp: 75, mp: 0, sp: 100},
                                                hitstun: 0.8,
                                                pierces: true,
                                                callback: () => {},
                                                blockHitboxes: false,
                                            }
                                        })
                                        Hitboxes.push(hitbox)
                                    },
                                    blockHitboxes: false,
                                }
                            })

                            let directDistance = Math.sqrt(Math.pow(x - this.character.object.position.x, 2) + Math.pow(this.character.object.position.z - z, 2))

                            hitbox.object.velocity.x = 500.0 * ((x - this.character.object.position.x) / directDistance)
                            hitbox.object.velocity.z = 500.0 * ((this.character.object.position.z - z) / directDistance)

                            Hitboxes.push(hitbox)
                        }, chargeTime: 1, mpCost: 55, spCost: 75}
                    ]
                },
                {
                    id: 2,
                    name: 'magic_school_wind', 
                    spells: [
                        {callback: (x, z) => {
                            let hitbox = new Hitbox({
                                position: {x: this.character.object.position.x, y: 0, z: this.character.object.position.z},
                                dimensions: {width: 25, height: 25},
                                owner: this.character, // usually set to 'this' but for aoe moves that can hit yourself set it to null
                                lifespan: 1, // secondsds
                                metadata: { // TODO: Add knockbackVelocity of the Y axis
                                    knockbackVelocity: -400, // Adctuals knockback will be relavant to the source, pos means away, neg means towards
                                    damageTypes: {hp: 0, mp: 0, sp: 0},
                                    hitstun: 0.5,
                                    pierces: false,
                                    callback: () => {},
                                    blockHitboxes: false,
                                }
                            })

                            let directDistance = Math.sqrt(Math.pow(x - this.character.object.position.x, 2) + Math.pow(this.character.object.position.z - z, 2))

                            hitbox.object.velocity.x = 700.0 * ((x - this.character.object.position.x) / directDistance)
                            hitbox.object.velocity.z = 700.0 * ((this.character.object.position.z - z) / directDistance)

                            Hitboxes.push(hitbox)
                        }, chargeTime: 0, mpCost: 7.5, spCost: 20},

                        {callback: (x, z) => {
                            let hitbox = new Hitbox({
                                position: {x: x - 50, y: 0, z: z - 50},
                                dimensions: {width: 100, height: 100},
                                owner: null, // usually set to 'this' but for aoe moves that can hit yourself set it to null
                                lifespan: 0.1, // secondsds
                                metadata: { // TODO: Add knodckbackVelocity of the Y axis
                                    knockbackVelocity: 350, // Actuals knockback will be relavant to the source, pos means away, neg means towards
                                    damageTypes: {hp: 0, mp: 0, sp: 50},
                                    hitstun: 0.5,
                                    pierces: true,
                                    callback: () => {},
                                    blockHitboxes: false,
                                }
                            })

                            Hitboxes.push(hitbox)
                        }, chargeTime: 0.4, mpCost: 15, spCost: 40},
                    ]
                }
            ], 
            [
                {
                    id: 3,
                    name: 'magic_school_stone', 
                    spells: [
                        {callback: (x, z) => {
                            let hitbox = new Hitbox({
                                position: {x: this.character.object.position.x - 100, y: 0, z: this.character.object.position.z - 100},
                                dimensions: {width: 200, height: 200},
                                owner: this.character, // usually set to 'this' but for aoe moves that can hit yourself set it to null
                                lifespan: 0.25, // secondsds
                                metadata: { // TODO: Add knockbackVelocity of the Y axis
                                    knockbackVelocity: 100, // Actuals knockback will be relavant to the source, pos means away, neg means towards
                                    damageTypes: {hp: 0, mp: 0, sp: 40},
                                    hitstun: 0.75,
                                    pierces: true,
                                    callback: () => {},
                                    blockHitboxes: false,
                                }
                            })

                            Hitboxes.push(hitbox)
                        }, chargeTime: 0, mpCost: 25, spCost: 35},

                        {callback: (x, z) => {
                            let hitbox = new Hitbox({
                                position: {x: x - 50, y: 0, z: z - 50},
                                dimensions: {width: 100, height: 100},
                                owner: null, // usually set to 'this' but for aoe moves that can hit yourself set it to null
                                lifespan: 10, // seconds
                                metadata: {
                                    knockbackVelocity: 0, // Actuals knockback will be relavant to the source, pos means away, neg means towards
                                    damageTypes: {hp: 0, mp: 0, sp: 0},
                                    hitstun: 0,
                                    pierces: true,
                                    callback: () => {},
                                    blockHitboxes: true,
                                }
                            })

                            Hitboxes.push(hitbox)
                        }, chargeTime: 1, mpCost: 50, spCost: 75},

                        {callback: (x, z) => {
                            let hitbox = new Hitbox({
                                position: {x: x - 50, y: 0, z: z - 50},
                                dimensions: {width: 100, height: 100},
                                owner: this.character, // usually set to 'this' but for aoe moves that can hit yourself set it to null
                                lifespan: 0.5, // seconds
                                metadata: {
                                    knockbackVelocity: 0, // Actuals knockback will be relavant to the source, pos means away, neg means towards
                                    damageTypes: {hp: 0, mp: 0, sp: 0},
                                    hitstun: 0.5,
                                    pierces: false,
                                    callback: (target, oldHitbox) => {
                                        let hitbox = new Hitbox({
                                            position: {x: target.object.position.x, y: 0, z: target.object.position.z},
                                            dimensions: {width: 25, height: 25},
                                            owner: this.character, // usually set to 'this' but for aoe moves that can hit yourself set it to null
                                            lifespan: 7.5, // seconds
                                            metadata: {
                                                knockbackVelocity: 0, // Actuals knockback will be relavant to the source, pos means away, neg means towards
                                                damageTypes: {hp: 0, mp: 0, sp: 0},
                                                hitstun: 0.5,
                                                pierces: true,
                                                callback: () => {
                                                    // Make this disappear if target is no longer touching
                                                },
                                                blockHitboxes: false,
                                            }
                                        })
            
                                        Hitboxes.push(hitbox)
                                    },
                                    blockHitboxes: false,
                                }
                            })

                            Hitboxes.push(hitbox)
                        }, chargeTime: 2.5, mpCost: 75, spCost: 50}
                    ]
                },
                {
                    id: 4,
                    name: 'magic_school_wind', 
                    spells: [
                        {callback: (x, z) => {
                            let hitbox = new Hitbox({
                                position: {x: this.character.object.position.x, y: 0, z: this.character.object.position.z},
                                dimensions: {width: 25, height: 25},
                                owner: this.character, // usually set to 'this' but for aoe moves that can hit yourself set it to null
                                lifespan: 1, // secondsds
                                metadata: { // TODO: Add knockbackVelocity of the Y axis
                                    knockbackVelocity: -400, // Adctuals knockback will be relavant to the source, pos means away, neg means towards
                                    damageTypes: {hp: 0, mp: 0, sp: 0},
                                    hitstun: 0.5,
                                    pierces: false,
                                    callback: () => {},
                                    blockHitboxes: false,
                                }
                            })

                            let directDistance = Math.sqrt(Math.pow(x - this.character.object.position.x, 2) + Math.pow(this.character.object.position.z - z, 2))

                            hitbox.object.velocity.x = 700.0 * ((x - this.character.object.position.x) / directDistance)
                            hitbox.object.velocity.z = 700.0 * ((this.character.object.position.z - z) / directDistance)

                            Hitboxes.push(hitbox)
                        }, chargeTime: 0, mpCost: 7.5, spCost: 20},

                        {callback: (x, z) => {
                            let hitbox = new Hitbox({
                                position: {x: x - 50, y: 0, z: z - 50},
                                dimensions: {width: 100, height: 100},
                                owner: null, // usually set to 'this' but for aoe moves that can hit yourself set it to null
                                lifespan: 0.1, // secondsds
                                metadata: { // TODO: Add knodckbackVelocity of the Y axis
                                    knockbackVelocity: 350, // Actuals knockback will be relavant to the source, pos means away, neg means towards
                                    damageTypes: {hp: 0, mp: 0, sp: 50},
                                    hitstun: 0.5,
                                    pierces: true,
                                    callback: () => {},
                                    blockHitboxes: false,
                                }
                            })

                            Hitboxes.push(hitbox)
                        }, chargeTime: 0.4, mpCost: 15, spCost: 40},
                    ]
                }
            ]
        ]

        this.m1HeldMaxTimer = 4 // In seconds
        this.spellBookOpen = false
        this.selectedMagicSchool = null // 0 Implies none, otherwise goes off of IDs
    }

    update() {
        // Keyboard inputs
        if (this.controllable && (this.character.hitstunTimer -= Deltatime) <= 0 && this.character.hitstunTimer <= 0) { 
            this.character.hitstunTimer = 0
            this.character.object.velocity.z = 0
            this.character.object.velocity.x = 0

            if (this.controls.up.pressed)
                this.character.object.velocity.z = this.character.movementSpeed 

            if (this.controls.down.pressed)
                this.character.object.velocity.z = -this.character.movementSpeed

            if (this.controls.left.pressed)
                this.character.object.velocity.x = -this.character.movementSpeed

            if (this.controls.right.pressed)
                this.character.object.velocity.x = this.character.movementSpeed

            if (this.controls.dodge.pressed && this.character.stats.sp > 0) {
                this.character.object.velocity.x *= 3
                this.character.object.velocity.z *= 3

                this.character.intangible = true
                this.character.hitstunTimer = 0.75

                this.character.stats.sp -= 35
                this.character.timeSinceLastAction = 0
            }

            // Normalizes movement if its multi-directional
            if (Math.abs(this.character.object.velocity.x) != 0 && Math.abs(this.character.object.velocity.z != 0)) {
                this.character.object.velocity.x *= Math.sqrt(2) / 2
                this.character.object.velocity.z *= Math.sqrt(2) / 2
            }

            
        }

        // Mouse inputs
        if (this.controllable && this.character.hitstunTimer <= 0) {
            // Update m1 held timer (or keep it at its cap)
            if (this.mouse.m1Pressed)
                this.mouse.m1PressedTimer += (this.mouse.m1PressedTimer + Deltatime >= this.m1HeldMaxTimer) ? 
                                             (-this.mouse.m1PressedTimer + this.m1HeldMaxTimer) : Deltatime
    
    
            // Spellbook interaction
            if (this.mouse.m2Pressed)
                this.spellBookOpen = true
    
            if (!this.mouse.m2Pressed && this.spellBookOpen) {
                for (let row = 0; row < 2; row++)
                    for (let col = 0; col < 2; col++)
                        if (this.mouse.x > (this.mouse.staticX - 150) + (row * 150) && this.mouse.x < (this.mouse.staticX - 150) + (row + 1) * 150 &&
                            this.mouse.y > (this.mouse.staticY - 150) + col * 150 && this.mouse.y < (this.mouse.staticY - 150) + (col + 1) * 150) {
                                // Set new magic school
                                this.selectedMagicSchool = this.magicSchools[col][row]

                                // Set maximum charge timer
                                for(const spell of this.magicSchools[col][row].spells)
                                    this.m1HeldMaxTimer = spell.chargeTime

                                
                            }

                this.spellBookOpen = false
            }
            
            // Using a spell
            if (!this.mouse.m1Pressed && this.mouse.m1PressedTimer != 0 && this.selectedMagicSchool != null) {
                for (let spell = this.selectedMagicSchool.spells.length - 1; spell >= 0; spell--)
                    if (this.selectedMagicSchool.spells[spell].chargeTime <= this.mouse.m1PressedTimer ||
                        this.selectedMagicSchool.spells[spell].chargeTime == 0 
                    ) {
                        if (this.character.stats.mp >= this.selectedMagicSchool.spells[spell].mpCost && this.character.stats.sp > 0) {
                            this.character.stats.mp -= this.selectedMagicSchool.spells[spell].mpCost
                            this.character.stats.sp -= this.selectedMagicSchool.spells[spell].spCost

                            this.selectedMagicSchool.spells[spell].callback(this.mouse.x, this.mouse.y)
                        }
                        break
                    }

                this.character.timeSinceLastAction = 0
            }

            if (!this.mouse.m1Pressed)
                this.mouse.m1PressedTimer = 0
        }



        // Should be last to give time for updating velocity, accceleration etc
        this.character.update()
    }

    draw() {
        this.character.draw('white')


        // Draw progress bar if m1 is held
        if (this.mouse.m1Pressed) {
            ctx.fillStyle = `rgb(67, 201, 176)`
            ctx.fillRect(this.mouse.x - 50, this.mouse.y - 50, this.mouse.m1PressedTimer * (100 / this.m1HeldMaxTimer), 10)

            ctx.fillStyle = 'black'
            for (const spell of this.selectedMagicSchool.spells) {
                ctx.fillRect(this.mouse.x - 50 + spell.chargeTime * (100 / this.m1HeldMaxTimer), this.mouse.y - 50, 2, 10)
            }
        }

        // Draw spell book ui if m2 is pressed (no need to show this UI element if m1 is pressed as its uninteractable anyways)
        if (this.mouse.m2Pressed && !this.mouse.m1Pressed) {
            // Background
            ctx.fillStyle = `rgb(100, 100, 100, 0.5)`
            ctx.fillRect(this.mouse.staticX - 150, this.mouse.staticY - 150, 300, 300)

            // Spells + highlighted spell
            for (let row = 0; row < 2; row++)
                for (let col = 0; col < 2; col++) {
                    // Draw each spell info

                    // Draw highlighted spell
                    if (this.mouse.x > (this.mouse.staticX - 150) + (row * 150) && this.mouse.x < (this.mouse.staticX - 150) + (row + 1) * 150 &&
                        this.mouse.y > (this.mouse.staticY - 150) + col * 150 && this.mouse.y < (this.mouse.staticY - 150) + (col + 1) * 150
                    ) {
                        ctx.fillStyle = `rgba(240, 239, 125, 0.25)`
                        ctx.fillRect((this.mouse.staticX - 150) + (row * 150), (this.mouse.staticY - 150) + (col * 150), 150, 150)
                    }
                }

            
        }

        // Draw status UI
        ctx.fillStyle = `rgba(0, 0, 0, 0.5)`
        ctx.fillRect(10, 10, this.character.stats.hp_max, 10)
        ctx.fillRect(10, 30, this.character.stats.mp_max, 10)
        ctx.fillRect(10, 50, this.character.stats.sp_max, 10)

        // hp bar
        ctx.fillStyle = `rgb(255, 69, 69)`
        ctx.fillRect(10, 10, this.character.stats.hp, 10)
        ctx.fillStyle = `rgb(100, 100, 155)`
        ctx.fillRect(10 + this.character.stats.hp, 10, this.character.stats.hp_shield, 10)

        // mp bar 
        ctx.fillStyle = `rgb(69, 69, 255)`
        ctx.fillRect(10, 30, this.character.stats.mp, 10)

        // sp + exhuastion bar
        ctx.fillStyle = `rgb(69, 205, 69)`
        ctx.fillRect(10, 50, this.character.stats.sp, 10)
        ctx.fillStyle = `rgba(0, 0, 0, 0.5)`
        ctx.fillRect(
            10 + (this.character.stats.sp - (this.character.stats.sp_max * this.character.stats.exhaustion) > 0 ? this.character.stats.sp - (this.character.stats.sp_max * this.character.stats.exhaustion) : 0), 
            50, 
            this.character.stats.sp < (this.character.stats.sp_max * this.character.stats.exhaustion) ? this.character.stats.sp : (this.character.stats.sp_max * this.character.stats.exhaustion), 
            10)

        // Draw cursor
        ctx.fillStyle = 'black'
        ctx.fillRect(this.mouse.x - 5, this.mouse.y - 5, 10, 10)
    }
}


class Hitbox {
    constructor({position, dimensions, owner, lifespan, metadata}) {
        this.object = new Object({position, dimensions})

        this.owner = owner
        this.lifespan = lifespan

        this.metadata = {
            knockbackVelocity: metadata.knockbackVelocity,

            damageTypes: {
                hp: metadata.damageTypes.hp,
                mp: metadata.damageTypes.mp,
                sp: metadata.damageTypes.sp
            },

            hitstun: metadata.hitstun,
            pierces: metadata.pierces,
            callback: metadata.callback,
            blockHitboxes: metadata.blockHitboxes
        }
    }

    collidesWith(hitbox) {
        return  this.object.position.x < hitbox.object.position.x + hitbox.object.dimensions.width && this.object.position.x + this.object.dimensions.width > hitbox.object.position.x &&
                this.object.position.z < hitbox.object.position.z + hitbox.object.dimensions.height && this.object.position.z + this.object.dimensions.height > hitbox.object.position.z &&
                this.object.position.y == hitbox.object.position.y
    }

    update() {
        this.lifespan -= Deltatime
        this.object.update()
    }

    draw() {
        if (this.metadata.damageTypes.hp == 0) {
            if (this.metadata.knockbackVelocity == 0)
                this.object.draw(`rgb(255, 25, 255)`)
            else
                this.object.draw(`rgb(25, 255, 25)`)
        }
        else {
            this.object.draw(`rgb(255, 25, 25)`)
        }
        
    }
}





NPCs.push(new Character({
    position: {x: 700, y: 0, z: 300},
    stats:    {hp: 300, mp: 150, sp: 250, vit: 10, atk: 10, def: 10, spd: 10}
}))

Players.push(new Player({
    position: {x: 300, y: 0, z: 300}, 
    keybinds: {up: 'w', down: 's', left: 'a', right: 'd', dodge: 'shift'},
    stats:    {hp: 250, mp: 250, sp: 250, vit: 10, atk: 10, def: 10, spd: 10}
}))





function main() {
    // Environment
    window.requestAnimationFrame(main)

    ctx.fillStyle = 'gray'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    currentTime = window.performance.now()
    Deltatime = (currentTime - previousTime) / 1000


    for (let hitboxIndex = 0; hitboxIndex < Hitboxes.length; hitboxIndex++) {
        if (Hitboxes[hitboxIndex].lifespan > 0) {
            Hitboxes[hitboxIndex].update()
            Hitboxes[hitboxIndex].draw()
        }

        // Remove hitboxes with lifespan = 0, make sure to create a seperate array to prevent undefined behavior
    }

    // NPCs
    let hitboxesValidated = false
    for (let npcIndex = 0; npcIndex < NPCs.length; npcIndex++) {
        if (!NPCs[npcIndex].intangible)
            for (let hitboxIndex = 0; hitboxIndex < Hitboxes.length; hitboxIndex++) {
                // Check hitbox + hitbox interactions
                if (!hitboxesValidated) {
                    for (let checkAgainstIndex = 0; checkAgainstIndex < Hitboxes.length; checkAgainstIndex++) {
                        if (checkAgainstIndex == hitboxIndex || Hitboxes[checkAgainstIndex].lifespan <= 0) continue
        
                        if (Hitboxes[hitboxIndex].collidesWith(Hitboxes[checkAgainstIndex]) && Hitboxes[checkAgainstIndex].metadata.blockHitboxes)
                            Hitboxes[hitboxIndex].lifespan = 0
                    }
                }

                // Check hitbox + player interactions
                if (Hitboxes[hitboxIndex].collidesWith(NPCs[npcIndex]) && Hitboxes[hitboxIndex].owner != NPCs[npcIndex] && !(Hitboxes[hitboxIndex].lifespan <= 0 && !NPCs[npcIndex].intangible)) {
                    NPCs[npcIndex].timeSinceLastAction = 0
                    
    
                    // Deal respective damage types
                    NPCs[npcIndex].stats.hp_shield -= Hitboxes[hitboxIndex].metadata.damageTypes.hp
                    if (NPCs[npcIndex].stats.hp_shield < 0) {
                        NPCs[npcIndex].stats.hp += NPCs[npcIndex].stats.hp_shield
                        NPCs[npcIndex].stats.hp_shield = 0
                    }
    
                    NPCs[npcIndex].stats.mp -= Hitboxes[hitboxIndex].metadata.damageTypes.mp
                    if (NPCs[npcIndex].stats.mp < 0)
                        NPCs[npcIndex].stats.mp = 0
    
                    NPCs[npcIndex].stats.mp -= Hitboxes[hitboxIndex].metadata.damageTypes.sp
                    if (NPCs[npcIndex].stats.sp < 0)
                        NPCs[npcIndex].stats.sp = 0
    
    
                    // Set hitstun if needed
                    if (NPCs[npcIndex].hitstunTimer < Hitboxes[hitboxIndex].metadata.hitstun)
                        NPCs[npcIndex].hitstunTimer = Hitboxes[hitboxIndex].metadata.hitstun
    
    
                    // Set knockback
                    let directDistance = 
                        Math.sqrt(
                            Math.pow(
                                ((NPCs[npcIndex].object.position.x + NPCs[npcIndex].object.dimensions.width) - (Hitboxes[hitboxIndex].object.position.x + Hitboxes[hitboxIndex].object.dimensions.width)), 2) 
                                + 
                            Math.pow(
                                ((Hitboxes[hitboxIndex].object.position.z + Hitboxes[hitboxIndex].object.dimensions.height) - (NPCs[npcIndex].object.position.z + NPCs[npcIndex].object.dimensions.height)), 2))
    
                                NPCs[npcIndex].object.velocity.x = Hitboxes[hitboxIndex].metadata.knockbackVelocity * ((NPCs[npcIndex].object.position.x + NPCs[npcIndex].object.dimensions.width) - (Hitboxes[hitboxIndex].object.position.x + Hitboxes[hitboxIndex].object.dimensions.width)) / directDistance
                                NPCs[npcIndex].object.velocity.z = Hitboxes[hitboxIndex].metadata.knockbackVelocity * ((Hitboxes[hitboxIndex].object.position.z + Hitboxes[hitboxIndex].object.dimensions.height) - (NPCs[npcIndex].object.position.z + NPCs[npcIndex].object.dimensions.height)) / directDistance
    
                    // Check if this hitbox can pierces multiple players
                    if (!Hitboxes[hitboxIndex].metadata.pierces)
                        Hitboxes[hitboxIndex].lifespan = 0
    
                    // Call this hitbox's callbacb if it has one
                    if (Hitboxes[hitboxIndex].metadata.callback != null)
                        Hitboxes[hitboxIndex].metadata.callback(NPCs[npcIndex], Hitboxes[hitboxIndex])
    
                }
                
            }
        
        
        hitboxesValidated = !NPCs[npcIndex].intangible

        NPCs[npcIndex].update()
        NPCs[npcIndex].draw('orange')        
    }

    // Player
    for (let playerIndex = 0; playerIndex < Players.length; playerIndex++) {
        if (!Players[playerIndex].character.intangible) 
            for (let hitboxIndex = 0; hitboxIndex < Hitboxes.length; hitboxIndex++) {
                // Check hitbox + player interactions
                if (Hitboxes[hitboxIndex].collidesWith(Players[playerIndex].character) && Hitboxes[hitboxIndex].owner != Players[playerIndex].character && !(Hitboxes[hitboxIndex].lifespan <= 0)) {
                    
                    Players[playerIndex].character.timeSinceLastAction = 0
    
                    // Deal respective damage types
                    Players[playerIndex].character.stats.hp_shield -= Hitboxes[hitboxIndex].metadata.damageTypes.hp
                    if (Players[playerIndex].character.stats.hp_shield < 0) {
                        Players[playerIndex].character.stats.hp += Players[playerIndex].character.stats.hp_shield
                        Players[playerIndex].character.stats.hp_shield = 0
                    }
    
                    Players[playerIndex].character.stats.mp -= Hitboxes[hitboxIndex].metadata.damageTypes.mp
                    if (Players[playerIndex].character.stats.mp < 0)
                        Players[playerIndex].character.stats.mp = 0
    
                    Players[playerIndex].character.stats.mp -= Hitboxes[hitboxIndex].metadata.damageTypes.sp
                    if (Players[playerIndex].character.stats.sp < 0)
                        Players[playerIndex].character.stats.sp = 0
    
    
                    // Set hitstun if needed
                    if (Players[playerIndex].character.hitstunTimer < Hitboxes[hitboxIndex].metadata.hitstun)
                        Players[playerIndex].character.hitstunTimer = Hitboxes[hitboxIndex].metadata.hitstun
    
    
                    // Set knockback
                    let directDistance = 
                        Math.sqrt(
                            Math.pow(
                                ((Players[playerIndex].character.object.position.x + Players[playerIndex].character.object.dimensions.width) - (Hitboxes[hitboxIndex].object.position.x + Hitboxes[hitboxIndex].object.dimensions.width)), 2) 
                                + 
                            Math.pow(
                                ((Hitboxes[hitboxIndex].object.position.z + Hitboxes[hitboxIndex].object.dimensions.height) - (Players[playerIndex].character.object.position.z + Players[playerIndex].character.object.dimensions.height)), 2))
    
                    Players[playerIndex].character.object.velocity.x = Hitboxes[hitboxIndex].metadata.knockbackVelocity * ((Players[playerIndex].character.object.position.x + Players[playerIndex].character.object.dimensions.width) - (Hitboxes[hitboxIndex].object.position.x + Hitboxes[hitboxIndex].object.dimensions.width)) / directDistance
                    Players[playerIndex].character.object.velocity.z = Hitboxes[hitboxIndex].metadata.knockbackVelocity * ((Hitboxes[hitboxIndex].object.position.z + Hitboxes[hitboxIndex].object.dimensions.height) - (Players[playerIndex].character.object.position.z + Players[playerIndex].character.object.dimensions.height)) / directDistance
    
                    // Check if this hitbox can pierces multiple players
                    if (!Hitboxes[hitboxIndex].metadata.pierces)
                        Hitboxes[hitboxIndex].lifespan = 0
    
                    // Call this hitbox's callbacb if it has one
                    if (Hitboxes[hitboxIndex].metadata.callback != null)
                        Hitboxes[hitboxIndex].metadata.callback(Players[playerIndex].character, Hitboxes[hitboxIndex])
                }

        
            
        }

        Players[playerIndex].update()
        Players[playerIndex].draw()
    }

    previousTime = currentTime
} main()







window.addEventListener('keydown', (event) => {
    let key = event.key.toLowerCase()

    switch(key) {
        case Players[0].controls.up.key:
            Players[0].controls.up.pressed    = true
            break

        case Players[0].controls.down.key:
            Players[0].controls.down.pressed  = true
            break

        case Players[0].controls.left.key:
            Players[0].controls.left.pressed  = true
            break

        case Players[0].controls.right.key:
            Players[0].controls.right.pressed = true
            break

        case Players[0].controls.dodge.key:
            Players[0].controls.dodge.pressed = true
            break
    }
})

window.addEventListener('keyup', (event) => {
    let key = event.key.toLowerCase()

    switch(key) {
        case Players[0].controls.up.key:
            Players[0].controls.up.pressed = false
            break

        case Players[0].controls.down.key:
            Players[0].controls.down.pressed = false
            break

        case Players[0].controls.left.key:
            Players[0].controls.left.pressed = false
            break

        case Players[0].controls.right.key:
            Players[0].controls.right.pressed = false
            break

        case Players[0].controls.dodge.key:
            Players[0].controls.dodge.pressed = false
            break
    }
})

window.addEventListener('mousemove', (event) => {
    Players[0].mouse.x = event.layerX
    Players[0].mouse.y = event.layerY
})

window.addEventListener('mousedown', (event) => {
    if (event.button == 0)
        Players[0].mouse.m1Pressed = true

    if (event.button == 2) {
        Players[0].mouse.m2Pressed = true
        Players[0].mouse.staticX = event.layerX
        Players[0].mouse.staticY = event.layerY
    }
        
})

window.addEventListener('mouseup', (event) => {
    if (event.button == 0) {
        Players[0].mouse.m1Pressed = false
    }

    if (event.button == 2) {
        Players[0].mouse.m2Pressed = false
    }
        
})