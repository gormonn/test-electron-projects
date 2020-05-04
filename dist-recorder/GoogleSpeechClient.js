const speech = require('@google-cloud/speech')
const {GoogleAuth} = require('google-auth-library');

const apiKey = 'AIzaSyA-6ueblWr4VB2jlPr_0naM1VYH8sBXTRU'; 
const googleAuth = new GoogleAuth();
const auth = googleAuth.fromAPIKey(apiKey);

// const client = new speech.v1.SpeechClient({
//     //fallback: true,
//     auth,
//     // credentials: {
//     // 	"type": "service_account",
//     // 	"project_id": "sprec-260520",
//     // 	"private_key_id": "418702d73b50b7ce3f76067a5a0109751671d9c7",
//     // 	"private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQC0phbCebYAZRe2\nOZiXygbLgpfH8rHm0jh+dkKL+WdEuulhQsmzYaLu8ffgOcYb2JQD8VuruUnbB0ie\nE9R/WMHPSh5dt0Qwt+X59MhGyUfe3zDK4KvU9gE9ruAL7AC9RqHOtXwpE8237V9h\n1pTU3a6HOoxssdI3i0yhjzVbVVE1V7o1HP5smmybYGoD3xVbEFH2qY+bLmywD2W8\nURhNvREhgcGIRhlcQYptI+WDEoYw2AC80oiEVZ7jx++YHLcmFzsyxUVgz1Nk437A\nHJRdpUxQ1VDtBofJAXE5sHtGeX6FNxaCLDfglAtfpubLNzjmrjfkMRC8I1+bpKRh\n7dFPEsQDAgMBAAECgf8q+vxAvW6+qU7MaXNZNaDFVnuAi4OZxJkgw19vBYrSQ9Tm\nCVsLUunOTTghCfsBX0Bj3k7aAQ00VXAI5oBitOnzfyNdV1SE/Q2MDfc7mnmtpIP3\nZAjD6E+pF5VOKZK9pG2VTIGD0BsiBMx+TDKRW6FwizfGpLbTxiJG2cvYHbpL3xUb\nsIg1p4WAUFm8vnjMoO+mqc5YcuXbKmx4WAIPqN1MIgC4LPvc/1yDtzQtZLVtrO27\nghbi9VUmqUygz/b42PWF9kivW/J/7rAN69yDm5TWuEQ2NHTC3WDX5whdHT2linXA\nlwtA7SfLricRKEldFlpBbVPsrlptbcehlmP8XRECgYEA89/wyAvoQ9YTwhzRAVDx\nddP1W38PDTTa+Dfj87gXqlmF4HVZ7MOVMaHc20xwdkdZTUuSuXN6sh6ysNb/Leel\n1Zl4lA947YJPeqfuWE9UeVqut1Z3Umb3QCFE1O3tJpzg5OP4nhTBPOLKLeQyhG+g\ntzPxexG/GTCvs2P686l0dM8CgYEAvaFnCbcHWWf/VSf+rgfJnpcDqucWU4BJabLf\nSdsOBksNVv8RVnZdEwMe9UQrthsUgfdv78t/EP2oXgPkyZOshzFSFobNPr2jqHLZ\nw8cvkCE1Dy1qA3jDTRGCVPz+VwCP0sYcYqsWoKi6jUKQNbbRj61ajbE7XswozHDx\nPvaCMo0CgYEA2ndxRnPMRQDAwHJ6FRjCxc/0C1v+StFfm17OGOWAZb0+vf3CaeQn\ngcfDhryqPnraF/EsZm95qZjwcJSZEjFjEL8kElbt+K50rqdDT975CKFgxKJzz+Cn\ne86Rz8G4YY/Fs6Y5cLudBAMSJRw42QT6z0N7/si+DT3dF/HnvGHADmcCgYAYr+6O\nITnftd5T48UQOwtQjjB4C2WosUbdb+AJ6W7F+vddoA9NxlMPqpRZMerO5m+hC+mS\nuldsitlkg/VBGOyZHR6muB34URABWhJnnoLerLQPqcXndc1XNzRUhCtIgFY5Bnmj\njsp/V/gRc9z6YTafEd58G9qy2LlnBD0kCUuh8QKBgQCIx6F8R4XNx04rZkcukUsV\nAJClags415Xb0W9A+afl6m/xXlEMj4gAW77mF/p2Hi5sY+wqpO1Q6Yn2LN8zo6Dl\nhy7dnfeVKPleqUXUVmdw87OG8HpGToNXOUrEG2VSbzZV4203o5CYsuxdyAQQYVSH\ni/BImO7HTZdHT9Fo8o8sNA==\n-----END PRIVATE KEY-----\n",
//     // 	"client_email": "starting-account-h6ls2g932j3e@sprec-260520.iam.gserviceaccount.com",
//     // 	"client_id": "114796192265116842258",
//     // 	"auth_uri": "https://accounts.google.com/o/oauth2/auth",
//     // 	"token_uri": "https://oauth2.googleapis.com/token",
//     // 	"auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
//     // 	"client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/starting-account-h6ls2g932j3e%40sprec-260520.iam.gserviceaccount.com"
//     // }
// });
function googleSpeechMakeRequest(audioBytes) { 
	try{
	//   Creates a client
		// const client = new speech.v1p1beta1.SpeechClient({
		// window = undefined
		const client = new speech.v1.SpeechClient({
			// fallback: false,
			auth,
			// credentials: {
			// 	"type": "service_account",
			// 	"project_id": "sprec-260520",
			// 	"private_key_id": "418702d73b50b7ce3f76067a5a0109751671d9c7",
			// 	"private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQC0phbCebYAZRe2\nOZiXygbLgpfH8rHm0jh+dkKL+WdEuulhQsmzYaLu8ffgOcYb2JQD8VuruUnbB0ie\nE9R/WMHPSh5dt0Qwt+X59MhGyUfe3zDK4KvU9gE9ruAL7AC9RqHOtXwpE8237V9h\n1pTU3a6HOoxssdI3i0yhjzVbVVE1V7o1HP5smmybYGoD3xVbEFH2qY+bLmywD2W8\nURhNvREhgcGIRhlcQYptI+WDEoYw2AC80oiEVZ7jx++YHLcmFzsyxUVgz1Nk437A\nHJRdpUxQ1VDtBofJAXE5sHtGeX6FNxaCLDfglAtfpubLNzjmrjfkMRC8I1+bpKRh\n7dFPEsQDAgMBAAECgf8q+vxAvW6+qU7MaXNZNaDFVnuAi4OZxJkgw19vBYrSQ9Tm\nCVsLUunOTTghCfsBX0Bj3k7aAQ00VXAI5oBitOnzfyNdV1SE/Q2MDfc7mnmtpIP3\nZAjD6E+pF5VOKZK9pG2VTIGD0BsiBMx+TDKRW6FwizfGpLbTxiJG2cvYHbpL3xUb\nsIg1p4WAUFm8vnjMoO+mqc5YcuXbKmx4WAIPqN1MIgC4LPvc/1yDtzQtZLVtrO27\nghbi9VUmqUygz/b42PWF9kivW/J/7rAN69yDm5TWuEQ2NHTC3WDX5whdHT2linXA\nlwtA7SfLricRKEldFlpBbVPsrlptbcehlmP8XRECgYEA89/wyAvoQ9YTwhzRAVDx\nddP1W38PDTTa+Dfj87gXqlmF4HVZ7MOVMaHc20xwdkdZTUuSuXN6sh6ysNb/Leel\n1Zl4lA947YJPeqfuWE9UeVqut1Z3Umb3QCFE1O3tJpzg5OP4nhTBPOLKLeQyhG+g\ntzPxexG/GTCvs2P686l0dM8CgYEAvaFnCbcHWWf/VSf+rgfJnpcDqucWU4BJabLf\nSdsOBksNVv8RVnZdEwMe9UQrthsUgfdv78t/EP2oXgPkyZOshzFSFobNPr2jqHLZ\nw8cvkCE1Dy1qA3jDTRGCVPz+VwCP0sYcYqsWoKi6jUKQNbbRj61ajbE7XswozHDx\nPvaCMo0CgYEA2ndxRnPMRQDAwHJ6FRjCxc/0C1v+StFfm17OGOWAZb0+vf3CaeQn\ngcfDhryqPnraF/EsZm95qZjwcJSZEjFjEL8kElbt+K50rqdDT975CKFgxKJzz+Cn\ne86Rz8G4YY/Fs6Y5cLudBAMSJRw42QT6z0N7/si+DT3dF/HnvGHADmcCgYAYr+6O\nITnftd5T48UQOwtQjjB4C2WosUbdb+AJ6W7F+vddoA9NxlMPqpRZMerO5m+hC+mS\nuldsitlkg/VBGOyZHR6muB34URABWhJnnoLerLQPqcXndc1XNzRUhCtIgFY5Bnmj\njsp/V/gRc9z6YTafEd58G9qy2LlnBD0kCUuh8QKBgQCIx6F8R4XNx04rZkcukUsV\nAJClags415Xb0W9A+afl6m/xXlEMj4gAW77mF/p2Hi5sY+wqpO1Q6Yn2LN8zo6Dl\nhy7dnfeVKPleqUXUVmdw87OG8HpGToNXOUrEG2VSbzZV4203o5CYsuxdyAQQYVSH\ni/BImO7HTZdHT9Fo8o8sNA==\n-----END PRIVATE KEY-----\n",
			// 	"client_email": "starting-account-h6ls2g932j3e@sprec-260520.iam.gserviceaccount.com",
			// 	"client_id": "114796192265116842258",
			// 	"auth_uri": "https://accounts.google.com/o/oauth2/auth",
			// 	"token_uri": "https://oauth2.googleapis.com/token",
			// 	"auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
			// 	"client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/starting-account-h6ls2g932j3e%40sprec-260520.iam.gserviceaccount.com"
			// }
		});

		// The audio file's encoding, sample rate in hertz, and BCP-47 language code
		const audio = {
			content: audioBytes,
		};
		const config = {
			encoding: 'LINEAR16',
			sampleRateHertz: 48000, // желательно указать корректное значение
			languageCode: 'ru-RU',
		};
		const request = {
			audio,
			config,
			// interimResults: true,  // возврат промежуточных результатов распознавания
			// singleUtterance: true   // непрерывность распознавания из стрима (пауза не сработает из файла)
		};

		log(client.recognize)
		// Detects speech in the audio file
		
		// debugger;
		const [response] = client.recognize(request);
		// debugger;
		//   console.log('recognize res', response);
		return response;
	}catch(err){
	  console.error(err)
	}
}

window.googleSpeechMakeRequest = googleSpeechMakeRequest