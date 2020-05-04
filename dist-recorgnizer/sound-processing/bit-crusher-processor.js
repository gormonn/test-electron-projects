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
        {name: 'bitDepth', defaultValue: 12, minValue: 1, maxValue: 16}, {
          name: 'frequencyReduction',
          defaultValue: 0.5,
          minValue: 0,
          maxValue: 1,
        },
      ];
    }
  
    constructor() {
      super();
      this.phase_ = 0;
      this.lastSampleValue_ = 0;
      this.isPlaying = true;
      this.port.onmessage = this.onmessage.bind(this)
    }

    onmessage(event) {
      const { data } = event;
      this.isPlaying = data;
    }
  
    process(inputs, outputs, parameters) {
      const input = inputs[0];
      const output = outputs[0];
  
      // AudioParam array can be either length of 1 or 128. Generally, the code
      // should prepare for both cases. In this particular example, |bitDepth|
      // AudioParam is constant but |frequencyReduction| is being automated.
      const bitDepth = parameters.bitDepth;
      const frequencyReduction = parameters.frequencyReduction;
      const isBitDepthConstant = bitDepth.length === 1;
  
      for (let channel = 0; channel < input.length; ++channel) {
        const inputChannel = input[channel];
        const outputChannel = output[channel];
        let step = Math.pow(0.5, bitDepth[0]);
        for (let i = 0; i < inputChannel.length; ++i) {
          // We only take care |bitDepth| because |frequencuReduction| will always
          // have 128 values.
          if (!isBitDepthConstant) {
            step = Math.pow(0.5, bitDepth[i]);
          }
          this.phase_ += frequencyReduction[i];
          if (this.phase_ >= 1.0) {
            this.phase_ -= 1.0;
            this.lastSampleValue_ =
                step * Math.floor(inputChannel[i] / step + 0.5);
          }
          outputChannel[i] = this.lastSampleValue_;
        }
      }
  
      return this.isPlaying;
    }
  }
  
  registerProcessor('bit-crusher-processor', BitCrusherProcessor);