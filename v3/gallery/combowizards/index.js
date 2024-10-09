// Environment setup
const canvas = document.querySelector('canvas')
const ctx = canvas.getContext('2d')

canvas.width  = 1024
canvas.height = 576


 /*
Thank you random netizen https://stackoverflow.com/questions/5127937/how-to-center-canvas-in-html5
     position: absolute;
     top: 50%;
     left: 50%;
     transform: translate(-50%, -50%)
 */
ctx.fillRect(0, 0, canvas.width, canvas.height)

deltatime = 0
previousTime = window.performance.now()
currentTime = 0

class Object {
    constructor({position, dimensions}) {

        this.position = {}
        this.position.x = position.x
        this.position.y = position.y
        this.position.z = position.z

        this.velocity = {}
        this.velocity.x = 0
        this.velocity.y = 0
        this.velocity.z = 0

        this.acceleration = {}
        this.acceleration.x = 0
        this.acceleration.y = 0
        this.acceleration.z = 0

        this.dimensions = {}
        this.dimensions.width  = dimensions.width
        this.dimensions.height = dimensions.height        
    }

    update() {
        this.velocity.x += this.acceleration.x * deltatime
        this.velocity.y += this.acceleration.y * deltatime
        this.velocity.z += this.acceleration.z * deltatime

        this.position.x += this.velocity.x * deltatime
        this.position.y -= this.velocity.y * deltatime
        this.position.z -= this.velocity.z * deltatime
    }

    draw(color) {
        ctx.fillStyle = color
        ctx.fillRect(
            this.position.x, this.position.z + this.position.y, 
            this.dimensions.width, this.dimensions.height)
    }
}

class Character {
    constructor({position, keybinds}) {
        // Handles rendering and physics 
        this.sprite = new Object({
            position:   position,
            dimensions: {width: 25, height: 50}
        })

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
        }

        // Tracks mouse info
        this.controlsMouse = true
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
        this.magicSchools = [
            [
                {
                    id: 1,
                    name: 'magic_school_1', 
                    spells: [
                        {callback: () => {console.log('bang')}, chargeTime: 0},
                        {callback: () => {console.log('boom')}, chargeTime: 1},
                        {callback: () => {console.log('kaboom')}, chargeTime: 2}
                    ]
                }
            ], 
            []

        ]


        this.movementSpeed = 250 // Pixels per second
        this.m1HeldMaxTimer = 4 // In seconds

        this.spellBookOpen = false
        this.selectedMagicSchool = null // 0 Implies none, otherwise goes off of IDs
    }

    update() {
        // Keyboard inputs
        if (this.controllable) { 
            this.sprite.velocity.z = 0
            this.sprite.velocity.x = 0

            if (this.controls.up.pressed)
                this.sprite.velocity.z = this.movementSpeed 

            if (this.controls.down.pressed)
                this.sprite.velocity.z = -this.movementSpeed

            if (this.controls.left.pressed)
                this.sprite.velocity.x = -this.movementSpeed

            if (this.controls.right.pressed)
                this.sprite.velocity.x = this.movementSpeed

            // Normalizes movement if its multi-directional
            if (Math.abs(this.sprite.velocity.x) != 0 && Math.abs(this.sprite.velocity.z != 0)) {
                this.sprite.velocity.x *= Math.sqrt(2) / 2
                this.sprite.velocity.z *= Math.sqrt(2) / 2
            }
        }

        // Mouse inputs
        if (this.controlsMouse) {
            // Update m1 held timer (or keep it at its cap)
            if (this.mouse.m1Pressed)
                this.mouse.m1PressedTimer += (this.mouse.m1PressedTimer + deltatime >= this.m1HeldMaxTimer) ? 
                                             (-this.mouse.m1PressedTimer + this.m1HeldMaxTimer) : deltatime
    
    
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
                        this.selectedMagicSchool.spells[spell].callback()
                        break
                    }

                this.mouse.m1PressedTimer = 0
            }
                
                    
        }

        // Should be last to give time for updating velocity, accceleration etc
        this.sprite.update()
    }

    draw() {
        this.sprite.draw('white')


        // Draw progress bar if m1 is held
        if (this.mouse.m1Pressed) {
            ctx.fillStyle = `rgb(67, 201, 176)`
            ctx.fillRect(this.mouse.x - 50, this.mouse.y - 50, this.mouse.m1PressedTimer * (100 / this.m1HeldMaxTimer), 10)
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
                        ctx.fillStyle = `rgb(240, 239, 125, 0.25)`
                        ctx.fillRect((this.mouse.staticX - 150) + (row * 150), (this.mouse.staticY - 150) + (col * 150), 150, 150)
                    }
                }

            
        }

        // Draw cursor
        ctx.fillStyle = 'black'
        ctx.fillRect(this.mouse.x - 5, this.mouse.y - 5, 10, 10)
    }
}
player = new Character({
    position: {x: 20, y: 0, z: 20}, 
    keybinds: {up: 'w', down: 's', left: 'a', right: 'd'}
})



function main() {
    // Environment
    window.requestAnimationFrame(main)

    ctx.fillStyle = 'gray'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    currentTime = window.performance.now()
    deltatime = (currentTime - previousTime) / 1000



    // Player
    player.update()
    player.draw()


    previousTime = currentTime
} main()




window.addEventListener('keydown', (event) => {
    key = event.key.toLowerCase()

    switch(key) {
        case player.controls.up.key:
            player.controls.up.pressed    = true
            break

        case player.controls.down.key:
            player.controls.down.pressed  = true
            break

        case player.controls.left.key:
            player.controls.left.pressed  = true
            break

        case player.controls.right.key:
            player.controls.right.pressed = true
            break
    }
})

window.addEventListener('keyup', (event) => {
    key = event.key.toLowerCase()

    switch(key) {
        case player.controls.up.key:
            player.controls.up.pressed = false
            break

        case player.controls.down.key:
            player.controls.down.pressed = false
            break

        case player.controls.left.key:
            player.controls.left.pressed = false
            break

        case player.controls.right.key:
            player.controls.right.pressed = false
    }
})

window.addEventListener('mousemove', (event) => {
    player.mouse.x = event.layerX
    player.mouse.y = event.layerY
})

window.addEventListener('mousedown', (event) => {
    if (event.button == 0)
        player.mouse.m1Pressed = true

    if (event.button == 2) {
        player.mouse.m2Pressed = true
        player.mouse.staticX = event.layerX
        player.mouse.staticY = event.layerY
    }
        
})

window.addEventListener('mouseup', (event) => {
    if (event.button == 0) {
        player.mouse.m1Pressed = false
    }

    if (event.button == 2) {
        player.mouse.m2Pressed = false
    }
        
})