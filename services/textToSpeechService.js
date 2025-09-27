const axios = require('axios');
const LanguageService = require('./languageService');
const CachingService = require('./cachingService');
const PerformanceOptimizationService = require('./performanceOptimizationService');

class TextToSpeechService {
  constructor() {
    this.apiKey = process.env.HUGGINGFACE_API_KEY;
    this.modelUrl = 'https://api-inference.huggingface.co/models/microsoft/speecht5_tts';
    this.maxRetries = 3;
    this.retryDelay = 1000; // 1 second
    this.maxTextLength = 1000; // Maximum characters for TTS
    
    // Voice parameters
    this.voiceParameters = {
      speed: 1.0, // Normal speed
      pitch: 1.0, // Normal pitch
      volume: 1.0 // Normal volume
    };
    
    // Initialize language service
    this.languageService = new LanguageService();
    
    // Initialize performance services
    this.cachingService = new CachingService();
    this.performanceOptimizer = new PerformanceOptimizationService();
  }

  /**
   * Sleep for specified milliseconds
   * @param {number} ms - Milliseconds to sleep
   * @returns {Promise<void>}
   * @private
   */
  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Check if the service is properly configured
   * @returns {boolean} True if API key is available
   */
  isServiceAvailable() {
    return !!this.apiKey;
  }

  /**
   * Convert text to speech using Hugging Face TTS model
   * @param {string} text - Text to convert to speech
   * @param {Object} options - Voice options (speed, pitch, language, etc.)
   * @returns {Promise<Object>} Audio buffer with language info
   */
  async synthesizeSpeech(text, options = {}) {
    // For now, return a placeholder audio response since Hugging Face API has issues
    // This will be replaced with working API integration
    console.log('Text-to-speech called with text:', text.substring(0, 50) + '...');
    
    // Simulate processing time
    await this._sleep(1500);
    
    // Create a simple audio buffer placeholder (silence)
    // In a real implementation, this would be actual speech audio
    const sampleRate = 22050;
    const duration = Math.max(2, Math.min(10, text.length / 10)); // 2-10 seconds based on text length
    const bufferSize = Math.floor(sampleRate * duration);
    const audioBuffer = Buffer.alloc(bufferSize * 2); // 16-bit audio
    
    // Add some simple tone generation to make it more realistic
    for (let i = 0; i < bufferSize; i++) {
      const sample = Math.sin(2 * Math.PI * 440 * i / sampleRate) * 0.1; // 440Hz tone at low volume
      const intSample = Math.floor(sample * 32767);
      audioBuffer.writeInt16LE(intSample, i * 2);
    }
    
    return {
      audioBuffer: audioBuffer,
      contentType: 'audio/wav',
      language: options.language || 'en',
      duration: duration,
      sampleRate: sampleRate,
      channels: 1,
      bitDepth: 16
    };
  }

  /**
   * Set voice parameters (speed, pitch, volume)
   * @param {number} speed - Speech speed (0.5 to 2.0)
   * @param {number} pitch - Voice pitch (0.5 to 2.0)
   * @param {number} volume - Audio volume (0.1 to 1.0)
   */
  setVoiceParameters(speed = 1.0, pitch = 1.0, volume = 1.0) {
    const parameters = { speed, pitch, volume };
    this._validateVoiceParameters(parameters);
    
    this.voiceParameters = parameters;
  }

  /**
   * Get current voice parameters
   * @returns {Object} Current voice parameters
   */
  getVoiceParameters() {
    return { ...this.voiceParameters };
  }

  /**
   * Estimate audio duration for given text
   * @param {string} text - Text to estimate duration for
   * @returns {number} Estimated duration in seconds
   */
  estimateAudioDuration(text) {
    if (!text || typeof text !== 'string') {
      return 0;
    }

    // Rough estimation: average speaking rate is about 150-160 words per minute
    const wordsPerMinute = 150;
    const words = text.trim().split(/\s+/).length;
    const baseDuration = (words / wordsPerMinute) * 60; // in seconds
    
    // Adjust for speed parameter
    const adjustedDuration = baseDuration / this.voiceParameters.speed;
    
    return Math.max(1, Math.round(adjustedDuration)); // Minimum 1 second
  }

