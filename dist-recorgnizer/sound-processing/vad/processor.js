class VadProcessor extends AudioWorkletProcessor {

    // Custom AudioParams can be defined with this static getter.
    static get parameterDescriptors() {
        return [{
            name: 'decay',
            defaultValue: 0.5
        }]
    }

    constructor() {
        // The super constructor call is required.
        super()
        this.delayInSamples = 22050
        this.delaySamples = [new Array(22050).fill(0), new Array(22050).fill(0)]
        this.pointers = [0, 0]
    }

    process(inputs, outputs, parameters) {
        console.log('reverbing')
        // process function which takes some input samples and some output samples is very common in DSP
        let input = inputs[0]
        let output = outputs[0]
        let decay = parameters.decay

        //iterate through left and right input channels
        for (let channel = 0; channel < input.length; ++channel) {
            let inputChannel = input[channel]
            let outputChannel = output[channel]
            let delaySamples = this.delaySamples[channel]

            //iterate through samples of a channel
            for (let i = 0; i < inputChannel.length; ++i) {
                let previousSample = delaySamples[this.pointers[channel] % this.delayInSamples]
                delaySamples[this.pointers[channel]] = inputChannel[i] + previousSample * decay[i]
                this.pointers[channel]++
                    if (this.pointers[channel] > this.delayInSamples) {
                        this.pointers[channel] = 0
                    }
                outputChannel[i] = inputChannel[i] + previousSample
            }
        }

        //say to main thread that process function should be called again
        return true
    }
}

registerProcessor('vad-processor', VadProcessor)