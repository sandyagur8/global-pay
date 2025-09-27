pragma circom 2.0.0;

include "node_modules/circomlib/circuits/poseidon.circom";

template PaymentChecker() {
    signal input amount;
    signal input secretNonce;
    signal input pubViewKeyX;
    signal input pubViewKeyY;
    signal input pubSpendKeyX;
    signal input pubSpendKeyY;
    signal input paymentType;
    signal input startDate;
    signal input endDate;
    
    signal input commitment;
    component hasher = Poseidon(9);

    hasher.inputs[0] <== amount;
    hasher.inputs[1] <== secretNonce;
    hasher.inputs[2] <== pubViewKeyX;
    hasher.inputs[3] <== pubViewKeyY;
    hasher.inputs[4] <== pubSpendKeyX;
    hasher.inputs[5] <== pubSpendKeyY;
    hasher.inputs[6] <== paymentType;
    hasher.inputs[7] <== startDate;
    hasher.inputs[8] <== endDate;
    commitment === hasher.out;
}

component main {
    public [
        pubViewKeyX, pubViewKeyY, pubSpendKeyX, pubSpendKeyY, 
        paymentType, startDate, endDate, commitment
    ]
} = PaymentChecker();