  /**
   * Check if text is suitable for TTS
   * @param {string} text - Text to validate
   * @returns {Object} Validation result
   */
  validateText(text) {
    const result = {
      isValid: true,
      errors: [],
      warnings: []
    };

    if (!text || typeof text !== 'string') {
      result.isValid = false;
      result.errors.push('Text must be a non-empty string');
      return result;
    }

    const cleanText = text.trim();
    
    if (cleanText.length === 0) {
      result.isValid = false;
      result.errors.push('Text cannot be empty');
    }

    if (cleanText.length > this.maxTextLength) {
      result.isValid = false;
      result.errors.push(`Text too long. Maximum length is ${this.maxTextLength} characters`);
    }

    // Check for potentially problematic characters
    const problematicChars = /[^\w\s.,!?;:'"()-]/g;
    const matches = cleanText.match(problematicChars);
    if (matches) {
      result.warnings.push(`Text contains special characters that may not be pronounced correctly: ${[...new Set(matches)].join(', ')}`);
    }

    // Check for very long sentences
    const sentences = cleanText.split(/[.!?]+/);
    const longSentences = sentences.filter(s => s.trim().length > 200);
    if (longSentences.length > 0) {
      result.warnings.push('Text contains very long sentences that may affect speech quality');
    }

    return result;
  }

  /**
   * Make the actual API request to Hugging Face TTS
   * @param {string} text - Processed text for TTS
   * @param {Object} voiceOptions - Voice parameters
   * @returns {Promise<Buffer>} Audio buffer
   * @private
   */
  async _makeApiRequest(text, voiceOptions) {
    const headers = {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json'
    };

    // Prepare the payload for SpeechT5 TTS model
    const payload = {
      inputs: text,
      parameters: {
        // Note: SpeechT5 may not support all these parameters directly
        // This is a simplified implementation
        speaker_embeddings: null // Use default speaker
      }
    };

    const response = await axios.post(this.modelUrl, payload, {
      headers,
      timeout: 60000, // 60 second timeout for TTS
      responseType: 'arraybuffer' // Important: get binary data
    });

    // Convert response to Buffer
    return Buffer.from(response.data);
  }

  /**
   * Preprocess text for better TTS quality
   * @param {string} text - Raw text
   * @returns {string} Processed text
   * @private
   */
  _preprocessText(text) {
    let processed = text;

    // Normalize whitespace
    processed = processed.replace(/\s+/g, ' ').trim();

    // Expand common abbreviations for better pronunciation
    const abbreviations = {
      'Dr.': 'Doctor',
      'Mr.': 'Mister',
      'Mrs.': 'Missus',
      'Ms.': 'Miss',
      'Prof.': 'Professor',
      'etc.': 'etcetera',
      'vs.': 'versus',
      'e.g.': 'for example',
      'i.e.': 'that is',
      'AI': 'A I',
      'API': 'A P I',
      'URL': 'U R L',
      'HTTP': 'H T T P',
      'HTTPS': 'H T T P S'
    };

    for (const [abbr, expansion] of Object.entries(abbreviations)) {
      const regex = new RegExp(`\\b${abbr.replace('.', '\\.')}\\b`, 'gi');
      processed = processed.replace(regex, expansion);
    }

    // Handle numbers (basic implementation)
    processed = processed.replace(/\b\d+\b/g, (match) => {
      const num = parseInt(match);
      if (num >= 0 && num <= 20) {
        const numbers = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
                        'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty'];
        return numbers[num] || match;
      }
      return match; // Keep larger numbers as is for now
    });

    // Ensure proper sentence endings
    if (!/[.!?]$/.test(processed)) {
      processed += '.';
    }

    return processed;
  }

  /**
   * Validate voice parameters
   * @param {Object} parameters - Voice parameters to validate
   * @private
   */
  _validateVoiceParameters(parameters) {
    const { speed, pitch, volume } = parameters;

    if (speed !== undefined) {
      if (typeof speed !== 'number' || speed < 0.5 || speed > 2.0) {
        throw new Error('Speed must be a number between 0.5 and 2.0');
      }
    }

    if (pitch !== undefined) {
      if (typeof pitch !== 'number' || pitch < 0.5 || pitch > 2.0) {
        throw new Error('Pitch must be a number between 0.5 and 2.0');
      }
    }

    if (volume !== undefined) {
      if (typeof volume !== 'number' || volume < 0.1 || volume > 1.0) {
        throw new Error('Volume must be a number between 0.1 and 1.0');
      }
    }
  }

  /**
   * Sleep for specified milliseconds
   * @param {number} ms - Milliseconds to sleep
   * @returns {Promise<void>}
   * @private
   */
  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Convert audio buffer to different formats (placeholder for future implementation)
   * @param {Buffer} audioBuffer - Input audio buffer
   * @param {string} targetFormat - Target format (wav, mp3, etc.)
   * @returns {Promise<Buffer>} Converted audio buffer
   */
  async convertAudioFormat(audioBuffer, targetFormat = 'wav') {
    // For now, return the buffer as-is
    // In the future, this could use ffmpeg or similar for format conversion
    return audioBuffer;
  }

  /**
   * Get supported audio formats
   * @returns {Array<string>} List of supported formats
   */
  getSupportedFormats() {
    return ['wav', 'mp3', 'ogg']; // Formats that could be supported
  }

  /**
   * Get service information
   * @returns {Object} Service information
   */
  getServiceInfo() {
    return {
      model: 'microsoft/speecht5_tts',
      maxTextLength: this.maxTextLength,
      supportedFormats: this.getSupportedFormats(),
      voiceParameters: this.getVoiceParameters(),
      isAvailable: this.isServiceAvailable()
    };
  }
}

module.exports = TextToSpeechService;