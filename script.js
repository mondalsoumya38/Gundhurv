let synth, droneOsc1, droneOsc2, reverb, analyzer;
let currentRaag;
let isPlaying = false;
let lastNoteTime = 0;
let playBtn, messageElement;

function getRaagData() {
    const currentHour = new Date().getHours(); 
    
    if (currentHour >= 18 && currentHour < 20) {
        return { name: "Raag Yaman", color: "#E66767", textColor: "#fff", scale: [60, 62, 64, 66, 67, 69, 71, 72], droneNotes: [48, 55], speed: 40, maxCircles: 100, expansionRate: 2, isNight: true };
    } else if (currentHour >= 20 && currentHour < 22) {
        return { name: "Raag Kedar", color: "#4A6984", textColor: "#fff", scale: [60, 62, 64, 65, 66, 67, 69, 72], droneNotes: [48, 55], speed: 35, maxCircles: 85, expansionRate: 2.2, isNight: true };
    } else if (currentHour >= 22 || currentHour === 0) { 
        return { name: "Raag Bageshree", color: "#303952", textColor: "#fff", scale: [60, 62, 63, 65, 67, 69, 70, 72], droneNotes: [48, 55], speed: 45, maxCircles: 110, expansionRate: 1.8, isNight: true };
    } else if (currentHour > 0 && currentHour < 3) {
        return { name: "Raag Malkauns", color: "#192A56", textColor: "#fff", scale: [60, 63, 65, 68, 70, 72], droneNotes: [48, 53], speed: 50, maxCircles: 120, expansionRate: 1.5, isNight: true };
    } else if (currentHour >= 3 && currentHour < 6) {
        return { name: "Raag Bhatiyar", color: "#574B90", textColor: "#fff", scale: [60, 61, 64, 65, 67, 69, 71, 72], droneNotes: [48, 55], speed: 35, maxCircles: 90, expansionRate: 2.5, isNight: true };
    } else {
        return { isNight: false, color: "#e0e0e0", textColor: "#888" };
    }
}

function setup() {
    currentRaag = getRaagData();
    
    messageElement = document.getElementById("message");
    playBtn = document.getElementById("play-btn");

    if (!currentRaag.isNight) {
        playBtn.style.display = "none"; 
        messageElement.textContent = "We only play at night.";
        document.body.style.backgroundColor = currentRaag.color;
        document.body.style.color = currentRaag.textColor;
        noCanvas(); 
        return; 
    }

    // Clear the message during the night so only the button shows
    messageElement.textContent = "";

    let myCanvas = createCanvas(windowWidth, windowHeight);
    myCanvas.parent('canvas-container');

    synth = new p5.MonoSynth();
    droneOsc1 = new p5.Oscillator('triangle');
    droneOsc2 = new p5.Oscillator('triangle');
    
    droneOsc1.freq(midiToFreq(currentRaag.droneNotes[0]));
    droneOsc2.freq(midiToFreq(currentRaag.droneNotes[1]));
    
    droneOsc1.amp(0);
    droneOsc2.amp(0);
    droneOsc1.start();
    droneOsc2.start();

    reverb = new p5.Reverb();
    reverb.process(synth, 6, 2); 
    reverb.process(droneOsc1, 6, 2);
    reverb.process(droneOsc2, 6, 2);

    analyzer = new p5.FFT();

    playBtn.addEventListener("click", () => {
        if (!isPlaying) {
            userStartAudio(); 
            droneOsc1.amp(0.1, 2); 
            droneOsc2.amp(0.1, 2); 
            playBtn.innerHTML = "⏸"; // Change to Pause icon
            playBtn.classList.add("playing"); // Fixes centering
        } else {
            droneOsc1.amp(0, 1); 
            droneOsc2.amp(0, 1);
            playBtn.innerHTML = "▶"; // Change to Play icon
            playBtn.classList.remove("playing");
        }
        isPlaying = !isPlaying;
    });
}

function draw() {
    if (!currentRaag || !currentRaag.isNight) return;

    background(currentRaag.color || '#111');

    if (isPlaying) {
        if (frameCount - lastNoteTime > currentRaag.speed) {
            playRandomNoteFromRaag();
            lastNoteTime = frameCount;
        }

        analyzer.analyze();
        let bassValue = analyzer.getEnergy("bass");
        let trebleValue = analyzer.getEnergy("treble");

        translate(width / 2, height / 2); 
        noFill();

        for (let i = 0; i < currentRaag.maxCircles; i++) {
            let radius = (i * currentRaag.expansionRate + frameCount * (currentRaag.expansionRate / 2)) % (width / 2);
            let thickness = map(bassValue, 0, 255, 1, 5);
            strokeWeight(thickness);
            
            let alpha = map(radius, 0, width / 2, 255, 0);
            stroke(255, 255, 255, alpha); 

            let d = radius * 2 + sin(i * 0.1 + frameCount * 0.05) * map(trebleValue, 0, 255, 0, 20);
            ellipse(0, 0, d);
        }
    }
}

function playRandomNoteFromRaag() {
    let randomIndex = Math.floor(Math.random() * currentRaag.scale.length);
    let midiNote = currentRaag.scale[randomIndex];
    let freq = midiToFreq(midiNote);
    synth.play(freq, 0.3, 0, 0.5); 
}

function windowResized() {
    if (currentRaag && currentRaag.isNight) {
        resizeCanvas(windowWidth, windowHeight);
    }
}