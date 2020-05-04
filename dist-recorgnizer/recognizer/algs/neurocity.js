let speechThreshold = 0.5

export const neurocity = (byteArray) => {
    let res = [];
    let min_value = null;
    let max_value = null;

    let start_i = (byteArray.length >= 4 && byteArray[0] == 82 && byteArray[1] == 73 && byteArray[2] == 70 && byteArray[3] == 70) ? 44 : 0;
    for(let i = start_i;i < byteArray.length;i+=2) {
        let value = (byteArray[i] | (byteArray[i+1] < 128 ? (byteArray[i+1] << 8) : ((byteArray[i+1] - 256) << 8)))/32768;
        res.push(value);

        if(min_value == null || min_value > value) min_value = value;
        if(max_value == null || max_value < value) max_value = value;

        if(start_i > 0 && (i == byteArray.length-1 || i == 400)) {
            speechThreshold = Math.max(Math.abs(min_value*4),Math.abs(max_value*4));
            if(speechThreshold > 0.8) speechThreshold = 0.8;
            if(speechThreshold < 0.01) speechThreshold = 0.01;
        }
    }
    return (min_value < -speechThreshold || max_value > speechThreshold);
};