class TanHSoftplusMinCPPN extends BaseCPPN{
    /*
     * Feedforward CPNN with 4 layers of 64 units alternating TanH/Softplus activation functions.
     */

    constructor(x_dim, input_dim, weights_path, output_dim){
        super(x_dim, input_dim, weights_path, output_dim);
    }

    generator() {
        //tf.reset_default_graph();
        // inputs to cppn
        this.input = tf.SymbolicTensor(tf.float32, [this.x_dim, this.input_dim + 1]);

        this.h1_weights = tf.variable(tf.truncatedNormal([this.input_dim + 1, 64], 0.0, 2.0));
        let h1 = tf.tanh(tf.matMul(this.input, this.h1_weights));

        this.h2_weights = tf.variable(tf.truncatedNormal([64, 64], 0.0, 2.0));
        let h2 = tf.softplus(tf.matMul(h1, this.h2_weights));

        this.h3_weights = tf.variable(tf.truncatedNormal([64, 64], 0.0, 2.0));
        let h3 = tf.tanh(tf.matMul(h2, this.h3_weights));

        this.h4_weights = tf.variable(tf.truncatedNormal([64, 64], 0.0, 2.0));
        let h4 = tf.softplus(tf.matMul(h3, this.h4_weights));

        this.output_weights = tf.variable(tf.truncatedNormal([64, this.output_dim], 0.0, 2.0));
        let output = tf.matMul(h4, this.output_weights);
        let result = tf.reshape(output, [this.x_dim, this.output_dim]);

        return result;
    }
}