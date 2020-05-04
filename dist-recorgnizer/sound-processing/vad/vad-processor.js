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
      
      this.createIterationPeriod()
      this.createVoiceTrendProps()
      this.createEnergyDetectorProps()
      this.createAnalyzer()
      this.port.onmessage = this.onmessage.bind(this)
    }

    onmessage(event) {
      console.log('onmessage', {event})
      // const { data } = event;
      // this.isPlaying = data;
    }
  
    createIterationPeriod(){
      this.options.context = this.options.source.context // TODO: здесь собака зарыта
      this.hertzPerBin = this.options.context.sampleRate / this.options.fftSize // че блять
      this.iterationPeriod = 1 / (this.options.context.sampleRate / this.options.bufferLen)
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

    createAnalyzer(){
    // и здесь тоже зарыта
      this.analyser = this.options.context.createAnalyser();
      this.analyser.smoothingTimeConstant = this.options.smoothingTimeConstant; // 0.99;
      this.analyser.fftSize = this.options.fftSize;

      this.fft = new Float32Array(this.analyser.frequencyBinCount);
      // Setup local storage of the Linear FFT data
      this.floatFrequencyDataLinear = new Float32Array(this.fft.length);
    }

    getEnergy(){
      // че за бред
      if(this.ready.energy) {
        return this.energy;
      }
  
      var energy = 0;
      var fft = this.floatFrequencyDataLinear;
  
      for(var i = 0, iLen = fft.length; i < iLen; i++) {
        energy += this.filter[i] * fft[i] * fft[i];
      }
  
      this.energy = energy;
      this.ready.energy = true;
  
      return energy;
    }

    process(inputs, outputs, parameters) {
      this.analyser.getFloatFrequencyData(this.fft);
      for(let i = 0, iLen = this.fft.length; i < iLen; i++){
        // -возведение в степень. -зачем? -хз
        this.floatFrequencyDataLinear[i] = Math.pow(10, this.fft[i] / 10)
      }
      this.ready = {}

      const energy = this.getEnergy()
      const signal = energy - this.energy_offset
      if(signal > this.energy_threshold_pos){
        this.voiceTrend = (this.voiceTrend + 1 > this.voiceTrendMax) ? this.voiceTrendMax : this.voiceTrend + 1
      } else if(signal < -this.energy_threshold_neg){
        this.voiceTrend = (this.voiceTrend - 1 < this.voiceTrendMin) ? this.voiceTrendMin : this.voiceTrend - 1
      } else {
        // voiceTrend gets smaller
        if(this.voiceTrend > 0){
          this.voiceTrend--
        } else if(this.voiceTrend < 0){
          this.voiceTrend++
        }
      }

      let start = false
      let end = false
      if(this.voiceTrend > this.voiceTrendStart){
        // Start of speech detected
        start = true
      } else if(this.voiceTrend < this.voiceTrendEnd) {
        // End of speech detected
        end = true
      }

      this.setEnergyDetectorProps(signal)

      if(start && !this.inSpeech){
        this.inSpeech = true
        this.options.voice_start()
        // post message to main process, что говор начался
      }
      if(end && this.inSpeech){
        this.inSpeech = false
        this.options.voice_stop()
        // отправить сообщение в основной процесс, что говор закончился
      }

      return true
    }
  }
  
  registerProcessor('bit-crusher-processor', BitCrusherProcessor);