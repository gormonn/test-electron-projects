//https://gist.github.com/spidercatnat/17315e5564714c5997baf66d09e9996e
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
 * A simple One pole filter.
 *
 * @class OnePoleProcessor
 * @extends AudioWorkletProcessor
 */

class OnePoleProcessor extends AudioWorkletProcessor {
    static get parameterDescriptors() {
      return [{
        name: 'frequency',
        defaultValue: 250,
        minValue: 0,
        maxValue: 0.5 * sampleRate
      }];
    }
  
    constructor() {
      super();
      this.isPlaying = true;
      this.port.onmessage = this.onmessage.bind(this)
      this.updateCoefficientsWithFrequency_(250);
    }

    onmessage(event) {
      const { data } = event;
      this.isPlaying = data;
    }

    updateCoefficientsWithFrequency_(frequency) {
      this.b1_ = Math.exp(-2 * Math.PI * frequency / sampleRate);
      this.a0_ = 1.0 - this.b1_;
      this.z1_ = 0;
    }
  
    process(inputs, outputs, parameters) {
      const input = inputs[0];
      const output = outputs[0];
  
      const frequency = parameters.frequency;
      const isFrequencyConstant = frequency.length === 1;
  
      for (let channel = 0; channel < output.length; ++channel) {
        const inputChannel = input[channel];
        const outputChannel = output[channel];
  
        // If |frequency| parameter doesn't chnage in the current render quantum,
        // we don't need to update the filter coef either.
        if (isFrequencyConstant) {
          this.updateCoefficientsWithFrequency_(frequency[0]);
        }
  
        for (let i = 0; i < outputChannel.length; ++i) {
          if (!isFrequencyConstant) {
            this.updateCoefficientsWithFrequency_(frequency[i]);
          }
          this.z1_ = inputChannel[i] * this.a0_ + this.z1_ * this.b1_;
          outputChannel[i] = this.z1_;
        }
      }
  
      return this.isPlaying;
    }
  }
  
  registerProcessor('one-pole-processor', OnePoleProcessor);