// This is a standalone build for gameplay features of Project 3

function load() {

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

    // Objects (i.e. dons and kats) are to be spawned in a specific quantity. I initially thought 50, but if these
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

}

load();