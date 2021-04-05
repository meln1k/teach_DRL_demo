class BaseCPPN{
    /*
     * Simple Base CPPN class wich takes an input vector in addition of a vector defining the x position.
     */
    constructor(x_dim, input_dim, batch_size=1, output_dim=1, weights_path=null){
        this.batch_size = batch_size;
        this.output_dim = output_dim;
        this.x_dim = x_dim;
        this.input_dim = input_dim;

        // builds the generator network
        this.G = this.generator();

        this.init();

        if(weights_path != null){
            let saver = tf.train.Saver();
            saver.restore(this.sess, weights_path);
        }
    }

    init(){
        let config = tf.ConfigProto();
        config.gpu_options.allow_growth = true;
        this.sess = tf.Session(config);
        let init = tf.global_variables_initializer();
        this.sess.run(init);
    }

    generator(){
        tf.resetStates();
        //tf.reset_default_graph();
        // inputs to cppn
        this.input = tf.SymbolicTensor('float32', [this.x_dim, this.input_dim + 1]);
        //this.input = tf.placeholder(tf.float32, [this.x_dim, this.input_dim + 1]);

        let output_weights = tf.variable(tf.truncatedNormal([this.input_dim + 1, this.output_dim]));
        //let output_weights = tf.Variable(tf.truncated_normal([this.input_dim + 1, this.output_dim]));
        let output = tf.matMul(this.input, output_weights);
        let result = tf.reshape(output, [this.x_dim]);
        return result;
    }

    generate(input_vector){
        let x = [...Array(this.x_dim).keys()];
        let scaled_x = x / (this.x_dim - 1);
        let x_vec = scaled_x.reshape((this.x_dim, 1));
        //let reshaped_input_vector = [...Array()];
        let final_input = x_vec.concat(reshaped_input_vector);
        //return this.sess.run(this.G, {this.input: final_input});
    }
}