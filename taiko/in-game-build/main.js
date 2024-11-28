// This is a standalone build for gameplay features of Project 3

let BEATMAP = null;
let HTML;

const GAME = {
    // Partially set upon map load/start, periodically updated
    BPM: 0,
    multiplierSV: 0, // Multiplier applied to baseSV
    inKiai: false,   // Used to signal a peak/chorus/important part of a song. Increases point gain by 20% for the duration its active

    // Updated very offten
    hitObjectsQueue: [], // Stores hit objects that will be displayed and checked for during input events
    scoreQueue:      [], // UI only; used to periodically add points and show score values per input event
    timingQueue:     [], // UI only; used to show timing result i.e. Good, Ok, and Bad
    inputQueue:      [],

    score: 0, // (380 + 90 * comboBonus) * (timingIsGood ? 1 : 0.5)      
              //https://taikotime.blogspot.com/2018/08/feature-combo-scoring-visualized.html
    combo: 0, // comboBonus = 1 at 10xCombo, 2 at 30x, 4 at 50x, and 8 at 100x 
    soul:  0, // Represents percent of completion of note hit requirements in order to pass the song
    
    // Set upon beatmap load
    baseSV: 0,              // Controls how fast hit objects move from left to right
    soulDifficulty: 0.0,    // Used to determine how much soul to gain/lose and ballon notes hit requirement
    timingGood: 0,  // +- ms window for hitting a note with a good rating, awards full points      
    timingOk:   0,  // +- ms window for hitting a note with a ok rating, awards half points  
    timingBad:  0,  // + ms window for hitting a note with a miss rating, awards no points and breaks combo. (Note only matters for early inputs since anything past - ok window is a miss anyways) 
}

const CONFIG = {
    hitObjectBaseValue: 380,
    comboScoreBonus: 90,
}

let FileInput = document.querySelector("#input");
FileInput.addEventListener('change', load);

function load() {
    Setup.GetGameHTML(HTML); 
    Util.GetRawText(FileInput.files[0]);

    update();
}

function update() {
    // Request update to be called next frame
    // Works off of CSS framerates, so this is normally tied to monitor refresh rate
    window.requestAnimationFrame(update);


    if (BEATMAP) {
        console.log(BEATMAP);
        debugger;
    }


    // https://osu.ppy.sh/wiki/en/Client/File_formats/osu_%28file_format%29

    // TODO: Object handling
    // Timing is done is milliseconds since osu beatmap store timings based on ms too
    
    // Note slider SVs will require increasing/decreasing the rate at which the objects appear
    // this means that I will also have to start them further back. Ill need to into the beatmap
    // data to figure out how to get a multiplier for these two things (since they are directly related)
    // https://www.youtube.com/watch?v=-7FiYZ4t2x0

    // Objects (i.e. dons and katsus) are to be spawned in a specific quantity. I initially thought 50, but if these
    // is in the browser I should probably attempt to be efficient with memory usage, specically since these
    // HAVE to be DOM objects (remmeber no CANVAS element usage is allowed)

    // Objects need to be despawned after they pass a specific threshold (i.e. the user missed the note) or when
    // they get interacted with (i.e. player attempts to hit the note)

    // Timing Points: Pos = uninherited and pos number is beat length (which is used to set bpm), Neg = uninherited and value sets SV



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

    // Change top background once reaching health threshold to pass
    // Maybe change it once again once full?

    
    // TODO: Ideas for calculating BPM
    // Adding measure lines (Use time sig 4/4)

    // BPM =   1 / (uninherited timing point val 1) * 1000 * (fps)
}
