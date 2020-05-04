//https://gist.github.com/spidercatnat/63e87a48531e4231d526786e17e8e4e4
/**
 * Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * A AudioWorklet-based BitCrusher demo from the spec example.
 *
 * @class BitCrusherProcessor
 * @extends AudioWorkletProcessor
 * @see https://webaudio.github.io/web-audio-api/#the-bitcrusher-node
 */

class BitCrusherProcessor extends AudioWorkletProcessor {
    static get parameterDescriptors() {
      return [
        {
          name: 'bitDepth',
          defaultValue: 12,
          minValue: 1,
          maxValue: 16
        }, {
          name: 'frequencyReduction',
          defaultValue: 0.5,
          minValue: 0,
          maxValue: 1,
        },
      ];
    }
  
    constructor() {
      super();
      this.options = {
        fftSize: 512,
        bufferLen: 512, 
        voice_stop: function() {},
        voice_start: function() {},
        smoothingTimeConstant: 0.99, 
        energy_offset: 1e-8, // The initial offset. 0,00000001
        energy_threshold_ratio_pos: 2, // Signal must be twice the offset
        energy_threshold_ratio_neg: 0.5, // Signal must be half the offset
        energy_integration: 1, // Size of integration change compared to the signal per second.
        filter: [
          {f: 200, v:0}, // 0 -> 200 is 0
          {f: 2000, v:1} // 200 -> 2k is 1
        ],
        source: null,
        context: null
      }
      this.ready = {}
      this.inSpeech = false // True when Voice Activity Detected

      this.setFilter(this.options.filter)
      
      this.createVoiceTrendProps()
      this.createEnergyDetectorProps()
      this.createAnalyther()
      this.createFft()
      this.port.onmessage = this.onmessage.bind(this)
    }

    onmessage(event) {
      console.log('onmessage', {event})
      // const { data } = event;
      // this.isPlaying = data;
    }
  
    createIterationPeriod(){
      this.options.context = this.options.source.context // TODO: здесь собака зарыта
      this.hertzPerBin = this.options.context.sample
    }

    createVoiceTrendProps(){
      this.voiceTrend = 0;
      this.voiceTrendMax = 10;
      this.voiceTrendMin = -10;
      this.voiceTrendStart = 5;
      this.voiceTrendEnd = -5;
    }

    createEnergyDetectorProps(){
      this.energy_offset = this.options.energy_offset
      this.energy_threshold_pos = this.energy_offset * this.options.energy_threshold_ratio_pos
      this.energy_threshold_neg = this.energy_offset * this.options.energy_threshold_ratio_neg
    }
  
    setEnergyDetectorProps(signal){
      // Integration brings in the real-time aspect through the relationship with the frequency this functions is called.
      const integration = signal * this.iterationPeriod * this.options.energy_integration
      // The !end limits the offset delta boost till after the end is detected.
      this.energy_offset += (integration > 0 || !end) ? integration : integration * 10
      this.energy_offset = this.energy_offset < 0 ? 0 : this.energy_offset
      this.energy_threshold_pos = this.energy_offset * this.options.energy_threshold_ratio_pos
      this.energy_threshold_neg = this.energy_offset * this.options.energy_threshold_ratio_neg
    }

    setFilter(shape){
      this.filter = [];
      for(let i = 0, iLen = this.options.fftSize / 2; i < iLen; i++) {
        this.filter[i] = 0;
        for(let j = 0, jLen = shape.length; j < jLen; j++) {
          if(i * this.hertzPerBin < shape[j].f) {
            this.filter[i] = shape[j].v;
            break; // Exit j loop
          }
        }
      }
    }

    createFft(){
      // Setup local storage of the Linear FFT data
      this.floatFrequencyDataLinear = new Float32Array(this.floatFrequencyData.length);
      this.floatFrequencyData = new Float32Array(this.analyser.frequencyBinCount);
    }

    createAnalyther(){
      this.analyser = this.options.context.createAnalyser();
      this.analyser.smoothingTimeConstant = this.options.smoothingTimeConstant; // 0.99;
      this.analyser.fftSize = this.options.fftSize;
    }

    update(){
      const fft = this.floatFrequencyData
      for(let i = 0, iLen = fft.length; i < iLen; i++){
        // -возведение в степень. -зачем? -хз
        this.floatFrequencyDataLinear[i] = Math.pow(10, fft[i] / 10)
      }
      this.ready = {}
    }
  
    monitor(){
      const energy = this.getEnergy()
      const signal = energy - this.energy_offset
      if(signal > this.energy_threshold_pos){
        this.voiceTrend
      }
    }

    process(inputs, outputs, parameters) {
      this.update()
      this.monitor()
    }
  }
  
  registerProcessor('bit-crusher-processor', BitCrusherProcessor);