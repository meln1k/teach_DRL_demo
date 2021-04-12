class CPPN {
    /*
     * CPPN class wich takes an input vector in addition of a vector defining the x position.
     */
    constructor(x_dim, input_dim){
        this.x_dim = x_dim;
        this.input_dim = input_dim;
        this.cppn_model = window.cppn_model;
    }

    generate(input_vector){
        let x = [...Array(this.x_dim).keys()];
        let scaled_x = x.map(e => e / (this.x_dim - 1));
        let x_vec = scaled_x.map(e => [e]);
        let final_input = [];
        for(let i = 0; i < this.x_dim; i++){
            final_input.push([x_vec[i].concat(input_vector)]);
        }
        final_input = tf.tensor(final_input);
        return this.cppn_model.predict(final_input.reshape([this.x_dim, this.input_dim + 1]));
    }
}