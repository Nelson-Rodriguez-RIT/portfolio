// This is a standalone build for gameplay features of Project 3

function load() {
    new Taiko.Beatmap(10);

    update();
}

function update() {
    // Request update to be called next frame
    // Works off of CSS framerates, so this is normally tied to monitor refresh rate
    window.requestAnimationFrame(update);

    // TODO: Object handling
    // Timing is done is milliseconds since osu beatmap store timings based on ms too
    
    // Note slider SVs will require increasing/decreasing the rate at which the objects appear
    // this means that I will also have to start them further back. Ill need to into the beatmap
    // data to figure out how to get a multiplier for these two things (since they are directly related)

    // Objects (i.e. dons and katsus) are to be spawned in a specific quantity. I initially thought 50, but if these
    // is in the browser I should probably attempt to be efficient with memory usage, specically since these
    // HAVE to be DOM objects (remmeber no CANVAS element usage is allowed)

    // Objects need to be despawned after they pass a specific threshold (i.e. the user missed the note) or when
    // they get interacted with (i.e. player attempts to hit the note)



    // TODO: Input
    // Don's and Katu's inputs should be mutually exclusive, meaning that using the input for one doesn't impact the other
    // This will likely require reading a few notes ahead. Perhaps use a for-of loop to check for objects within hit range

    // Inputs will need to be able to last for more than one frame for big notes, since its very unlikely to hit both
    // bottoms exactly on the same frame. Perhaps I should have a queue structure for inputs instead of a boolean type on/off system

    

    // TODO: UI Handling
    // Hitting a note should involve a small animation of the note either going off screen at a curved angle (opposed to just moving straight offscreen as if you missed it)
    // or to the health bar. At 50 or 75% health bar should visually change to show this i.e. the tamashii icon should change, entire bar gets a glow

    // Hitting a note should show its accuracy animation and change for bigger varieties respectivily
    // If combo reaches 50 and above, spritesheet for combo numbers should change to golden ver

    // Score should show the number (quickly but) gradually increasing with a +### indicator underneath to show recently earned points
    // I should probably use a queue for this system

    // Hitzone and general UI elements to change to be more "active"/glowing during Kai periods

    // I definitly have to implement don chan
    // He should have idle, combo reached/special note cleared, failing, and kai time animations
    
    // Reach combo milestone should have don chan also let an exclamation of reached combo

    // Don and Katsu should become animated at 50 combo and twice as fast as at 150. This should be BPM


    
    // TODO: Ideas for calculating BPM
}

load();