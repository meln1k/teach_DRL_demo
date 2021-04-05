// import * as tf from '@tensorflow/tfjs';


class ParkourHeadlessGame {
    constructor(config) {
        this.config = config
        this.obs = [];
        this.initWorld()
    }

    initWorld() {

        this.env = new ParametricContinuousFlatParkour(0, this.config);

        this.env.set_environment(null,
            5,
            2.5 * SCALE * CREEPER_UNIT,
            30);
        this.obs.push(this.env.reset());

        this.nb_actions = this.env.agent_body.motors.length;
        //this.stateSize = this.env.bodies.length * 10 + this.env.joints.length * 3
    }

}



tf.registerOp('RandomStandardNormal', (node) => {
    const result = tf.randomNormal(node.inputs[0].shape, node.attrs['mean'], node.attrs['stdDev'], node.attrs['dtype'], node.attrs['seed'])
    return result.reshape([2,-1]);
})

class ParkourGame extends ParkourHeadlessGame {
    constructor(config, canvas_id) {
        config.canvas_id = canvas_id
        super(config)
        this.nb_steps = 0;
        this.done = false;
    }

    async loop() {

        const model = await tf.loadGraphModel('/model.json');

        setInterval(() => {
            this.play(model);
        }, 1000 / this.config.draw_fps)
    }

    /**
     * Play one step
     */
    play(model) {

        let state = this.obs[this.obs.length - 1];

        let config = {
            batchSize: 32,
            verbose: false
        }

        let input = tf.tensor(state,[1, 36])

        let actions = model.predict([tf.tensor([0,0,0,0], [1, 4]), input], config)[0].arraySync()[0];

        console.log("actions", actions);

        let ret = this.env.step(actions, 1);
        this.obs.push(ret[0]);
        this.env.render();
        this.nb_steps += 1;
    }


    loadBrain(folder, name, callback) {
        this.agent.restore(folder, name, callback)
        // var title = name.replace('model-ddpg-walker-', '').replace('/model', '').replace('model-ddpg-walker', '')
        // document.getElementById('brain-name').innerText = title

    }
}
