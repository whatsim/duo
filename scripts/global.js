var inputVideoEl = document.createElement('video')
var index = 0
var scannerPos = 0;

var colorDistance = 170
var smoothing = .1

var allowed = function (stream) {
    window.persistAudioStream = stream;
    
    inputVideoEl.srcObject = stream;
    inputVideoEl.onloadedmetadata = function(e) {
       inputVideoEl.play();
       
       output.width = inputVideoEl.videoWidth
       output.height = inputVideoEl.videoHeight

       // construct our seriously object
        seriously = new Seriously();

        camera = seriously.source(inputVideoEl);
        target = seriously.target("#output");

        falsecolor = seriously.effect('falsecolor');
        contrast = seriously.effect('brightness-contrast');

        // connect all our nodes in the right order

        falsecolor.source = camera;
        contrast.source = falsecolor
        target.source = contrast;
        console.log(contrast)
        seriously.go();
     };
    var audioContext = new AudioContext();
    var audioStream = audioContext.createMediaStreamSource( stream );
    var analyser = audioContext.createAnalyser();
    audioStream.connect(analyser);
    analyser.fftSize = 1024;

    var sampleRate = audioContext.sampleRate
    var frequencyArray = new Uint8Array(analyser.frequencyBinCount);
    
    
    var sample = function () {
        requestAnimationFrame(sample);
        analyser.getByteFrequencyData(frequencyArray);
      	var total = 0;
        var biggest = {index:0,size:0}

        for (var i = 0 ; i < 255; i++) {
            var frequency = i * sampleRate / (analyser.fftSize/2)
            total += frequencyArray[i]
            if(frequencyArray[i] > biggest.size){
                biggest.size = frequencyArray[i]
                biggest.index = i
                biggest.frequency = frequency
            }
        }
        if(falsecolor){
            index = index - (index - biggest.index)*smoothing
            var one = index/2
            var two = (one + colorDistance) % 255
            falsecolor.black = "hsl("+one+","+100+"%,25%)"
            falsecolor.white = "hsl("+two+","+100+"%,90%)"
            
            contrast.contrast = biggest.size / 255 + 1
            // contrast.brightness = biggest.size / 255 + 2
        }
    }

    var seriously, // the main object that holds the entire composition
    camera, // wrapper object for source video
    falsecolor,
    contrast,
    target // a wrapper object for our target canvas

    sample();

}

var notAllowed = function (error) {
    console.log(error);
}

navigator.getUserMedia({video:true,audio:true}, allowed, notAllowed);
